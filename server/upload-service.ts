import express from "express";
import multer from "multer";
import { extension as extFromMime } from "mime-types";
import path from "path";
import fs from "fs";
import { nanoid } from "nanoid";

// Enhanced upload service with large file support (no compression/resize)
export class UploadService {
  private uploadDir: string;
  private maxFileSizeMB: number;
  private maxFileSize: number;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "uploads", "originals");
    this.maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || "100", 10);
    this.maxFileSize = this.maxFileSizeMB * 1024 * 1024;
    
    // Ensure upload directory exists
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  // Enhanced file extension detection
  private decideExtension(originalname: string, mimetype: string): string {
    const extOrig = path.extname(originalname).replace(".", "").toLowerCase();
    if (extOrig) return extOrig; // Use original extension if available
    const e = extFromMime(mimetype);
    return (e || "bin").toLowerCase();
  }

  // Create multer storage configuration
  createStorage() {
    return multer.diskStorage({
      destination: (req, file, cb) => cb(null, this.uploadDir),
      filename: (req, file, cb) => {
        const ext = this.decideExtension(file.originalname, file.mimetype);
        const id = nanoid();
        cb(null, `${id}.${ext}`);
      }
    });
  }

  // Supported MIME types for images
  private getAllowedMimeTypes(): Set<string> {
    return new Set([
      "image/jpeg",
      "image/jpg", 
      "image/png",
      "image/webp",
      "image/gif",
      "image/heic",
      "image/heif",
      "image/avif",
      "image/bmp",
      "image/tiff"
    ]);
  }

  // Create enhanced multer configuration
  createUploadMiddleware(maxFiles: number = 10) {
    const allowedTypes = this.getAllowedMimeTypes();
    
    return multer({
      storage: this.createStorage(),
      limits: {
        fileSize: this.maxFileSize, // Support large Android photos
        files: maxFiles
      },
      fileFilter: (req, file, cb) => {
        if (allowedTypes.has(file.mimetype)) {
          return cb(null, true);
        }
        return cb(new Error(`サポートされていないファイル形式です: ${file.mimetype}`));
      }
    });
  }

  // Process uploaded files and return public URLs
  processUploadedFiles(files: Express.Multer.File[]): Array<{
    url: string;
    originalName: string;
    mimeType: string;
    size: number;
    sizeFormatted: string;
  }> {
    return (files || []).map(file => {
      const publicUrl = `/uploads/originals/${path.basename(file.path)}`;
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      
      return {
        url: publicUrl,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        sizeFormatted: `${sizeInMB}MB`
      };
    });
  }

  // Error handler for upload failures
  handleUploadError(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    console.error("Upload error:", err);
    
    if (err && err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `ファイルが大きすぎます。上限は ${this.maxFileSizeMB}MB です。`,
        maxSize: this.maxFileSizeMB
      });
    }
    
    if (err && err.code === "LIMIT_FILE_COUNT") {
      return res.status(413).json({
        error: "アップロードできるファイル数を超えています。",
      });
    }
    
    res.status(400).json({ 
      error: err.message || "アップロードエラーが発生しました" 
    });
  }

  // Get upload statistics
  getUploadStats() {
    return {
      maxFileSizeMB: this.maxFileSizeMB,
      maxFileSize: this.maxFileSize,
      uploadDir: this.uploadDir,
      supportedFormats: Array.from(this.getAllowedMimeTypes())
    };
  }
}

export const uploadService = new UploadService();