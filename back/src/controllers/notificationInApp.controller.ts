import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { jsonResponse } from "../utils/responseApi.js";
import { prisma } from "../config/database.js";

// ─── Owner ────────────────────────────────────────────────────────────────────

/** GET /api/owner/notifications */
export const getOwnerNotifications = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);

  const owner = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { telephone: true, email: true },
  });
  const destinataires = [owner?.telephone, owner?.email].filter(Boolean) as string[];

  const notifications = await prisma.notification.findMany({
    where: {
      proprietaireId,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      sujet: true,
      contenu: true,
      lu: true,
      bailId: true,
      bienId: true,
      locataireId: true,
      createdAt: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      proprietaireId,
      lu: false,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notifications récupérées", data: { notifications, unreadCount } })
  );
};

/** PATCH /api/owner/notifications/mark-all-read */
export const markOwnerNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);

  const owner = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { telephone: true, email: true },
  });
  const destinataires = [owner?.telephone, owner?.email].filter(Boolean) as string[];

  await prisma.notification.updateMany({
    where: {
      proprietaireId,
      lu: false,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
    data: { lu: true },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Toutes les notifications marquées comme lues", data: null })
  );
};

/** PATCH /api/owner/notifications/:id/read */
export const markOwnerOneNotificationRead = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);

  const owner = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { telephone: true, email: true },
  });
  const destinataires = [owner?.telephone, owner?.email].filter(Boolean) as string[];

  await prisma.notification.updateMany({
    where: {
      id: String(req.params.id),
      proprietaireId,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
    data: { lu: true },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notification marquée comme lue", data: null })
  );
};

// ─── Locataire ────────────────────────────────────────────────────────────────

/** GET /api/locataire/notifications */
export const getLocataireNotifications = async (req: Request, res: Response): Promise<void> => {
  const locataireId = req.locataire?.id;
  if (!locataireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);

  const locataire = await prisma.locataire.findUnique({
    where: { id: locataireId },
    select: { telephone: true, email: true },
  });
  const destinataires = [locataire?.telephone, locataire?.email].filter(Boolean) as string[];

  const notifications = await prisma.notification.findMany({
    where: {
      locataireId,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      sujet: true,
      contenu: true,
      lu: true,
      bailId: true,
      bienId: true,
      createdAt: true,
    },
  });

  const unreadCount = await prisma.notification.count({
    where: {
      locataireId,
      lu: false,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notifications récupérées", data: { notifications, unreadCount } })
  );
};

/** PATCH /api/locataire/notifications/mark-all-read */
export const markLocataireNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  const locataireId = req.locataire?.id;
  if (!locataireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);

  const locataire = await prisma.locataire.findUnique({
    where: { id: locataireId },
    select: { telephone: true, email: true },
  });
  const destinataires = [locataire?.telephone, locataire?.email].filter(Boolean) as string[];

  await prisma.notification.updateMany({
    where: {
      locataireId,
      lu: false,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
    data: { lu: true },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Toutes les notifications marquées comme lues", data: null })
  );
};

/** PATCH /api/locataire/notifications/:id/read */
export const markLocataireOneNotificationRead = async (req: Request, res: Response): Promise<void> => {
  const locataireId = req.locataire?.id;
  if (!locataireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);

  const locataire = await prisma.locataire.findUnique({
    where: { id: locataireId },
    select: { telephone: true, email: true },
  });
  const destinataires = [locataire?.telephone, locataire?.email].filter(Boolean) as string[];

  await prisma.notification.updateMany({
    where: {
      id: String(req.params.id),
      locataireId,
      ...(destinataires.length > 0 ? { destinataire: { in: destinataires } } : {}),
    },
    data: { lu: true },
  });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notification marquée comme lue", data: null })
  );
};

// ─── Admin ────────────────────────────────────────────────────────────────────

/** GET /api/admin/notifications - Aggregated system events */
export const getAdminNotifications = async (_req: Request, res: Response): Promise<void> => {
  const [pendingAnnonces, pendingVerifications, activeSignalements, pendingTemoignages, newFeedbacks] = await Promise.all([
    prisma.bien.count({ where: { statutAnnonce: "EN_ATTENTE" as any } }),
    prisma.proprietaire.count({ where: { statutVerification: "PENDING" as any } }),
    prisma.signalement.count({ where: { statut: "EN_ATTENTE" as any } }),
    prisma.temoignage.count({ where: { actif: false } }),
    prisma.feedback.count({ where: { lu: false } }),
  ]);

  const total = pendingAnnonces + pendingVerifications + activeSignalements + pendingTemoignages + newFeedbacks;

  const items = [
    ...(pendingAnnonces > 0
      ? [{ id: "annonces", type: "ANNONCE_EN_ATTENTE", titre: "Annonces en attente", message: `${pendingAnnonces} annonce${pendingAnnonces > 1 ? "s" : ""} en attente de validation`, lien: "/admin/annonces", count: pendingAnnonces, createdAt: new Date().toISOString() }]
      : []),
    ...(pendingVerifications > 0
      ? [{ id: "verifications", type: "VERIFICATION_EN_ATTENTE", titre: "Vérifications d'identité", message: `${pendingVerifications} vérification${pendingVerifications > 1 ? "s" : ""} en attente`, lien: "/admin/verifications", count: pendingVerifications, createdAt: new Date().toISOString() }]
      : []),
    ...(activeSignalements > 0
      ? [{ id: "signalements", type: "SIGNALEMENT_ACTIF", titre: "Signalements actifs", message: `${activeSignalements} signalement${activeSignalements > 1 ? "s" : ""} à traiter`, lien: "/admin/signalements", count: activeSignalements, createdAt: new Date().toISOString() }]
      : []),
    ...(pendingTemoignages > 0
      ? [{ id: "temoignages", type: "TEMOIGNAGE_EN_ATTENTE", titre: "Témoignages à valider", message: `${pendingTemoignages} témoignage${pendingTemoignages > 1 ? "s" : ""} en attente de publication`, lien: "/admin/temoignages", count: pendingTemoignages, createdAt: new Date().toISOString() }]
      : []),
    ...(newFeedbacks > 0
      ? [{ id: "feedbacks", type: "FEEDBACK_NON_LU", titre: "Nouveaux feedbacks", message: `${newFeedbacks} feedback${newFeedbacks > 1 ? "s" : ""} non lu${newFeedbacks > 1 ? "s" : ""}`, lien: "/admin/feedbacks", count: newFeedbacks, createdAt: new Date().toISOString() }]
      : []),
  ];

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Notifications admin récupérées", data: { items, unreadCount: total } })
  );
};
