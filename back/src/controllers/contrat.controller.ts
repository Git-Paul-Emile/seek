import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as ContratService from "../services/contrat.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";

const getOwner = (req: Request) => {
  if (!req.owner?.id)
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.owner.id;
};

// ─── GET /api/biens/:id/bail/:bailId/contrat ──────────────────────────────────

export const getContrat = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const contrat = await ContratService.getContrat(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: contrat ? "Contrat récupéré" : "Aucun contrat", data: contrat ?? null })
  );
};

// ─── POST /api/biens/:id/bail/:bailId/contrat ─────────────────────────────────
// Génération automatique : sélection du modèle selon le type de bail

export const genererContrat = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const contrat = await ContratService.genererContrat(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Contrat généré", data: contrat })
  );
};

// ─── PATCH /api/biens/:id/bail/:bailId/contrat/:contratId ─────────────────────

export const updateContrat = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const { contenu } = req.body;
  if (!contenu) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "contenu est requis" })
    );
    return;
  }
  const contrat = await ContratService.updateContrat(
    req.params.id as string,
    req.params.bailId as string,
    req.params.contratId as string,
    proprietaireId,
    contenu
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Contrat mis à jour", data: contrat })
  );
};

// ─── PATCH /api/biens/:id/bail/:bailId/contrat/:contratId/activer ─────────────

export const activerContrat = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const contrat = await ContratService.activerContrat(
    req.params.id as string,
    req.params.bailId as string,
    req.params.contratId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Contrat activé", data: contrat })
  );
};

// ─── POST /api/biens/:id/bail/:bailId/contrat/:contratId/envoyer ──────────────

export const envoyerContrat = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const result = await ContratService.envoyerContrat(
    req.params.id as string,
    req.params.bailId as string,
    req.params.contratId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: `Contrat activé et envoyé à ${result.email}`,
      data: result,
    })
  );
};
