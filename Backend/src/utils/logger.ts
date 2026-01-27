/**
 * Logger Utility
 * Provides consistent logging interface across the application
 * Only supports info and error log levels
 */

type LogLevel = "info" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    return JSON.stringify(logEntry, null, 2);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: any): void {
    console.log(this.formatMessage("info", message, data));
  }

  /**
   * Log error messages
   */
  error(message: string, error?: any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(this.formatMessage("error", message, errorData));
  }
}

// Export singleton instance
export const logger = new Logger();
