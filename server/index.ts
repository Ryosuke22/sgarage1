import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { registerFeesRoutes } from "./routes/fees";
import { registerAuctionMemoryRoutes } from "./routes/auction.memory";
import { attachRealtime } from "./realtime/ws";
import uploadRoutes from "./routes/upload";
import uploadMulterRoutes from "./routes/upload-multer";
import adminObjectsRoutes from "./routes/admin-objects";
import adminThumbnailsRoutes from "./routes/admin-thumbnails";
import { uploadRouter } from "./uploadRouter";
import { gcsUploadRouter } from "./gcsUploadRouter";
import { gcsVideoUpload } from "./gcsVideoUpload";
import { gcsImageUpload } from "./gcsImageUpload";
import { pdfUploadRouter } from "./pdfUploadRouter";
import { setupVite, serveStatic, log } from "./vite";
import fs from "node:fs";
import path from "node:path";
import "./cronJobs";
import "./jobs/scanRawObjects";
import "./jobs/generateThumbnails";

const isProd = false; // ← 検証中は固定でOK（必ず Vite ミドルウェアを通す）
console.log("[mode] isProd =", isProd, "NODE_ENV=", process.env.NODE_ENV);

// Structured logger (simple console-based for now)
const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logData = { timestamp, level: 'info', message, ...meta };
    console.log(JSON.stringify(logData));
  },
  error: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logData = { timestamp, level: 'error', message, ...meta };
    console.error(JSON.stringify(logData));
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logData = { timestamp, level: 'warn', message, ...meta };
    console.warn(JSON.stringify(logData));
  },
  fatal: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logData = { timestamp, level: 'fatal', message, ...meta };
    console.error(JSON.stringify(logData));
  }
};

// Global error handlers for production monitoring
process.on("unhandledRejection", (reason, promise) => {
  logger.error("UNHANDLED_REJECTION", {
    reason: reason instanceof Error ? {
      message: reason.message,
      stack: reason.stack,
      name: reason.name
    } : reason,
    promise: promise.toString()
  });
});

process.on("uncaughtException", (error) => {
  logger.fatal("UNCAUGHT_EXCEPTION", {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    }
  });
  
  // Give the logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

const app = express();

/** Replit iframe埋め込み対応（送信直前にCSPとXFOを上書きするフック） */
{
  const origWriteHead = (app.response as any).writeHead;
  (app.response as any).writeHead = function (...args: any[]) {
    try {
      // Replit の IDE/プレビューからの iframe 埋め込みを許可
      // *.replit.com / *.repl.co / *.replit.dev / *.replit.app / *.repl.run を網羅
      this.setHeader(
        "Content-Security-Policy",
        "frame-ancestors 'self' https://replit.com https://*.replit.com https://*.repl.co https://*.replit.dev https://*.replit.app https://*.repl.run"
      );
      // iframe を拒否する古いヘッダを確実に除去
      this.removeHeader?.("X-Frame-Options");

      // もし下流が同名ヘッダを明示的に積んでいた場合も潰す
      if (args[1] && typeof args[1] === "string" && typeof args[2] === "object") {
        delete (args[2] as any)["x-frame-options"];
        delete (args[2] as any)["X-Frame-Options"];
        delete (args[2] as any)["content-security-policy"]; // 当パッチで最終値を設定
        delete (args[2] as any)["Content-Security-Policy"];
      }
    } catch {}
    return origWriteHead.apply(this, args as any);
  };
}

// CORS設定（開発・本番対応）
app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) {
    // 開発環境では任意のoriginを許可
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      // 本番環境では特定のドメインのみ許可
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://*.replit.app',
        'https://*.replit.dev'
      ];
      if (!origin || allowedOrigins.some(allowed => 
        allowed && (origin === allowed || origin.match(allowed.replace('*', '.*')))
      )) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma']
}));

// レスポンス圧縮
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

// ヘルスチェック
app.get("/healthz", (_req: Request, res: Response) => res.json({ ok: true }));

// 構造化ログミドルウェア
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(this, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const logData = {
        method: req.method,
        path: path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      };

      let logLine = `${logData.method} ${logData.path} ${logData.statusCode} in ${logData.duration}`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // 既存のルートを登録
  const server = await registerRoutes(app);
  
  // ブーストパック機能を追加
  registerFeesRoutes(app);
  
  // アップロード機能を追加
  app.use("/api", uploadRoutes);
  app.use("/api", uploadMulterRoutes);
  app.use("/api", adminObjectsRoutes);
  app.use("/api", adminThumbnailsRoutes);
  
  // ローカルファイルアップロード（multer使用）
  app.use("/api", uploadRouter);
  
  // GCSダイレクトアップロード（memoryStorage使用）
  app.use("/api/gcs", gcsUploadRouter);
  
  // GCS動画アップロード（diskStorage使用、大容量対応）
  app.use("/api/video", gcsVideoUpload);
  
  // GCS画像アップロード（diskStorage使用、複数ファイル対応）
  app.use("/api/image", gcsImageUpload);
  
  // PDF文書アップロード（車検証対応、diskStorage使用）
  app.use("/api", pdfUploadRouter);
  
  // アップロードされたファイルを静的配信
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));
  
  // 大容量アップロード対応: タイムアウト延長
  server.headersTimeout = 1000 * 60 * 10;  // 10分
  server.requestTimeout = 1000 * 60 * 10;  // 10分
  
  // WebSocketリアルタイム機能をアタッチ
  const realtime = attachRealtime(server);
  
  // メモリベースの入札API（リアルタイム付き）
  registerAuctionMemoryRoutes(app, realtime.broadcast);
  
  logger.info("Boost pack features initialized", { 
    wsClients: realtime.getClientCount() 
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (isProd) {
    serveStatic(app);         // dist/public から配信
  } else {
    await setupVite(app, server); // Viteミドルウェア（開発）
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`🚀 Samurai Garage server running on port ${port}`);
    console.log(`📱 Access the app at: http://localhost:${port}`);
    console.log(`🎮 Sample data loaded - ready for 3-minute demo!`);
    console.log(`🏎️ Featured: NSX Type R, RX-7 FD3S, VF1000R, GT-R R32`);
    
    log(`serving on port ${port}`);
    logger.info("Samurai Garage server started successfully", { 
      port, 
      env: process.env.NODE_ENV,
      sampleDataReady: true,
      featuredVehicles: ["NSX Type R", "RX-7 FD3S", "VF1000R", "GT-R R32"]
    });
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
})();
