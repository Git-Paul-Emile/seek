import { prisma } from "../config/database.js";

export const findByTypeLogement = (typeLogementId: string) =>
  prisma.typeLogementChamp.findMany({
    where: { typeLogementId },
    orderBy: { ordre: "asc" },
    include: {
      champ: {
        include: { categorie: { select: { id: true, nom: true, ordre: true } } },
      },
    },
  });

export const findAllChampsWithState = (typeLogementId: string) =>
  prisma.champ.findMany({
    where: { actif: true },
    orderBy: [{ categorie: { ordre: "asc" } }, { nom: "asc" }],
    include: {
      categorie: { select: { id: true, nom: true, ordre: true } },
      typeLogements: {
        where: { typeLogementId },
        select: { obligatoire: true, ordre: true },
      },
    },
  });

export const setChamps = async (
  typeLogementId: string,
  items: { champId: string; obligatoire: boolean; ordre: number }[]
) => {
  await prisma.typeLogementChamp.deleteMany({ where: { typeLogementId } });
  if (items.length === 0) return [];
  return prisma.typeLogementChamp.createMany({
    data: items.map((item) => ({ ...item, typeLogementId })),
  });
};
