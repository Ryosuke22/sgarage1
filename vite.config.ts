// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: { strict: true, deny: ["**/.*"] },
    // Replit で外部からアクセスできるようにローカル固定をやめる
    host: true,              // 0.0.0.0 で待受
    port: 5174,
    // ← ここが今回の主因。Replit の動的ホストを許可
    allowedHosts: [
      ".replit.dev",         // 例: xxxx.worf.replit.dev
      ".repl.co"             // 一部の環境で使われる旧ドメイン
    ],
    proxy: {
      "/health": {
        target: "http://127.0.0.1:5002",
        changeOrigin: true,
      },
    },
    // HTTPS 環境でのHMRが不安定なら有効化（任意）
    // hmr: { clientPort: 443 },
  },
});
