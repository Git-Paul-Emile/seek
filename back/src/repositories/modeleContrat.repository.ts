import { prisma } from "../config/database.js";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface CreateModeleContratData {
  titre: string;
  typeBail?: string | null;
  contenu: string;
  actif?: boolean;
  ordre?: number;
}

export interface UpdateModeleContratData {
  titre?: string;
  typeBail?: string | null;
  contenu?: string;
  actif?: boolean;
  ordre?: number;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const create = async (data: CreateModeleContratData) => {
  return prisma.modeleContrat.create({ data });
};

export const findById = async (id: string) => {
  return prisma.modeleContrat.findUnique({ where: { id } });
};

export const update = async (id: string, data: UpdateModeleContratData) => {
  return prisma.modeleContrat.update({ where: { id }, data });
};

export const remove = async (id: string) => {
  return prisma.modeleContrat.delete({ where: { id } });
};

export const countContrats = async (modeleId: string) => {
  return prisma.contrat.count({ where: { modeleId } });
};

// ─── List avec pagination ─────────────────────────────────────────────────────

export const findMany = async (params: {
  page: number;
  limit: number;
  typeBail?: string;
  actif?: boolean;
}) => {
  const { page, limit, typeBail, actif } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(typeBail !== undefined ? { typeBail } : {}),
    ...(actif !== undefined ? { actif } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.modeleContrat.findMany({
      where,
      orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
      skip,
      take: limit,
    }),
    prisma.modeleContrat.count({ where }),
  ]);

  return { items, total };
};

// ─── Liste publique (actifs seulement, optionnel filtre typeBail) ─────────────

export const findActifs = async (typeBail?: string) => {
  return prisma.modeleContrat.findMany({
    where: {
      actif: true,
      ...(typeBail ? { OR: [{ typeBail }, { typeBail: null }] } : {}),
    },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    select: { id: true, titre: true, typeBail: true, ordre: true },
  });
};
