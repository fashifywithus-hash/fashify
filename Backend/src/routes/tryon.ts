import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Profile } from "../models/Profile";
import { loadInventoryFromCSV } from "../core/csvParser";
import { tryOnService } from "../services/tryOnService";

const router = express.Router();

/**
 * POST /api/tryon
 * Generate try-on image using Gemini API
 * Requires authentication - automatically uses userId from token
 * 
 * Request body:
 * {
 *   baseUpperStyleId: string,    // StyleId for base upper layer (e.g., t-shirt)
 *   outerUpperStyleId: string,    // StyleId for outer upper layer (e.g., jacket)
 *   bottomsStyleId: string,       // StyleId for bottoms (e.g., jeans)
 *   footwearStyleId: string       // StyleId for footwear (e.g., shoes)
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
    console.log("🎨 Try-on request received");
    
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

    console.log(`📋 Try-on request for user ${userId} with styleIds:`, {
      baseUpper: baseUpperStyleId,
      outerUpper: outerUpperStyleId,
      bottoms: bottomsStyleId,
      footwear: footwearStyleId,
    });

    // Fetch user's profile to get uploaded photo
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

    console.log(`✅ Found user profile with photo for user ${userId}`);

    // Load inventory to validate styleIds
    const inventory = await loadInventoryFromCSV();
    console.log(`📦 Loaded ${inventory.length} inventory items`);

    // Find inventory items by styleId
    const baseUpperItem = inventory.find(item => item.styleId === baseUpperStyleId);
    const outerUpperItem = inventory.find(item => item.styleId === outerUpperStyleId);
    const bottomsItem = inventory.find(item => item.styleId === bottomsStyleId);
    const footwearItem = inventory.find(item => item.styleId === footwearStyleId);

    // Validate all styleIds exist
    const missingItems: string[] = [];
    if (!baseUpperItem) missingItems.push(`baseUpperStyleId: ${baseUpperStyleId}`);
    if (!outerUpperItem) missingItems.push(`outerUpperStyleId: ${outerUpperStyleId}`);
    if (!bottomsItem) missingItems.push(`bottomsStyleId: ${bottomsStyleId}`);
    if (!footwearItem) missingItems.push(`footwearStyleId: ${footwearStyleId}`);

    if (missingItems.length > 0) {
      return res.status(404).json({
        error: "Invalid styleIds",
        message: `The following styleIds were not found in inventory: ${missingItems.join(", ")}`,
      });
    }

    // Generate try-on image using Gemini API
    console.log("🔄 Calling Gemini API to generate try-on image...");
    const tryOnImage = await tryOnService.generateTryOn({
      userPhoto: profile.photo_url,
      baseUpperStyleId,
      outerUpperStyleId,
      bottomsStyleId,
      footwearStyleId,
    });

    console.log("✅ Try-on image generated successfully");

    res.json({
      success: true,
      image: tryOnImage,
      message: "Try-on image generated successfully",
    });
  } catch (error: any) {
    console.error("❌ Try-on error:", error);
    res.status(500).json({
      error: "Failed to generate try-on image",
      message: error.message,
    });
  }
});

export default router;

