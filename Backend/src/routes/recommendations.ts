import express, { Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { Profile } from "../models/Profile";
import { recommendationService } from "../services/recommendationService";
import { logger } from "../utils/logger";
import type { UserPreferences } from "../types/inventory";

const router = express.Router();

/**
 * POST /api/recommendations
 * Get outfit recommendations based on user's saved profile preferences
 * Requires authentication - automatically uses userId from token
 */
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    // Fetch user's profile from database
    const profile = await Profile.findOne({ user_id: userId });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Please complete onboarding first to get personalized recommendations",
      });
    }

    // Convert profile data to UserPreferences format
    const preferences: UserPreferences = {
      gender: profile.gender || "male",
      weather: profile.weather_preference || 50,
      lifestyle: profile.lifestyle || "casual",
      bodyType: profile.body_type || "average",
      height: profile.height || 170,
      skinTone: profile.skin_tone || 50,
      styles: profile.preferred_styles || [],
    };

    logger.info("Generating recommendations for user", { userId, preferences });

    // Get recommendations based on user's saved preferences
    const recommendations = await recommendationService.getRecommendations(preferences);

    logger.info("Recommendations generated", {
      shirts: recommendations.shirts.length,
      jackets: recommendations.jackets.length,
      jeans: recommendations.jeans.length,
      shoes: recommendations.shoes.length,
    });

    res.json({
      message: "Recommendations generated successfully",
      recommendations,
      preferences, // Include preferences used for debugging
    });
  } catch (error: any) {
    logger.error("Get recommendations error", error);
    res.status(500).json({
      error: "Failed to get recommendations",
      message: error.message,
    });
  }
});

export default router;
