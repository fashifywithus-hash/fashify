/**
 * Try-On Service - Handles virtual try-on using Gemini API
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

interface JewelleryTryOnRequest {
  userPhoto: string; // Base64 data URL
  necklineStyleId: string;
  sareeStyleId: string;
}

interface JewelleryTryOnResult {
  image: string;
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

  private getImagePathForStyleId(styleId: string): string | null {
    const lower = styleId.toLowerCase();
    let folderParts: string[] | null = null;
    let fileName = `${styleId}.jpg`;

    // Jewellery-only mapping in this branch
    if (lower.startsWith("neckline_")) {
      folderParts = ["jewellery", "necklines"];
    } else if (lower.startsWith("saree_")) {
      folderParts = ["jewellery", "sarees"];
    } else if (lower.startsWith("neck_")) {
      // Allow NECK_* styleIds as aliases for necklines
      folderParts = ["jewellery", "necklines"];
    } else if (lower.startsWith("saree_")) {
      folderParts = ["jewellery", "sarees"];
    }

    if (!folderParts) {
      logger.error("Unknown jewellery styleId prefix for try-on", { styleId });
      return null;
    }

    // inventory-images is at Backend/inventory-images relative to this file
    const imagePath = path.resolve(
      __dirname,
      "..",
      "..",
      "inventory-images",
      ...folderParts,
      fileName
    );

    if (!fs.existsSync(imagePath)) {
      logger.error("Image file not found for jewellery styleId", { styleId, imagePath });
      return null;
    }

    logger.info("Resolved image for jewellery styleId", { styleId, imagePath });
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
   * Generate a single jewellery try-on image using Gemini API
   */
  async generateTryOn(request: JewelleryTryOnRequest): Promise<JewelleryTryOnResult> {
    try {
      logger.info("Starting jewellery try-on generation process");

      // Convert user photo from data URL to buffer
      logger.info("Processing user photo");
      const userPhotoBuffer = this.dataURLToBuffer(request.userPhoto);

      // Get image paths for jewellery inventory
      logger.info("Loading jewellery item images");
      const necklineImagePath = this.getImagePathForStyleId(request.necklineStyleId);
      const sareeImagePath = this.getImagePathForStyleId(request.sareeStyleId);

      // Validate required images exist
      const missing: string[] = [];
      if (!necklineImagePath) missing.push(`neckline (${request.necklineStyleId})`);
      if (!sareeImagePath) missing.push(`saree (${request.sareeStyleId})`);
      if (missing.length > 0) {
        throw new Error(`Missing images for: ${missing.join(", ")}`);
      }

      // Load all images
      const necklineBuffer = this.loadImageFile(necklineImagePath!);
      const sareeBuffer = this.loadImageFile(sareeImagePath!);

      logger.info("All jewellery images loaded successfully");

      // Initialize Gemini client
      const ai = this.getClient();

      // Prepare contents array with images and couture prompt
      // IMAGE 0: Identity (user)
      // IMAGE 1: Jewelry (necklace + earrings)
      // IMAGE 2: Attire (saree)
      const contents: any[] = [
        {
          inlineData: {
            data: userPhotoBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // IMAGE 0 (Identity)
        {
          inlineData: {
            data: necklineBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // IMAGE 1 (Jewelry)
        {
          inlineData: {
            data: sareeBuffer.toString("base64"),
            mimeType: "image/jpeg",
          },
        }, // IMAGE 2 (Attire / Saree)
        `--- HIGH-FIDELITY MULTI-VIEW VIRTUAL COUTURE TRY-ON ---

**INPUT MAPPING:**
- IMAGE 0 (Identity): The target person. Maintain 100% fidelity of the face, skin tone, and body shape.
- IMAGE 1 (Jewelry): Source the necklace and earrings from this image. Ensure the gold filigree and fringe details are preserved.
- IMAGE 2 (Attire): The Saree. Use the exact fabric texture, color, and border pattern from this image.

**TASK:** Generate ONE photorealistic, high-end fashion image. The person from Image 0 must be styled wearing the jewelry from Image 1 and the saree from Image 2.

### VIEW A: UPPER BODY CLOSE-UP (Frontal)
- **Composition:** Centered portrait from the waist up.
- **Focus:** Sharp detail on the necklace drape and the way the earrings frame the face. The saree blouse and the 'pallu' (shoulder drape) must be visible and perfectly tucked.

**TECHNICAL CONSTRAINTS:**
1. **Lighting:** Use consistent warm, professional studio lighting across all three images.
2. **Background:** Use a clean, neutral, high-end studio grey or deep brown background to make the gold and fabric pop.
3. **Fidelity:** Do not alter the user's facial features. The jewelry and saree must look like they are physically on the person, including realistic shadows on the skin and fabric.
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

      // Extract image from response
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error("No candidates in Gemini API response");
      }

      const candidate = response.candidates[0];
      if (!candidate.content || !candidate.content.parts) {
        throw new Error("No content parts in Gemini API response");
      }

      const imageParts = candidate.content.parts.filter(
        (part: any) => part.inlineData && part.inlineData.data
      );

      if (imageParts.length < 1) {
        const partTypes = candidate.content.parts.map((p: any) =>
          p.inlineData ? "image" : "text"
        );
        logger.error("Expected at least 1 image part in Gemini API response", {
          imagePartCount: imageParts.length,
          partTypes,
        });
        throw new Error(
          `Gemini response did not contain an image (found ${imageParts.length})`
        );
      }

      const [partA] = imageParts;
      const mime = (partA.inlineData?.mimeType as string | undefined) || "image/png";
      const image = `data:${mime};base64,${partA.inlineData!.data}`;

      logger.info("Jewellery try-on image generated");

      return { image };
    } catch (error: any) {
      logger.error("Error in try-on generation", error);
      throw new Error(`Failed to generate try-on image: ${error.message}`);
    }
  }
}

// Export singleton instance
export const tryOnService = new TryOnService();

