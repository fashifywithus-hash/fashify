/**
 * Try-On Service
 * Handles try-on API calls to backend
 */

import { apiClient } from "@/config/api";

export interface TryOnRequest {
  baseUpperStyleId: string;    // StyleId for base upper layer (e.g., t-shirt)
  outerUpperStyleId: string;    // StyleId for outer upper layer (e.g., jacket)
  bottomsStyleId: string;       // StyleId for bottoms (e.g., jeans)
  footwearStyleId: string;     // StyleId for footwear (e.g., shoes)
}

export interface TryOnResponse {
  success: boolean;
  image: string;  // Base64 encoded image data URL
  message: string;
}

class TryOnService {
  /**
   * Generate try-on image using selected items
   */
  async tryOn(request: TryOnRequest): Promise<TryOnResponse> {
    try {
      const data = await apiClient.post<TryOnResponse>("/api/tryon", request);
      return data;
    } catch (error: any) {
      console.error("Failed to generate try-on:", error);
      throw error;
    }
  }
}

export const tryOnService = new TryOnService();
