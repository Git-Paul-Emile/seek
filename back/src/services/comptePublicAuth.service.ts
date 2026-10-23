import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface JwtPayload {
  sub: string;
  nom: string;
  prenom: string;
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

const generateTokenPair = (id: string, nom: string, prenom: string): TokenPair => {
  const accessExpiry = process.env.COMPTE_PUBLIC_ACCESS_TOKEN_EXPIRY ?? "15m";
  const refreshExpiry = process.env.COMPTE_PUBLIC_REFRESH_TOKEN_EXPIRY ?? "30d";

  const accessToken = jwt.sign(
    { sub: id, nom, prenom } as JwtPayload,
    getSecret("COMPTE_PUBLIC_ACCESS_TOKEN_SECRET"),
    { expiresIn: accessExpiry } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { sub: id, nom, prenom } as JwtPayload,
    getSecret("COMPTE_PUBLIC_REFRESH_TOKEN_SECRET"),
    { expiresIn: refreshExpiry } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: new Date(Date.now() + parseExpiry(refreshExpiry) * 1000),
  };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, getSecret("COMPTE_PUBLIC_ACCESS_TOKEN_SECRET")) as JwtPayload;
  } catch {
    throw new AppError("Token d'accès invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }
};

// ─── Register ─────────────────────────────────────────────────────────────────

export const register = async (data: {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  password: string;
}) => {
  const existing = await prisma.comptePublic.findFirst({
    where: {
      OR: [
        { telephone: data.telephone },
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  if (existing) {
    throw new AppError("Un compte existe déjà avec ce numéro ou cet email", StatusCodes.CONFLICT);
  }

  const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  const compte = await prisma.comptePublic.create({
    data: {
      nom: data.nom,
      prenom: data.prenom,
      telephone: data.telephone,
      email: data.email ?? null,
      password: hashedPassword,
    },
  });

  const tokens = generateTokenPair(compte.id, compte.nom, compte.prenom);
  await saveRefreshToken(compte.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return { compte: { id: compte.id, nom: compte.nom, prenom: compte.prenom, telephone: compte.telephone, email: compte.email }, tokens };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const login = async (data: { telephone: string; password: string }) => {
  const compte = await prisma.comptePublic.findUnique({
    where: { telephone: data.telephone },
  });

  if (!compte || !(await bcrypt.compare(data.password, compte.password))) {
    throw new AppError("Numéro de téléphone ou mot de passe incorrect", StatusCodes.UNAUTHORIZED);
  }

  // Les comptes liés doivent se connecter via leur propre interface (owner / locataire)
  if (compte.proprietaireId) {
    throw new AppError(
      "Ce numéro est associé à un compte propriétaire. Connectez-vous via l'espace propriétaire.",
      StatusCodes.FORBIDDEN
    );
  }
  if (compte.locataireId) {
    throw new AppError(
      "Ce numéro est associé à un compte locataire. Connectez-vous via l'espace locataire.",
      StatusCodes.FORBIDDEN
    );
  }

  const tokens = generateTokenPair(compte.id, compte.nom, compte.prenom);
  await saveRefreshToken(compte.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return { compte: { id: compte.id, nom: compte.nom, prenom: compte.prenom, telephone: compte.telephone, email: compte.email }, tokens };
};

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refreshTokens = async (rawToken: string) => {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(rawToken, getSecret("COMPTE_PUBLIC_REFRESH_TOKEN_SECRET")) as JwtPayload;
  } catch {
    throw new AppError("Refresh token invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }

  const tokenHash = hashToken(rawToken);
  const stored = await prisma.comptePublicRefreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new AppError("Refresh token invalide", StatusCodes.UNAUTHORIZED);
  }

  // Rotate token
  await prisma.comptePublicRefreshToken.update({ where: { tokenHash }, data: { revokedAt: new Date() } });

  const compte = await prisma.comptePublic.findUnique({ where: { id: payload.sub } });
  if (!compte) throw new AppError("Compte introuvable", StatusCodes.UNAUTHORIZED);

  const tokens = generateTokenPair(compte.id, compte.nom, compte.prenom);
  await saveRefreshToken(compte.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return { compte: { id: compte.id, nom: compte.nom, prenom: compte.prenom, telephone: compte.telephone, email: compte.email }, tokens };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (rawToken: string) => {
  const tokenHash = hashToken(rawToken);
  await prisma.comptePublicRefreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

// ─── Me ───────────────────────────────────────────────────────────────────────

export const getMe = async (id: string) => {
  const compte = await prisma.comptePublic.findUnique({
    where: { id },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, createdAt: true },
  });
  if (!compte) throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);
  return compte;
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateProfile = async (
  id: string,
  data: { nom?: string; prenom?: string; email?: string | null }
) => {
  if (data.email) {
    const conflict = await prisma.comptePublic.findFirst({
      where: { email: data.email, NOT: { id } },
    });
    if (conflict) throw new AppError("Cet email est déjà utilisé", StatusCodes.CONFLICT);
  }

  const compte = await prisma.comptePublic.update({
    where: { id },
    data: {
      ...(data.nom !== undefined && { nom: data.nom }),
      ...(data.prenom !== undefined && { prenom: data.prenom }),
      ...(data.email !== undefined && { email: data.email }),
    },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, createdAt: true },
  });
  return compte;
};

// ─── Change Password ───────────────────────────────────────────────────────────

export const changePassword = async (
  id: string,
  data: { currentPassword: string; newPassword: string }
) => {
  const compte = await prisma.comptePublic.findUnique({ where: { id } });
  if (!compte) throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);

  const valid = await bcrypt.compare(data.currentPassword, compte.password);
  if (!valid) throw new AppError("Mot de passe actuel incorrect", StatusCodes.UNAUTHORIZED);

  const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
  const hashedPassword = await bcrypt.hash(data.newPassword, saltRounds);

  await prisma.comptePublic.update({ where: { id }, data: { password: hashedPassword } });
};

// ─── Delete Account ────────────────────────────────────────────────────────────

export const deleteAccount = async (id: string, password: string) => {
  const compte = await prisma.comptePublic.findUnique({ where: { id } });
  if (!compte) throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);

  const valid = await bcrypt.compare(password, compte.password);
  if (!valid) throw new AppError("Mot de passe incorrect", StatusCodes.UNAUTHORIZED);

  // Cascade: refreshTokens + favoris supprimés automatiquement (onDelete: Cascade)
  await prisma.comptePublic.delete({ where: { id } });
};

// ─── Helpers internes ─────────────────────────────────────────────────────────

async function saveRefreshToken(comptePublicId: string, rawToken: string, expiresAt: Date) {
  await prisma.comptePublicRefreshToken.create({
    data: { comptePublicId, tokenHash: hashToken(rawToken), expiresAt },
  });
}

// ─── Liaison automatique : owner ──────────────────────────────────────────────

export const getOrCreateForProprietaire = async (
  proprietaireId: string
): Promise<{ compte: { id: string; nom: string; prenom: string }; tokens: TokenPair }> => {
  // Chercher un ComptePublic déjà lié
  let compte = await prisma.comptePublic.findUnique({
    where: { proprietaireId },
  });

  if (!compte) {
    const proprietaire = await prisma.proprietaire.findUnique({
      where: { id: proprietaireId },
      select: { id: true, nom: true, prenom: true, telephone: true, email: true, password: true },
    });
    if (!proprietaire) throw new AppError("Propriétaire introuvable", StatusCodes.NOT_FOUND);

    // Si un ComptePublic indépendant existe avec le même téléphone → le lier
    const existing = await prisma.comptePublic.findUnique({
      where: { telephone: proprietaire.telephone },
    });
    if (existing && !existing.proprietaireId && !existing.locataireId) {
      compte = await prisma.comptePublic.update({
        where: { id: existing.id },
        data: {
          nom: proprietaire.nom,
          prenom: proprietaire.prenom,
          email: proprietaire.email,
          password: proprietaire.password,
          proprietaireId: proprietaire.id,
        },
      });
    } else {
      compte = await prisma.comptePublic.create({
        data: {
          nom: proprietaire.nom,
          prenom: proprietaire.prenom,
          telephone: proprietaire.telephone,
          email: proprietaire.email,
          password: proprietaire.password,
          proprietaireId: proprietaire.id,
        },
      });
    }
  }

  const tokens = generateTokenPair(compte.id, compte.nom, compte.prenom);
  await saveRefreshToken(compte.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return { compte: { id: compte.id, nom: compte.nom, prenom: compte.prenom }, tokens };
};

// ─── Liaison automatique : locataire ──────────────────────────────────────────

export const getOrCreateForLocataire = async (
  locataireId: string
): Promise<{ compte: { id: string; nom: string; prenom: string }; tokens: TokenPair }> => {
  let compte = await prisma.comptePublic.findUnique({
    where: { locataireId },
  });

  if (!compte) {
    const locataire = await prisma.locataire.findUnique({
      where: { id: locataireId },
      select: { id: true, nom: true, prenom: true, telephone: true, email: true, password: true },
    });
    if (!locataire) throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
    if (!locataire.password) throw new AppError("Locataire non activé", StatusCodes.BAD_REQUEST);

    const existing = await prisma.comptePublic.findUnique({
      where: { telephone: locataire.telephone },
    });
    if (existing && !existing.locataireId) {
      // Compte trouvé par téléphone (libre ou lié à un proprio) → on y rattache le locataire
      compte = await prisma.comptePublic.update({
        where: { id: existing.id },
        data: {
          nom: locataire.nom,
          prenom: locataire.prenom,
          email: locataire.email,
          password: locataire.password,
          locataireId: locataire.id,
        },
      });
    } else if (!existing) {
      // Aucun compte avec ce téléphone → on en crée un nouveau
      compte = await prisma.comptePublic.create({
        data: {
          nom: locataire.nom,
          prenom: locataire.prenom,
          telephone: locataire.telephone,
          email: locataire.email,
          password: locataire.password,
          locataireId: locataire.id,
        },
      });
    } else {
      // Le téléphone est déjà pris par un autre locataire — ne devrait pas arriver
      throw new AppError(
        "Ce numéro est déjà lié à un autre compte locataire",
        StatusCodes.CONFLICT
      );
    }
  }

  const tokens = generateTokenPair(compte.id, compte.nom, compte.prenom);
  await saveRefreshToken(compte.id, tokens.refreshToken, tokens.refreshTokenExpiresAt);

  return { compte: { id: compte.id, nom: compte.nom, prenom: compte.prenom }, tokens };
};

// ─── Révoquer tous les tokens publics d'un compte lié ─────────────────────────

export const revokePublicTokensForProprietaire = async (proprietaireId: string): Promise<void> => {
  const compte = await prisma.comptePublic.findUnique({ where: { proprietaireId } });
  if (compte) {
    await prisma.comptePublicRefreshToken.updateMany({
      where: { comptePublicId: compte.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
};

export const revokePublicTokensForLocataire = async (locataireId: string): Promise<void> => {
  const compte = await prisma.comptePublic.findUnique({ where: { locataireId } });
  if (compte) {
    await prisma.comptePublicRefreshToken.updateMany({
      where: { comptePublicId: compte.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
};
