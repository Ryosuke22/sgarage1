// server/vite.ts
import type { Express } from "express";

// Vite 開発サーバーをセットアップ（開発環境用）
export async function setupVite(_app: Express, _server?: any) {
  console.log("setupVite called (stub)");
}

// 本番用の静的ファイル配信（ダミー）
export function serveStatic(_app: Express) {
  console.log("serveStatic called (stub)");
}

// ログ出力関数
export function log(message: string) {
  console.log("[vite-log]", message);
}
