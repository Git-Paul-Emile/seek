import { prisma } from "../config/database.js";

interface TypeLogementType {
  id: string;
  nom: string;
  slug: string;
  image: string | null;
  actif: boolean;
  ordre: number;
  createdAt: Date;
  updatedAt: Date;
}

type TypeLogementWithCount = TypeLogementType & { count: number };

export const findAll = async (): Promise<TypeLogementWithCount[]> => {
  const types = await prisma.typeLogement.findMany({
    where:   { actif: true },
    orderBy: { nom: "asc" },
  });

  // Pour chaque type, compter les biens publiés
  const typesWithCount = await Promise.all(
    types.map(async (type) => {
      const count = await prisma.bien.count({
        where: { typeLogementId: type.id, statutAnnonce: "PUBLIE" },
      });
      return { ...type, count };
    })
  );

  return typesWithCount;
};

export const findAllAdmin = () =>
  prisma.typeLogement.findMany({ orderBy: { ordre: "asc" } });

export const findById = (id: string): Promise<TypeLogementType | null> =>
  prisma.typeLogement.findUnique({ where: { id } });

export const findBySlug = (slug: string): Promise<TypeLogementType | null> =>
  prisma.typeLogement.findUnique({ where: { slug } });

export const findByOrdre = (ordre: number): Promise<TypeLogementType | null> =>
  prisma.typeLogement.findFirst({ where: { ordre } });

export const create = (data: {
  nom: string;
  slug: string;
  image?: string;
  ordre?: number;
}): Promise<TypeLogementType> =>
  prisma.typeLogement.create({ data });

export const update = (
  id: string,
  data: Partial<{ nom: string; slug: string; image: string; actif: boolean; ordre: number }>
): Promise<TypeLogementType> =>
  prisma.typeLogement.update({ where: { id }, data });

export const remove = (id: string): Promise<TypeLogementType> =>
  prisma.typeLogement.delete({ where: { id } });
