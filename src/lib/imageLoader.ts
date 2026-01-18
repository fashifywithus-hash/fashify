/**
 * Utility to load product images from Backend/images folder
 */

let imageManifest: Record<string, string[]> | null = null;

/**
 * Load the image manifest (mapping of styleId to image paths)
 */
async function loadImageManifest(): Promise<Record<string, string[]>> {
  if (imageManifest) {
    return imageManifest;
  }

  try {
    const response = await fetch('/Backend/images-manifest.json');
    if (!response.ok) {
      throw new Error('Failed to load image manifest');
    }
    imageManifest = await response.json();
    return imageManifest;
  } catch (error) {
    console.error('Error loading image manifest:', error);
    return {};
  }
}

/**
 * Get image paths for a given styleId
 * Uses the image manifest for accurate image loading
 */
export async function getProductImages(styleId: string): Promise<string[]> {
  const manifest = await loadImageManifest();
  const basePath = '/Backend/images/';
  
  if (manifest[styleId] && manifest[styleId].length > 0) {
    // Return full paths to images
    const images = manifest[styleId].map(imagePath => `${basePath}${imagePath}`);
    return images;
  }
  
  // Fallback: If manifest doesn't have this styleId, return empty array
  console.warn(`No images found in manifest for styleId: ${styleId}`);
  return [];
}

/**
 * Get the first image for a product (for thumbnail)
 */
export async function getProductImage(styleId: string): Promise<string | null> {
  const images = await getProductImages(styleId);
  return images.length > 0 ? images[0] : null;
}
