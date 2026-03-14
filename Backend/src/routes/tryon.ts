import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Profile } from "../models/Profile";
import { tryOnService } from "../services/tryOnService";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * POST /api/tryon
 * Generate a single jewellery try-on image using Gemini API
 * Requires authentication - automatically uses userId from token
 *
 * Request body:
 * {
 *   necklineStyleId: string,  // Jewellery inventory ID (e.g., NECK_001)
 *   sareeStyleId: string      // Saree inventory ID (e.g., SAREE_001)
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   image: string,   // Base64 encoded image data URL
 *   message: string
 * }
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    logger.info("Try-on request received");
    
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;
    const { necklineStyleId, sareeStyleId } = req.body;

    // Validate required parameters
    if (!necklineStyleId || !sareeStyleId) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "Both styleIds are required: necklineStyleId, sareeStyleId",
      });
    }

    logger.info("Jewellery try-on request for user", {
      userId,
      necklineStyleId,
      sareeStyleId,
    });

    // Fetch user's profile to get uploaded photo (used as Image 0 in Gemini try-on)
    const profile = await Profile.findOne({ user_id: userId });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Please complete onboarding and upload a photo first",
      });
    }

    if (!profile.photo_url) {
      return res.status(400).json({
        error: "No photo uploaded",
        message: "Please upload a photo in your profile before trying on outfits",
      });
    }

    logger.info("Found user profile with photo", { userId });

    // Generate jewellery try-on image using Gemini API
    logger.info("Calling Gemini API to generate jewellery try-on image");
    const result = await tryOnService.generateTryOn({
      userPhoto: profile.photo_url,
      necklineStyleId,
      sareeStyleId,
    });

    logger.info("Jewellery try-on image generated successfully");

    res.json({
      success: true,
      image: result.image,
      message: "Jewellery try-on image generated successfully",
    });
  } catch (error: any) {
    logger.error("Try-on error", error);
    res.status(500).json({
      error: "Failed to generate try-on image",
      message: error.message,
    });
  }
});

export default router;

