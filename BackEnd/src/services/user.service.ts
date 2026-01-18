import { User } from '../models/User.model';
import { PersonalInfoRequestDto, PersonalInfoResponseDto, WardrobeResponseDto } from '../dto/user.dto';
import { getOutfitSuggestions } from '../utils/api.util';
import { logger } from '../utils/logger';

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
      logger.service('UserService', 'updatePersonalInfo', { 
        userId: _id,
        fields: Object.keys(updateData).filter(k => k !== 'userPic'),
        hasPhoto: !!updateData.userPic,
        photoSize: updateData.userPic ? `${(updateData.userPic.length / 1024).toFixed(2)}KB` : 'N/A',
      });

      // Find user by ID
      logger.database('findById', 'users', { userId: _id });
      const user = await User.findById(_id);
      if (!user) {
        logger.info('User not found for update', { userId: _id }, 'USER_SERVICE');
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Update user personal information
      const updatedFields: string[] = [];
      
      // Handle userPic separately: if not provided or empty, use existing photo from DB
      const hasNewPhoto = updateData.userPic !== undefined && 
                          updateData.userPic !== null && 
                          updateData.userPic !== '';
      
      if (!hasNewPhoto) {
        // No new photo provided, preserve existing photo from database
        if (user.userPic) {
          logger.info('No new photo provided, using existing photo from database', {
            userId: _id,
            existingPhotoSize: `${(user.userPic.length / 1024).toFixed(2)}KB`
          }, 'USER_SERVICE');
          // Keep existing userPic, don't update it
        } else {
          logger.info('No photo provided and no existing photo in database', { userId: _id }, 'USER_SERVICE');
        }
        // Remove userPic from updateData so it doesn't get cleared
        delete updateData.userPic;
      } else {
        // New photo provided, will be updated
        updatedFields.push('userPic');
      }
      
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof typeof updateData] !== undefined) {
          let value = updateData[key as keyof typeof updateData];
          
          // Normalize gender to proper case (Male, Female, Other)
          if (key === 'gender' && typeof value === 'string') {
            value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            if (!['Male', 'Female', 'Other'].includes(value)) {
              logger.info('Invalid gender value, skipping', { value, userId: _id }, 'USER_SERVICE');
              return; // Skip invalid gender values
            }
          }
          
          (user as any)[key] = value;
          updatedFields.push(key);
        }
      });

      logger.info('Updating user fields', { userId: _id, fields: updatedFields }, 'USER_SERVICE');
      logger.database('save', 'users', { userId: _id });
      await user.save();
      logger.service('UserService', 'User updated successfully', { userId: _id });

      // Prepare user info for API call including user picture
      // Use existing photo from DB if no new photo was provided
      const userPicForApi = user.userPic ? user.userPic : undefined;
      const userInfoForApi = {
        name: user.name,
        gender: user.gender,
        location: user.location,
        bodyType: user.bodyType,
        height: user.height,
        goToStyle: user.goToStyle,
        userPic: userPicForApi
      };

      logger.service('UserService', 'Calling outfit suggestions API', {
        userId: _id,
        hasPhoto: !!userInfoForApi.userPic,
        photoSource: hasNewPhoto ? 'new_upload' : (userPicForApi ? 'existing_db' : 'none'),
        photoSize: userPicForApi ? `${(userPicForApi.length / 1024).toFixed(2)}KB` : 'N/A'
      });
      // Call nano banano API to get outfit suggestions based on user info and picture
      const wardrobeSuggestions = await getOutfitSuggestions(userInfoForApi);
      logger.service('UserService', 'Outfit suggestions received', {
        userId: _id,
        wardrobeItems: wardrobeSuggestions.wardrobe?.length || 0,
      });

      return {
        success: true,
        message: 'Personal information updated successfully',
        data: wardrobeSuggestions
      };
    } catch (error: any) {
      logger.error('Update personal info error', error, 'USER_SERVICE');
      
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
      logger.service('UserService', 'getPersonalInfo', { userId });
      logger.database('findById', 'users', { userId });
      const user = await User.findById(userId);
      
      if (!user) {
        logger.info('User not found', { userId }, 'USER_SERVICE');
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

      logger.service('UserService', 'Personal info retrieved successfully', { userId });
      return {
        success: true,
        message: 'Personal information retrieved successfully',
        data: personalInfoResponse
      };
    } catch (error: any) {
      logger.error('Get personal info error', error, 'USER_SERVICE');
      
      return {
        success: false,
        message: 'Failed to retrieve personal information. Please try again later.'
      };
    }
  }
}
