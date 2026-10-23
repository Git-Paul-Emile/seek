import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getSiteStats, getAdminStats, getProprietairesStats, getProprietaireDetail, getRevenusStats } from "../repositories/stats.repository.js";
import { jsonResponse } from "../utils/responseApi.js";

// GET /api/stats - public
export const getStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await getSiteStats();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statistiques récupérées", data: stats })
  );
};

// GET /api/stats/admin - admin auth requis
export const getAdminStatsController = async (_req: Request, res: Response): Promise<void> => {
  const stats = await getAdminStats();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statistiques admin récupérées", data: stats })
  );
};

// GET /api/stats/proprietaires - admin auth requis
export const getProprietairesStatsController = async (_req: Request, res: Response): Promise<void> => {
  const stats = await getProprietairesStats();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statistiques des propriétaires récupérées", data: stats })
  );
};

// GET /api/stats/revenus - admin auth requis
export const getRevenusStatsController = async (_req: Request, res: Response): Promise<void> => {
  const stats = await getRevenusStats();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statistiques des revenus récupérées", data: stats })
  );
};

// GET /api/stats/proprietaires/:id - admin auth requis
export const getProprietaireDetailController = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  
  if (!id || typeof id !== 'string') {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "error", message: "ID invalide", data: null })
    );
    return;
  }
  
  const detail = await getProprietaireDetail(id);
  
  if (!detail) {
    res.status(StatusCodes.NOT_FOUND).json(
      jsonResponse({ status: "error", message: "Propriétaire non trouvé", data: null })
    );
    return;
  }
  
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Détails du propriétaire récupérés", data: detail })
  );
};
