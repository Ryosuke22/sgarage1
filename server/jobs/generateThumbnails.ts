import cron from "node-cron";
import sharp from "sharp";
import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { promisify } from "util";
import { pipeline } from "stream";

const pipelineAsync = promisify(pipeline);

// Initialize Google Cloud Storage
let gcsStorage: Storage | null = null;
let gcsBucket: any = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_SERVICE_ACCOUNT_KEY) {
    gcsStorage = new Storage({
      ...(process.env.GCS_SERVICE_ACCOUNT_KEY && {
        credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)
      })
    });
    
    if (process.env.GCS_BUCKET) {
      gcsBucket = gcsStorage.bucket(process.env.GCS_BUCKET);
      console.log("Thumbnail generator GCS integration initialized");
    }
  }
} catch (error) {
  console.warn("Thumbnail generator GCS not configured:", (error as Error).message);
}

interface ThumbnailConfig {
  size: number;
  suffix: string;
  quality: number;
  format: 'jpeg' | 'webp';
}

// Thumbnail configurations
const THUMBNAIL_CONFIGS: ThumbnailConfig[] = [
  { size: 150, suffix: 'thumb', quality: 80, format: 'jpeg' },
  { size: 300, suffix: 'medium', quality: 85, format: 'jpeg' },
  { size: 800, suffix: 'large', quality: 90, format: 'jpeg' },
  { size: 150, suffix: 'thumb', quality: 80, format: 'webp' },
  { size: 300, suffix: 'medium', quality: 85, format: 'webp' }
];

interface ThumbnailResult {
  originalFile: string;
  thumbnails: {
    filename: string;
    size: number;
    format: string;
    url: string;
  }[];
  processedAt: string;
  error?: string;
}

