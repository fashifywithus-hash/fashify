/**
 * Recommendation Service
 * Handles recommendation API calls to backend
 */

import { apiClient } from "@/config/api";
import type { RecommendationResult } from "@/types/inventory";

export interface RecommendationsResponse {
  message: string;
  recommendations: RecommendationResult;
  preferences?: any; // User preferences used for recommendations
}

class RecommendationService {
  /**
   * Get outfit recommendations based on user's saved profile
   * The backend automatically fetches the user's profile using the auth token
   */
  async getRecommendations(): Promise<RecommendationResult> {
    try {
      const data = await apiClient.post<RecommendationsResponse>("/api/recommendations", {});
      return data.recommendations;
    } catch (error: any) {
      console.error("Failed to get recommendations:", error);
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();
