import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiResponseDto } from '../dto/auth.dto';
import { PersonalInfoResponseDto, WardrobeResponseDto } from '../dto/user.dto';
import { logger } from '../utils/logger';

/**
 * Controller for user personal information endpoints
 * Handles HTTP requests and responses
 */
export class UserController {
  /**
   * Handles user personal information update request
   * Updates user info and gets outfit suggestions
   * @param req - Express request object
   * @param res - Express response object
   */
  static async updatePersonalInfo(req: Request, res: Response): Promise<void> {
    try {
      const { _id, ...data } = req.body;
      logger.service('UserController', 'updatePersonalInfo', { 
        userId: _id,
        hasPhoto: !!data.userPic,
        fields: Object.keys(data).filter(k => k !== 'userPic'),
      });

      const result = await UserService.updatePersonalInfo(req.body);

      if (result.success && result.data) {
        logger.service('UserController', 'Update personal info success', {
          userId: _id,
          wardrobeItems: result.data.wardrobe?.length || 0,
        });
        const response: ApiResponseDto<WardrobeResponseDto> = {
          success: true,
          message: result.message,
          data: result.data
        };
        res.status(200).json(response);
      } else {
        logger.warn('Update personal info failed', { message: result.message, userId: _id }, 'USER_CONTROLLER');
        const response: ApiResponseDto = {
          success: false,
          message: result.message
        };
        res.status(400).json(response);
      }
    } catch (error) {
      logger.error('Update personal info controller error', error, 'USER_CONTROLLER');
      const response: ApiResponseDto = {
        success: false,
        message: 'Internal server error. Please try again later.'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Handles get user personal information request
   * @param req - Express request object
   * @param res - Express response object
   */
  static async getPersonalInfo(req: Request, res: Response): Promise<void> {
    try {
      const { _id } = req.body;
      logger.service('UserController', 'getPersonalInfo', { userId: _id });

      const result = await UserService.getPersonalInfo(_id);

      if (result.success && result.data) {
        logger.service('UserController', 'Get personal info success', { userId: _id });
        const response: ApiResponseDto<PersonalInfoResponseDto> = {
          success: true,
          message: result.message,
          data: result.data
        };
        res.status(200).json(response);
      } else {
        logger.warn('Get personal info failed', { message: result.message, userId: _id }, 'USER_CONTROLLER');
        const response: ApiResponseDto = {
          success: false,
          message: result.message
        };
        res.status(404).json(response);
      }
    } catch (error) {
      logger.error('Get personal info controller error', error, 'USER_CONTROLLER');
      const response: ApiResponseDto = {
        success: false,
        message: 'Internal server error. Please try again later.'
      };
      res.status(500).json(response);
    }
  }
}