async function generateThumbnailsForImage(filename: string): Promise<ThumbnailResult> {
  console.log(`Generating thumbnails for: ${filename}`);
  
  const tempDir = '/tmp/thumbnail-generator';
  const tempFilePath = path.join(tempDir, path.basename(filename));
  const result: ThumbnailResult = {
    originalFile: filename,
    thumbnails: [],
    processedAt: new Date().toISOString()
  };
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Download original file from GCS
    const sourceFile = gcsBucket.file(filename);
    const [exists] = await sourceFile.exists();
    
    if (!exists) {
      throw new Error(`Source file not found: ${filename}`);
    }

    // Download to temp location
    await pipelineAsync(
      sourceFile.createReadStream(),
      createWriteStream(tempFilePath)
    );

    // Get original image metadata
    const imageMetadata = await sharp(tempFilePath).metadata();
    console.log(`Original image: ${imageMetadata.width}x${imageMetadata.height}, format: ${imageMetadata.format}`);

    // Generate thumbnails for each configuration
    for (const config of THUMBNAIL_CONFIGS) {
      try {
        // Skip if original is smaller than thumbnail size
        if (imageMetadata.width && imageMetadata.width < config.size) {
          console.log(`Skipping ${config.suffix} thumbnail: original too small`);
          continue;
        }

        // Generate thumbnail filename
        const originalExt = path.extname(filename);
        const baseName = filename.replace(originalExt, '');
        const thumbnailFilename = `${baseName}_${config.suffix}.${config.format}`;
        const thumbnailPath = thumbnailFilename.replace('public/', 'public/thumbnails/');
        
        const tempThumbnailPath = path.join(tempDir, `${config.suffix}_${config.format}_${path.basename(filename)}`);

        // Generate thumbnail using Sharp
        let sharpInstance = sharp(tempFilePath)
          .resize(config.size, config.size, {
            fit: 'inside',
            withoutEnlargement: true
          });

        if (config.format === 'jpeg') {
          sharpInstance = sharpInstance.jpeg({ quality: config.quality });
        } else if (config.format === 'webp') {
          sharpInstance = sharpInstance.webp({ quality: config.quality });
        }

        await sharpInstance.toFile(tempThumbnailPath);

        // Upload thumbnail to GCS
        const thumbnailFile = gcsBucket.file(thumbnailPath);
        await thumbnailFile.save(await fs.readFile(tempThumbnailPath), {
          metadata: {
            contentType: `image/${config.format}`,
            metadata: {
              originalFile: filename,
              thumbnailSize: config.size.toString(),
              thumbnailType: config.suffix,
              generatedAt: new Date().toISOString(),
              generatedBy: 'thumbnail-generator'
            }
          }
        });

        // Clean up temp thumbnail
        await fs.unlink(tempThumbnailPath);

        const thumbnailUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${thumbnailPath}`;
        
        result.thumbnails.push({
          filename: thumbnailPath,
          size: config.size,
          format: config.format,
          url: thumbnailUrl
        });

        console.log(`Generated ${config.suffix} thumbnail: ${thumbnailPath}`);

      } catch (thumbnailError) {
        console.error(`Failed to generate ${config.suffix} thumbnail:`, thumbnailError);
      }
    }

    // Clean up temp original file
    await fs.unlink(tempFilePath);

    console.log(`Generated ${result.thumbnails.length} thumbnails for ${filename}`);
    return result;

  } catch (error) {
    console.error(`Error generating thumbnails for ${filename}:`, error);
    
    // Clean up temp files
    try {
      await fs.unlink(tempFilePath);
    } catch {}

    result.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }
}

async function processPublicImages(): Promise<void> {
  if (!gcsStorage || !gcsBucket) {
    console.log("Thumbnail generator: GCS not configured, skipping generation");
    return;
  }

  try {
    console.log("Starting thumbnail generation for public images...");
    
    // List all files in public/ directory (excluding thumbnails)
    const [files] = await gcsBucket.getFiles({
      prefix: 'public/',
      maxResults: 100
    });

    // Filter for image files that don't already have thumbnails
    const imageFiles = files.filter((file: any) => {
      if (file.name.endsWith('/')) return false;
      if (file.name.includes('/thumbnails/')) return false;
      
      // Check if it's an image file
      const ext = path.extname(file.name).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
    });

    if (imageFiles.length === 0) {
      console.log("No new images found for thumbnail generation");
      return;
    }

    console.log(`Found ${imageFiles.length} images for thumbnail generation`);
    
    let processedCount = 0;
    let successCount = 0;

    // Process each image file
    for (const file of imageFiles) {
      try {
        // Check if thumbnails already exist
        const baseName = file.name.replace(path.extname(file.name), '');
        const [existingThumbnails] = await gcsBucket.getFiles({
          prefix: `${baseName.replace('public/', 'public/thumbnails/')}_`,
          maxResults: 1
        });

        if (existingThumbnails.length > 0) {
          console.log(`Thumbnails already exist for ${file.name}, skipping`);
          continue;
        }

        const result = await generateThumbnailsForImage(file.name);
        
        if (result.error) {
          console.error(`Thumbnail generation failed for ${file.name}: ${result.error}`);
        } else {
          successCount++;
          console.log(`Successfully generated thumbnails for ${file.name}`);
        }
        
        processedCount++;
        
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        processedCount++;
      }
    }

    console.log(`Thumbnail generation completed: ${processedCount} processed, ${successCount} successful`);
    
  } catch (error) {
    console.error("Thumbnail generation process failed:", error);
  }
}

// Get thumbnail URLs for a given image
async function getThumbnailsForImage(originalFilename: string): Promise<string[]> {
  if (!gcsStorage || !gcsBucket) return [];

  try {
    const baseName = originalFilename.replace(path.extname(originalFilename), '');
    const thumbnailPrefix = baseName.replace('public/', 'public/thumbnails/');
    
    const [thumbnailFiles] = await gcsBucket.getFiles({
      prefix: `${thumbnailPrefix}_`
    });

    return thumbnailFiles.map((file: any) => 
      `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${file.name}`
    );
  } catch (error) {
    console.error('Error getting thumbnails:', error);
    return [];
  }
}

// Clean up orphaned thumbnails (thumbnails without original files)
async function cleanupOrphanedThumbnails(): Promise<void> {
  if (!gcsStorage || !gcsBucket) return;

  try {
    console.log("Cleaning up orphaned thumbnails...");
    
    const [thumbnailFiles] = await gcsBucket.getFiles({
      prefix: 'public/thumbnails/',
      maxResults: 500
    });

    let deletedCount = 0;

    for (const thumbnailFile of thumbnailFiles) {
      if (thumbnailFile.name.endsWith('/')) continue;
      
      // Extract original filename from thumbnail
      const thumbnailName = path.basename(thumbnailFile.name);
      const match = thumbnailName.match(/^(.+)_(thumb|medium|large)\.(jpeg|webp)$/);
      
      if (!match) continue;
      
      const originalBaseName = match[1];
      const possibleOriginals = [
        `public/${originalBaseName}.jpg`,
        `public/${originalBaseName}.jpeg`,
        `public/${originalBaseName}.png`,
        `public/${originalBaseName}.webp`,
        `public/${originalBaseName}.avif`
      ];

      // Check if any original file exists
      let originalExists = false;
      for (const originalPath of possibleOriginals) {
        const [exists] = await gcsBucket.file(originalPath).exists();
        if (exists) {
          originalExists = true;
          break;
        }
      }

      if (!originalExists) {
        await thumbnailFile.delete();
        deletedCount++;
        console.log(`Deleted orphaned thumbnail: ${thumbnailFile.name}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} orphaned thumbnails`);
    }

  } catch (error) {
    console.error("Thumbnail cleanup failed:", error);
  }
}

// Schedule thumbnail generation every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  console.log("Running scheduled thumbnail generation...");
  await processPublicImages();
});

// Schedule thumbnail cleanup daily at 3 AM
cron.schedule("0 3 * * *", async () => {
  console.log("Running thumbnail cleanup...");
  await cleanupOrphanedThumbnails();
});

// Export functions for manual execution
export { 
  generateThumbnailsForImage, 
  processPublicImages, 
  getThumbnailsForImage,
  cleanupOrphanedThumbnails 
};

console.log("Thumbnail generator scheduled: every 15 minutes for generation, daily at 3 AM for cleanup");