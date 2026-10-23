import { prisma } from "../config/database.js";
import type { Admin, RefreshToken } from "../generated/prisma/client.js";

// ─── Admin ────────────────────────────────────────────────────────────────────

export const findAdminByEmail = (email: string): Promise<Admin | null> =>
  prisma.admin.findUnique({ where: { email } });

export const findAdminById = (id: string): Promise<Admin | null> =>
  prisma.admin.findUnique({ where: { id } });

export const updateAdmin = (
  id: string,
  data: { email?: string; password?: string }
): Promise<Admin> =>
  prisma.admin.update({ where: { id }, data });

// ─── RefreshToken ─────────────────────────────────────────────────────────────

export const createRefreshToken = (data: {
  adminId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<RefreshToken> =>
  prisma.refreshToken.create({ data });

export const findRefreshToken = (tokenHash: string): Promise<RefreshToken | null> =>
  prisma.refreshToken.findUnique({ where: { tokenHash } });

/** Révoque un token précis (logout ou rotation) */
export const revokeRefreshToken = (tokenHash: string): Promise<RefreshToken> =>
  prisma.refreshToken.update({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });

/** Révoque TOUS les tokens d'un admin (compromission détectée) */
export const revokeAllRefreshTokens = (adminId: string): Promise<{ count: number }> =>
  prisma.refreshToken.updateMany({
    where: { adminId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

/** Supprime les tokens expirés (nettoyage optionnel) */
export const deleteExpiredRefreshTokens = (): Promise<{ count: number }> =>
  prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
