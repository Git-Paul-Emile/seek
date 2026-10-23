import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as AuthRepository from "../repositories/auth.repository.js";

// ─── Types────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

interface JwtAdminPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getSecret = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Variable d'environnement manquante : ${key}`);
  return value;
};

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const parseExpiry = (expiry: string): number => {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return value * (multipliers[unit] ?? 60);
};

// ─── Génération de tokens ─────────────────────────────────────────────────────

const generateTokenPair = (adminId: string, email: string): TokenPair => {
  const accessExpiry = process.env.ACCESS_TOKEN_EXPIRY ?? "15m";
  const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRY ?? "7d";

  const accessToken = jwt.sign(
    { sub: adminId, email } as JwtAdminPayload,
    getSecret("ACCESS_TOKEN_SECRET"),
    { expiresIn: accessExpiry } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { sub: adminId, email } as JwtAdminPayload,
    getSecret("REFRESH_TOKEN_SECRET"),
    { expiresIn: refreshExpiry } as jwt.SignOptions
  );

  const refreshTokenExpiresAt = new Date(
    Date.now() + parseExpiry(refreshExpiry) * 1000
  );

  return { accessToken, refreshToken, refreshTokenExpiresAt };
};

// ─── Service : Login ──────────────────────────────────────────────────────────

export const login = async (
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; refreshTokenExpiresAt: Date }> => {
  // 1. Trouver l'admin
  const admin = await AuthRepository.findAdminByEmail(email);
  if (!admin) {
    throw new AppError("Email ou mot de passe incorrect", StatusCodes.UNAUTHORIZED);
  }

  // 2. Vérifier le mot de passe (timing-safe via bcrypt)
  const passwordValid = await bcrypt.compare(password, admin.password);
  if (!passwordValid) {
    throw new AppError("Email ou mot de passe incorrect", StatusCodes.UNAUTHORIZED);
  }

  // 3. Générer la paire de tokens
  const tokens = generateTokenPair(admin.id, admin.email);

  // 4. Persister le refresh token (hash uniquement)
  await AuthRepository.createRefreshToken({
    adminId: admin.id,
    tokenHash: hashToken(tokens.refreshToken),
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return tokens;
};

// ─── Service : Refresh ────────────────────────────────────────────────────────

export const refresh = async (
  oldRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string; refreshTokenExpiresAt: Date }> => {
  // 1. Vérifier la signature JWT
  let payload: JwtAdminPayload;
  try {
    payload = jwt.verify(
      oldRefreshToken,
      getSecret("REFRESH_TOKEN_SECRET")
    ) as JwtAdminPayload;
  } catch {
    throw new AppError("Refresh token invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }

  // 2. Chercher le token en BDD
  const tokenHash = hashToken(oldRefreshToken);
  const storedToken = await AuthRepository.findRefreshToken(tokenHash);

  if (!storedToken) {
    // Token inconnu → possible replay attack après révocation → révoquer tout
    await AuthRepository.revokeAllRefreshTokens(payload.sub);
    throw new AppError("Token révoqué ou inconnu - session terminée", StatusCodes.UNAUTHORIZED);
  }

  if (storedToken.revokedAt !== null) {
    // Token déjà révoqué → signal de compromission → révoquer tous les tokens
    await AuthRepository.revokeAllRefreshTokens(payload.sub);
    throw new AppError("Token déjà utilisé - compromission détectée", StatusCodes.UNAUTHORIZED);
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError("Refresh token expiré", StatusCodes.UNAUTHORIZED);
  }

  // 3. Rotation : révoquer l'ancien token
  await AuthRepository.revokeRefreshToken(tokenHash);

  // 4. Générer une nouvelle paire
  const tokens = generateTokenPair(payload.sub, payload.email);

  // 5. Persister le nouveau refresh token
  await AuthRepository.createRefreshToken({
    adminId: payload.sub,
    tokenHash: hashToken(tokens.refreshToken),
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return tokens;
};

// ─── Service : Logout ─────────────────────────────────────────────────────────

export const logout = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await AuthRepository.findRefreshToken(tokenHash);

  if (storedToken && !storedToken.revokedAt) {
    await AuthRepository.revokeRefreshToken(tokenHash);
  }
};

// ─── Service : Vérification du access token ───────────────────────────────────

export const verifyAccessToken = (token: string): JwtAdminPayload => {
  try {
    return jwt.verify(token, getSecret("ACCESS_TOKEN_SECRET")) as JwtAdminPayload;
  } catch {
    throw new AppError("Token d'accès invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }
};

// ─── Service : Mise à jour du profil admin ─────────────────────────────────

export const updateProfile = async (
  id: string,
  data: { email?: string; password?: string }
) => {
  const admin = await AuthRepository.findAdminById(id);
  if (!admin) {
    throw new AppError("Admin introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérification de l'unicité de l'email si modifié
  if (data.email && data.email !== admin.email) {
    const existingEmail = await AuthRepository.findAdminByEmail(data.email);
    if (existingEmail && existingEmail.id !== id) {
      throw new AppError(
        "Cette adresse email est déjà utilisée par un autre admin.",
        StatusCodes.CONFLICT
      );
    }
  }

  // Hachage du mot de passe si fourni
  if (data.password) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
    data.password = await bcrypt.hash(data.password, saltRounds);
  }

  const updated = await AuthRepository.updateAdmin(id, {
    email: data.email,
    password: data.password,
  });

  return {
    id: updated.id,
    email: updated.email,
  };
};

// ─── Service : Changement de mot de passe ──────────────────────────────────

export const changePassword = async (
  adminId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  // 1. Trouver l'admin
  const admin = await AuthRepository.findAdminById(adminId);
  if (!admin) {
    throw new AppError("Admin introuvable", StatusCodes.NOT_FOUND);
  }

  // 2. Vérifier le mot de passe actuel
  const passwordValid = await bcrypt.compare(currentPassword, admin.password);
  if (!passwordValid) {
    throw new AppError(
      "Le mot de passe actuel est incorrect",
      StatusCodes.UNAUTHORIZED
    );
  }

  // 3. Vérifier que le nouveau mot de passe est différent de l'actuel
  if (currentPassword === newPassword) {
    throw new AppError(
      "Le nouveau mot de passe doit être différent de l'actuel",
      StatusCodes.BAD_REQUEST
    );
  }

  // 4. Hachage du nouveau mot de passe
  const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  // 5. Mise à jour du mot de passe
  await AuthRepository.updateAdmin(adminId, { password: hashedPassword });

  // 6. Révoquer tous les tokens existants pour des raisons de sécurité
  await AuthRepository.revokeAllRefreshTokens(adminId);

  return {
    message: "Mot de passe modifié avec succès. Veuillez vous reconnecter.",
  };
};
