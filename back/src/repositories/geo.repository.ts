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
