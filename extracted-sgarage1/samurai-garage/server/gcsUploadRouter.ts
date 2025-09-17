// server/gcsUploadRouter.ts
import express from "express";
import multer from "multer";
import crypto from "node:crypto";
import { Storage } from "@google-cloud/storage";
import { configureBucketCors } from "./gcs-cors-config";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB（必要に応じて調整）
});

// GCS初期化（環境変数チェック付き）
let storage: Storage | null = null;
let bucket: any = null;
let bucketName: string | null = null;

try {
  if (process.env.GCP_PROJECT_ID && process.env.GCS_BUCKET && process.env.GCP_SERVICE_ACCOUNT_JSON) {
    storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON),
    });
    bucketName = process.env.GCS_BUCKET;
    bucket = storage.bucket(bucketName);
    
    console.log("GCS direct upload router initialized");
    
  } else {
    console.warn("GCS not configured for direct upload - missing environment variables");
  }
} catch (error) {
  console.error("GCS initialization error:", error);
}

export const gcsUploadRouter = express.Router();

// フロントの <input name="file"> を受け取る
gcsUploadRouter.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!storage || !bucket) {
      return res.status(503).json({ 
        ok: false, 
        message: "Google Cloud Storage not configured. Please set GCP_PROJECT_ID, GCS_BUCKET, and GCP_SERVICE_ACCOUNT_JSON environment variables." 
      });
    }

    if (!req.file) return res.status(400).json({ ok: false, message: "file is required" });

    const ext = (req.file.originalname.split(".").pop() || "bin").toLowerCase();
    const objectName = `doc/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

    const gcsFile = bucket.file(objectName);
    await gcsFile.save(req.file.buffer, {
      resumable: false, // 単発アップロード（簡単）
      contentType: req.file.mimetype || "application/octet-stream",
      metadata: {
        contentDisposition: `inline; filename="${req.file.originalname.replace(/"/g, "")}"`,
      },
    });

    // （公開バケットであれば）直リンク
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;

    // 非公開バケットでも見せたい場合は "読み取り用 署名URL" を短時間発行
    const [readUrl] = await gcsFile.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 10 * 60 * 1000,
    });

    res.json({ ok: true, objectName, publicUrl, readUrl });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ ok: false, message: err?.message || "upload failed" });
  }
});