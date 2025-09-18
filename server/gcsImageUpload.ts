// server/gcsImageUpload.ts
import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { configureBucketCors } from "./gcs-cors-config";

const tmpDir = path.join(process.cwd(), "tmp_uploads");
fs.mkdirSync(tmpDir, { recursive: true });

// ディスク保存（無圧縮・非加工）
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpDir),
    filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
  }),
  limits: { fileSize: 200 * 1024 * 1024 }, // 写真は十分余裕（必要に応じて調整）
  fileFilter: (_req, file, cb) => {
    const ok = [
      "image/jpeg", "image/png", "image/webp",
      "image/heic", "image/heif"
    ].includes(file.mimetype);
    if (ok) {
      cb(null, true);
    } else {
      cb(new Error("unsupported image type"));
    }
  },
});

// GCS初期化（環境変数チェック付き）
let storage: Storage | null = null;
let bucket: any = null;

try {
  if (process.env.GCP_PROJECT_ID && process.env.GCS_BUCKET && process.env.GCP_SERVICE_ACCOUNT_JSON) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON),
    });
    bucket = storage.bucket(process.env.GCS_BUCKET);
    
    console.log("GCS image upload router initialized");
    
  } else {
    console.warn("GCS not configured for image upload - missing environment variables");
  }
} catch (error) {
  console.error("GCS image upload initialization error:", error);
}

export const gcsImageUpload = express.Router();

gcsImageUpload.post("/upload-image", upload.array("files", 20), async (req, res) => {
  try {
    if (!storage || !bucket) {
      return res.status(503).json({ 
        ok: false, 
        message: "Google Cloud Storage not configured. Please set GCP_PROJECT_ID, GCS_BUCKET, and GCP_SERVICE_ACCOUNT_JSON environment variables." 
      });
    }

    if (!req.files || !(req.files as Express.Multer.File[]).length) {
      return res.status(400).json({ ok: false, message: "files[] required" });
    }

    const results: Array<{ objectName: string; publicUrl: string; readUrl: string }> = [];
    const uploadedFiles = req.files as Express.Multer.File[];

    for (const f of uploadedFiles) {
      try {
        const original = f.originalname.replace(/"/g, "");
        const ext = (original.split(".").pop() || "bin").toLowerCase();
        const objectName = `image/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
        const contentType = f.mimetype || "application/octet-stream";

        const gcsFile = bucket.file(objectName);
        
        await new Promise<void>((resolve, reject) => {
          const read = fs.createReadStream(f.path);
          const write = gcsFile.createWriteStream({
            resumable: true,
            contentType,
            metadata: { contentDisposition: `inline; filename="${original}"` },
          });
          read.on("error", reject);
          write.on("error", reject);
          write.on("finish", resolve);
          read.pipe(write);
        });

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectName}`;
        const [readUrl] = await gcsFile.getSignedUrl({
          version: "v4",
          action: "read",
          expires: Date.now() + 10 * 60 * 1000,
        });
        results.push({ objectName, publicUrl, readUrl });
      } catch (error) {
        console.error(`Error uploading file ${f.originalname}:`, error);
      } finally {
        // 一時ファイル削除
        fs.unlink(f.path, () => {});
      }
    }

    res.json({ ok: true, items: results });
  } catch (error: any) {
    // 失敗時も全ての一時ファイルを削除
    if (req.files) {
      for (const f of req.files as Express.Multer.File[]) {
        fs.unlink(f.path, () => {});
      }
    }
    res.status(500).json({ ok: false, message: error?.message || "upload failed" });
  }
});