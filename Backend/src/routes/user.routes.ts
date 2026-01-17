import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validatePersonalInfo, validateGetPersonalInfo } from '../validators/user.validator';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/user/personal-info
 * @desc    Update user personal information and get outfit suggestions
 * @access  Public (should be protected with auth in production)
 */
router.post(
  '/personal-info',
  validatePersonalInfo,
  handleValidationErrors,
  UserController.updatePersonalInfo
);

/**
 * @route   POST /api/user/get-personal-info
 * @desc    Get user personal information
 * @access  Public (should be protected with auth in production)
 */
router.post(
  '/get-personal-info',
  validateGetPersonalInfo,
  handleValidationErrors,
  UserController.getPersonalInfo
);

export { router as userRoutes };
