import { prisma } from "../config/database.js";

const include = { categorie: { select: { id: true, nom: true, slug: true } } } as const;

export const findAll = () =>
  prisma.meuble.findMany({
    where: { actif: true },
    include,
    orderBy: [{ categorie: { nom: "asc" } }, { nom: "asc" }],
  });

export const findAllAdmin = () =>
  prisma.meuble.findMany({
    include,
    orderBy: [{ categorie: { nom: "asc" } }, { nom: "asc" }],
  });

export const findById = (id: string) =>
  prisma.meuble.findUnique({ where: { id }, include });

export const findByNomAndCategorie = (nom: string, categorieId: string) =>
  prisma.meuble.findUnique({ where: { nom_categorieId: { nom, categorieId } }, include });

export const createMany = (items: { nom: string; categorieId: string }[]) =>
  prisma.$transaction(items.map((item) => prisma.meuble.create({ data: item, include })));

export const update = (
  id: string,
  data: Partial<{ nom: string; categorieId: string; actif: boolean }>
) => prisma.meuble.update({ where: { id }, data, include });

export const remove = (id: string) =>
  prisma.meuble.delete({ where: { id } });
