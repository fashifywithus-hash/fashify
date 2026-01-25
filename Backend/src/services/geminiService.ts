/**
 * Gemini API Service
 * Handles all interactions with Google's Gemini API for outfit generation
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { retryWithBackoff } from '../utils/retryUtils';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBMaNJweJZPNW6qPeV2jD6aXdAEM-5D9k0';
const GEMINI_ACCESS_TOKEN = process.env.GEMINI_ACCESS_TOKEN || '\ya29.a0AUMWg_I5r_bMfjc3obvb34VqD3NYxXRonjaraJviSlBW68YKq_gjQIC12H6b2Kz_nluSw5TbReKS3IYgxxNwD2QjdxRKpqPdkBemPk6I7IjDzK-4WXvO9vkgLEK-X191OzcI2f6i8wwi-ADGwlYuH8jVjiFWJlATFhplw-q9siXSYDBWNqjo5LWWMLF-FKHdrbxDE_NjrAesYgaCgYKAUoSARMSFQHGX2MiQVv4LnHZXN7btHJU8bOpAA0213';
const GEMINI_BASE_URL = 'https://us-central1-aiplatform.googleapis.com/v1/projects/fashify-484620/locations/us-central1/publishers/google/models';

export interface OutfitCombination {
  top_id: string;
  bottom_id: string;
  jacket_id: string;
  shoe_id: string;
  reasoning: string;
}

export class GeminiService {
  /**
   * Workflow 1: Get 6 outfit combinations from Gemini
   * Analyzes user image and selects best combinations from inventory
   */
  async getOutfitCombinations(
    userImageBase64: string,
    inventoryData: string
  ): Promise<OutfitCombination[]> {
    console.log('🔄 [Workflow 1] Starting outfit combination generation...');
    console.log(`📊 Inventory data length: ${inventoryData.length} characters`);

    const url = `${GEMINI_BASE_URL}/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: userImageBase64,
              },
            },
            {
              text: "Act as an AI Stylist. 1. Analyze my photo. 2. Select 2 outfits from the inventory using the styleId. Requirements: Each outfit must have a Top, Bottom, Jacket, and Shoes. Output JSON only.",
            },
            {
              text: `Inventory Data [styleId, Sub_Category, Color, Style_Tag]:\n${inventoryData}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              top_id: {
                type: 'STRING',
                description: 'The styleId of the inner top',
              },
              bottom_id: {
                type: 'STRING',
                description: 'The styleId of the pants',
              },
              jacket_id: {
                type: 'STRING',
                description: 'The styleId of the outerwear',
              },
              shoe_id: {
                type: 'STRING',
                description: 'The styleId of the footwear',
              },
              reasoning: {
                type: 'STRING',
                description: "Brief explanation of why these items work for the user's skin tone and body shape.",
              },
            },
            required: ['top_id', 'bottom_id', 'jacket_id', 'shoe_id', 'reasoning'],
          },
        },
      },
    };

    return await retryWithBackoff(
      async () => {
        console.log('📤 [Workflow 1] Sending request to Gemini API...');
        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GEMINI_ACCESS_TOKEN}`,
          },
        });

        console.log('✅ [Workflow 1] Received response from Gemini API');
        
        const textResponse = response.data.candidates[0]?.content?.parts[0]?.text;
        if (!textResponse) {
          throw new Error('No text response from Gemini API');
        }

        console.log('📝 [Workflow 1] Parsing JSON response...');
        const combinations: OutfitCombination[] = JSON.parse(textResponse);
        
        // Limit to 6 combinations
        const limitedCombinations = combinations.slice(0, 6);
        console.log(`✅ [Workflow 1] Successfully parsed ${limitedCombinations.length} outfit combinations`);
        return limitedCombinations;
      },
      {
        maxRetries: 5,
        initialDelayMs: 2000, // Start with 2 seconds for rate limits
        maxDelayMs: 60000, // Max 60 seconds delay
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      }
    );
  }

  /**
   * Workflow 2: Generate base layer image (user + top + bottom)
   */
  async generateBaseLayerImage(
    userImageBase64: string,
    topWearImageBase64: string,
    bottomWearImageBase64: string
  ): Promise<string> {
    console.log('🔄 [Workflow 2] Starting base layer image generation...');

    const url = `${GEMINI_BASE_URL}/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              "text": "IDENTITY & BASE LAYER ANCHOR: Use Image 1 as the master reference for the subject's face, skin texture, and body proportions. 1. SUBJECT IDENTITY: Strictly preserve the unique facial structure, eyes, and skin tone from Image 1—zero beautification or alteration. 2. BASE CLOTHING: Photorealistically wrap the inner top from Image 2 and the bottoms from Image 3 onto the subject's body. The fabric must follow the subject's natural curves and posture, showing realistic folds and tension points. 3. COMPOSITION: Render a full-body portrait against a neutral, high-key studio background to ensure clear lighting on the garments. 4. QUALITY: 8K resolution, sharp focus on fabric weave, and accurate color matching to the garment references."
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: userImageBase64,
              },
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: bottomWearImageBase64,
              },
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: topWearImageBase64,
              },
            },
          ],
        },
      ],
    };

    return await retryWithBackoff(
      async () => {
        console.log('📤 [Workflow 2] Sending request to Gemini Image API...');
        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GEMINI_ACCESS_TOKEN}`,
          },
        });

        console.log('✅ [Workflow 2] Received response from Gemini Image API');
        
        const generatedImageBase64 = response.data.candidates[0]?.content?.parts[0]?.inlineData?.data;
        if (!generatedImageBase64) {
          throw new Error('No image data in response from Gemini Image API');
        }

        console.log('✅ [Workflow 2] Successfully generated base layer image');
        return generatedImageBase64;
      },
      {
        maxRetries: 5,
        initialDelayMs: 3000, // Start with 3 seconds for image generation
        maxDelayMs: 60000, // Max 60 seconds delay
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      }
    );
  }

  /**
   * Workflow 3: Generate final image (base layer + jacket + shoes)
   */
  async generateFinalImage(
    baseLayerImageBase64: string,
    jacketImageBase64: string,
    shoeImageBase64: string
  ): Promise<string> {
    console.log('🔄 [Workflow 3] Starting final image generation...');

    const url = `${GEMINI_BASE_URL}/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              "text": "FINAL OUTFIT & SCENE INTEGRATION: Use Image 1 (the base fusion) as the subject reference. 1. OUTERWEAR LAYERING: Naturally drape the jacket from Image 2 over the subject's shoulders. The jacket must show depth and volume, with visible shadows where it overlaps the inner shirt. 2. ACCESSORIES: Render the footwear from Image 3 onto the subject's feet with correct ground perspective. 3. ENVIRONMENT: Place the subject in a high-end urban street setting during 'Golden Hour.' Use professional 85mm lens characteristics (shallow depth of field) to blur the background slightly. 4. LIGHTING: Global illumination must be consistent across the subject and the jacket, with soft rim light highlighting the outfit's silhouette. Maintain 100% facial accuracy from the source."
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: baseLayerImageBase64,
              },
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: jacketImageBase64,
              },
            },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: shoeImageBase64,
              },
            },
          ],
        },
      ],
    };

    return await retryWithBackoff(
      async () => {
        console.log('📤 [Workflow 3] Sending request to Gemini Image API...');
        const response = await axios.post(url, requestBody, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GEMINI_ACCESS_TOKEN}`,
          },
        });

        console.log('✅ [Workflow 3] Received response from Gemini Image API');
        
        const generatedImageBase64 = response.data.candidates[0]?.content?.parts[0]?.inlineData?.data;
        if (!generatedImageBase64) {
          throw new Error('No image data in response from Gemini Image API');
        }

        console.log('✅ [Workflow 3] Successfully generated final image');
        return generatedImageBase64;
      },
      {
        maxRetries: 5,
        initialDelayMs: 3000, // Start with 3 seconds for image generation
        maxDelayMs: 60000, // Max 60 seconds delay
        backoffMultiplier: 2,
        retryableStatusCodes: [429, 500, 502, 503, 504],
      }
    );
  }
}

export const geminiService = new GeminiService();

