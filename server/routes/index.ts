import { modelsRouter } from "./models";
import type { Express } from "express";

export async function registerRoutes(app: Express) {
  app.use("/api/models", modelsRouter);
  return app; // 既存の構成に合わせて
}