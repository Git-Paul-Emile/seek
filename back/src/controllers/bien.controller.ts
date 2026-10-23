import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as BienService from "../services/bien.service.js";
import { getOwnerStats, getStatsVuesBien, getStatsVuesOwner, getAdminStatsVues, getStatsFavorisOwner, getStatsFavorisBien } from "../repositories/bien.repository.js";
import { jsonResponse } from "../utils/responseApi.js";
import { saveDraftSchema } from "../validators/bien.validator.js";
import { AppError } from "../utils/AppError.js";
import * as PremiumService from "../services/premium.service.js";

// ─── Brouillon ────────────────────────────────────────────────────────────────

export const saveDraft = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }

  const fields = req.files as { photos?: Express.Multer.File[]; video?: Express.Multer.File[] } | undefined;
  const photoFiles = fields?.photos ?? [];
  const videoFile  = fields?.video?.[0];

  let body: Record<string, unknown> = {};
  try {
    body = req.body.data ? JSON.parse(req.body.data as string) : req.body;
  } catch {
    body = req.body;
  }

  const parsed = saveDraftSchema.safeParse(body);
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

  const bien = await BienService.saveDraft(parsed.data, proprietaireId, photoFiles, videoFile);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Brouillon enregistré", data: bien })
  );
};

export const getDraft = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }

  const draft = await BienService.getDraftByProprietaire(proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Brouillon récupéré", data: draft ?? null })
  );
};

export const soumettreAnnonce = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }

  const id = req.params.id as string;
  const bien = await BienService.soumettreAnnonce(id, proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Annonce soumise pour validation", data: bien })
  );
};

// ─── Liste des biens du propriétaire ─────────────────────────────────────────

export const getBiens = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }
  const biens = await BienService.getBiensByProprietaire(proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Biens récupérés", data: biens })
  );
};

export const deleteBien = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  await BienService.deleteBien(req.params.id as string, proprietaireId);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const retourBrouillon = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  const bien = await BienService.retourBrouillon(req.params.id as string, proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Annonce remise en brouillon", data: bien })
  );
};

export const annulerAnnonce = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  await BienService.annulerAnnonce(req.params.id as string, proprietaireId);
  res.status(StatusCodes.NO_CONTENT).send();
};

export const getBienById = async (req: Request, res: Response): Promise<void> => {
  const bien = await BienService.getBienById(req.params.id as string);
  if (!bien) {
    throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Bien récupéré", data: bien })
  );
};

// ─── Public - dernières annonces (pour page d'accueil) ─────────────────────────

export const getDernieresAnnonces = async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 10;
  
  // D'abord récupérer les annonces mises en avant (via rotation intelligente)
  const promotedResult = await PremiumService.getAnnoncesMiseEnAvant(4);
  const promotedAnnonces = promotedResult.annonces;
  
  // Calculer combien d'annonces supplémentaires il faut récupérer
  const remainingSlots = Math.max(0, limit - promotedAnnonces.length);
  
  // Récupérer les dernières annonces publiées non boostées
  const regularAnnonces = remainingSlots > 0 
    ? await BienService.getDernieresAnnonces(remainingSlots)
    : [];
  
  // Filtrer les annonces régulières pour exclure celles qui sont déjà en promotion
  const promotedIds = new Set(promotedAnnonces.map((a: any) => a.id));
  const filteredRegular = regularAnnonces.filter((a: any) => !promotedIds.has(a.id));
  
  // Combiner : boostées en premier, puis régulières
  const combined = [...promotedAnnonces, ...filteredRegular];
  
  res.status(StatusCodes.OK).json(
    jsonResponse({ 
      status: "success", 
      message: "Annonces récupérées", 
      data: combined 
    })
  );
};

// ─── Public - lieux distincts ─────────────────────────────────────────────────

export const getDistinctLieux = async (_req: Request, res: Response): Promise<void> => {
  const lieux = await BienService.getDistinctLieux();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Lieux récupérés", data: lieux })
  );
};

// ─── Public - recherche avec filtres ──────────────────────────────────────────

