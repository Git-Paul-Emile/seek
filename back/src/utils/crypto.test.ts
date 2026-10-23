import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateRandomPassword,
  generateOTP,
  hashToken,
  generateResetToken,
  isOTPExpired,
  sanitizePhoneNumber,
  generateTokenId
} from './crypto.js';

describe('crypto utils', () => {
  describe('generateRandomPassword', () => {
    it('devrait générer un mot de passe de la longueur par défaut (12)', () => {
      const password = generateRandomPassword();
      expect(password).toHaveLength(12);
    });

    it('devrait générer un mot de passe de la longueur spécifiée', () => {
      const password = generateRandomPassword(16);
      expect(password).toHaveLength(16);
    });

    it('devrait contenir au moins une majuscule', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[A-Z]/);
    });

    it('devrait contenir au moins une minuscule', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[a-z]/);
    });

    it('devrait contenir au moins un chiffre', () => {
      const password = generateRandomPassword();
      expect(password).toMatch(/[0-9]/);
    });

    it('devrait générer des mots de passe différents à chaque appel', () => {
      const password1 = generateRandomPassword();
      const password2 = generateRandomPassword();
      expect(password1).not.toBe(password2);
    });
  });

  describe('generateOTP', () => {
    it('devrait générer un OTP de 6 chiffres par défaut', () => {
      const otp = generateOTP();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('devrait générer un OTP de la longueur spécifiée', () => {
      const otp = generateOTP(4);
      expect(otp).toHaveLength(4);
      expect(otp).toMatch(/^\d{4}$/);
    });

    it('devrait générer des OTP différents à chaque appel', () => {
      const otp1 = generateOTP();
      const otp2 = generateOTP();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('hashToken', () => {
    it('devrait hasher un token avec sha256', () => {
      const token = 'test-token';
      const hashed = hashToken(token);
      expect(hashed).toHaveLength(64); // sha256 hex = 64 chars
    });

    it('devrait toujours produire le même hash pour le même token', () => {
      const token = 'test-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toBe(hash2);
    });

    it('devrait produire des hashes différents pour des tokens différents', () => {
      const hash1 = hashToken('token1');
      const hash2 = hashToken('token2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateResetToken', () => {
    it('devrait générer un token de 64 caractères', () => {
      const token = generateResetToken();
      expect(token).toHaveLength(64);
    });

    it('devrait générer des tokens différents à chaque appel', () => {
      const token1 = generateResetToken();
      const token2 = generateResetToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('isOTPExpired', () => {
    it('devrait retourner true si OTP expiré', () => {
      const createdAt = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
      const result = isOTPExpired(createdAt, 10);
      expect(result).toBe(true);
    });

    it('devrait retourner false si OTP non expiré', () => {
      const createdAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const result = isOTPExpired(createdAt, 10);
      expect(result).toBe(false);
    });

    it('devrait utiliser 10 minutes par défaut', () => {
      const createdAt = new Date(Date.now() - 11 * 60 * 1000);
      const result = isOTPExpired(createdAt);
      expect(result).toBe(true);
    });
  });

  describe('sanitizePhoneNumber', () => {
    it('devrait supprimer les caractères spéciaux sauf +', () => {
      const phone = '+221 77 123 45 67';
      const sanitized = sanitizePhoneNumber(phone);
      expect(sanitized).toBe('+221771234567');
    });

    it('devrait garder uniquement les chiffres et le +', () => {
      const phone = '(+33) 1 23 45 67 89';
      const sanitized = sanitizePhoneNumber(phone);
      expect(sanitized).toBe('+33123456789');
    });

    it('devrait fonctionner avec un numéro sans caractères spéciaux', () => {
      const phone = '221771234567';
      const sanitized = sanitizePhoneNumber(phone);
      expect(sanitized).toBe('221771234567');
    });
  });

  describe('generateTokenId', () => {
    it('devrait générer un UUID v4', () => {
      const tokenId = generateTokenId();
      expect(tokenId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('devrait générer des tokenId différents à chaque appel', () => {
      const tokenId1 = generateTokenId();
      const tokenId2 = generateTokenId();
      expect(tokenId1).not.toBe(tokenId2);
    });
  });
});
