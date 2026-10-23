import { prisma } from "../config/database.js";
import type { TypeTransaction } from "../generated/prisma/client.js";

export const findAll = (): Promise<TypeTransaction[]> =>
  prisma.typeTransaction.findMany({
    where:   { actif: true },
    orderBy: { ordre: "asc" },
  });

export const findAllAdmin = (): Promise<TypeTransaction[]> =>
  prisma.typeTransaction.findMany({ orderBy: { ordre: "asc" } });

export const findById = (id: string): Promise<TypeTransaction | null> =>
  prisma.typeTransaction.findUnique({ where: { id } });

export const findBySlug = (slug: string): Promise<TypeTransaction | null> =>
  prisma.typeTransaction.findUnique({ where: { slug } });

export const findByOrdre = (ordre: number): Promise<TypeTransaction | null> =>
  prisma.typeTransaction.findFirst({ where: { ordre } });

export const create = (data: {
  nom: string;
  slug: string;
  ordre?: number;
}): Promise<TypeTransaction> =>
  prisma.typeTransaction.create({ data });

export const update = (
  id: string,
  data: Partial<{ nom: string; slug: string; actif: boolean; ordre: number }>
): Promise<TypeTransaction> =>
  prisma.typeTransaction.update({ where: { id }, data });

export const remove = (id: string): Promise<TypeTransaction> =>
  prisma.typeTransaction.delete({ where: { id } });
