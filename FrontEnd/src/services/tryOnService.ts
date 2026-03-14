/**
 * Try-On Service
 * Handles try-on API calls to backend
 */

import { apiClient } from "@/config/api";

export interface JewelleryTryOnRequest {
  necklineStyleId: string;
  sareeStyleId: string;
}

export interface JewelleryTryOnResponse {
  success: boolean;
  image: string;
  message: string;
}

class TryOnService {
  /**
   * Generate jewellery multi-view try-on images using selected items
   */
  async tryOn(request: JewelleryTryOnRequest): Promise<JewelleryTryOnResponse> {
    try {
      const data = await apiClient.post<JewelleryTryOnResponse>("/api/tryon", request);
      return data;
    } catch (error: any) {
      console.error("Failed to generate try-on:", error);
      throw error;
    }
  }
}

export const tryOnService = new TryOnService();
