/**
 * Backend Logging Utility
 * Provides structured logging for debugging and error tracking
 * Only supports info and error levels
 */

class Logger {
  private log(level: 'info' | 'error', message: string, data?: any, context?: string): void {
    const prefix = `[${new Date().toISOString()}] [${context || 'APP'}]`;
    
    if (level === 'error') {
      console.error(`${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '');
    } else {
      // Always log info
      console.log(`${prefix} ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  error(message: string, error?: any, context?: string): void {
    this.log('error', message, error, context);
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
    this.info(`Validation: ${field}`, { 
      value: this.sanitizeValue(value), 
      isValid: result,
      message 
    }, 'VALIDATION');
  }

  service(serviceName: string, action: string, data?: any): void {
    this.info(`${serviceName}: ${action}`, data, 'SERVICE');
  }

  database(operation: string, collection: string, data?: any): void {
    this.info(`DB ${operation}: ${collection}`, data, 'DATABASE');
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
