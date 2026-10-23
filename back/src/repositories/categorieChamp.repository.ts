import { prisma } from "../config/database.js";

export const findAll = () =>
  prisma.categorieChamp.findMany({ orderBy: { ordre: "asc" } });

export const findById = (id: string) =>
  prisma.categorieChamp.findUnique({ where: { id }, include: { champs: true } });

export const findByNom = (nom: string) =>
  prisma.categorieChamp.findUnique({ where: { nom } });

export const create = (data: { nom: string; ordre?: number }) =>
  prisma.categorieChamp.create({ data });

export const update = (id: string, data: Partial<{ nom: string; ordre: number }>) =>
  prisma.categorieChamp.update({ where: { id }, data });

export const remove = (id: string) =>
  prisma.categorieChamp.delete({ where: { id } });
