import crypto from "crypto";

/**
 * Générer un mot de passe aléatoire
 */
export const generateRandomPassword = (length: number = 12): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Assurer au moins une majuscule, une minuscule et un chiffre
  password += charset.replace(/[^A-Z]/g, "").charAt(Math.floor(Math.random() * 26));
  password += charset.replace(/[^a-z]/g, "").charAt(Math.floor(Math.random() * 26));
  password += charset.replace(/[^0-9]/g, "").charAt(Math.floor(Math.random() * 10));
  
  // Remplir le reste
  for (let i = password.length; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Mélanger le mot de passe
  return password.split("").sort(() => 0.5 - Math.random()).join("");
};

/**
 * Générer un code OTP de 6 chiffres
 */
export const generateOTP = (length: number = 6): string => {
  return crypto.randomInt(0, Math.pow(10, length))
    .toString()
    .padStart(length, "0");
};

/**
 * Hacher un token pour stockage en base de données
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Générer un token de réinitialisation sécurisé
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Vérifier si un token OTP a expiré
 */
export const isOTPExpired = (createdAt: Date, expiresInMinutes: number = 10): boolean => {
  const expiresAt = new Date(createdAt.getTime() + expiresInMinutes * 60 * 1000);
  return new Date() > expiresAt;
};

/**
 * Nettoyer les caractères spéciaux d'un numéro de téléphone
 */
export const sanitizePhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9+]/g, "");
};

/**
 * Générer un ID de token unique
 */
export const generateTokenId = (): string => {
  return crypto.randomUUID();
};
