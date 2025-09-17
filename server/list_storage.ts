// Utility to list Object Storage files
import type { Express } from "express";
import { Storage } from "@google-cloud/storage";

export function addStorageListEndpoint(app: Express) {
  app.get("/api/storage/list", async (req, res) => {
    try {
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        return res.json({ error: "No bucket configured" });
      }

      // Try to list files (this may require proper authentication setup)
      const result = {
        bucketId,
        publicPaths: process.env.PUBLIC_OBJECT_SEARCH_PATHS,
        privateDir: process.env.PRIVATE_OBJECT_DIR,
        note: "Files should be accessible via Object Storage UI in Replit"
      };
      
      res.json(result);
    } catch (error: any) {
      res.json({ error: error.message });
    }
  });
}