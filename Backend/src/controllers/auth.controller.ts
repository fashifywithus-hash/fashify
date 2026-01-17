import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponseDto, AuthResponseDto } from '../dto/auth.dto';

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
      const { phoneNumber, password } = req.body;

      const result = await AuthService.signupOrLogin({ phoneNumber, password });

      if (result.success && result.user) {
        const response: ApiResponseDto<AuthResponseDto> = {
          success: true,
          message: result.message,
          data: result.user
        };
        // Use 201 for signup, 200 for login
        const statusCode = result.user.action === 'signup' ? 201 : 200;
        res.status(statusCode).json(response);
      } else {
        const response: ApiResponseDto = {
          success: false,
          message: result.message
        };
        res.status(400).json(response);
      }
    } catch (error) {
      console.error('Signup/Login controller error:', error);
      const response: ApiResponseDto = {
        success: false,
        message: 'Internal server error. Please try again later.'
      };
      res.status(500).json(response);
    }
  }
}
