import { prisma } from "../config/database.js";

const include = { categorie: { select: { id: true, nom: true, slug: true } } } as const;

export const findAll = () =>
  prisma.equipement.findMany({
    where: { actif: true },
    include,
    orderBy: [{ categorie: { nom: "asc" } }, { nom: "asc" }],
  });

export const findAllAdmin = () =>
  prisma.equipement.findMany({
    include,
    orderBy: [{ categorie: { nom: "asc" } }, { nom: "asc" }],
  });

export const findById = (id: string) =>
  prisma.equipement.findUnique({ where: { id }, include });

export const findByNomAndCategorie = (nom: string, categorieId: string) =>
  prisma.equipement.findUnique({ where: { nom_categorieId: { nom, categorieId } }, include });

export const createMany = (items: { nom: string; categorieId: string }[]) =>
  prisma.$transaction(items.map((item) => prisma.equipement.create({ data: item, include })));

export const update = (
  id: string,
  data: Partial<{ nom: string; categorieId: string; actif: boolean }>
) => prisma.equipement.update({ where: { id }, data, include });

export const remove = (id: string) =>
  prisma.equipement.delete({ where: { id } });