export const searchAnnoncesPubliques = async (req: Request, res: Response): Promise<void> => {
  const {
    ville, quartier, typeLogement, typeTransaction,
    prixMin, prixMax,
    chambres, surfaceMin, surfaceMax,
    meuble, parking, ascenseur, fumeurs, animaux, equipementIds,
    misEnAvant, featuredFirst,
    statutBien, proprietaireVerification,
    sortBy, sortOrder,
    page, limit,
    lat, lng, radius,
  } = req.query as Record<string, string>;

  const result = await BienService.searchAnnoncePubliques({
    ville:               ville    || undefined,
    quartier:            quartier || undefined,
    typeLogementSlug:    typeLogement || undefined,
    typeTransactionSlug: typeTransaction || undefined,
    statutBienSlug:      statutBien || undefined,
    proprietaireVerification: proprietaireVerification || undefined,
    prixMin:       prixMin   ? parseInt(prixMin)   : undefined,
    prixMax:       prixMax   ? parseInt(prixMax)   : undefined,
    nbChambresMin: chambres  ? parseInt(chambres)  : undefined,
    surfaceMin:    surfaceMin ? parseInt(surfaceMin) : undefined,
    surfaceMax:    surfaceMax ? parseInt(surfaceMax) : undefined,
    meuble:        meuble    === "1" ? true : undefined,
    parking:       parking   === "1" ? true : undefined,
    ascenseur:     ascenseur === "1" ? true : undefined,
    fumeurs:       fumeurs   === "1" ? true : undefined,
    animaux:       animaux   === "1" ? true : undefined,
    equipementIds: equipementIds ? equipementIds.split(",").filter(Boolean) : undefined,
    misEnAvant:    misEnAvant    === "1" ? true : undefined,
    featuredFirst: featuredFirst === "1" ? true : undefined,
    sortBy:    (sortBy === "prix" || sortBy === "createdAt") ? sortBy : undefined,
    sortOrder: (sortOrder === "asc" || sortOrder === "desc") ? sortOrder : undefined,
    page:      page   ? parseInt(page)     : undefined,
    limit:     limit  ? parseInt(limit)    : undefined,
    lat:       lat    ? parseFloat(lat)    : undefined,
    lng:       lng    ? parseFloat(lng)    : undefined,
    radius:    radius ? parseFloat(radius) : undefined,
  });
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Résultats de recherche", data: result })
  );
};

// ─── Public - annonce publiée par ID ─────────────────────────────────────────────

export const getAnnoncePublie = async (req: Request, res: Response): Promise<void> => {
  const bien = await BienService.getAnnoncePublieById(req.params.id as string);
  // Enregistrer la vue en arrière-plan avec déduplication (30 min par IP)
  const bienId = req.params.id as string;
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
    ?? req.socket.remoteAddress
    ?? "unknown";
  const userId = (req as any).comptePublic?.id ?? null;
  (async () => {
    try {
      const { prisma } = await import("../config/database.js");
      const since = new Date(Date.now() - 30 * 60 * 1000);
      const existing = await prisma.vueBien.findFirst({
        where: {
          bienId,
          createdAt: { gte: since },
          OR: [
            { ipAddress: ip },
            ...(userId ? [{ userId }] : []),
          ],
        },
        select: { id: true },
      });
      if (!existing) {
        await prisma.vueBien.create({ data: { bienId, ipAddress: ip, userId } });
        await prisma.bien.update({ where: { id: bienId }, data: { nbVues: { increment: 1 } } });
      }
    } catch { /* ignore */ }
  })();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Annonce récupérée", data: bien })
  );
};

// ─── Stats propriétaire ───────────────────────────────────────────────────────

export const getOwnerStatsController = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }
  const stats = await getOwnerStats(proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statistiques récupérées", data: stats })
  );
};

// ─── Stats vues par bien (propriétaire) ──────────────────────────────────────

export const getStatsVuesBienController = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  const stats = await getStatsVuesBien(req.params.id as string, proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Stats vues récupérées", data: stats }));
};

// ─── Stats vues globales owner ────────────────────────────────────────────────

export const getStatsVuesOwnerController = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  const stats = await getStatsVuesOwner(proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Stats vues récupérées", data: stats }));
};

// ─── Stats vues admin ─────────────────────────────────────────────────────────

export const getAdminStatsVuesController = async (_req: Request, res: Response): Promise<void> => {
  const stats = await getAdminStatsVues();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Stats vues admin récupérées", data: stats }));
};

// ─── Stats favoris propriétaire (toutes ses annonces) ─────────────────────────

export const getStatsFavorisOwnerController = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }
  const stats = await getStatsFavorisOwner(proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Stats favoris récupérées", data: stats }));
};

// ─── Stats favoris d'un bien (propriétaire) ─────────────────────────────────

export const getStatsFavorisBienController = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  }
  const stats = await getStatsFavorisBien(req.params.id as string, proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Stats favoris récupérées", data: stats }));
};

// ─── Public - annonces similaires ────────────────────────────────────────────

export const getAnnoncesSimilaires = async (req: Request, res: Response): Promise<void> => {
  const bienId = req.params.id as string;
  const bien = await BienService.getAnnoncePublieById(bienId);

  if (!bien) {
    throw new AppError("Annonce introuvable ou non publiée", StatusCodes.NOT_FOUND);
  }

  // Paramètre limit optionnel: défaut 4, max 6 ( Desktop UX)
  let limit = parseInt(req.query.limit as string) || 4;
  limit = Math.min(Math.max(limit, 3), 6); // Entre 3 et 6

  const similaires = await BienService.getAnnoncesSimilaires(bienId, limit);
  
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Annonces similaires récupérées", data: similaires })
  );
};
