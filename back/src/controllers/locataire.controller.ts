import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as LocataireService from "../services/locataire.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";
import { z } from "zod";
import {
  createLocataireSchema,
  updateLocataireSchema,
} from "../validators/locataire.validator.js";

const getOwner = (req: Request) => {
  if (!req.owner?.id)
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.owner.id;
};

// ─── Liste ────────────────────────────────────────────────────────────────────

export const getLocataires = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const locataires = await LocataireService.getByProprietaire(proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Locataires récupérés",
      data: locataires,
    })
  );
};

// ─── Détail ───────────────────────────────────────────────────────────────────

export const getLocataireById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const locataire = await LocataireService.getById(
    req.params.id as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Locataire récupéré",
      data: locataire,
    })
  );
};

// ─── Création ─────────────────────────────────────────────────────────────────

export const createLocataire = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = createLocataireSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({
        status: "fail",
        message: parsed.error.issues[0]?.message ?? "Données invalides",
        data: parsed.error.flatten(),
      })
    );
    return;
  }

  const locataire = await LocataireService.create(proprietaireId, parsed.data);
  res.status(StatusCodes.CREATED).json(
    jsonResponse({
      status: "success",
      message: "Locataire créé",
      data: locataire,
    })
  );
};

// ─── Modification ─────────────────────────────────────────────────────────────

export const updateLocataire = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = updateLocataireSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({
        status: "fail",
        message: parsed.error.issues[0]?.message ?? "Données invalides",
        data: parsed.error.flatten(),
      })
    );
    return;
  }

  const locataire = await LocataireService.updateOwner(
    req.params.id as string,
    proprietaireId,
    parsed.data
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Locataire mis à jour",
      data: locataire,
    })
  );
};

// ─── Suppression ──────────────────────────────────────────────────────────────

export const deleteLocataire = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  await LocataireService.remove(req.params.id as string, proprietaireId);
  res.status(StatusCodes.NO_CONTENT).send();
};

// ─── Lien d'activation ────────────────────────────────────────────────────────

export const getLienActivation = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const { lien: _hidden, ...result } = await LocataireService.getLien(
    req.params.id as string,
    proprietaireId
  );
  // lien masqué intentionnellement : envoyé automatiquement au locataire par SMS/email
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Demande traitée avec succès",
      data: result,
    })
  );
};

// ─── Validation de la vérification du locataire ───────────────────────────────────

const approveVerificationSchema = z.object({});

export const approveLocataireVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const id = req.params.id;
  
  if (!id || Array.isArray(id)) {
    throw new AppError("ID invalide", StatusCodes.BAD_REQUEST);
  }

  const result = await LocataireService.approveLocataireVerification(id, proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Vérification du locataire approuvée",
      data: result,
    })
  );
};

const rejectVerificationSchema = z.object({
  motif: z.string().min(1, "Le motif de rejet est obligatoire"),
});

export const rejectLocataireVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const id = req.params.id;
  
  if (!id || Array.isArray(id)) {
    throw new AppError("ID invalide", StatusCodes.BAD_REQUEST);
  }

  const parsed = rejectVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({
        status: "fail",
        message: parsed.error.issues[0]?.message ?? "Données invalides",
        data: parsed.error.flatten(),
      })
    );
    return;
  }

  const { motif } = parsed.data;
  const result = await LocataireService.rejectLocataireVerification(id, proprietaireId, motif);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Vérification du locataire rejetée",
      data: result,
    })
  );
};

// ─── Recherche globale par téléphone/email ────────────────────────────────────

export const searchLocataireByContact = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const { telephone, email } = req.query as { telephone?: string; email?: string };

  if (!telephone && !email) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "Fournissez un téléphone ou un email", data: null })
    );
    return;
  }

  const result = await LocataireService.searchByContact(proprietaireId, { telephone, email });
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Recherche effectuée", data: result })
  );
};

// ─── Nombre de vérifications en attente ───────────────────────────────────

export const getPendingVerificationsCount = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const count = await LocataireService.getPendingVerificationsCount(proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Nombre de vérifications en attente",
      data: { count },
    })
  );
};
