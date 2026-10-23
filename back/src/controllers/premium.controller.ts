import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as PremiumService from "../services/premium.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";
import { ModePaiement, MOYENS_PAIEMENT } from "../types/premium.types.js";

// ─── Récupérer les formules premium disponibles ─────────────────────────────────

export const getFormulesPremium = async (_req: Request, res: Response): Promise<void> => {
  const formules = await PremiumService.getFormulesPremium();

  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Formules premium récupérées",
      data: { formules, moyenPaiement: MOYENS_PAIEMENT },
    })
  );
};

// ─── Admin CRUD FormulePremium ────────────────────────────────────────────────

export const adminGetFormules = async (_req: Request, res: Response): Promise<void> => {
  const formules = await PremiumService.adminGetAllFormules();
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Formules récupérées", data: formules }));
};

export const adminCreateFormule = async (req: Request, res: Response): Promise<void> => {
  const { code, nom, dureeJours, prix, accroche, description, idealPour, populer, actif, ordre } = req.body;
  if (!code || !nom || !dureeJours || !prix || !accroche || !description) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Champs obligatoires manquants" }));
    return;
  }
  const formule = await PremiumService.adminCreateFormule({
    code, nom,
    dureeJours: parseInt(dureeJours),
    prix: parseFloat(prix),
    accroche, description,
    idealPour: idealPour ?? [],
    populer, actif, ordre,
  });
  res.status(StatusCodes.CREATED).json(jsonResponse({ status: "success", message: "Formule créée", data: formule }));
};

export const adminUpdateFormule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const formule = await PremiumService.adminUpdateFormule(id as string, req.body);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Formule mise à jour", data: formule }));
};

export const adminDeleteFormule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await PremiumService.adminDeleteFormule(id as string);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Formule supprimée" }));
};

// ─── Vérifier la place puis payer et activer la mise en avant (simulation) ────

export const payerEtActiverPremium = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const bienId = req.params.id as string;
  const { formuleId, modePaiement } = req.body;

  if (!formuleId) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "L'ID de la formule est requis" })
    );
    return;
  }

  if (!modePaiement) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "Le mode de paiement est requis" })
    );
    return;
  }

  const modesValides = Object.values(ModePaiement);
  if (!modesValides.includes(modePaiement)) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: `Mode de paiement invalide. Modes disponibles: ${modesValides.join(", ")}` })
    );
    return;
  }

  try {
    const result = await PremiumService.simulerPaiementEtActiverPromotion(
      bienId,
      proprietaireId,
      formuleId,
      modePaiement
    );

    res.status(StatusCodes.OK).json(
      jsonResponse({
        status: "success",
        message: "Paiement effectué avec succès. Votre annonce est maintenant mise en avant !",
        data: {
          paiement: {
            transactionId: result.paiement.transactionId,
            montant: result.paiement.montant,
            modePaiement: result.paiement.modePaiement,
            datePaiement: result.paiement.datePaiement,
          },
          promotion: result.promotion.data,
        },
      })
    );
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(jsonResponse({ status: "fail", message: error.message }));
      return;
    }
    console.error("[PREMIUM] Erreur lors du paiement:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      jsonResponse({ status: "error", message: "Une erreur inattendue s'est produite" })
    );
  }
};

// ─── Récupérer les moyens de paiement disponibles ───────────────────────────────

export const getMoyensPaiement = async (_req: Request, res: Response): Promise<void> => {
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Moyens de paiement disponibles",
      data: MOYENS_PAIEMENT,
    })
  );
};

// ─── Arrêter la mise en avant d'un bien (propriétaire) ──────────────────────────

export const arreterPremium = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const bienId = req.params.id as string;

  try {
    const result = await PremiumService.arreterMiseEnAvant(bienId, proprietaireId);

    res.status(StatusCodes.OK).json(
      jsonResponse({ status: "success", message: result.message, data: result })
    );
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(jsonResponse({ status: "fail", message: error.message }));
      return;
    }
    console.error("[PREMIUM] Erreur lors de l'arrêt de la mise en avant:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      jsonResponse({ status: "error", message: "Une erreur inattendue s'est produite" })
    );
  }
};

// ─── Statut de mise en avant d'un bien (propriétaire) ───────────────────────────

export const getPromotionStatus = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const bienId = req.params.id as string;

  const status = await PremiumService.getPromotionStatus(bienId, proprietaireId);

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Statut de mise en avant récupéré", data: status })
  );
};

// ─── Historique des mises en avant d'un bien (propriétaire) ────────────────────

export const getHistoriqueBien = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const bienId = req.params.id as string;

  try {
    const historique = await PremiumService.getHistoriqueMisesEnAvant(bienId, proprietaireId);

    res.status(StatusCodes.OK).json(
      jsonResponse({ status: "success", message: "Historique des mises en avant récupéré", data: historique })
    );
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json(jsonResponse({ status: "fail", message: error.message }));
      return;
    }
    console.error("[PREMIUM] Erreur lors de la récupération de l'historique:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
      jsonResponse({ status: "error", message: "Une erreur inattendue s'est produite" })
    );
  }
};

// ─── Historique de tous les paiements premium du propriétaire ──────────────────

export const getHistoriquePaiements = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner!.id;
  const { page, limit } = req.query;

  const result = await PremiumService.getHistoriqueMisesEnAvantProprietaire(
    proprietaireId,
    {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    }
  );

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Historique des paiements premium récupéré", data: result })
  );
};

// ─── Annonces mises en avant pour la page d'accueil (public) ───────────────────

export const getAnnoncesMiseEnAvant = async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 5;

  const result = await PremiumService.getAnnoncesMiseEnAvant(limit);

  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: result.message,
      data: { annonces: result.annonces, total: result.total, placesDisponibles: result.placesDisponibles },
    })
  );
};

// ─── État des places de mise en avant disponibles (public) ────────────────────

export const getPlacesDisponibles = async (_req: Request, res: Response): Promise<void> => {
  const result = await PremiumService.getPlacesDisponibles();

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "État des places de mise en avant récupéré", data: result })
  );
};

// ─── Admin : historique global des mises en avant ──────────────────────────────

export const getAdminHistoriquePromotions = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
  const statut = req.query.statut as string | undefined;
  const proprietaireId = req.query.proprietaireId as string | undefined;

  const result = await PremiumService.adminGetHistorique({ page, limit, statut, proprietaireId });

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Historique des mises en avant récupéré", data: result })
  );
};

// ─── Admin : statistiques globales des mises en avant ──────────────────────────

export const getAdminStatsPromotions = async (_req: Request, res: Response): Promise<void> => {
  const stats = await PremiumService.adminGetStats();

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Stats mises en avant récupérées", data: stats })
  );
};

// ─── Admin : arrêter manuellement une mise en avant ────────────────────────────

export const adminArreterPromotion = async (req: Request, res: Response): Promise<void> => {
  const id = req.params["id"] as string;
  const { motif } = req.body as { motif?: string };

  const result = await PremiumService.adminArreterPromotion(id, motif as string);

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: result.message, data: result })
  );
};

// ─── Admin : traiter les mises en avant expirées ───────────────────────────────

export const adminTraiterExpires = async (_req: Request, res: Response): Promise<void> => {
  const result = await PremiumService.traiterPromotionsExpirees();
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: `${result.traite} mise(s) en avant expirée(s) traitée(s)`, data: result })
  );
};
