import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as GeoRepository from "../repositories/geo.repository.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";

// ─── Pays (public) ────────────────────────────────────────────────────────────

export const getPays = async (_req: Request, res: Response): Promise<void> => {
  const pays = await GeoRepository.findAllPays();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Pays récupérés", data: pays })
  );
};

// ─── Pays (admin) ─────────────────────────────────────────────────────────────

export const getAllPaysAdmin = async (_req: Request, res: Response): Promise<void> => {
  const pays = await GeoRepository.findAllPaysAdmin();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Pays récupérés", data: pays })
  );
};

export const createPays = async (req: Request, res: Response): Promise<void> => {
  const { nom, code } = req.body as { nom: string; code: string };
  if (!nom?.trim() || !code?.trim()) throw new AppError("nom et code sont requis", StatusCodes.BAD_REQUEST);
  const pays = await GeoRepository.createPays({ nom: nom.trim(), code: code.trim().toUpperCase() });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Pays créé", data: pays })
  );
};

export const updatePays = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nom, code } = req.body as { nom?: string; code?: string };
  const data: Record<string, string> = {};
  if (nom?.trim()) data.nom = nom.trim();
  if (code?.trim()) data.code = code.trim().toUpperCase();
  const pays = await GeoRepository.updatePays(req.params.id as string, data);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Pays mis à jour", data: pays })
  );
};

export const deletePays = async (req: Request, res: Response): Promise<void> => {
  await GeoRepository.deletePays(req.params.id as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Pays supprimé", data: null })
  );
};

// ─── Villes (public) ─────────────────────────────────────────────────────────

export const getVilles = async (req: Request, res: Response): Promise<void> => {
  const villes = await GeoRepository.findVillesByPays(req.params.paysId as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Villes récupérées", data: villes })
  );
};

// ─── Villes (admin) ───────────────────────────────────────────────────────────

export const getAllVillesAdmin = async (req: Request, res: Response): Promise<void> => {
  const paysId = req.query.paysId as string | undefined;
  const villes = await GeoRepository.findAllVillesAdmin(paysId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Villes récupérées", data: villes })
  );
};

export const createVille = async (req: Request, res: Response): Promise<void> => {
  const { nom, paysId } = req.body as { nom: string; paysId: string };
  if (!nom?.trim() || !paysId) throw new AppError("nom et paysId sont requis", StatusCodes.BAD_REQUEST);
  const ville = await GeoRepository.createVille({ nom: nom.trim(), paysId });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Ville créée", data: ville })
  );
};

export const updateVille = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nom, paysId } = req.body as { nom?: string; paysId?: string };
  const data: Record<string, string> = {};
  if (nom?.trim()) data.nom = nom.trim();
  if (paysId) data.paysId = paysId;
  const ville = await GeoRepository.updateVille(req.params.id as string, data);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Ville mise à jour", data: ville })
  );
};

export const deleteVille = async (req: Request, res: Response): Promise<void> => {
  await GeoRepository.deleteVille(req.params.id as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Ville supprimée", data: null })
  );
};

// ─── Quartiers (public) ───────────────────────────────────────────────────────

export const getQuartiersByVille = async (req: Request, res: Response): Promise<void> => {
  const quartiers = await GeoRepository.findQuartiersByVille(req.params.villeId as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Quartiers récupérés", data: quartiers })
  );
};

// ─── Quartiers (admin) ────────────────────────────────────────────────────────

export const getAllQuartiersAdmin = async (req: Request, res: Response): Promise<void> => {
  const villeId = req.query.villeId as string | undefined;
  const quartiers = await GeoRepository.findAllQuartiersAdmin(villeId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Quartiers récupérés", data: quartiers })
  );
};

export const createQuartier = async (req: Request, res: Response): Promise<void> => {
  const { nom, villeId, latitude, longitude } = req.body as {
    nom: string;
    villeId: string;
    latitude: number;
    longitude: number;
  };
  if (!nom?.trim() || !villeId) throw new AppError("nom et villeId sont requis", StatusCodes.BAD_REQUEST);
  if (latitude == null || longitude == null) throw new AppError("latitude et longitude sont requis", StatusCodes.BAD_REQUEST);
  const quartier = await GeoRepository.createQuartier({
    nom: nom.trim(),
    villeId,
    latitude: Number(latitude),
    longitude: Number(longitude),
  });
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Quartier créé", data: quartier })
  );
};

export const updateQuartier = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { nom, villeId, latitude, longitude } = req.body as {
    nom?: string;
    villeId?: string;
    latitude?: number;
    longitude?: number;
  };
  const data: { nom?: string; villeId?: string; latitude?: number; longitude?: number } = {};
  if (nom?.trim()) data.nom = nom.trim();
  if (villeId) data.villeId = villeId;
  if (latitude != null) data.latitude = Number(latitude);
  if (longitude != null) data.longitude = Number(longitude);
  const quartier = await GeoRepository.updateQuartier(req.params.id as string, data);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Quartier mis à jour", data: quartier })
  );
};

export const deleteQuartier = async (req: Request, res: Response): Promise<void> => {
  await GeoRepository.deleteQuartier(req.params.id as string);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Quartier supprimé", data: null })
  );
};
