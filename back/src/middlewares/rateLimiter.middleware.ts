import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const shouldSkipSensitiveRateLimit = () => process.env.NODE_ENV !== "production";

/**
 * Rate limiter global - 500 requêtes par 15 minutes
 */
export const limiteurGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour l'authentification (inscription, connexion, mot de passe oublié)
 * 10 tentatives par 15 minutes
 */
export const limiteurAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skip: shouldSkipSensitiveRateLimit,
  message: {
    success: false,
    message: "Trop de tentatives, veuillez réessayer dans 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Utiliser le numéro de téléphone en priorité, sinon utiliser l'IP avec support IPv6
    const phone = req.body?.telephone;
    return phone || ipKeyGenerator(req as any);
  },
});

/**
 * Rate limiter pour les OTP (mot de passe oublié par SMS/Email)
 * 5 tentatives par heure
 */
export const limiteurOtp = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5,
  skip: shouldSkipSensitiveRateLimit,
  message: {
    success: false,
    message: "Trop de demandes de code, veuillez réessayer dans une heure",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = req.body?.telephone;
    const email = req.body?.email;
    return phone || email || ipKeyGenerator(req as any);
  },
});

/**
 * Rate limiter strict pour les opérations sensibles
 * 5 tentatives par 15 minutes
 */
export const limiteurStrict = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skip: shouldSkipSensitiveRateLimit,
  message: {
    success: false,
    message: "Opération trop fréquente, veuillez réessayer plus tard",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour le refresh token
 * 30 requêtes par heure
 */
export const limiteurRefresh = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  skip: shouldSkipSensitiveRateLimit,
  message: {
    success: false,
    message: "Trop de renouvellements de token",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
