import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as OwnerRepo from "../repositories/owner.repository.js";
import { prisma } from "../config/database.js";
import * as CloudinaryService from "./cloudinary.service.js";
import { fetchAndEmitStatsGlobales } from "./socket.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OwnerTokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface JwtOwnerPayload {
  sub: string;
  prenom: string;
  nom: string;
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

const generateTokenPair = (
  id: string,
  prenom: string,
  nom: string
): OwnerTokenPair => {
  const accessExpiry = process.env.OWNER_ACCESS_TOKEN_EXPIRY ?? "15m";
  const refreshExpiry = process.env.OWNER_REFRESH_TOKEN_EXPIRY ?? "30d";

  const accessToken = jwt.sign(
    { sub: id, prenom, nom } as JwtOwnerPayload,
    getSecret("OWNER_ACCESS_TOKEN_SECRET"),
    { expiresIn: accessExpiry } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { sub: id, prenom, nom } as JwtOwnerPayload,
    getSecret("OWNER_REFRESH_TOKEN_SECRET"),
    { expiresIn: refreshExpiry } as jwt.SignOptions
  );

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresAt: new Date(
      Date.now() + parseExpiry(refreshExpiry) * 1000
    ),
  };
};

// ─── Vérification du token ────────────────────────────────────────────────────

