import { prisma } from "../config/database.js";
import type { CategorieEquipement } from "../generated/prisma/client.js";

export const findAll = (): Promise<CategorieEquipement[]> =>
  prisma.categorieEquipement.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }] });

export const findActive = (): Promise<CategorieEquipement[]> =>
  prisma.categorieEquipement.findMany({
    where: { actif: true },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });

export const findById = (id: string): Promise<CategorieEquipement | null> =>
  prisma.categorieEquipement.findUnique({ where: { id } });

export const findBySlug = (slug: string): Promise<CategorieEquipement | null> =>
  prisma.categorieEquipement.findUnique({ where: { slug } });

export const findByNom = (nom: string): Promise<CategorieEquipement | null> =>
  prisma.categorieEquipement.findUnique({ where: { nom } });

export const create = (data: {
  nom: string;
  slug: string;
  actif?: boolean;
  ordre?: number;
}): Promise<CategorieEquipement> => prisma.categorieEquipement.create({ data });

export const update = (
  id: string,
  data: Partial<{ nom: string; slug: string; actif: boolean; ordre: number }>
): Promise<CategorieEquipement> =>
  prisma.categorieEquipement.update({ where: { id }, data });

export const remove = (id: string): Promise<CategorieEquipement> =>
  prisma.categorieEquipement.delete({ where: { id } });

export const countEquipements = (id: string): Promise<number> =>
  prisma.equipement.count({ where: { categorieId: id } });
