import { Request, Response, NextFunction } from 'express';
import { ApiResponseDto } from '../dto/auth.dto';
import { logger } from '../utils/logger';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  }, 'ERROR_HANDLER');
  
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
  // Ignore Vite dev server routes and other common dev tools
  const ignoredPaths = [
    '/__server_sent_events__',
    '/@vite/client',
    '/@react-refresh',
    '/@fs',
    '/node_modules',
    '/favicon.ico'
  ];
  
  const shouldIgnore = ignoredPaths.some(path => req.path.startsWith(path));
  
  if (!shouldIgnore) {
    logger.warn('Route not found', { path: req.path, method: req.method }, 'NOT_FOUND');
  }
  
  const response: ApiResponseDto = {
    success: false,
    message: 'Route not found'
  };
  
  res.status(404).json(response);
};
