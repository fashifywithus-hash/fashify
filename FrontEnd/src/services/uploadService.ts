/**
 * Upload Service
 * Handles file uploads to the backend API
 */

import { apiClient } from "@/config/api";

export interface UploadPhotoResponse {
  photo_url: string;
  message: string;
}

class UploadService {
  /**
   * Upload a photo file
   * @param file - The file to upload
   * @returns The photo URL (base64 data URL)
   */
  async uploadPhoto(file: File): Promise<string> {
    const API_BASE_URL = (apiClient as any).baseURL;
    const token = apiClient.getToken();
    
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("photo", file);

    const response = await fetch(`${API_BASE_URL}/api/upload/photo`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({
      error: response.statusText || "Unknown error",
    }));

    if (!response.ok) {
      const error: any = {
        error: data.error || "Upload failed",
        message: data.message,
      };
      throw error;
    }

    return (data as UploadPhotoResponse).photo_url;
  }
}

export const uploadService = new UploadService();
