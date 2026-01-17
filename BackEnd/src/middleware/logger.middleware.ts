import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request/Response logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const { method, path, query, body } = req;

  // Log request
  logger.request(method, path, body, query);

  // Log response when it finishes
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    logger.response(method, path, res.statusCode, duration, data);
    return originalSend.call(this, data);
  };

  next();
};
