// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";

// index.ts は await registerRoutes(app) の戻り値を server として使う想定
export async function registerRoutes(app: Express): Promise<Server> {
  // 動作確認用のルート
  app.get("/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  app.get("/", (_req, res) => {
    res.send("garages server is running");
  });

  // Node の HTTP サーバを作って返す（index.ts 側で listen する）
  const server = createServer(app);
  return server;
}
