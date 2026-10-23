import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

// Types pour les payloads JWT
export interface AccessTokenPayload {
  sub: string; // ID du propriétaire
  telephone: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Fonctions utilitaires pour les secrets
const getAccessTokenSecret = (): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET manquant dans .env");
  }
  return secret;
};

const getRefreshTokenSecret = (): string => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error("REFRESH_TOKEN_SECRET manquant dans .env");
  }
  return secret;
};

// Configuration des durées
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

/**
 * Générer un access token JWT
 */
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getAccessTokenSecret(), {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

/**
 * Générer un refresh token JWT
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, getRefreshTokenSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

/**
 * Générer une paire de tokens (access + refresh)
 */
export const generateTokenPair = (payload: {
  userId: string;
  telephone: string;
  role: string;
  tokenId: string;
}): TokenPair => {
  const accessToken = generateAccessToken({
    sub: payload.userId,
    telephone: payload.telephone,
    role: payload.role,
  });

  const refreshToken = generateRefreshToken({
    sub: payload.userId,
    tokenId: payload.tokenId,
  });

  return { accessToken, refreshToken };
};

/**
 * Vérifier un access token
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getAccessTokenSecret()) as AccessTokenPayload;
};

/**
 * Vérifier un refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, getRefreshTokenSecret()) as RefreshTokenPayload;
};

/**
 * Décoder un token sans vérifier (utile pour debugging)
 */
export const decodeToken = (token: string): JwtPayload | null => {
  const decoded = jwt.decode(token);
  return decoded as JwtPayload | null;
};