export const verifyOwnerAccessToken = (token: string): JwtOwnerPayload => {
  try {
    return jwt.verify(
      token,
      getSecret("OWNER_ACCESS_TOKEN_SECRET")
    ) as JwtOwnerPayload;
  } catch {
    throw new AppError("Token d'accès invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }
};

// ─── Inscription ──────────────────────────────────────────────────────────────

export const register = async (data: {
  prenom: string;
  nom: string;
  sexe?: string;
  telephone: string;
  email?: string;
  password: string;
}): Promise<
  { proprietaire: { id: string; prenom: string; nom: string; telephone: string; email?: string; telephoneVerifie: boolean } }
> => {
  // Normaliser les champs optionnels (chaîne vide → null)
  const telephone = normalizePhone(data.telephone);
  const email = data.email?.trim() === "" ? null : data.email?.trim() ?? null;
  const sexe = data.sexe?.trim() === "" ? null : data.sexe ?? null;

  // Unicité du téléphone
  const existingPhone = await findOwnerByPhone(telephone);
  if (existingPhone) {
    throw new AppError(
      "Ce numéro de téléphone est déjà associé à un compte.",
      StatusCodes.CONFLICT
    );
  }

  // Unicité de l'email (si fourni)
  if (email) {
    const existingEmail = await OwnerRepo.findByEmail(email);
    if (existingEmail) {
      throw new AppError(
        "Cette adresse email est déjà associée à un compte.",
        StatusCodes.CONFLICT
      );
    }
  }

  // Hachage du mot de passe
  const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
  const hashedPassword = await bcrypt.hash(data.password, saltRounds);

  // Création du propriétaire
  const proprietaire = await OwnerRepo.create({
    prenom: data.prenom.trim(),
    nom: data.nom.trim(),
    sexe,
    telephone,
    email,
    password: hashedPassword,
  });

  // Stats admin temps réel
  fetchAndEmitStatsGlobales().catch(() => null);

  // Ne pas générer de tokens ici - le propriétaire doit d'abord vérifier son téléphone
  return {
    proprietaire: {
      id: proprietaire.id,
      prenom: proprietaire.prenom,
      nom: proprietaire.nom,
      telephone: proprietaire.telephone,
      email: proprietaire.email ?? undefined,
      telephoneVerifie: proprietaire.telephoneVerifie,
    },
  };
};

// ─── Connexion ────────────────────────────────────────────────────────────────

/** Supprime les espaces, tirets et parenthèses d'un numéro */
const normalizePhone = (phone: string) => phone.trim().replace(/[\s\-().]/g, "");

const buildPhoneVariants = (raw: string): string[] => {
  const normalized = normalizePhone(raw);
  const digitsOnly = normalized.replace(/^\+/, "");
  const variants = new Set<string>();

  if (!normalized) return [];

  variants.add(normalized);
  variants.add(digitsOnly);

  if (digitsOnly.startsWith("221")) {
    const local = digitsOnly.slice(3);
    if (local) {
      variants.add(local);
      variants.add(`+221${local}`);
      variants.add(`221${local}`);
    }
  } else {
    variants.add(`+221${digitsOnly}`);
    variants.add(`221${digitsOnly}`);
  }

  return [...variants].filter(Boolean);
};

/** Cherche un propriétaire par téléphone en essayant plusieurs variantes */
const findByPhoneVariants = async (raw: string) => {
  const stripped = normalizePhone(raw);

  // 1. Correspondance exacte (après normalisation)
  let found = await OwnerRepo.findByTelephone(stripped);
  if (found) return found;

  // 2. Sans indicatif → essayer avec +221 (Sénégal)
  if (!stripped.startsWith("+")) {
    found = await OwnerRepo.findByTelephone(`+221${stripped}`);
    if (found) return found;
  }

  // 3. Avec indicatif → essayer sans le +XXX (1 à 3 chiffres)
  if (stripped.startsWith("+")) {
    const local = stripped.replace(/^\+\d{1,3}/, "");
    found = await OwnerRepo.findByTelephone(local);
    if (found) return found;
  }

  return null;
};

const findOwnerByPhone = async (raw: string) => {
  const variants = buildPhoneVariants(raw);
  if (variants.length === 0) return null;
  return OwnerRepo.findByTelephones(variants);
};

export const login = async (data: {
  identifiant: string;
  password: string;
}): Promise<
  OwnerTokenPair & { proprietaire: { id: string; prenom: string; nom: string; telephone: string; email?: string; telephoneVerifie: boolean } }
> => {
  const identifiant = data.identifiant.trim();

  // Chercher par téléphone (plusieurs variantes) puis par email
  let proprietaire = await findOwnerByPhone(identifiant);
  if (!proprietaire) {
    proprietaire = await OwnerRepo.findByEmail(identifiant);
  }

  // Message intentionnellement générique pour ne pas révéler l'existence du compte
  if (!proprietaire) {
    throw new AppError(
      "Identifiant ou mot de passe incorrect.",
      StatusCodes.UNAUTHORIZED
    );
  }

  const valid = await bcrypt.compare(data.password, proprietaire.password);
  if (!valid) {
    throw new AppError(
      "Identifiant ou mot de passe incorrect.",
      StatusCodes.UNAUTHORIZED
    );
  }

  const tokens = generateTokenPair(
    proprietaire.id,
    proprietaire.prenom,
    proprietaire.nom
  );

  await OwnerRepo.createRefreshToken({
    proprietaireId: proprietaire.id,
    tokenHash: hashToken(tokens.refreshToken),
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return {
    ...tokens,
    proprietaire: {
      id: proprietaire.id,
      prenom: proprietaire.prenom,
      nom: proprietaire.nom,
      telephone: proprietaire.telephone,
      email: proprietaire.email ?? undefined,
      telephoneVerifie: proprietaire.telephoneVerifie,
    },
  };
};

// ─── Refresh ──────────────────────────────────────────────────────────────────

export const refresh = async (
  oldRefreshToken: string
): Promise<OwnerTokenPair & { proprietaireId: string }> => {
  let payload: JwtOwnerPayload;
  try {
    payload = jwt.verify(
      oldRefreshToken,
      getSecret("OWNER_REFRESH_TOKEN_SECRET")
    ) as JwtOwnerPayload;
  } catch {
    throw new AppError("Refresh token invalide ou expiré", StatusCodes.UNAUTHORIZED);
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await OwnerRepo.findRefreshToken(tokenHash);

  if (!stored) {
    await OwnerRepo.revokeAllRefreshTokens(payload.sub);
    throw new AppError("Token révoqué ou inconnu - session terminée", StatusCodes.UNAUTHORIZED);
  }

  if (stored.revokedAt !== null) {
    await OwnerRepo.revokeAllRefreshTokens(payload.sub);
    throw new AppError("Token déjà utilisé - compromission détectée", StatusCodes.UNAUTHORIZED);
  }

  if (stored.expiresAt < new Date()) {
    throw new AppError("Refresh token expiré", StatusCodes.UNAUTHORIZED);
  }

  await OwnerRepo.revokeRefreshToken(tokenHash);

  const proprietaire = await OwnerRepo.findById(payload.sub);
  if (!proprietaire) {
    throw new AppError("Compte introuvable", StatusCodes.UNAUTHORIZED);
  }

  const tokens = generateTokenPair(
    proprietaire.id,
    proprietaire.prenom,
    proprietaire.nom
  );

  await OwnerRepo.createRefreshToken({
    proprietaireId: proprietaire.id,
    tokenHash: hashToken(tokens.refreshToken),
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return { ...tokens, proprietaireId: proprietaire.id };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout = async (refreshToken: string): Promise<string | null> => {
  const tokenHash = hashToken(refreshToken);
  const stored = await OwnerRepo.findRefreshToken(tokenHash);
  if (stored && !stored.revokedAt) {
    await OwnerRepo.revokeRefreshToken(tokenHash);
    return stored.proprietaireId;
  }
  return null;
};

// ─── Me ───────────────────────────────────────────────────────────────────────

export const me = async (id: string) => {
  const p = await (prisma as any).proprietaire.findUnique({
    where: { id },
    select: {
      id: true, prenom: true, nom: true, telephone: true, email: true,
      sexe: true, statutVerification: true, verifiedAt: true,
      telephoneVerifie: true,
      estSuspendu: true, dateFinSuspension: true,
    },
  });
  if (!p) throw new AppError("Compte introuvable", StatusCodes.UNAUTHORIZED);
  return {
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    telephone: p.telephone,
    email: p.email ?? undefined,
    sexe: p.sexe ?? undefined,
    telephoneVerifie: p.telephoneVerifie,
    statutVerification: p.statutVerification,
    verifiedAt: p.verifiedAt,
    estSuspendu: p.estSuspendu,
    dateFinSuspension: p.dateFinSuspension,
  };
};

// ─── Mise à jour du profil ───────────────────────────────────────────────────

export const updateProfile = async (
  id: string,
  data: {
    prenom?: string;
    nom?: string;
    sexe?: string;
    telephone?: string;
    email?: string | null;
    password?: string;
  }
) => {
  const existing = await OwnerRepo.findById(id);
  if (!existing) {
    throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérification de l'unicité du téléphone si modifié
  if (data.telephone && data.telephone !== existing.telephone) {
    const normalizedPhone = data.telephone.replace(/\s/g, "");
    const existingPhone = await OwnerRepo.findByTelephone(normalizedPhone);
    if (existingPhone && existingPhone.id !== id) {
      throw new AppError(
        "Ce numéro de téléphone est déjà associé à un autre compte.",
        StatusCodes.CONFLICT
      );
    }
    data.telephone = normalizedPhone;
  }

  // Vérification de l'unicité de l'email si modifié
  if (data.email !== undefined) {
    const normalizedEmail = data.email?.trim() === "" ? null : data.email?.trim() ?? null;
    if (normalizedEmail && normalizedEmail !== existing.email) {
      const existingEmail = await OwnerRepo.findByEmail(normalizedEmail);
      if (existingEmail && existingEmail.id !== id) {
        throw new AppError(
          "Cette adresse email est déjà associée à un autre compte.",
          StatusCodes.CONFLICT
        );
      }
    }
    data.email = normalizedEmail;
  }

  // Hachage du mot de passe si fourni
  if (data.password) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
    data.password = await bcrypt.hash(data.password, saltRounds);
  }

  // Normalisation du sexe
  if (data.sexe !== undefined) {
    data.sexe = data.sexe?.trim() === "" ? undefined : data.sexe;
  }

  const updated = await OwnerRepo.update(id, {
    prenom: data.prenom?.trim(),
    nom: data.nom?.trim(),
    sexe: data.sexe,
    telephone: data.telephone,
    email: data.email,
    password: data.password,
  });

  return {
    id: updated.id,
    prenom: updated.prenom,
    nom: updated.nom,
    telephone: updated.telephone,
    email: updated.email ?? undefined,
    sexe: updated.sexe ?? undefined,
  };
};

// ─── Suppression du compte ─────────────────────────────────────────────────────

export const deleteProfile = async (id: string): Promise<void> => {
  const existing = await OwnerRepo.findById(id);
  if (!existing) {
    throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);
  }

  const [verifOwner, biens, docs, locataires] = await Promise.all([
    prisma.verificationDocuments.findUnique({
      where: { proprietaireId: id },
      select: { pieceIdentiteRecto: true, pieceIdentiteVerso: true, selfie: true },
    }),
    prisma.bien.findMany({ where: { proprietaireId: id }, select: { photos: true } }),
    prisma.documentBien.findMany({ where: { proprietaireId: id }, select: { url: true } }),
    prisma.locataire.findMany({
      where: { proprietaireId: id },
      select: { verification: { select: { pieceIdentiteRecto: true, pieceIdentiteVerso: true, selfie: true } } },
    }),
  ]);

  const urls: (string | null | undefined)[] = [
    verifOwner?.pieceIdentiteRecto,
    verifOwner?.pieceIdentiteVerso,
    verifOwner?.selfie,
    ...biens.flatMap((b) => b.photos),
    ...docs.map((d) => d.url),
    ...locataires.flatMap((l) =>
      l.verification
        ? [l.verification.pieceIdentiteRecto, l.verification.pieceIdentiteVerso, l.verification.selfie]
        : []
    ),
  ];

  await CloudinaryService.deleteUrls(urls);
  await OwnerRepo.remove(id);
};

// ─── Mot de passe oublié ──────────────────────────────────────────────────────

export const requestPasswordReset = async (identifiant: string): Promise<{ token: string; email: string | null; telephone: string; prenom: string; proprietaireId: string }> => {
  const cryptoLib = await import("crypto");
  const stripped = identifiant.trim().replace(/[\s\-()]/g, "");
  let proprietaire = await OwnerRepo.findByTelephone(stripped);
  if (!proprietaire && !stripped.startsWith("+")) {
    proprietaire = await OwnerRepo.findByTelephone(`+221${stripped}`);
  }
  if (!proprietaire) {
    proprietaire = await OwnerRepo.findByEmail(identifiant.trim());
  }
  if (!proprietaire) {
    throw new AppError("Si ce compte existe, un lien de réinitialisation a été envoyé.", StatusCodes.OK);
  }

  await OwnerRepo.invalidatePasswordResetTokens(proprietaire.id);

  const rawToken = cryptoLib.randomBytes(32).toString("hex");
  const tokenHash = cryptoLib.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await OwnerRepo.createPasswordResetToken({ proprietaireId: proprietaire.id, tokenHash, expiresAt });

  return { token: rawToken, email: proprietaire.email, telephone: proprietaire.telephone, prenom: proprietaire.prenom, proprietaireId: proprietaire.id };
};

export const resetPassword = async (rawToken: string, newPassword: string): Promise<void> => {
  const cryptoLib = await import("crypto");
  const tokenHash = cryptoLib.createHash("sha256").update(rawToken).digest("hex");
  const stored = await OwnerRepo.findPasswordResetToken(tokenHash);

  if (!stored) throw new AppError("Token invalide ou expiré", StatusCodes.BAD_REQUEST);
  if (stored.usedAt) throw new AppError("Ce lien a déjà été utilisé", StatusCodes.BAD_REQUEST);
  if (stored.expiresAt < new Date()) throw new AppError("Ce lien a expiré", StatusCodes.BAD_REQUEST);

  const saltRounds = parseInt(process.env.BCRYPT_SALT ?? "12", 10);
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

  await OwnerRepo.update(stored.proprietaireId, { password: hashedPassword });
  await OwnerRepo.markPasswordResetTokenUsed(tokenHash);
};

// ─── OTP vérification téléphone ───────────────────────────────────────────────

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const sendOtpTelephone = async (proprietaireId: string): Promise<string> => {
  const otp = generateOtp();
  const otpExpiresAt = new Date(
    Date.now() + parseInt(process.env.OTP_EXPIRES_IN_MINUTES ?? "10", 10) * 60 * 1000
  );

  await OwnerRepo.update(proprietaireId, {
    telephoneOtp: otp,
    telephoneOtpExpiresAt: otpExpiresAt,
  } as any);

  return otp;
};

export const verifyOtpTelephone = async (proprietaireId: string, otp: string): Promise<OwnerTokenPair & { proprietaire: { id: string; prenom: string; nom: string; telephone: string; email?: string; telephoneVerifie: boolean } }> => {
  const proprietaire = await OwnerRepo.findById(proprietaireId);
  if (!proprietaire) throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);

  const p = proprietaire as any;
  if (!p.telephoneOtp || p.telephoneOtp !== otp)
    throw new AppError("Code OTP invalide", StatusCodes.BAD_REQUEST);
  if (!p.telephoneOtpExpiresAt || p.telephoneOtpExpiresAt < new Date())
    throw new AppError("Code OTP expiré", StatusCodes.BAD_REQUEST);

  // Marquer le téléphone comme vérifié
  await OwnerRepo.update(proprietaireId, {
    telephoneVerifie: true,
    telephoneOtp: null,
    telephoneOtpExpiresAt: null,
  } as any);

  // Générer les tokens après vérification réussie
  const tokens = generateTokenPair(
    proprietaire.id,
    proprietaire.prenom,
    proprietaire.nom
  );

  await OwnerRepo.createRefreshToken({
    proprietaireId: proprietaire.id,
    tokenHash: hashToken(tokens.refreshToken),
    expiresAt: tokens.refreshTokenExpiresAt,
  });

  return {
    ...tokens,
    proprietaire: {
      id: proprietaire.id,
      prenom: proprietaire.prenom,
      nom: proprietaire.nom,
      telephone: proprietaire.telephone,
      email: proprietaire.email ?? undefined,
      telephoneVerifie: true,
    },
  };
};
