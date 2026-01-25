/**
 * Outfit Combinations Route
 * POST /api/outfit-combinations
 * Generates 12 outfit combination images using Gemini AI
 */

import express, { Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Profile } from '../models/Profile';
import { outfitCombinationService } from '../services/outfitCombinationService';
import { imageUrlToBase64 } from '../utils/imageUtils';

const router = express.Router();

/**
 * POST /api/outfit-combinations
 * Generate outfit combination images based on selected items
 * 
 * Request Body:
 * {
 *   selectedItems: {
 *     shirts: string[],    // Array of styleIds
 *     jackets: string[],
 *     jeans: string[],
 *     shoes: string[]
 *   }
 * }
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('\n🎨 ===== Outfit Combination Generation Request =====');
    
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { selectedItems } = req.body;

    // Validate request body
    if (!selectedItems) {
      return res.status(400).json({
        error: 'Missing selectedItems in request body',
      });
    }

    if (
      !Array.isArray(selectedItems.shirts) ||
      !Array.isArray(selectedItems.jackets) ||
      !Array.isArray(selectedItems.jeans) ||
      !Array.isArray(selectedItems.shoes)
    ) {
      return res.status(400).json({
        error: 'Invalid selectedItems format. Expected arrays for shirts, jackets, jeans, and shoes',
      });
    }

    console.log(`👤 User ID: ${userId}`);
    console.log(`📦 Selected items:`, {
      shirts: selectedItems.shirts.length,
      jackets: selectedItems.jackets.length,
      jeans: selectedItems.jeans.length,
      shoes: selectedItems.shoes.length,
    });

    // Fetch user's profile to get photo URL
    const profile = await Profile.findOne({ user_id: userId });
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please complete onboarding first',
      });
    }

    if (!profile.photo_url) {
      return res.status(400).json({
        error: 'User photo not found',
        message: 'Please upload a photo during onboarding',
      });
    }

    console.log(`📸 User photo URL: ${profile.photo_url}`);

    // Convert user photo URL to base64
    console.log('📥 Converting user photo to base64...');
    const userImageBase64 = await imageUrlToBase64(profile.photo_url);
    console.log('✅ User photo converted to base64');

    // Generate outfit combinations
    console.log('🚀 Starting outfit combination generation...');
    const results = await outfitCombinationService.generateOutfitCombinations(
      userImageBase64,
      selectedItems
    );

    console.log(`✅ Successfully generated ${results.length} outfit combinations`);

    res.json({
      message: 'Outfit combinations generated successfully',
      count: results.length,
      combinations: results,
    });
  } catch (error: any) {
    console.error('❌ Error generating outfit combinations:', error);
    res.status(500).json({
      error: 'Failed to generate outfit combinations',
      message: error.message,
    });
  }
});

export default router;

