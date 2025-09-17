import { Router } from "express";
import { isAdmin } from "../middleware/auth";
import { 
  generateThumbnailsForImage, 
  processPublicImages, 
  getThumbnailsForImage,
  cleanupOrphanedThumbnails 
} from "../jobs/generateThumbnails";

const router = Router();

// Manually trigger thumbnail generation for all public images
router.post("/admin/thumbnails/generate", isAdmin, async (req, res) => {
  try {
    // Run generation in background
    processPublicImages().catch(error => {
      console.error("Manual thumbnail generation error:", error);
    });

    res.json({
      success: true,
      message: "Thumbnail generation initiated for all public images"
    });

  } catch (error) {
    console.error("Thumbnail generation trigger error:", error);
    res.status(500).json({ error: "Failed to trigger thumbnail generation" });
  }
});

// Generate thumbnails for a specific image
router.post("/admin/thumbnails/generate/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename.startsWith('public/')) {
      return res.status(400).json({ error: "Only public images can have thumbnails generated" });
    }

    const result = await generateThumbnailsForImage(filename);
    
    if (result.error) {
      return res.status(500).json({ 
        error: "Thumbnail generation failed", 
        details: result.error 
      });
    }

    res.json({
      success: true,
      message: "Thumbnails generated successfully",
      result
    });

  } catch (error) {
    console.error("Single thumbnail generation error:", error);
    res.status(500).json({ error: "Failed to generate thumbnails" });
  }
});

// Get thumbnails for a specific image
router.get("/admin/thumbnails/:filename", isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const thumbnails = await getThumbnailsForImage(filename);
    
    res.json({
      success: true,
      originalFile: filename,
      thumbnails
    });

  } catch (error) {
    console.error("Get thumbnails error:", error);
    res.status(500).json({ error: "Failed to get thumbnails" });
  }
});

// Cleanup orphaned thumbnails
router.post("/admin/thumbnails/cleanup", isAdmin, async (req, res) => {
  try {
    // Run cleanup in background
    cleanupOrphanedThumbnails().catch(error => {
      console.error("Manual thumbnail cleanup error:", error);
    });

    res.json({
      success: true,
      message: "Thumbnail cleanup initiated"
    });

  } catch (error) {
    console.error("Thumbnail cleanup trigger error:", error);
    res.status(500).json({ error: "Failed to trigger thumbnail cleanup" });
  }
});

export default router;