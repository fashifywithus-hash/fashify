import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponseDto } from '../dto/auth.dto';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const response: ApiResponseDto = {
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    };
    res.status(400).json(response);
    return;
  }
  
  next();
};
