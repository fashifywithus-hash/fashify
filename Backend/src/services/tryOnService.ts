/**
 * Try-On Service - Handles virtual try-on using Gemini API
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

interface TryOnRequest {
  userPhoto: string; // Base64 data URL
  baseUpperStyleId: string;
  outerUpperStyleId: string;
  bottomsStyleId: string;
  footwearStyleId: string;
}

class TryOnService {
  private getClient() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || "fashify-484620";
    const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const credentialsJson = process.env.GOOGLE_CREDENTIALS;

    logger.info("Initializing Gemini client", { 
      projectId, 
      location,
      hasCredentialsPath: !!credentialsPath,
      hasCredentialsJson: !!credentialsJson
    });
    try {
      if (credentialsJson && !credentialsPath) {
        try {
          const credentials = JSON.parse(credentialsJson);
          const tempDir = path.join(process.cwd(), "tmp");
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const tempCredentialsPath = path.join(tempDir, "google-credentials.json");
          fs.writeFileSync(tempCredentialsPath, credentialsJson, "utf8");

          process.env.GOOGLE_APPLICATION_CREDENTIALS = tempCredentialsPath;
          
          logger.info("Credentials loaded from GOOGLE_CREDENTIALS and written to temp file", {
            tempPath: tempCredentialsPath
          });
        } catch (parseError: any) {
          logger.error("Failed to parse GOOGLE_CREDENTIALS JSON", { error: parseError.message });
          throw new Error(`Invalid GOOGLE_CREDENTIALS JSON: ${parseError.message}`);
        }
      }

      if (credentialsPath) {
        if (fs.existsSync(credentialsPath)) {
          logger.info("Using credentials from file", { path: credentialsPath });
        } else {
          logger.error("Credentials file not found", { path: credentialsPath });
          throw new Error(`Google Cloud credentials file not found: ${credentialsPath}`);
        }
      }

      if (!credentialsPath && !credentialsJson) {
        logger.info("No Google Cloud credentials provided. Attempting to use Application Default Credentials (ADC).");
        logger.info("If running outside GCP, you must set either:");
        logger.info("  - GOOGLE_APPLICATION_CREDENTIALS (path to service account key file), or");
        logger.info("  - GOOGLE_CREDENTIALS (JSON string of service account credentials)");
      }
    } catch (error: any) {
      logger.error("Error setting up Google Cloud credentials", { error: error.message });
      throw new Error(`Failed to configure Google Cloud credentials: ${error.message}`);
    }

    const clientConfig: any = {
      vertexai: true,
      project: projectId,
      location: location,
    };
    return new GoogleGenAI(clientConfig);
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
   * Resolve image file path for a styleId based on new suit inventory layout.
   *
   * Convention:
   * - BLZ_xxx -> inventory-images/blazers/BLZ_xxx.jpg
   * - SHRT_xxx -> inventory-images/shirts/SHRT_xxx.jpg
   * - PANT_xxx -> inventory-images/pants/PANT_xxx.jpg
   * - SHOE_xxx -> inventory-images/shoes/SHOE_xxx.jpg
   */
  private getImagePathForStyleId(styleId: string): string | null {
    const upper = styleId.toUpperCase();
    let folder: string | null = null;

    if (upper.startsWith("BLZ_")) {
      folder = "blazers";
    } else if (upper.startsWith("SHRT_")) {
      folder = "shirts";
    } else if (upper.startsWith("PANT_")) {
      folder = "pants";
    } else if (upper.startsWith("SHOE_")) {
      folder = "shoes";
    }

    if (!folder) {
      logger.error("Unknown styleId prefix for try-on", { styleId });
      return null;
    }

    // inventory-images is at Backend/inventory-images relative to this file
    const imagePath = path.resolve(__dirname, "..", "..", "inventory-images", folder, `${upper}.jpg`);

    if (!fs.existsSync(imagePath)) {
      logger.error("Image file not found for styleId", { styleId, folder, imagePath });
      return null;
    }

    logger.info("Resolved image for styleId", { styleId, folder, imagePath });
    return imagePath;
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
      logger.info("Starting try-on generation process");

      // Convert user photo from data URL to buffer
      logger.info("Processing user photo");
      const userPhotoBuffer = this.dataURLToBuffer(request.userPhoto);

      // Get image paths for each styleId using new suit inventory layout
      logger.info("Loading suit item images");
      const baseUpperImagePath = this.getImagePathForStyleId(request.baseUpperStyleId);
      const outerUpperImagePath = this.getImagePathForStyleId(request.outerUpperStyleId);
      const bottomsImagePath = this.getImagePathForStyleId(request.bottomsStyleId);
      const footwearImagePath = this.getImagePathForStyleId(request.footwearStyleId);

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

      logger.info("All images loaded successfully");

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

      logger.info("Calling Gemini API using models.generateContent");

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

      logger.info("Gemini API response received");

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
          logger.info("Found image in response", { mimeType });
          break;
        }
      }

      if (!imageBase64) {
        const partTypes = candidate.content.parts.map((p: any) => p.inlineData ? "image" : "text");
        logger.error("No image data found in Gemini API response", { partTypes });
        throw new Error("No image data found in Gemini API response");
      }

      // Convert to data URL format
      const dataURL = `data:${mimeType};base64,${imageBase64}`;

      logger.info("Try-on image generated and converted to data URL");

      return dataURL;
    } catch (error: any) {
      logger.error("Error in try-on generation", error);
      throw new Error(`Failed to generate try-on image: ${error.message}`);
    }
  }
}

// Export singleton instance
export const tryOnService = new TryOnService();

