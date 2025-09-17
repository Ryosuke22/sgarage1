import cron from "node-cron";
import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs/promises";
import { createWriteStream, createReadStream } from "fs";
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
      console.log("Object scanner GCS integration initialized");
    }
  }
} catch (error) {
  console.warn("Object scanner GCS not configured:", (error as Error).message);
}

interface ScanResult {
  filename: string;
  isClean: boolean;
  issues: string[];
  metadata: {
    size: number;
    contentType: string;
    dimensions?: { width: number; height: number };
    uploadedBy?: string;
    scannedAt: string;
  };
}

// Content scanning utilities
async function scanImageContent(filePath: string): Promise<{ isClean: boolean; issues: string[] }> {
  const issues: string[] = [];
  let isClean = true;

  try {
    // Check file size (already enforced at upload, but double-check)
    const stats = await fs.stat(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      issues.push("File size exceeds 10MB limit");
      isClean = false;
    }

    // Basic file type validation by reading file headers
    const buffer = Buffer.alloc(8);
    const fd = await fs.open(filePath, 'r');
    await fd.read(buffer, 0, 8, 0);
    await fd.close();

    const signature = buffer.toString('hex').toUpperCase();
    
    // Check for valid image signatures
    const validSignatures = [
      'FFD8FF',    // JPEG
      '89504E47',  // PNG
      '52494646',  // WebP (RIFF)
      '0000001C'   // AVIF (partial match)
    ];

    const isValidImage = validSignatures.some(sig => signature.startsWith(sig));
    if (!isValidImage) {
      issues.push("Invalid image file signature");
      isClean = false;
    }

    // Additional checks could be added here:
    // - Image content analysis
    // - EXIF data sanitization
    // - Malware scanning
    // - Content moderation APIs

  } catch (error) {
    console.error('Image scanning error:', error);
    issues.push("Failed to scan image content");
    isClean = false;
  }

  return { isClean, issues };
}

async function processRawObject(filename: string): Promise<ScanResult> {
  console.log(`Scanning object: ${filename}`);
  
  const tempDir = '/tmp/object-scanner';
  const tempFilePath = path.join(tempDir, path.basename(filename));
  
  try {
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Download file from GCS to temporary location
    const file = gcsBucket.file(filename);
    const [metadata] = await file.getMetadata();
    
    // Download file
    await pipelineAsync(
      file.createReadStream(),
      createWriteStream(tempFilePath)
    );

    // Scan the downloaded file
    const scanResult = await scanImageContent(tempFilePath);
    
    // Clean up temp file
    await fs.unlink(tempFilePath);

    const result: ScanResult = {
      filename,
      isClean: scanResult.isClean,
      issues: scanResult.issues,
      metadata: {
        size: parseInt(metadata.size),
        contentType: metadata.contentType || 'unknown',
        uploadedBy: metadata.metadata?.uploadedBy,
        scannedAt: new Date().toISOString()
      }
    };

    return result;

  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
    
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFilePath);
    } catch {}

    return {
      filename,
      isClean: false,
      issues: [`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      metadata: {
        size: 0,
        contentType: 'unknown',
        scannedAt: new Date().toISOString()
      }
    };
  }
}

async function moveObject(filename: string, destination: 'public' | 'quarantine'): Promise<void> {
  try {
    const sourceFile = gcsBucket.file(filename);
    const destPath = filename.replace('raw/', `${destination}/`);
    const destFile = gcsBucket.file(destPath);

    // Copy file to destination
    await sourceFile.copy(destFile);
    
    // Add scan metadata
    await destFile.setMetadata({
      metadata: {
        ...((await sourceFile.getMetadata())[0].metadata || {}),
        scannedAt: new Date().toISOString(),
        scanResult: destination,
        processedBy: 'object-scanner'
      }
    });

    // Delete original file
    await sourceFile.delete();
    
    console.log(`Moved ${filename} to ${destination}/`);
    
  } catch (error) {
    console.error(`Error moving ${filename}:`, error);
    throw error;
  }
}

async function scanRawObjects(): Promise<void> {
  if (!gcsStorage || !gcsBucket) {
    console.log("Object scanner: GCS not configured, skipping scan");
    return;
  }

  try {
    console.log("Starting object scan...");
    
    // List all files in raw/ directory
    const [files] = await gcsBucket.getFiles({
      prefix: 'raw/',
      maxResults: 50 // Process in batches
    });

    if (files.length === 0) {
      console.log("No raw objects to scan");
      return;
    }

    console.log(`Found ${files.length} raw objects to scan`);
    
    let processedCount = 0;
    let cleanCount = 0;
    let quarantineCount = 0;

    // Process each file
    for (const file of files) {
      // Skip directories
      if (file.name.endsWith('/')) continue;
      
      try {
        const scanResult = await processRawObject(file.name);
        
        if (scanResult.isClean) {
          await moveObject(file.name, 'public');
          cleanCount++;
        } else {
          console.warn(`Quarantining ${file.name}: ${scanResult.issues.join(', ')}`);
          await moveObject(file.name, 'quarantine');
          quarantineCount++;
        }
        
        processedCount++;
        
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        
        // Move problematic files to quarantine
        try {
          await moveObject(file.name, 'quarantine');
          quarantineCount++;
          processedCount++;
        } catch (moveError) {
          console.error(`Failed to quarantine ${file.name}:`, moveError);
        }
      }
    }

    console.log(`Object scan completed: ${processedCount} processed, ${cleanCount} clean, ${quarantineCount} quarantined`);
    
  } catch (error) {
    console.error("Object scan failed:", error);
  }
}

// Cleanup old quarantine files (older than 30 days)
async function cleanupQuarantine(): Promise<void> {
  if (!gcsStorage || !gcsBucket) return;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [files] = await gcsBucket.getFiles({
      prefix: 'quarantine/',
      maxResults: 100
    });

    let deletedCount = 0;

    for (const file of files) {
      if (file.name.endsWith('/')) continue;
      
      const [metadata] = await file.getMetadata();
      const createdDate = new Date(metadata.timeCreated);
      
      if (createdDate < thirtyDaysAgo) {
        await file.delete();
        deletedCount++;
        console.log(`Deleted old quarantine file: ${file.name}`);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old quarantine files`);
    }

  } catch (error) {
    console.error("Quarantine cleanup failed:", error);
  }
}

// Schedule object scanning every 10 minutes
cron.schedule("*/10 * * * *", async () => {
  console.log("Running scheduled object scan...");
  await scanRawObjects();
});

// Schedule quarantine cleanup daily at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running quarantine cleanup...");
  await cleanupQuarantine();
});

// Export for manual execution
export { scanRawObjects, cleanupQuarantine };

console.log("Object scanner scheduled: every 10 minutes for scanning, daily at 2 AM for cleanup");