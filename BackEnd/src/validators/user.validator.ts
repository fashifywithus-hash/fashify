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
    .custom((value) => {
      if (!value) return true; // Optional field
      const normalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      const validGenders = ['Male', 'Female', 'Other'];
      if (!validGenders.includes(normalized)) {
        throw new Error('Gender must be Male, Female, or Other');
      }
      return true;
    })
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
    .custom(async (value: string | undefined) => {
      // Only validate if userPic is provided
      if (!value || value.trim().length === 0) {
        // If not provided, that's okay (it's optional)
        return true;
      }
      
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
