import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";
import * as BailInvitationService from "../services/bailInvitation.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOwner = (req: Request) => {
  if (!req.owner?.id) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.owner.id;
};

const getLocataire = (req: Request) => {
  if (!req.locataire?.id) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.locataire.id;
};

// ─── Schéma de validation ─────────────────────────────────────────────────────

const creerInvitationSchema = z.object({
  bienId: z.string().min(1, "L'ID du bien est requis"),
  locataireId: z.string().min(1, "L'ID du locataire est requis"),
  typeBail: z.string().optional().nullable(),
  dateDebutBail: z.string().min(1, "La date de début est requise"),
  dateFinBail: z.string().optional().nullable(),
  montantLoyer: z.number().positive("Le montant du loyer est requis"),
  montantCaution: z.number().optional().nullable(),
  cautionVersee: z.boolean().optional(),
  jourLimitePaiement: z.number().int().min(1).max(28).optional().nullable(),
  renouvellement: z.boolean().optional(),
  frequencePaiement: z.string().optional().nullable(),
});

// ─── Owner : créer une invitation ────────────────────────────────────────────

export const creerInvitation = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);

  const parsed = creerInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: parsed.error.issues[0]?.message ?? "Données invalides", data: parsed.error.flatten() })
    );
    return;
  }

  const invitation = await BailInvitationService.creerInvitation(proprietaireId, parsed.data);
  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Invitation envoyée au locataire", data: invitation })
  );
};

// ─── Locataire : voir ses invitations ────────────────────────────────────────

export const getInvitations = async (req: Request, res: Response): Promise<void> => {
  const locataireId = getLocataire(req);
  const invitations = await BailInvitationService.getInvitationsByLocataire(locataireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Invitations récupérées", data: invitations })
  );
};

// ─── Locataire : accepter une invitation ─────────────────────────────────────

export const accepterInvitation = async (req: Request, res: Response): Promise<void> => {
  const locataireId = getLocataire(req);
  const token = req.params.token as string;
  if (!token) throw new AppError("Token manquant", StatusCodes.BAD_REQUEST);

  const bail = await BailInvitationService.accepterInvitation(token, locataireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Invitation acceptée, bail créé", data: bail })
  );
};

// ─── Locataire : refuser une invitation ──────────────────────────────────────

export const refuserInvitation = async (req: Request, res: Response): Promise<void> => {
  const locataireId = getLocataire(req);
  const token = req.params.token as string;
  if (!token) throw new AppError("Token manquant", StatusCodes.BAD_REQUEST);

  const result = await BailInvitationService.refuserInvitation(token, locataireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: result.message, data: null })
  );
};
