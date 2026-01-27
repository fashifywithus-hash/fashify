import express, { Response } from "express";
import { body, validationResult } from "express-validator";
import { Profile } from "../models/Profile";
import { authenticate, AuthRequest } from "../middleware/auth";
import { logger } from "../utils/logger";

const router = express.Router();

/**
 * POST /api/onboarding
 * Save or update user profile/onboarding data
 */
router.post(
  "/",
  authenticate,
  [
    body("name").optional().isString().trim(),
    body("gender").optional().isString().isIn(["male", "female", "other"]),
    body("weather_preference").optional().isInt({ min: 0, max: 100 }),
    body("lifestyle").optional().isString().isIn(["formal", "casual", "athletic"]),
    body("body_type").optional().isString().isIn(["slim", "athletic", "average", "muscular", "curvy", "plus"]),
    body("height").optional().isInt({ min: 100, max: 250 }),
    body("skin_tone").optional().isInt({ min: 0, max: 100 }),
    body("preferred_styles").optional().isArray(),
    // photo_url: no validation - handled manually in route
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.id;
      
      // Validate photo_url manually (allow null or string)
      if (req.body.photo_url !== undefined && req.body.photo_url !== null && typeof req.body.photo_url !== "string") {
        return res.status(400).json({
          error: "Invalid photo_url",
          message: "photo_url must be a string or null",
        });
      }

      const profileData: any = {
        user_id: userId,
        name: req.body.name || null,
        gender: req.body.gender || null,
        weather_preference: req.body.weather_preference || null,
        lifestyle: req.body.lifestyle || null,
        body_type: req.body.body_type || null,
        height: req.body.height || null,
        skin_tone: req.body.skin_tone || null,
        preferred_styles: req.body.preferred_styles || [],
        photo_url: req.body.photo_url !== undefined ? req.body.photo_url : null,
      };

      // Check if profile already exists
      const existingProfile = await Profile.findOne({ user_id: userId });

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await Profile.findOneAndUpdate({ user_id: userId }, profileData, {
          new: true,
          runValidators: true,
        });
      } else {
        // Insert new profile
        result = await Profile.create(profileData);
      }

      res.json({
        message: existingProfile ? "Profile updated successfully" : "Profile created successfully",
        profile: result,
      });
    } catch (error: any) {
      logger.error("Save profile error", error);
      res.status(500).json({
        error: "Failed to save profile",
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/onboarding/get
 * Get user profile/onboarding data
 */
router.post("/get", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.id;

    const profile = await Profile.findOne({ user_id: userId });

    if (!profile) {
      return res.status(404).json({
        error: "Profile not found",
        message: "Please complete onboarding first",
      });
    }

    res.json({
      profile,
    });
  } catch (error: any) {
    logger.error("Get profile error", error);
    res.status(500).json({
      error: "Failed to get profile",
      message: error.message,
    });
  }
});

export default router;
