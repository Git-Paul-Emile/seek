import { prisma } from "../config/database.js";

// ─── Pays ─────────────────────────────────────────────────────────────────────

export const findAllPays = () =>
  prisma.pays.findMany({ orderBy: { nom: "asc" } });

export const findAllPaysAdmin = () =>
  prisma.pays.findMany({
    orderBy: { nom: "asc" },
    include: { _count: { select: { villes: true } } },
  });

export const createPays = (data: { nom: string; code: string }) =>
  prisma.pays.create({ data });

export const updatePays = (id: string, data: { nom?: string; code?: string }) =>
  prisma.pays.update({ where: { id }, data });

export const deletePays = (id: string) =>
  prisma.pays.delete({ where: { id } });

// ─── Villes ───────────────────────────────────────────────────────────────────

export const findVillesByPays = (paysId: string) =>
  prisma.ville.findMany({ where: { paysId }, orderBy: { nom: "asc" } });

export const findAllVillesAdmin = (paysId?: string) =>
  prisma.ville.findMany({
    where: paysId ? { paysId } : undefined,
    orderBy: { nom: "asc" },
    include: {
      pays: { select: { id: true, nom: true, code: true } },
      _count: { select: { quartiers: true } },
    },
  });

export const createVille = (data: { nom: string; paysId: string }) =>
  prisma.ville.create({ data, include: { pays: true } });

export const updateVille = (id: string, data: { nom?: string; paysId?: string }) =>
  prisma.ville.update({ where: { id }, data, include: { pays: true } });

export const deleteVille = (id: string) =>
  prisma.ville.delete({ where: { id } });

// ─── Quartiers ────────────────────────────────────────────────────────────────

/** Distance maximale entre une position et un quartier pour proposer ce quartier. */
const RAYON_QUARTIER_PROCHE_KM = 10;

/**
 * Le quartier connu le plus proche d'une position (formule de haversine en SQL), avec sa ville
 * et son pays, ou null s'il n'y en a aucun dans un rayon de RAYON_QUARTIER_PROCHE_KM.
 */
export const findQuartierLePlusProche = async (lat: number, lng: number) => {
  const [proche] = await prisma.$queryRaw<{ id: string; distanceKm: number }[]>`
    SELECT id, distance_km AS "distanceKm" FROM (
      SELECT id,
        6371 * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS(latitude - ${lat}) / 2), 2) +
          COS(RADIANS(${lat})) * COS(RADIANS(latitude)) * POWER(SIN(RADIANS(longitude - ${lng}) / 2), 2)
        )) AS distance_km
      FROM "Quartier"
    ) AS q
    WHERE distance_km <= ${RAYON_QUARTIER_PROCHE_KM}
    ORDER BY distance_km
    LIMIT 1`;
  if (!proche) return null;
  const quartier = await prisma.quartier.findUnique({
    where: { id: proche.id },
    include: { ville: { include: { pays: true } } },
  });
  return quartier ? { ...quartier, distanceKm: proche.distanceKm } : null;
};

export const findQuartiersByVille = (villeId: string) =>
  prisma.quartier.findMany({ where: { villeId }, orderBy: { nom: "asc" } });

export const findAllQuartiersAdmin = (villeId?: string) =>
  prisma.quartier.findMany({
    where: villeId ? { villeId } : undefined,
    orderBy: { nom: "asc" },
    include: {
      ville: { select: { id: true, nom: true, pays: { select: { id: true, nom: true } } } },
    },
  });

export const createQuartier = (data: {
  nom: string;
  villeId: string;
  latitude: number;
  longitude: number;
}) => prisma.quartier.create({ data, include: { ville: { include: { pays: true } } } });

export const updateQuartier = (
  id: string,
  data: { nom?: string; villeId?: string; latitude?: number; longitude?: number }
) => prisma.quartier.update({ where: { id }, data, include: { ville: { include: { pays: true } } } });

export const deleteQuartier = (id: string) =>
  prisma.quartier.delete({ where: { id } });
