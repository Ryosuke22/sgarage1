// server/uploadRouter.ts
import express from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";

const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (必要に応じて調整)
});

export const uploadRouter = express.Router();

// 単一ファイル: フィールド名 "file"
uploadRouter.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ ok: false, message: "file is required" });
  res.json({
    ok: true,
    filename: req.file.filename,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`, // 静的配信で参照
  });
});