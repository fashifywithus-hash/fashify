import { body } from 'express-validator';
import { validateFullBodyImage } from '../utils/image-analysis.util';

/**
 * Validation rules for user personal information endpoints
 */

/**
 * Validates personal information update request
 */
export const validatePersonalInfo = [
  body('_id')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('gender')
    .optional()
    .trim()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Location must be between 1 and 200 characters'),
  body('bodyType')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Body type must be between 1 and 100 characters'),
  body('height')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Height must be between 1 and 50 characters'),
  body('goToStyle')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Go to style must be between 1 and 100 characters'),
  body('userPic')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('User picture is required')
    .custom(async (value: string) => {
      // Validate if it's a full body image
      const validationResult = await validateFullBodyImage(value);
      if (!validationResult.isValid) {
        throw new Error(validationResult.message || 'Image does not appear to be a full body photo. Please upload a photo showing your full body from head to toe.');
      }
      
      return true;
    })
    .withMessage('User picture must be a FULL BODY image. Full body images are required for accurate outfit suggestions.')
];

/**
 * Validates get personal information request
 */
export const validateGetPersonalInfo = [
  body('_id')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];
