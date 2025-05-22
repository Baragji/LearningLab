// packages/core/src/utils/validation.test.ts
import { isValidEmail, isValidPassword, isEmptyString } from './validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test@example.')).toBe(false);
      expect(isValidEmail('test@exam ple.com')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('password123')).toBe(true);
      expect(isValidPassword('12345678')).toBe(true);
      expect(isValidPassword('securePassword1')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('short1')).toBe(false); // Too short
      expect(isValidPassword('passwordwithoutdigit')).toBe(false); // No digit
    });
  });

  describe('isEmptyString', () => {
    it('should return true for empty strings', () => {
      expect(isEmptyString('')).toBe(true);
      expect(isEmptyString('   ')).toBe(true);
      expect(isEmptyString(null)).toBe(true);
      expect(isEmptyString(undefined)).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmptyString('text')).toBe(false);
      expect(isEmptyString('  text  ')).toBe(false);
      expect(isEmptyString('0')).toBe(false);
    });
  });
});