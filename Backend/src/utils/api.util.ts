import axios, { AxiosInstance } from 'axios';

/**
 * API utility functions for external API calls
 */

/**
 * Creates an axios instance for API calls
 */
export const createApiClient = (baseURL?: string): AxiosInstance => {
  return axios.create({
    baseURL: baseURL || process.env.NANO_BANANO_API_URL || 'https://api.nanobanano.com',
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Calls nano banano API to get outfit suggestions
 * @param userInfo - User personal information including user picture
 * @returns Promise resolving to wardrobe suggestions
 */
export const getOutfitSuggestions = async (userInfo: {
  name?: string;
  gender?: string;
  location?: string;
  bodyType?: string;
  height?: string;
  goToStyle?: string;
  userPic?: string;
}): Promise<{
  title: string;
  description: string;
  wardrobe: Array<{ image: string }>;
}> => {
  try {
    const apiClient = createApiClient();
    
    // Call nano banano API with user information including user picture
    const response = await apiClient.post('/outfit-suggestions', {
      name: userInfo.name,
      gender: userInfo.gender,
      location: userInfo.location,
      bodyType: userInfo.bodyType,
      height: userInfo.height,
      goToStyle: userInfo.goToStyle,
      userPic: userInfo.userPic
    });

    // Return the wardrobe suggestions
    return {
      title: response.data.title || 'Suggested Wardrobe',
      description: response.data.description || 'Based on your personal information, we have suggested a wardrobe for you',
      wardrobe: response.data.wardrobe || []
    };
  } catch (error: any) {
    console.error('Error calling nano banano API:', error);
    
    // Return default response if API call fails
    // In production, you might want to handle this differently
    return {
      title: 'Suggested Wardrobe',
      description: 'Based on your personal information, we have suggested a wardrobe for you',
      wardrobe: []
    };
  }
};
