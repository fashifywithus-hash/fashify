import { User } from '../models/User.model';
import { SignupRequestDto, AuthResponseDto } from '../dto/auth.dto';
import { validatePhoneNumber, validatePassword } from '../utils/validation.util';
import { hashPassword, comparePassword } from '../utils/password.util';

/**
 * Service for user authentication operations
 * Contains business logic for authentication
 */
export class AuthService {
  /**
   * Signs up a new user or logs in existing user
   * If user exists, verifies password and logs in
   * If user doesn't exist, creates new account
   * @param authData - User authentication data containing phone number and password
   * @returns Promise resolving to authentication result
   */
  static async signupOrLogin(authData: SignupRequestDto): Promise<{
    success: boolean;
    message: string;
    user?: AuthResponseDto;
  }> {
    try {
      const { phoneNumber, password } = authData;

      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        return {
          success: false,
          message: 'Invalid phone number format'
        };
      }

      // Validate password
      if (!validatePassword(password)) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long'
        };
      }

      // Check if user already exists
      const existingUser = await User.findOne({ phoneNumber });
      
      if (existingUser) {
        // User exists - verify password for login
        const isPasswordValid = await comparePassword(password, existingUser.password);
        
        if (!isPasswordValid) {
          return {
            success: false,
            message: 'Invalid phone number or password'
          };
        }

        // Login successful
        const userResponse: AuthResponseDto = {
          id: existingUser._id.toString(),
          phoneNumber: existingUser.phoneNumber,
          createdAt: existingUser.createdAt,
          action: 'login'
        };

        return {
          success: true,
          message: 'Login successful',
          user: userResponse
        };
      } else {
        // User doesn't exist - create new account (signup)
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = new User({
          phoneNumber,
          password: hashedPassword
        });

        await newUser.save();

        // Return user data without password
        const userResponse: AuthResponseDto = {
          id: newUser._id.toString(),
          phoneNumber: newUser.phoneNumber,
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
      console.error('Signup/Login error:', error);
      
      // Handle duplicate key error (MongoDB unique constraint)
      if (error.code === 11000) {
        return {
          success: false,
          message: 'User with this phone number already exists'
        };
      }

      return {
        success: false,
        message: 'Failed to process request. Please try again later.'
      };
    }
  }
}
