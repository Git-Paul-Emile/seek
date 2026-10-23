import { prisma } from "../config/database.js";

export const findByTypeLogement = (typeLogementId: string) =>
  prisma.typeLogementEquipement.findMany({
    where: { typeLogementId },
    include: {
      equipement: {
        include: { categorie: { select: { id: true, nom: true, ordre: true } } },
      },
    },
  });

export const findAllEquipementsWithState = (typeLogementId: string) =>
  prisma.equipement.findMany({
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

export const setEquipements = async (typeLogementId: string, equipementIds: string[]) => {
  await prisma.typeLogementEquipement.deleteMany({ where: { typeLogementId } });
  if (equipementIds.length === 0) return [];
  return prisma.typeLogementEquipement.createMany({
    data: equipementIds.map((equipementId) => ({ typeLogementId, equipementId })),
  });
};
