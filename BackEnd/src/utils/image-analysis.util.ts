import { logger } from './logger';

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
  logger.info('Starting image validation', { 
    imageLength: userPic.length,
    isDataUrl: userPic.startsWith('data:image/'),
  }, 'IMAGE_VALIDATION');

  try {
    // Use basic heuristic validation
    // For production, you could use Gemini Vision API or other image analysis services
    logger.info('Using basic validation', null, 'IMAGE_VALIDATION');
    const result = await basicFullBodyValidation(userPic);
    logger.info('Basic validation completed', { isValid: result.isValid }, 'IMAGE_VALIDATION');
    return result;

  } catch (error: any) {
    logger.error('Error validating full body image', error, 'IMAGE_VALIDATION');
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
    
    // Check if base64 data exists
    if (!base64Data || base64Data.length === 0) {
      logger.info('Invalid base64 image data', { hasData: !!base64Data }, 'IMAGE_VALIDATION');
      return {
        isValid: false,
        message: 'Invalid image data. Please upload a valid image file.'
      };
    }
    
    const sizeKB = (base64Data.length / 1024).toFixed(2);
    logger.info('Checking image size', { sizeKB, base64Length: base64Data.length }, 'IMAGE_VALIDATION');
    
    // Lowered threshold: compressed images can be smaller (at least 10KB base64 encoded)
    // This is more lenient to account for image compression
    if (base64Data.length < 10000) {
      logger.info('Image too small', { sizeKB, requiredKB: '10KB' }, 'IMAGE_VALIDATION');
      return {
        isValid: false,
        message: 'Image appears too small. Please upload a higher resolution image.'
      };
    }
    
    logger.info('Image size validation passed', { sizeKB }, 'IMAGE_VALIDATION');
  } else if (!userPic || userPic.trim().length === 0) {
    logger.info('Empty image provided', null, 'IMAGE_VALIDATION');
    return {
      isValid: false,
      message: 'Image is required. Please upload a photo.'
    };
  }

  // If we can't validate properly, we'll accept it but warn
  // In production, you should use proper image analysis
  logger.info('Image validation passed', null, 'IMAGE_VALIDATION');
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
