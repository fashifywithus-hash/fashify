/**
 * Frontend Logging Utility
 * Provides structured logging for debugging and error tracking
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private enableDebug = import.meta.env.VITE_DEBUG_LOGS === 'true';

  private formatMessage(level: LogLevel, message: string, data?: any, context?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private log(level: LogLevel, message: string, data?: any, context?: string): void {
    const entry = this.formatMessage(level, message, data, context);
    
    // Always log errors
    if (level === 'error') {
      console.error(`[${entry.timestamp}] [${context || 'APP'}] ${message}`, data || '');
      return;
    }

    // Log warnings in development
    if (level === 'warn' && this.isDevelopment) {
      console.warn(`[${entry.timestamp}] [${context || 'APP'}] ${message}`, data || '');
      return;
    }

    // Log info/debug only in development or when debug is enabled
    if ((this.isDevelopment || this.enableDebug) && (level === 'info' || level === 'debug')) {
      const logMethod = level === 'debug' ? console.debug : console.log;
      logMethod(`[${entry.timestamp}] [${context || 'APP'}] ${message}`, data || '');
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
  apiRequest(endpoint: string, method: string, payload?: any): void {
    this.debug(`API Request: ${method} ${endpoint}`, { payload }, 'API');
  }

  apiResponse(endpoint: string, method: string, response: any, duration?: number): void {
    this.debug(`API Response: ${method} ${endpoint}`, { response, duration: `${duration}ms` }, 'API');
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
