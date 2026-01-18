/**
 * Frontend Logging Utility
 * Provides structured logging for debugging and error tracking
 * Only supports info and error levels
 */

class Logger {
  private log(level: 'info' | 'error', message: string, data?: any, context?: string): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${context || 'APP'}]`;
    
    if (level === 'error') {
      console.error(`${prefix} ${message}`, data || '');
    } else {
      // Always log info
      console.log(`${prefix} ${message}`, data || '');
    }
  }

  info(message: string, data?: any, context?: string): void {
    this.log('info', message, data, context);
  }

  error(message: string, error?: any, context?: string): void {
    this.log('error', message, error, context);
  }

  // Specialized logging methods
  apiRequest(endpoint: string, method: string, payload?: any): void {
    this.info(`API Request: ${method} ${endpoint}`, { payload }, 'API');
  }

  apiResponse(endpoint: string, method: string, response: any, duration?: number): void {
    this.info(`API Response: ${method} ${endpoint}`, { response, duration: `${duration}ms` }, 'API');
  }

  apiError(endpoint: string, method: string, error: any): void {
    this.error(`API Error: ${method} ${endpoint}`, error, 'API');
  }

  auth(action: string, data?: any): void {
    this.info(`Auth: ${action}`, data, 'AUTH');
  }

  onboarding(step: string, data?: any): void {
    this.info(`Onboarding: ${step}`, data, 'ONBOARDING');
  }
}

export const logger = new Logger();
