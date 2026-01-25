/**
 * Image Utility Functions
 * Handles image URL fetching and base64 conversion
 */

import axios from 'axios';

/**
 * Fetch image from URL and convert to base64
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`📥 Fetching image from URL: ${imageUrl}`);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000, // 30 second timeout
    });

    const buffer = Buffer.from(response.data, 'binary');
    const base64 = buffer.toString('base64');
    
    console.log(`✅ Successfully converted image to base64 (${base64.length} chars)`);
    return base64;
  } catch (error: any) {
    console.error(`❌ Error fetching image from ${imageUrl}:`, error.message);
    throw new Error(`Failed to fetch image: ${error.message}`);
  }
}

/**
 * Convert base64 string to data URL
 */
export function base64ToDataUrl(base64: string, mimeType: string = 'image/png'): string {
  return `data:${mimeType};base64,${base64}`;
}

