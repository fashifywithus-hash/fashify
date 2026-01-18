/**
 * Image utility functions
 */

/**
 * Convert File to base64 data URL
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convert File to base64 string (without data URL prefix)
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  const dataURL = await fileToDataURL(file);
  // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
  return dataURL.split(",")[1] || dataURL;
};

/**
 * Convert base64 to data URL
 */
export const base64ToDataURL = (base64: string, mimeType: string = "image/jpeg"): string => {
  return `data:${mimeType};base64,${base64}`;
};
