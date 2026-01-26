/**
 * Try-On Service - Handles virtual try-on using Gemini API
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import type { InventoryItem } from "../types/inventory";
import { loadInventoryFromCSV } from "../core/csvParser";

interface TryOnRequest {
  userPhoto: string; // Base64 data URL
  baseUpperStyleId: string;
  outerUpperStyleId: string;
  bottomsStyleId: string;
  footwearStyleId: string;
}

class TryOnService {
  private inventory: InventoryItem[] | null = null;

  /**
   * Initialize Gemini client
   */
  private getClient() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || "fashify-484620";
    const location = process.env.GOOGLE_CLOUD_LOCATION || "global";

    console.log(`🔧 Initializing Gemini client with project: ${projectId}, location: ${location}`);

    return new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location: location,
    });
  }

  /**
   * Convert base64 data URL to buffer
   */
  private dataURLToBuffer(dataURL: string): Buffer {
    // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
    const base64Data = dataURL.replace(/^data:image\/\w+;base64,/, "");
    return Buffer.from(base64Data, "base64");
  }

  /**
   * Get image file for a styleId from default-images directory
   */
  private getFirstImageForStyleId(styleId: string): string | null {
    // Images are stored in inventory-mappings/default-images/{styleId}.jpg
    const possiblePaths = [
      path.join(__dirname, "..", "..", "inventory-mappings", "default-images", `${styleId}.jpg`),
      path.resolve(process.cwd(), "inventory-mappings", "default-images", `${styleId}.jpg`),
      path.resolve(__dirname, "..", "..", "..", "Backend", "inventory-mappings", "default-images", `${styleId}.jpg`),
    ];

    for (const imagePath of possiblePaths) {
      if (fs.existsSync(imagePath)) {
        console.log(`📸 Found image for styleId ${styleId}: ${imagePath}`);
        return imagePath;
      }
    }

    console.warn(`⚠️ No image found for styleId: ${styleId}`);
    return null;
  }

  /**
   * Load image file and convert to buffer
   */
  private loadImageFile(imagePath: string): Buffer {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }
    return fs.readFileSync(imagePath);
  }

  /**
   * Generate try-on image using Gemini API
   */
  async generateTryOn(request: TryOnRequest): Promise<string> {
    try {
      console.log("🎨 Starting try-on generation process");

      // Convert user photo from data URL to buffer
      console.log("📷 Processing user photo...");
      const userPhotoBuffer = this.dataURLToBuffer(request.userPhoto);

      // Get image paths for each styleId
      console.log("📦 Loading inventory item images...");
      const baseUpperImagePath = this.getFirstImageForStyleId(request.baseUpperStyleId);
      const outerUpperImagePath = this.getFirstImageForStyleId(request.outerUpperStyleId);
      const bottomsImagePath = this.getFirstImageForStyleId(request.bottomsStyleId);
      const footwearImagePath = this.getFirstImageForStyleId(request.footwearStyleId);

      // Validate all images exist
      if (!baseUpperImagePath || !outerUpperImagePath || !bottomsImagePath || !footwearImagePath) {
        const missing = [];
        if (!baseUpperImagePath) missing.push(`baseUpper (${request.baseUpperStyleId})`);
        if (!outerUpperImagePath) missing.push(`outerUpper (${request.outerUpperStyleId})`);
        if (!bottomsImagePath) missing.push(`bottoms (${request.bottomsStyleId})`);
        if (!footwearImagePath) missing.push(`footwear (${request.footwearStyleId})`);
        throw new Error(`Missing images for: ${missing.join(", ")}`);
      }

      // Load all images
      const baseUpperBuffer = this.loadImageFile(baseUpperImagePath);
      const outerUpperBuffer = this.loadImageFile(outerUpperImagePath);
      const bottomsBuffer = this.loadImageFile(bottomsImagePath);
      const footwearBuffer = this.loadImageFile(footwearImagePath);

      console.log("✅ All images loaded successfully");

      // Initialize Gemini client
      const ai = this.getClient();

      // Prepare contents array with images and prompt
      // Using exact prompt from the Python script
      // Structure: array of parts (images and text) - matches Python script exactly
      const contents: any[] = [
        {
          inlineData: {
            data: userPhotoBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // Image 0: Master Identity (User Photo)
        {
          inlineData: {
            data: baseUpperBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // Image 1: Base layer (T-shirt)
        {
          inlineData: {
            data: outerUpperBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // Image 2: Outer layer (Jacket)
        {
          inlineData: {
            data: bottomsBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // Image 3: Bottoms
        {
          inlineData: {
            data: footwearBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // Image 4: Footwear
        `
    INSTRUCTION: HIGH-FIDELITY CHARACTER PRESERVATION TRY-ON

    1. MASTER IDENTITY: Use Image 0 as the ABSOLUTE structural reference for the person's
       face, facial features, skin tone, and exact body shape.
       DO NOT blend or average this face with any faces found in the inventory images.

    2. CLOTHING REPLACEMENT:
       - Take ONLY the textures and shapes of the clothing from Images 1, 2, 3, and 4.
       - Discard everything else from those images (people, backgrounds, heads).
       - Wear the Jacket (Image 2) over the T-shirt (Image 1).

    3. POSITIONING:
       - Keep the person in the exact center-frame as seen in Image 0.
       - Match the lighting of the final image to a high-end fashion studio.

    4. CONSTRAINT: If Image 0 has a transparent background, place the final person
       on a clean, neutral studio grey background. Ensure the jawline and eyes
       perfectly match Image 0 at 100% fidelity.
    `,
      ];

      console.log("🤖 Calling Gemini API using models.generateContent (matching Python script)...");

      // Call Gemini API using models.generateContent - matches Python script exactly
      // Python: client.models.generate_content() with response_modalities=['IMAGE']
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: contents,
        config: {
          responseModalities: ["IMAGE"],
          thinkingConfig: {
            thinkingBudget: 32000,
          },
        },
      });

      console.log("✅ Gemini API response received");

      // Extract image from response - matches Python script structure
      // Python: response.candidates[0].content.parts with inline_data
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates in Gemini API response");
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("No content parts in Gemini API response");
      }

      // Find image part in response
      let imageBase64: string | null = null;
      let mimeType: string = "image/png";

      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          imageBase64 = part.inlineData.data;
          mimeType = part.inlineData.mimeType || "image/png";
          console.log(`📸 Found image in response with mime_type: ${mimeType}`);
          break;
        }
      }

      if (!imageBase64) {
        console.error("❌ Available part types:", candidate.content.parts.map((p: any) => p.inlineData ? "image" : "text"));
        throw new Error("No image data found in Gemini API response");
      }

      // Convert to data URL format
      const dataURL = `data:${mimeType};base64,${imageBase64}`;

      console.log("✅ Try-on image generated and converted to data URL");

      return dataURL;
    } catch (error: any) {
      console.error("❌ Error in try-on generation:", error);
      throw new Error(`Failed to generate try-on image: ${error.message}`);
    }
  }
}

// Export singleton instance
export const tryOnService = new TryOnService();
