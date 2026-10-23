import { prisma } from "../config/database.js";
import type { StatutContrat } from "../generated/prisma/enums.js";

// ─── Include helper ───────────────────────────────────────────────────────────

const CONTRAT_INCLUDE = {
  modele: {
    select: { id: true, titre: true, typeBail: true },
  },
} as const;

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const create = async (data: {
  bailId: string;
  modeleId?: string | null;
  titre: string;
  contenu: string;
}) => {
  return prisma.contrat.create({ data, include: CONTRAT_INCLUDE });
};

export const findByBailId = async (bailId: string) => {
  return prisma.contrat.findUnique({ where: { bailId }, include: CONTRAT_INCLUDE });
};

export const update = async (id: string, data: { contenu: string }) => {
  return prisma.contrat.update({ where: { id }, data, include: CONTRAT_INCLUDE });
};

export const updateStatut = async (id: string, statut: StatutContrat) => {
  return prisma.contrat.update({ where: { id }, data: { statut }, include: CONTRAT_INCLUDE });
};

export const remove = async (id: string) => {
  return prisma.contrat.delete({ where: { id } });
};
