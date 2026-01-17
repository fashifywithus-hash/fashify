/**
 * API Client for Backend Integration
 * Handles all communication with the Fashify backend API
 */

import { logger } from './logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface AuthResponse {
  id: string;
  email: string;
  createdAt: string;
  action: 'signup' | 'login';
}

export interface PersonalInfoRequest {
  _id: string;
  name?: string;
  gender?: 'Male' | 'Female' | 'Other';
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
}

export interface PersonalInfoResponse {
  _id: string;
  name?: string;
  gender?: string;
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
  updatedAt: string;
}

export interface WardrobeItem {
  image: string;
}

export interface WardrobeResponse {
  title: string;
  description: string;
  wardrobe: WardrobeItem[];
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const startTime = Date.now();
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    // Log request
    let payload: any = null;
    if (config.body) {
      try {
        payload = JSON.parse(config.body as string);
        // Don't log full image data, just metadata
        if (payload.userPic) {
          payload = {
            ...payload,
            userPic: `[Base64 Image: ${payload.userPic.length} chars]`,
          };
        }
      } catch {
        payload = '[Non-JSON body]';
      }
    }
    logger.apiRequest(endpoint, method, payload);

    try {
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        logger.apiError(endpoint, method, {
          status: response.status,
          statusText: response.statusText,
          error: data,
        });
        return {
          success: false,
          message: data.message || 'An error occurred',
          errors: data.errors,
        };
      }

      logger.apiResponse(endpoint, method, {
        success: data.success,
        hasData: !!data.data,
        dataSize: data.data ? JSON.stringify(data.data).length : 0,
      }, duration);

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.apiError(endpoint, method, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Authentication
  async signupOrLogin(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    const sanitizedEmail = email.substring(0, 3) + '***@' + email.split('@')[1];
    logger.auth('Signup/Login attempt', { email: sanitizedEmail });
    const result = await this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success) {
      logger.auth('Signup/Login success', { action: result.data?.action, userId: result.data?.id });
    } else {
      logger.auth('Signup/Login failed', { error: result.message });
    }
    return result;
  }

  // User Personal Info
  async updatePersonalInfo(data: PersonalInfoRequest): Promise<ApiResponse<WardrobeResponse>> {
    return this.request<WardrobeResponse>('/api/user/personal-info', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPersonalInfo(_id: string): Promise<ApiResponse<PersonalInfoResponse>> {
    return this.request<PersonalInfoResponse>('/api/user/get-personal-info', {
      method: 'POST',
      body: JSON.stringify({ _id }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
