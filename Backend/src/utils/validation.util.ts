/**
 * Validation utility functions
 */

/**
 * Validates phone number format
 * @param phoneNumber - Phone number to validate
 * @returns boolean indicating if phone number is valid
 */
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation - accepts digits, +, -, spaces, parentheses
  // Can be customized based on requirements
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns boolean indicating if password meets requirements
 */
export const validatePassword = (password: string): boolean => {
  // Password must be at least 6 characters
  return password.length >= 6;
};

/**
 * Validates user picture format
 * Accepts base64 data URLs or image URLs
 * @param userPic - User picture string (base64 or URL)
 * @returns boolean indicating if user picture format is valid
 */
export const validateUserPicture = (userPic: string): boolean => {
  if (!userPic || userPic.trim().length === 0) {
    return false;
  }

  // Check if it's a base64 data URL
  const base64DataUrlRegex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i;
  if (base64DataUrlRegex.test(userPic)) {
    return true;
  }

  // Check if it's a valid image URL
  const imageUrlRegex = /\.(jpeg|jpg|png|webp|gif)(\?.*)?$/i;
  const urlRegex = /^https?:\/\/.+/i;
  if (urlRegex.test(userPic) && imageUrlRegex.test(userPic)) {
    return true;
  }

  // Check if it's a base64 string without data URL prefix (legacy support)
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (base64Regex.test(userPic) && userPic.length > 100) {
    return true;
  }

  return false;
};
