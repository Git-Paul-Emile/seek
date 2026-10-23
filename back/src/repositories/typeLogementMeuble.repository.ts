import { prisma } from "../config/database.js";

export const findByTypeLogement = (typeLogementId: string) =>
  prisma.typeLogementMeuble.findMany({
    where: { typeLogementId },
    include: {
      meuble: {
        include: { categorie: { select: { id: true, nom: true, ordre: true } } },
      },
    },
  });

export const findAllMeublesWithState = (typeLogementId: string) =>
  prisma.meuble.findMany({
    where: { actif: true },
    orderBy: [{ categorie: { ordre: "asc" } }, { nom: "asc" }],
    include: {
      categorie: { select: { id: true, nom: true, ordre: true } },
      typeLogements: {
        where: { typeLogementId },
        select: { typeLogementId: true },
      },
    },
  });

export const setMeubles = async (typeLogementId: string, meubleIds: string[]) => {
  await prisma.typeLogementMeuble.deleteMany({ where: { typeLogementId } });
  if (meubleIds.length === 0) return [];
  return prisma.typeLogementMeuble.createMany({
    data: meubleIds.map((meubleId) => ({ typeLogementId, meubleId })),
  });
};
