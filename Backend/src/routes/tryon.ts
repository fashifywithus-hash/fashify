import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Profile } from "../models/Profile";
import { catalogService } from "../services/catalogService";
import { tryOnService } from "../services/tryOnService";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * POST /api/tryon
 * Generate try-on image using Gemini API
 * Requires authentication - automatically uses userId from token
 *
 * Request body:
 * {
 *   baseUpperStyleId: string,    // Shirt inside blazer (e.g., SHRT_001)
 *   outerUpperStyleId: string,   // Blazer/jacket (e.g., BLZ_001)
 *   bottomsStyleId: string,      // Pants (e.g., PANT_001)
 *   footwearStyleId: string      // Shoes (e.g., SHOE_001)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   image: string,  // Base64 encoded image data URL
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
    const { baseUpperStyleId, outerUpperStyleId, bottomsStyleId, footwearStyleId } = req.body;

    // Validate required parameters
    if (!baseUpperStyleId || !outerUpperStyleId || !bottomsStyleId || !footwearStyleId) {
      return res.status(400).json({
        error: "Missing required parameters",
        message: "All four styleIds are required: baseUpperStyleId, outerUpperStyleId, bottomsStyleId, footwearStyleId",
      });
    }

    logger.info("Try-on request for user", {
      userId,
      baseUpper: baseUpperStyleId,
      outerUpper: outerUpperStyleId,
      bottoms: bottomsStyleId,
      footwear: footwearStyleId,
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

    // Validate styleIds against suit catalog (only items with existing image files)
    const catalog = catalogService.getCatalog();

    const baseUpperValid = catalog.shirts.some((i) => i.styleId === baseUpperStyleId);
    const outerUpperValid = catalog.blazers.some((i) => i.styleId === outerUpperStyleId);
    const bottomsValid = catalog.pants.some((i) => i.styleId === bottomsStyleId);
    const footwearValid = catalog.shoes.some((i) => i.styleId === footwearStyleId);

    if (!baseUpperValid || !outerUpperValid || !bottomsValid || !footwearValid) {
      const missing: string[] = [];
      if (!baseUpperValid) missing.push(`baseUpperStyleId (shirt): ${baseUpperStyleId}`);
      if (!outerUpperValid) missing.push(`outerUpperStyleId (blazer): ${outerUpperStyleId}`);
      if (!bottomsValid) missing.push(`bottomsStyleId (pants): ${bottomsStyleId}`);
      if (!footwearValid) missing.push(`footwearStyleId (shoes): ${footwearStyleId}`);
      return res.status(404).json({
        error: "Invalid styleIds",
        message: `The following styleIds were not found in suit catalog: ${missing.join(", ")}`,
      });
    }

    // Generate try-on image using Gemini API
    logger.info("Calling Gemini API to generate try-on image");
    const tryOnImage = await tryOnService.generateTryOn({
      userPhoto: profile.photo_url,
      baseUpperStyleId,
      outerUpperStyleId,
      bottomsStyleId,
      footwearStyleId,
    });

    logger.info("Try-on image generated successfully");

    res.json({
      success: true,
      image: tryOnImage,
      message: "Try-on image generated successfully",
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

