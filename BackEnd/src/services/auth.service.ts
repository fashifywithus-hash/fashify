import { User } from '../models/User.model';
import { SignupRequestDto, AuthResponseDto } from '../dto/auth.dto';
import { validateEmail, validatePassword } from '../utils/validation.util';
import { hashPassword, comparePassword } from '../utils/password.util';
import { logger } from '../utils/logger';

/**
 * Service for user authentication operations
 * Contains business logic for authentication
 */
export class AuthService {
  /**
   * Signs up a new user or logs in existing user
   * If user exists, verifies password and logs in
   * If user doesn't exist, creates new account
   * @param authData - User authentication data containing email and password
   * @returns Promise resolving to authentication result
   */
  static async signupOrLogin(authData: SignupRequestDto): Promise<{
    success: boolean;
    message: string;
    user?: AuthResponseDto;
  }> {
    try {
      const { email, password } = authData;
      const sanitizedEmail = email.substring(0, 3) + '***@' + email.split('@')[1];
      logger.service('AuthService', 'signupOrLogin', { email: sanitizedEmail });

      // Validate email
      if (!validateEmail(email)) {
        logger.warn('Invalid email format', { email: sanitizedEmail }, 'AUTH_SERVICE');
        return {
          success: false,
          message: 'Invalid email format'
        };
      }

      // Validate password
      if (!validatePassword(password)) {
        logger.warn('Invalid password format', null, 'AUTH_SERVICE');
        return {
          success: false,
          message: 'Password must be at least 6 characters long'
        };
      }

      // Check if user already exists
      const normalizedEmail = email.trim().toLowerCase();
      logger.database('findOne', 'users', { email: sanitizedEmail });
      const existingUser = await User.findOne({ email: normalizedEmail });
      
      if (existingUser) {
        logger.service('AuthService', 'Existing user found, attempting login', { userId: existingUser._id.toString() });
        // User exists - verify password for login
        const isPasswordValid = await comparePassword(password, existingUser.password);
        
        if (!isPasswordValid) {
          logger.warn('Login failed: invalid password', { userId: existingUser._id.toString() }, 'AUTH_SERVICE');
          return {
            success: false,
            message: 'Invalid email or password'
          };
        }

        // Login successful
        logger.service('AuthService', 'Login successful', { userId: existingUser._id.toString() });
        const userResponse: AuthResponseDto = {
          id: existingUser._id.toString(),
          email: existingUser.email,
          createdAt: existingUser.createdAt,
          action: 'login'
        };

        return {
          success: true,
          message: 'Login successful',
          user: userResponse
        };
      } else {
        logger.service('AuthService', 'New user, creating account', null);
        // User doesn't exist - create new account (signup)
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = new User({
          email: normalizedEmail,
          password: hashedPassword
        });

        logger.database('save', 'users', { email: sanitizedEmail });
        await newUser.save();
        logger.service('AuthService', 'Signup successful', { userId: newUser._id.toString() });

        // Return user data without password
        const userResponse: AuthResponseDto = {
          id: newUser._id.toString(),
          email: newUser.email,
          createdAt: newUser.createdAt,
          action: 'signup'
        };

        return {
          success: true,
          message: 'User signed up successfully',
          user: userResponse
        };
      }
    } catch (error: any) {
      logger.error('Signup/Login error', error, 'AUTH_SERVICE');
      
      // Handle duplicate key error (MongoDB unique constraint)
      if (error.code === 11000) {
        logger.warn('Duplicate email', { errorCode: error.code }, 'AUTH_SERVICE');
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      return {
        success: false,
        message: 'Failed to process request. Please try again later.'
      };
    }
  }
}
