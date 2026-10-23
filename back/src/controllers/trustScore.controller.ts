import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { computeScoreForProprietaire } from "../services/trustScore.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";

/** GET /api/proprietaires/:id/score - score public d'un propriétaire */
export const getPublicScore = async (req: Request, res: Response) => {
  const { id } = req.params;
  const score = await computeScoreForProprietaire(id as string);
  // Si l'id n'existe pas, le service retourne 0
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Score de confiance", data: { score } }));
};

/** GET /api/owner/score - score du propriétaire connecté (avec détail) */
export const getOwnScore = async (req: Request, res: Response) => {
  const proprietaireId = (req as any).proprietaire?.id;
  if (!proprietaireId) throw new AppError("Non authentifié", StatusCodes.UNAUTHORIZED);
  const score = await computeScoreForProprietaire(proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Votre score de confiance", data: { score } }));
};
