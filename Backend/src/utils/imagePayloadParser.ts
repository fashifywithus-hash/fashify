/**
 * Image Payload Parser
 * Parses the fashifyInventoryImagePayload.csv file to get image URLs for styleIds
 */

import * as fs from 'fs';
import * as path from 'path';

export interface StyleImageData {
  styleId: string;
  imageUrl: string;
}

/**
 * Parse the image payload CSV and return a map of styleId -> default image URL
 */
export function parseImagePayloadCSV(): Map<string, string> {
  // Try multiple possible paths for the CSV file
  const possiblePaths = [
    path.join(process.cwd(), 'fashifyInventoryImagePayload.csv'), // When running from Backend folder
    path.join(process.cwd(), 'Backend', 'fashifyInventoryImagePayload.csv'), // When running from project root
    path.join(__dirname, '../../fashifyInventoryImagePayload.csv'), // When running from dist
  ];
  
  let csvPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      csvPath = possiblePath;
      break;
    }
  }
  
  if (!csvPath) {
    throw new Error(`Could not find fashifyInventoryImagePayload.csv in any of these locations: ${possiblePaths.join(', ')}`);
  }
  
  console.log(`📂 Reading image payload CSV from: ${csvPath}`);

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    const imageMap = new Map<string, string>();
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      // Parse CSV line (handling quoted JSON values)
      const firstCommaIndex = line.indexOf(',');
      if (firstCommaIndex === -1) continue;

      const styleId = line.substring(0, firstCommaIndex).trim();
      const jsonPart = line.substring(firstCommaIndex + 1).trim();
      
      try {
        // Parse the JSON string (it's double-quoted in CSV)
        const jsonStr = jsonPart.replace(/^"/, '').replace(/"$/, '').replace(/""/g, '"');
        const styleImages = JSON.parse(jsonStr);
        
        // Get the default image URL
        if (styleImages.default && styleImages.default.imageUrl) {
          imageMap.set(styleId, styleImages.default.imageUrl);
          console.log(`✓ Mapped styleId ${styleId} to image URL`);
        } else {
          console.warn(`⚠️ StyleId ${styleId} has no default image`);
        }
      } catch (parseError) {
        console.error(`❌ Error parsing JSON for styleId ${styleId}:`, parseError);
      }
    }

    console.log(`✅ Parsed ${imageMap.size} styleId-image mappings from CSV`);
    return imageMap;
  } catch (error: any) {
    console.error('❌ Error reading image payload CSV:', error.message);
    throw new Error(`Failed to parse image payload CSV: ${error.message}`);
  }
}

/**
 * Get image URL for a styleId
 */
export function getImageUrlForStyleId(styleId: string, imageMap: Map<string, string>): string | null {
  return imageMap.get(styleId) || null;
}

