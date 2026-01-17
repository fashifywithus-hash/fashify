import bcrypt from 'bcryptjs';

/**
 * Password utility functions
 */

/**
 * Hashes a password using bcrypt
 * @param password - Plain text password
 * @returns Promise resolving to hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password with a hashed password
 * @param plainPassword - Plain text password
 * @param hashedPassword - Hashed password
 * @returns Promise resolving to boolean indicating if passwords match
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
