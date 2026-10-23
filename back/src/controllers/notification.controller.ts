import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import * as NotificationService from "../services/notification.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";

const getOwner = (req: Request) => {
  if (!req.owner?.id) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.owner.id;
};

// ─── Envoyer un rappel manuel sur une échéance ────────────────────────────────

/** POST /api/biens/:id/bail/:bailId/echeancier/:echeanceId/rappel */
export const envoyerRappel = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  // params are typed as `any` via global augmentation; cast to string to satisfy functions
  const { id: bienId, bailId, echeanceId } = req.params as { id: string; bailId: string; echeanceId: string };

  // Vérifier que le bien appartient au propriétaire
  const bien = await prisma.bien.findUnique({ where: { id: bienId }, select: { proprietaireId: true } });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  // Récupérer l'échéance + locataire + bien
  const echeance = await prisma.echeancierLoyer.findUnique({
    where: { id: echeanceId },
    include: {
      bail: {
        include: {
          locataire: { select: { id: true, nom: true, prenom: true, telephone: true } },
          bien: { select: { titre: true } },
        },
      },
    },
  }) as any; // cast to any so TypeScript knows bail property exists
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.bailId !== bailId) throw new AppError("Données incohérentes", StatusCodes.BAD_REQUEST);

  const { locataire, bien: bienData } = echeance.bail;

  const result = await NotificationService.envoyerRappelLoyer({
    locataireTelephone: locataire.telephone,
    locataireNom: `${locataire.prenom} ${locataire.nom}`,
    montant: echeance.montant,
    dateEcheance: echeance.dateEcheance.toISOString(),
    bienTitre: bienData.titre,
    echeanceId,
    bailId,
    bienId,
    proprietaireId,
    locataireId: locataire.id,
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Rappel envoyé", data: result })
  );
};

// ─── Lister l'historique des rappels d'une échéance ──────────────────────────

/** GET /api/biens/:id/bail/:bailId/echeancier/:echeanceId/rappels */
export const getRappelsEcheance = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const { id: bienId, echeanceId } = req.params as { id: string; bailId: string; echeanceId: string };

  const bien = await prisma.bien.findUnique({ where: { id: bienId }, select: { proprietaireId: true } });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  const rappels = await NotificationService.getNotificationsEcheance(echeanceId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Historique des relances récupéré", data: rappels })
  );
};

// ─── Lister les notifications d'un bail ───────────────────────────────────────

/** GET /api/biens/:id/bail/:bailId/notifications */
export const getNotificationsBail = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const { id: bienId, bailId } = req.params as { id: string; bailId: string };

  const bien = await prisma.bien.findUnique({ where: { id: bienId }, select: { proprietaireId: true } });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  const notifications = await NotificationService.getNotificationsBail(bailId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notifications récupérées", data: notifications })
  );
};
