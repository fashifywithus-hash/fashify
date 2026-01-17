/**
 * Backend Logging Utility
 * Provides structured logging for debugging and error tracking
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private enableDebug = process.env.DEBUG_LOGS === 'true';

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const prefix = `[${new Date().toISOString()}] [${context || 'APP'}]`;
    
    // Always log errors
    if (level === 'error') {
      console.error(`${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '');
      return;
    }

    // Log warnings
    if (level === 'warn') {
      console.warn(`${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '');
      return;
    }

    // Log info/debug only in development or when debug is enabled
    if (this.isDevelopment || this.enableDebug) {
      if (level === 'info') {
        console.log(`${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '');
      } else if (level === 'debug') {
        console.debug(`${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '');
      }
    }
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: any, context?: string): void {
    this.log('error', message, error, context);
  }

  debug(message: string, data?: any, context?: string): void {
    this.log('debug', message, data, context);
  }

  // Specialized logging methods
  request(method: string, path: string, body?: any, query?: any): void {
    const sanitizedBody = this.sanitizeBody(body);
    this.info(`${method} ${path}`, { body: sanitizedBody, query }, 'REQUEST');
  }

  response(method: string, path: string, statusCode: number, duration: number, data?: any): void {
    this.info(`${method} ${path} - ${statusCode}`, { 
      duration: `${duration}ms`,
      hasData: !!data,
      dataSize: data ? JSON.stringify(data).length : 0,
    }, 'RESPONSE');
  }

  validation(field: string, value: any, result: boolean, message?: string): void {
    this.debug(`Validation: ${field}`, { 
      value: this.sanitizeValue(value), 
      isValid: result,
      message 
    }, 'VALIDATION');
  }

  service(serviceName: string, action: string, data?: any): void {
    this.info(`${serviceName}: ${action}`, data, 'SERVICE');
  }

  database(operation: string, collection: string, data?: any): void {
    this.debug(`DB ${operation}: ${collection}`, data, 'DATABASE');
  }

  // Sanitize sensitive data
  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.userPic) {
      sanitized.userPic = `[Base64 Image: ${sanitized.userPic.length} chars]`;
    }
    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    if (value && typeof value === 'object' && 'password' in value) {
      return { ...value, password: '[REDACTED]' };
    }
    return value;
  }
}

export const logger = new Logger();
