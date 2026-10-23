import { prisma } from "../config/database.js";

// ─── Proprietaire ────────────────────────────────────────────────────────────

export const findByTelephone = (telephone: string) =>
  prisma.proprietaire.findUnique({ where: { telephone } });

export const findByTelephones = (telephones: string[]) =>
  prisma.proprietaire.findFirst({
    where: {
      telephone: {
        in: telephones,
      },
    },
  });

export const findByEmail = (email: string) =>
  prisma.proprietaire.findUnique({ where: { email } });

export const findById = (id: string) =>
  prisma.proprietaire.findUnique({ where: { id } });

export const create = (data: {
  prenom: string;
  nom: string;
  sexe?: string | null;
  telephone: string;
  email?: string | null;
  password: string;
}) => prisma.proprietaire.create({ data });

export const update = (
  id: string,
  data: {
    prenom?: string;
    nom?: string;
    sexe?: string | null;
    telephone?: string;
    email?: string | null;
    password?: string;
  }
) => prisma.proprietaire.update({ where: { id }, data });

export const remove = (id: string) =>
  prisma.proprietaire.delete({ where: { id } });

// ─── ProprietaireRefreshToken ─────────────────────────────────────────────────

export const createRefreshToken = (data: {
  proprietaireId: string;
  tokenHash: string;
  expiresAt: Date;
}) => prisma.proprietaireRefreshToken.create({ data });

export const findRefreshToken = (tokenHash: string) =>
  prisma.proprietaireRefreshToken.findUnique({ where: { tokenHash } });

export const revokeRefreshToken = (tokenHash: string) =>
  prisma.proprietaireRefreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });

export const revokeAllRefreshTokens = (proprietaireId: string) =>
  prisma.proprietaireRefreshToken.updateMany({
    where: { proprietaireId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

// ─── PasswordResetToken ────────────────────────────────────────────────────────

export const createPasswordResetToken = (data: {
  proprietaireId: string;
  tokenHash: string;
  expiresAt: Date;
}) => prisma.passwordResetToken.create({ data });

export const findPasswordResetToken = (tokenHash: string) =>
  prisma.passwordResetToken.findUnique({ where: { tokenHash } });

export const markPasswordResetTokenUsed = (tokenHash: string) =>
  prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } });

export const invalidatePasswordResetTokens = (proprietaireId: string) =>
  prisma.passwordResetToken.updateMany({
    where: { proprietaireId, usedAt: null },
    data: { usedAt: new Date() },
  });
