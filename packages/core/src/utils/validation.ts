// packages/core/src/utils/validation.ts

/**
 * Validates an email address format
 * @param email The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password meets minimum requirements
 * @param password The password to validate
 * @returns True if the password is valid, false otherwise
 */
export function isValidPassword(password: string): boolean {
  if (!password) return false;
  
  // Password must be at least 8 characters long and contain at least one number
  return password.length >= 8 && /\d/.test(password);
}

/**
 * Checks if a string is empty or only whitespace
 * @param value The string to check
 * @returns True if the string is empty or only whitespace, false otherwise
 */
export function isEmptyString(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return true;
  return value.trim() === '';
}