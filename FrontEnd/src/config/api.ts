/**
 * API Configuration
 * Centralized API client for backend communication
 */

/**
 * Get the API base URL based on environment
 * - Uses VITE_API_URL if explicitly set (build-time env var) - REQUIRED for production
 * - Falls back to localhost for development
 * 
 * For production: Set VITE_API_URL in .env.production before building
 * Example: VITE_API_URL=https://fashify-backend-prod.us-east-1.elasticbeanstalk.com
 */
function getApiBaseUrl(): string {
  // If explicitly set via environment variable, use it (required for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Auto-detect: if running on production domain, try to construct API URL
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // If running on production domain (not localhost or local IP)
    if (hostname !== "localhost" && 
        hostname !== "127.0.0.1" && 
        !hostname.startsWith("192.168.") &&
        !hostname.startsWith("10.")) {
      
      // For AWS S3/CloudFront deployments, VITE_API_URL must be set at build time
      if (hostname.includes("s3-website") || 
          hostname.includes("amazonaws.com") || 
          hostname.includes("cloudfront.net")) {
        const errorMsg = 
          "❌ CRITICAL CONFIGURATION ERROR ❌\n" +
          "VITE_API_URL must be set in production build.\n" +
          "Please set VITE_API_URL in .env.production before building.\n" +
          "Example: VITE_API_URL=http://your-backend.elasticbeanstalk.com\n" +
          "Current fallback will create an invalid URL and API calls will fail!";
        console.error(errorMsg);
        // Return a placeholder that will fail fast with a clear error
        // This prevents silent failures and makes the issue obvious
        return "INVALID_API_URL_NOT_SET";
      }
      
      // For custom domains, try api subdomain as fallback
      // But VITE_API_URL should still be set explicitly
      console.warn(
        "Running on production domain but VITE_API_URL not set. " +
        "Using api subdomain as fallback. Set VITE_API_URL in .env.production for production builds."
      );
      return `${protocol}//api.${hostname}`;
    }
  }

  // Default to localhost for development
  return "http://localhost:3000";
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiError {
  error: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    } else if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
   // Validate API URL is properly configured
    if (this.baseURL === "INVALID_API_URL_NOT_SET" || !this.baseURL.startsWith("http")) {
      const error: ApiError = {
        error: "API Configuration Error",
        message: "VITE_API_URL is not set. Please set it in .env.production and rebuild the application."
      };
      throw error;
    }
    
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({
      error: response.statusText || "Unknown error",
    }));

    if (!response.ok) {
      const error: ApiError = {
        error: data.error || "Request failed",
        message: data.message,
      };
      throw error;
    }

    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
