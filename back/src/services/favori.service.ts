import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";

const BIEN_SELECT = {
  id: true,
  titre: true,
  prix: true,
  prixAncien: true,
  photos: true,
  pays: true,
  region: true,
  quartier: true,
  surface: true,
  nbChambres: true,
  nbSdb: true,
  actif: true,
  statutAnnonce: true,
  parking: true,
  dateDerniereModificationPrix: true,
  estMisEnAvant: true,
  typeLogement: { select: { nom: true } },
  typeTransaction: { select: { nom: true, slug: true } },
  statutBien: { select: { nom: true, slug: true } },
  proprietaire: {
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      statutVerification: true,
    },
  },
} as const;

export const getFavoris = async (comptePublicId: string) => {
  const favoris = await prisma.favori.findMany({
    where: { comptePublicId },
    orderBy: { createdAt: "desc" },
    include: { bien: { select: BIEN_SELECT } },
  });

  return favoris.map((f) => {
    const bien = f.bien;
    const bienSuppr = !bien.actif || bien.statutAnnonce !== "PUBLIE";

    return {
      id: f.id,
      bienId: f.bienId,
      createdAt: f.createdAt,
      bien,
      bienSuppr,
    };
  });
};

export const addFavori = async (comptePublicId: string, bienId: string) => {
  const bien = await prisma.bien.findFirst({
    where: { id: bienId, actif: true, statutAnnonce: "PUBLIE" },
    select: { id: true },
  });

  if (!bien) {
    throw new AppError("Annonce introuvable ou non disponible", StatusCodes.NOT_FOUND);
  }

  const existing = await prisma.favori.findUnique({
    where: { comptePublicId_bienId: { comptePublicId, bienId } },
  });

  if (existing) return existing;

  await prisma.$transaction([
    prisma.favori.create({
      data: { comptePublicId, bienId },
    }),
    prisma.bien.update({
      where: { id: bienId },
      data: { nbFavoris: { increment: 1 } },
    }),
  ]);
};

export const toggleFavori = async (comptePublicId: string, bienId: string) => {
  const existing = await prisma.favori.findUnique({
    where: { comptePublicId_bienId: { comptePublicId, bienId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.favori.delete({
        where: { comptePublicId_bienId: { comptePublicId, bienId } },
      }),
      prisma.bien.update({
        where: { id: bienId },
        data: { nbFavoris: { decrement: 1 } },
      }),
    ]);
    return { action: "removed" as const };
  }

  await addFavori(comptePublicId, bienId);
  return { action: "added" as const };
};

export const removeFavori = async (comptePublicId: string, bienId: string) => {
  const existing = await prisma.favori.findUnique({
    where: { comptePublicId_bienId: { comptePublicId, bienId } },
  });

  if (!existing) throw new AppError("Favori introuvable", StatusCodes.NOT_FOUND);

  await prisma.$transaction([
    prisma.favori.delete({
      where: { comptePublicId_bienId: { comptePublicId, bienId } },
    }),
    prisma.bien.update({
      where: { id: bienId },
      data: { nbFavoris: { decrement: 1 } },
    }),
  ]);
};

export const getFavoriIds = async (comptePublicId: string): Promise<string[]> => {
  const favoris = await prisma.favori.findMany({
    where: { comptePublicId },
    select: { bienId: true },
  });
  return favoris.map((f) => f.bienId);
};
