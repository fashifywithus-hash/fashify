import { User } from '../models/User.model';
import { PersonalInfoRequestDto, PersonalInfoResponseDto, WardrobeResponseDto } from '../dto/user.dto';
import { getOutfitSuggestions } from '../utils/api.util';

/**
 * Service for user personal information operations
 * Contains business logic for user profile management
 */
export class UserService {
  /**
   * Updates user personal information and gets outfit suggestions
   * @param personalInfo - User personal information data
   * @returns Promise resolving to wardrobe suggestions
   */
  static async updatePersonalInfo(personalInfo: PersonalInfoRequestDto): Promise<{
    success: boolean;
    message: string;
    data?: WardrobeResponseDto;
  }> {
    try {
      const { _id, ...updateData } = personalInfo;

      // Find user by ID
      const user = await User.findById(_id);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update user personal information
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] !== undefined) {
          (user as any)[key] = updateData[key as keyof typeof updateData];
        }
      });

      await user.save();

      // Prepare user info for API call including user picture
      const userInfoForApi = {
        name: user.name,
        gender: user.gender,
        location: user.location,
        bodyType: user.bodyType,
        height: user.height,
        goToStyle: user.goToStyle,
        userPic: user.userPic
      };

      // Call nano banano API to get outfit suggestions based on user info and picture
      const wardrobeSuggestions = await getOutfitSuggestions(userInfoForApi);

      return {
        success: true,
        message: 'Personal information updated successfully',
        data: wardrobeSuggestions
      };
    } catch (error: any) {
      console.error('Update personal info error:', error);
      
      return {
        success: false,
        message: 'Failed to update personal information. Please try again later.'
      };
    }
  }

  /**
   * Gets user personal information
   * @param userId - User ID
   * @returns Promise resolving to user personal information
   */
  static async getPersonalInfo(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: PersonalInfoResponseDto;
  }> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      const personalInfoResponse: PersonalInfoResponseDto = {
        _id: user._id.toString(),
        name: user.name,
        gender: user.gender,
        location: user.location,
        bodyType: user.bodyType,
        height: user.height,
        goToStyle: user.goToStyle,
        userPic: user.userPic,
        updatedAt: user.updatedAt
      };

      return {
        success: true,
        message: 'Personal information retrieved successfully',
        data: personalInfoResponse
      };
    } catch (error: any) {
      console.error('Get personal info error:', error);
      
      return {
        success: false,
        message: 'Failed to retrieve personal information. Please try again later.'
      };
    }
  }
}
