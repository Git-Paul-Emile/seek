import { prisma } from "../config/database.js";
import type { TypeChamp } from "../generated/prisma/enums.js";

export interface ChampData {
  nom: string;
  type: TypeChamp;
  unite?: string | null;
  options?: string[];
  categorieId: string;
  actif?: boolean;
}

export const findAll = () =>
  prisma.champ.findMany({
    orderBy: [{ categorie: { ordre: "asc" } }, { nom: "asc" }],
    include: { categorie: { select: { id: true, nom: true } } },
  });

export const findAllAdmin = () =>
  prisma.champ.findMany({
    orderBy: [{ categorie: { ordre: "asc" } }, { nom: "asc" }],
    include: { categorie: { select: { id: true, nom: true } } },
  });

export const findById = (id: string) =>
  prisma.champ.findUnique({
    where: { id },
    include: { categorie: { select: { id: true, nom: true } } },
  });

export const findByNomAndCategorie = (nom: string, categorieId: string) =>
  prisma.champ.findUnique({ where: { nom_categorieId: { nom, categorieId } } });

export const create = (data: ChampData) =>
  prisma.champ.create({
    data,
    include: { categorie: { select: { id: true, nom: true } } },
  });

export const update = (id: string, data: Partial<ChampData>) =>
  prisma.champ.update({
    where: { id },
    data,
    include: { categorie: { select: { id: true, nom: true } } },
  });

export const remove = (id: string) =>
  prisma.champ.delete({ where: { id } });
