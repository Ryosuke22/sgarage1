import { Router } from "express";
import multer from "multer";
import path from "path";
import { Storage } from "@google-cloud/storage";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

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
      console.log("Multer GCS integration initialized");
    }
  }
} catch (error) {
  console.warn("Multer GCS not configured:", (error as Error).message);
}

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const ALLOWED_MIMETYPES = new Set([
  "image/jpeg", 
  "image/jpg", 
  "image/png", 
  "image/webp", 
  "image/avif"
]);

const upload = multer({
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB for high-resolution photos
    files: 1 // Single file upload
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Validate file extension
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`Invalid file extension: ${ext}. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`));
    }
    
    // Validate MIME type
    if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
      return cb(new Error(`Invalid MIME type: ${file.mimetype}`));
    }
    
    cb(null, true);
  },
  storage: multer.memoryStorage(), // Store in memory for direct cloud upload
});

// Direct multipart upload to cloud storage
router.post("/upload/direct", isAuthenticated, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const userId = (req as any).user?.id;
    const { purpose = 'listing' } = req.body;

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${purpose}/${userId}/${timestamp}_${sanitizedFilename}`;

    let publicUrl: string;

    if (gcsStorage && gcsBucket) {
      // Upload to Google Cloud Storage
      const file = gcsBucket.file(uniqueFilename);
      
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            uploadedBy: userId,
            purpose: purpose,
            originalName: req.file.originalname,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${uniqueFilename}`;
      
      console.log(`File uploaded to GCS: ${uniqueFilename}`);
    } else {
      // Fallback to local storage or return error
      return res.status(503).json({ 
        error: "Cloud storage not configured",
        message: "GCS_BUCKET and GOOGLE_APPLICATION_CREDENTIALS required"
      });
    }

    res.json({ 
      success: true,
      publicUrl,
      filename: uniqueFilename,
      size: req.file.size,
      contentType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Direct upload error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File too large. Maximum size is 100MB." });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: "Unexpected file field." });
      }
    }
    
    next(error);
  }
});

// Upload multiple files
router.post("/upload/multiple", isAuthenticated, upload.array("files", 5), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    const userId = (req as any).user?.id;
    const { purpose = 'listing' } = req.body;
    const uploadResults: any[] = [];

    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    // Upload each file
    for (const file of files) {
      const timestamp = Date.now();
      const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilename = `${purpose}/${userId}/${timestamp}_${sanitizedFilename}`;

      const gcsFile = gcsBucket.file(uniqueFilename);
      
      await gcsFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            uploadedBy: userId,
            purpose: purpose,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${uniqueFilename}`;
      
      uploadResults.push({
        originalName: file.originalname,
        filename: uniqueFilename,
        publicUrl,
        size: file.size,
        contentType: file.mimetype
      });
    }

    res.json({ 
      success: true,
      files: uploadResults,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    next(error);
  }
});

// Get upload status/info
router.get("/upload/info/:filename", isAuthenticated, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    const { filename } = req.params;
    const userId = (req as any).user?.id;

    // Security check: ensure user can only access their own files
    if (!filename.includes(`/${userId}/`)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const file = gcsBucket.file(filename);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    const [metadata] = await file.getMetadata();
    
    res.json({
      exists: true,
      filename: filename,
      size: parseInt(metadata.size),
      contentType: metadata.contentType,
      uploadedAt: metadata.timeCreated,
      publicUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${filename}`,
      metadata: metadata.metadata
    });

  } catch (error) {
    console.error('Upload info error:', error);
    res.status(500).json({ error: "Failed to get file info" });
  }
});

export default router;