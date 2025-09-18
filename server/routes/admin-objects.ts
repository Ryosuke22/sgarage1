import { Router } from "express";
import { Storage } from "@google-cloud/storage";
import { isAdmin } from "../middleware/auth";
import { scanRawObjects, cleanupQuarantine } from "../jobs/scanRawObjects";

const router = Router();

// Initialize Google Cloud Storage
let gcsStorage: Storage | null = null;
let gcsBucket: any = null;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_SERVICE_ACCOUNT_KEY) {
    gcsStorage = new Storage({
      ...(process.env.GCS_SERVICE_ACCOUNT_KEY && {
        credentials: JSON.parse(process.env.GCS_SERVICE_ACCOUNT_KEY)
      })
    });
    
    if (process.env.GCS_BUCKET) {
      gcsBucket = gcsStorage.bucket(process.env.GCS_BUCKET);
    }
  }
} catch (error) {
  console.warn("Admin objects GCS not configured:", (error as Error).message);
}

// Get object storage statistics
router.get("/admin/objects/stats", isAdmin, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    const stats = {
      raw: { count: 0, totalSize: 0 },
      public: { count: 0, totalSize: 0 },
      quarantine: { count: 0, totalSize: 0 }
    };

    // Count files in each directory
    for (const prefix of ['raw', 'public', 'quarantine']) {
      const [files] = await gcsBucket.getFiles({
        prefix: `${prefix}/`,
        maxResults: 1000
      });

      for (const file of files as any[]) {
        if (!file.name.endsWith('/')) {
          const [metadata] = await file.getMetadata();
          stats[prefix as keyof typeof stats].count++;
          stats[prefix as keyof typeof stats].totalSize += parseInt(metadata.size || '0');
        }
      }
    }

    res.json({
      success: true,
      stats,
      lastScan: new Date().toISOString()
    });

  } catch (error) {
    console.error("Object stats error:", error);
    res.status(500).json({ error: "Failed to get object statistics" });
  }
});

// List objects in a specific directory
router.get("/admin/objects/:directory", isAdmin, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    const { directory } = req.params;
    const { page = '1', limit = '20' } = req.query;
    
    if (!['raw', 'public', 'quarantine'].includes(directory)) {
      return res.status(400).json({ error: "Invalid directory" });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const [files] = await gcsBucket.getFiles({
      prefix: `${directory}/`,
      maxResults: limitNum + offset
    });

    const filteredFiles = files
      .filter(file => !file.name.endsWith('/'))
      .slice(offset, offset + limitNum);

    const objects = await Promise.all(
      filteredFiles.map(async (file: any) => {
        const [metadata] = await file.getMetadata();
        return {
          name: file.name,
          size: parseInt(metadata.size || '0'),
          contentType: metadata.contentType,
          created: metadata.timeCreated,
          updated: metadata.updated,
          metadata: metadata.metadata || {},
          publicUrl: `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${file.name}`
        };
      })
    );

    res.json({
      success: true,
      objects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: files.filter((f: any) => !f.name.endsWith('/')).length
      }
    });

  } catch (error) {
    console.error("List objects error:", error);
    res.status(500).json({ error: "Failed to list objects" });
  }
});

// Manually trigger object scan
router.post("/admin/objects/scan", isAdmin, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    // Run scan in background
    scanRawObjects().catch(error => {
      console.error("Manual scan error:", error);
    });

    res.json({
      success: true,
      message: "Object scan initiated"
    });

  } catch (error) {
    console.error("Manual scan trigger error:", error);
    res.status(500).json({ error: "Failed to trigger scan" });
  }
});

// Move object between directories
router.post("/admin/objects/move", isAdmin, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    const { filename, destination } = req.body;
    
    if (!filename || !destination) {
      return res.status(400).json({ error: "Filename and destination required" });
    }

    if (!['public', 'quarantine'].includes(destination)) {
      return res.status(400).json({ error: "Invalid destination" });
    }

    const sourceFile = gcsBucket.file(filename);
    const [exists] = await sourceFile.exists();
    
    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    // Determine destination path
    const currentDir = filename.split('/')[0];
    const destPath = filename.replace(`${currentDir}/`, `${destination}/`);
    const destFile = gcsBucket.file(destPath);

    // Copy and delete
    await sourceFile.copy(destFile);
    await destFile.setMetadata({
      metadata: {
        ...((await sourceFile.getMetadata())[0].metadata || {}),
        movedAt: new Date().toISOString(),
        movedBy: (req as any).user?.id || 'admin',
        previousLocation: currentDir
      }
    });
    await sourceFile.delete();

    res.json({
      success: true,
      message: `File moved to ${destination}`,
      newPath: destPath
    });

  } catch (error) {
    console.error("Move object error:", error);
    res.status(500).json({ error: "Failed to move object" });
  }
});

// Delete object permanently
router.delete("/admin/objects/:filename", isAdmin, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    const { filename } = req.params;
    const file = gcsBucket.file(filename);
    
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    await file.delete();

    res.json({
      success: true,
      message: "File deleted permanently"
    });

  } catch (error) {
    console.error("Delete object error:", error);
    res.status(500).json({ error: "Failed to delete object" });
  }
});

// Cleanup quarantine
router.post("/admin/objects/cleanup", isAdmin, async (req, res) => {
  try {
    if (!gcsStorage || !gcsBucket) {
      return res.status(503).json({ error: "Cloud storage not configured" });
    }

    // Run cleanup in background
    cleanupQuarantine().catch(error => {
      console.error("Manual cleanup error:", error);
    });

    res.json({
      success: true,
      message: "Quarantine cleanup initiated"
    });

  } catch (error) {
    console.error("Cleanup trigger error:", error);
    res.status(500).json({ error: "Failed to trigger cleanup" });
  }
});

export default router;