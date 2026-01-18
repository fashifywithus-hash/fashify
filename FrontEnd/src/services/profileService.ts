/**
 * Profile Service
 * Handles profile operations with the backend API
 */

import { apiClient } from "@/config/api";

export interface Profile {
  _id?: string;
  user_id: string;
  name: string | null;
  gender: string | null;
  weather_preference: number | null;
  lifestyle: string | null;
  body_type: string | null;
  height: number | null;
  skin_tone: number | null;
  preferred_styles: string[];
  photo_url: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileData {
  name?: string;
  gender?: string;
  weather_preference?: number;
  lifestyle?: string;
  body_type?: string;
  height?: number;
  skin_tone?: number;
  preferred_styles?: string[];
  photo_url?: string;
}

class ProfileService {
  /**
   * Get user profile
   */
  async getProfile(): Promise<Profile | null> {
    try {
      const data = await apiClient.post<{ profile: Profile }>("/api/onboarding/get", {});
      return data.profile;
    } catch (error: any) {
      if (error.error === "Profile not found") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Save or update user profile
   */
  async saveProfile(profileData: ProfileData): Promise<Profile> {
    const data = await apiClient.post<{ profile: Profile }>(
      "/api/onboarding",
      profileData
    );
    return data.profile;
  }

  /**
   * Check if user has a profile
   */
  async hasProfile(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return profile !== null;
    } catch {
      return false;
    }
  }
}

export const profileService = new ProfileService();
