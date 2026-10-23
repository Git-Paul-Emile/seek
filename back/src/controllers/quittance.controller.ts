import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as QuittanceService from "../services/quittance.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";

const getOwner = (req: Request) => {
  if (!req.owner?.id) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.owner.id;
};

/** GET /api/biens/:id/bail/:bailId/echeancier/:echeanceId/quittance */
export const getQuittance = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const quittance = await QuittanceService.getQuittance(
    req.params.id as string,
    req.params.bailId as string,
    req.params.echeanceId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: quittance ? "Quittance récupérée" : "Aucune quittance", data: quittance })
  );
};

/** POST /api/biens/:id/bail/:bailId/echeancier/:echeanceId/quittance */
export const genererQuittance = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const quittance = await QuittanceService.genererQuittance(
    req.params.id as string,
    req.params.bailId as string,
    req.params.echeanceId as string,
    proprietaireId
  );
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Quittance générée", data: quittance })
  );
};

/** GET /api/biens/:id/bail/:bailId/quittances */
export const getQuittancesBail = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const quittances = await QuittanceService.getQuittancesBail(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Quittances récupérées", data: quittances })
  );
};
