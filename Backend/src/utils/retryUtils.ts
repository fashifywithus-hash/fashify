/**
 * Retry Utility Functions
 * Handles retry logic with exponential backoff for API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [429, 500, 502, 503, 504], // Rate limit and server errors
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable based on status code
 */
function isRetryableError(error: any, retryableStatusCodes: number[]): boolean {
  if (!error.response) {
    // Network errors are retryable
    return true;
  }
  
  const statusCode = error.response.status;
  return retryableStatusCodes.includes(statusCode);
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelayMs);
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if we should retry
      if (attempt === config.maxRetries) {
        console.error(`❌ Max retries (${config.maxRetries}) exceeded`);
        throw error;
      }

      // Check if error is retryable
      if (!isRetryableError(error, config.retryableStatusCodes)) {
        console.error(`❌ Error is not retryable (status: ${error.response?.status})`);
        throw error;
      }

      const delay = calculateDelay(attempt, config);
      const statusCode = error.response?.status || 'network error';
      
      console.warn(
        `⚠️ Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms (status: ${statusCode})`
      );
      
      await sleep(delay);
    }
  }

  throw lastError;
}

