import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiResponseDto } from '../dto/auth.dto';
import { logger } from '../utils/logger';

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
    logger.info('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errors.array(),
    }, 'VALIDATION');
    
    const response: ApiResponseDto = {
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    };
    res.status(400).json(response);
    return;
  }
  
  logger.info('Validation passed', { path: req.path, method: req.method }, 'VALIDATION');
  next();
};
