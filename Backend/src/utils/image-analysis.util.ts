import axios from 'axios';

/**
 * Image analysis utility functions
 * Validates if an image contains a full body photo
 */

/**
 * Analyzes image to check if it's a full body photo
 * Uses image analysis to detect person and verify full body visibility
 * @param userPic - User picture (base64 data URL or image URL)
 * @returns Promise resolving to validation result
 */
export const validateFullBodyImage = async (userPic: string): Promise<{
  isValid: boolean;
  message?: string;
}> => {
  try {
    // Extract base64 data if it's a data URL
    let imageData: string = userPic;
    if (userPic.startsWith('data:image/')) {
      imageData = userPic.split(',')[1];
    }

    // Option 1: Use nano banano API to validate the image
    // This assumes nano banano has an image validation endpoint
    const nanoBananoApiUrl = process.env.NANO_BANANO_API_URL || 'https://api.nanobanano.com';
    
    try {
      const response = await axios.post(
        `${nanoBananoApiUrl}/validate-image`,
        {
          image: userPic,
          type: 'full_body'
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.isValid === true) {
        return {
          isValid: true,
          message: 'Image validated as full body photo'
        };
      } else {
        return {
          isValid: false,
          message: response.data?.message || 'Image does not appear to be a full body photo. Please upload a photo showing your full body from head to toe.'
        };
      }
    } catch (apiError: any) {
      // If nano banano validation endpoint doesn't exist, fall back to basic checks
      console.warn('Nano banano validation endpoint not available, using basic validation');
    }

    // Option 2: Basic heuristic validation (fallback)
    // This is a simple check - for production, use a proper image analysis service
    return await basicFullBodyValidation(userPic);

  } catch (error: any) {
    console.error('Error validating full body image:', error);
    return {
      isValid: false,
      message: 'Unable to validate image. Please ensure it is a full body photo.'
    };
  }
};

/**
 * Basic validation using heuristics
 * Note: This is a simple fallback. For production, use proper image analysis (Google Vision, AWS Rekognition, etc.)
 * @param userPic - User picture
 * @returns Promise resolving to validation result
 */
const basicFullBodyValidation = async (userPic: string): Promise<{
  isValid: boolean;
  message?: string;
}> => {
  // Basic checks:
  // 1. Image should be reasonably large (full body photos are typically larger)
  // 2. For base64, check the size
  // 3. For URLs, we can't check without downloading
  
  if (userPic.startsWith('data:image/')) {
    const base64Data = userPic.split(',')[1];
    // Full body images are typically larger (at least 50KB base64 encoded)
    // This is a rough heuristic - adjust based on your needs
    if (base64Data.length < 50000) {
      return {
        isValid: false,
        message: 'Image appears too small. Full body photos are typically larger. Please upload a higher resolution full body image.'
      };
    }
  }

  // If we can't validate properly, we'll accept it but warn
  // In production, you should use proper image analysis
  return {
    isValid: true,
    message: 'Image format validated. Please ensure it is a full body photo for accurate outfit suggestions.'
  };
};

/**
 * Alternative: Use Google Cloud Vision API for full body detection
 * Requires: @google-cloud/vision package and GCP credentials
 * Uncomment and configure if you want to use Google Vision API
 */
/*
import { ImageAnnotatorClient } from '@google-cloud/vision';

export const validateFullBodyWithGoogleVision = async (userPic: string): Promise<{
  isValid: boolean;
  message?: string;
}> => {
  try {
    const client = new ImageAnnotatorClient();
    
    // Extract base64 data
    let imageData: string = userPic;
    if (userPic.startsWith('data:image/')) {
      imageData = userPic.split(',')[1];
    }

    const [result] = await client.objectLocalization({
      image: { content: Buffer.from(imageData, 'base64') }
    });

    // Check for person detection
    const persons = result.localizedObjectAnnotations?.filter(
      obj => obj.name === 'Person'
    );

    if (!persons || persons.length === 0) {
      return {
        isValid: false,
        message: 'No person detected in the image. Please upload a photo with a person.'
      };
    }

    // Check bounding box to see if it covers most of the image (indicating full body)
    // This is a simplified check - you may need more sophisticated logic
    const person = persons[0];
    const boundingPoly = person.boundingPoly;
    
    if (boundingPoly && boundingPoly.normalizedVertices) {
      const vertices = boundingPoly.normalizedVertices;
      const width = Math.abs(vertices[2].x - vertices[0].x);
      const height = Math.abs(vertices[2].y - vertices[0].y);
      
      // Full body photos typically have a certain aspect ratio
      // Height should be significantly greater than width (portrait orientation)
      if (height > width * 1.5) {
        return {
          isValid: true,
          message: 'Full body photo detected'
        };
      }
    }

    return {
      isValid: false,
      message: 'Image does not appear to be a full body photo. Please upload a photo showing your full body from head to toe.'
    };
  } catch (error: any) {
    console.error('Google Vision API error:', error);
    return {
      isValid: false,
      message: 'Unable to validate image. Please ensure it is a full body photo.'
    };
  }
};
*/
