import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as NotificationPreferencesService from "../services/notificationPreferences.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";

// ─── GET /api/owner/notifications/canaux ──────────────────────────────────────

export const getCanaux = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }

  const data = await NotificationPreferencesService.getCanauxProprietaire(proprietaireId);

  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Préférences de notification récupérées",
      data,
    })
  );
};

// ─── PUT /api/owner/notifications/canaux ──────────────────────────────────────

export const updateCanaux = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }

  const { canaux, modePaiement } = req.body as { canaux: string[]; modePaiement?: string };

  const data = await NotificationPreferencesService.updateCanauxProprietaire(
    proprietaireId,
    canaux,
    modePaiement as any
  );

  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Canaux de notification mis à jour",
      data,
    })
  );
};
