import { Router } from "express";
import { Storage } from "@google-cloud/storage";
import { z } from "zod";
import { isAuthenticated } from "../middleware/auth";

const router = Router();

// Initialize Google Cloud Storage if credentials are available
let gcsStorage: Storage | null = null;
let gcsBucket: any = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_SERVICE_ACCOUNT_KEY || process.env.GCP_SERVICE_ACCOUNT_JSON) {
    gcsStorage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      // Use service account key from environment if available
      ...(process.env.GCS_SERVICE_ACCOUNT_KEY && {
        credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)
      }),
      ...(process.env.GCP_SERVICE_ACCOUNT_JSON && {
        credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON)
      })
    });
    
    if (process.env.GCS_BUCKET) {
      gcsBucket = gcsStorage.bucket(process.env.GCS_BUCKET);
      console.log("Google Cloud Storage initialized");
    }
  }
} catch (error) {
  console.warn("Google Cloud Storage not configured:", (error as Error).message);
}

const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^image\/(jpe?g|png|webp|avif)$/),
  purpose: z.enum(['listing', 'profile', 'document']).optional().default('listing'),
});

// Generate signed upload URL for Google Cloud Storage
router.post("/upload/gcs/sign", isAuthenticated, async (req, res, next) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ 
        error: "Google Cloud Storage not configured",
        message: "GCS_BUCKET and GOOGLE_APPLICATION_CREDENTIALS environment variables required"
      });
    }

    const { filename, contentType, purpose } = uploadSchema.parse(req.body);
    const userId = (req as any).user?.id;

    // Validate file extension
    if (!/\.(jpe?g|png|webp|avif)$/i.test(filename)) {
      return res.status(400).json({ error: "Invalid file extension" });
    }

    // Generate unique filename with timestamp and user ID
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${purpose}/${userId}/${timestamp}_${sanitizedFilename}`;

    const file = gcsBucket.file(uniqueFilename);
    
    // Generate signed URL for upload (5 minute expiry)
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      contentType,
      extensionHeaders: {
        'x-goog-content-length-range': '0,104857600' // Max 100MB for high-resolution photos
      }
    });

    // Generate public URL for accessing the file
    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${uniqueFilename}`;

    return res.json({ 
      uploadUrl,
      publicUrl,
      filename: uniqueFilename,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error("GCS signed URL generation error:", error);
    next(error);
  }
});

// Validate uploaded file (optional endpoint to confirm upload success)
router.post("/upload/gcs/validate", isAuthenticated, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Google Cloud Storage not configured" });
    }

    const { filename } = z.object({
      filename: z.string().min(1)
    }).parse(req.body);

    const file = gcsBucket.file(filename);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get file metadata
    const [metadata] = await file.getMetadata();
    
    return res.json({
      exists: true,
      size: metadata.size,
      contentType: metadata.contentType,
      uploadedAt: metadata.timeCreated,
      publicUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${filename}`
    });
  } catch (error) {
    console.error("GCS file validation error:", error);
    res.status(500).json({ error: "File validation failed" });
  }
});

// Delete file from GCS
router.delete("/upload/gcs/:filename", isAuthenticated, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Google Cloud Storage not configured" });
    }

    const { filename } = req.params;
    const userId = (req as any).user?.id;

    // Security check: ensure user can only delete their own files
    if (!filename.includes(`/${userId}/`)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const file = gcsBucket.file(filename);
    await file.delete();

    return res.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("GCS file deletion error:", error);
    res.status(500).json({ error: "File deletion failed" });
  }
});

// Simple signed URL endpoint (no authentication required)
router.post("/uploads/create-url", async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ 
        message: "Google Cloud Storage not configured. Please set GCP_PROJECT_ID, GCS_BUCKET, and GCP_SERVICE_ACCOUNT_JSON environment variables."
      });
    }

    const { objectName, contentType } = req.body ?? {};
    if (!objectName || !contentType) {
      return res.status(400).json({ 
        message: "objectName & contentType required" 
      });
    }

    const [url] = await gcsBucket.file(objectName).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 5 * 60 * 1000,
      contentType,
    });
    
    res.json({ url });
  } catch (error) {
    console.error("Simple GCS signed URL generation error:", error);
    res.status(500).json({ 
      message: "Failed to generate signed URL" 
    });
  }
});

export default router;