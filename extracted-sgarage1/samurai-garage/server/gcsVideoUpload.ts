import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { Storage } from "@google-cloud/storage";
import crypto from "node:crypto";

const tmpDir = path.join(process.cwd(), "tmp_uploads");
fs.mkdirSync(tmpDir, { recursive: true });

// ディスクに置く（大容量でもメモリを食わない）
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpDir),
    filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  }),
  // 上限は環境に合わせて（例: 1GB）
  limits: { fileSize: 1_000 * 1024 * 1024 }
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
    console.log("GCS video upload router initialized");
  } else {
    console.warn("GCS not configured for video upload - missing environment variables");
  }
} catch (error) {
  console.error("GCS video upload initialization error:", error);
}

export const gcsVideoUpload = express.Router();

gcsVideoUpload.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!storage || !bucket) {
      return res.status(503).json({ 
        ok: false, 
        message: "Google Cloud Storage not configured. Please set GCP_PROJECT_ID, GCS_BUCKET, and GCP_SERVICE_ACCOUNT_JSON environment variables." 
      });
    }

    if (!req.file) return res.status(400).json({ ok: false, message: "file is required" });

    const original = req.file.originalname.replace(/"/g, "");
    const ext = (original.split(".").pop() || "bin").toLowerCase();
    const objectName = `video/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

    const contentType =
      req.file.mimetype ||
      (ext === "mov" ? "video/quicktime" :
       ext === "mp4" ? "video/mp4" : "application/octet-stream");

    const localPath = req.file.path;
    const gcsFile = bucket.file(objectName);

    // ストリーム転送（レジューム有効）
    await new Promise<void>((resolve, reject) => {
      const read = fs.createReadStream(localPath);
      const write = gcsFile.createWriteStream({
        resumable: true,
        contentType,
        metadata: {
          contentDisposition: `inline; filename="${original}"`,
        },
      });
      read.on("error", reject);
      write.on("error", reject);
      write.on("finish", resolve);
      read.pipe(write);
    });

    // 一時ファイル削除
    fs.unlink(localPath, () => {});

    // 公開運用ならACL/ポリシー次第でこのURLがそのまま再生可能
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectName}`;

    // 非公開運用なら短期の読み取り用署名URLを返す
    const [readUrl] = await gcsFile.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return res.json({ ok: true, objectName, publicUrl, readUrl });
  } catch (e: any) {
    // 失敗時も一時ファイルは削除
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    return res.status(500).json({ ok: false, message: e?.message || "upload failed" });
  }
});