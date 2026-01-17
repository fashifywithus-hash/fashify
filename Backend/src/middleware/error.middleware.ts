import { Request, Response, NextFunction } from 'express';
import { ApiResponseDto } from '../dto/auth.dto';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);
  
  const response: ApiResponseDto = {
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { errors: [{ msg: err.message }] })
  };
  
  res.status(500).json(response);
};

/**
 * 404 Not Found middleware
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponseDto = {
    success: false,
    message: 'Route not found'
  };
  
  res.status(404).json(response);
};
