import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateSignup } from '../validators/auth.validator';
import { handleValidationErrors } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user or login existing user
 *          If user exists, logs them in; otherwise, signs them up
 * @access  Public
 */
router.post(
  '/signup',
  validateSignup,
  handleValidationErrors,
  AuthController.signupOrLogin
);

export { router as authRoutes };
