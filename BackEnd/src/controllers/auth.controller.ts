import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponseDto, AuthResponseDto } from '../dto/auth.dto';
import { logger } from '../utils/logger';

/**
 * Controller for authentication endpoints
 * Handles HTTP requests and responses
 */
export class AuthController {
  /**
   * Handles user signup or login request
   * If user exists, logs them in; otherwise, signs them up
   * @param req - Express request object
   * @param res - Express response object
   */
  static async signupOrLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const sanitizedEmail = email ? email.substring(0, 3) + '***@' + email.split('@')[1] : '***';
      logger.service('AuthController', 'signupOrLogin', { email: sanitizedEmail });

      const result = await AuthService.signupOrLogin({ email, password });

      if (result.success && result.user) {
        logger.service('AuthController', 'Signup/Login success', { 
          action: result.user.action,
          userId: result.user.id 
        });
        const response: ApiResponseDto<AuthResponseDto> = {
          success: true,
          message: result.message,
          data: result.user
        };
        // Use 201 for signup, 200 for login
        const statusCode = result.user.action === 'signup' ? 201 : 200;
        res.status(statusCode).json(response);
      } else {
        logger.warn('Signup/Login failed', { message: result.message }, 'AUTH_CONTROLLER');
        const response: ApiResponseDto = {
          success: false,
          message: result.message
        };
        res.status(400).json(response);
      }
    } catch (error) {
      logger.error('Signup/Login controller error', error, 'AUTH_CONTROLLER');
      const response: ApiResponseDto = {
        success: false,
        message: 'Internal server error. Please try again later.'
      };
      res.status(500).json(response);
    }
  }
}
