import { prisma } from "../config/database.js";
import type { StatutBien } from "../generated/prisma/client.js";

export const findAll = (): Promise<StatutBien[]> =>
  prisma.statutBien.findMany({
    where:   { actif: true },
    orderBy: { ordre: "asc" },
  });

export const findAllAdmin = (): Promise<StatutBien[]> =>
  prisma.statutBien.findMany({ orderBy: { ordre: "asc" } });

export const findById = (id: string): Promise<StatutBien | null> =>
  prisma.statutBien.findUnique({ where: { id } });

export const findBySlug = (slug: string): Promise<StatutBien | null> =>
  prisma.statutBien.findUnique({ where: { slug } });

export const findByOrdre = (ordre: number): Promise<StatutBien | null> =>
  prisma.statutBien.findFirst({ where: { ordre } });

export const create = (data: {
  nom: string;
  slug: string;
  ordre?: number;
}): Promise<StatutBien> =>
  prisma.statutBien.create({ data });

export const update = (
  id: string,
  data: Partial<{ nom: string; slug: string; actif: boolean; ordre: number }>
): Promise<StatutBien> =>
  prisma.statutBien.update({ where: { id }, data });

export const remove = (id: string): Promise<StatutBien> =>
  prisma.statutBien.delete({ where: { id } });
