import { prisma } from "../config/database.js";
import type { CategorieMeuble } from "../generated/prisma/client.js";

export const findAll = (): Promise<CategorieMeuble[]> =>
  prisma.categorieMeuble.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }] });

export const findActive = (): Promise<CategorieMeuble[]> =>
  prisma.categorieMeuble.findMany({
    where: { actif: true },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });

export const findById = (id: string): Promise<CategorieMeuble | null> =>
  prisma.categorieMeuble.findUnique({ where: { id } });

export const findBySlug = (slug: string): Promise<CategorieMeuble | null> =>
  prisma.categorieMeuble.findUnique({ where: { slug } });

export const findByNom = (nom: string): Promise<CategorieMeuble | null> =>
  prisma.categorieMeuble.findUnique({ where: { nom } });

export const create = (data: {
  nom: string;
  slug: string;
  actif?: boolean;
  ordre?: number;
}): Promise<CategorieMeuble> => prisma.categorieMeuble.create({ data });

export const update = (
  id: string,
  data: Partial<{ nom: string; slug: string; actif: boolean; ordre: number }>
): Promise<CategorieMeuble> =>
  prisma.categorieMeuble.update({ where: { id }, data });

export const remove = (id: string): Promise<CategorieMeuble> =>
  prisma.categorieMeuble.delete({ where: { id } });

export const countMeubles = (id: string): Promise<number> =>
  prisma.meuble.count({ where: { categorieId: id } });
