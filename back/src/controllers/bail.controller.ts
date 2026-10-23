import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import * as BailService from "../services/bail.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { AppError } from "../utils/AppError.js";
import {
  createBailSchema,
  prolongerBailSchema,
  resilierBailSchema,
} from "../validators/bail.validator.js";
import { z } from "zod";

const payerEcheanceSchema = z.object({
  datePaiement: z.coerce.date(),
  modePaiement: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
  montant: z.number().positive().optional(),
});

const payerMoisMultiplesSchema = z.object({
  datePaiement: z.coerce.date(),
  nombreMois: z.number().int().min(1).max(36),
  modePaiement: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

const restituerCautionSchema = z.object({
  montantRestitue: z.number().min(0),
  motifRetenue: z.string().optional(),
  dateRestitution: z.coerce.date().optional(),
});

// Restitution de la caution facultative au moment de l'archivage.
const archiverBailSchema = z.object({
  restitution: z
    .object({
      montantRestitue: z.number({ message: "Indiquez le montant restitué en chiffres." }).min(0, "Le montant restitué ne peut pas être négatif."),
      motifRetenue: z.string().trim().max(500).optional(),
    })
    .optional(),
});

const getOwner = (req: Request) => {
  if (!req.owner?.id)
    throw new AppError("Authentification requise", StatusCodes.UNAUTHORIZED);
  return req.owner.id;
};

// ─── Bail actif d'un bien ─────────────────────────────────────────────────────

export const getBailActif = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const bail = await BailService.getBailActif(
    req.params.id as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: bail ? "Bail actif récupéré" : "Aucun bail actif",
      data: bail ?? null,
    })
  );
};

// ─── Historique des baux d'un bien ───────────────────────────────────────────

export const getHistoriqueBails = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const bails = await BailService.getHistoriqueBails(
    req.params.id as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Historique des baux récupéré",
      data: bails,
    })
  );
};

// ─── Créer un bail ────────────────────────────────────────────────────────────

export const creerBail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = createBailSchema.safeParse(req.body);
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

  const bail = await BailService.creerBail(
    req.params.id as string,
    proprietaireId,
    parsed.data
  );
  res.status(StatusCodes.CREATED).json(
    jsonResponse({
      status: "success",
      message: "Bail créé - le bien est maintenant Loué",
      data: bail,
    })
  );
};

// ─── Annuler un bail ──────────────────────────────────────────────────────────

export const annulerBail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  await BailService.annulerBail(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Bail annulé - le bien est maintenant Libre",
      data: null,
    })
  );
};

// ─── Mettre en préavis ────────────────────────────────────────────────────────

export const mettreEnPreavis = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const bail = await BailService.mettreEnPreavis(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Bail en préavis", data: bail })
  );
};

// ─── Mettre en renouvellement ─────────────────────────────────────────────────

export const mettreEnRenouvellement = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const bail = await BailService.mettreEnRenouvellement(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Bail en renouvellement", data: bail })
  );
};

// ─── Archiver un bail ─────────────────────────────────────────────────────────

export const archiverBail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = archiverBailSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: parsed.error.issues[0]?.message ?? "Données invalides", data: null }));
    return;
  }
  const bail = await BailService.archiverBail(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId,
    parsed.data.restitution
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Bail archivé - locataire passé en ancien locataire", data: bail })
  );
};

// ─── Bail à archiver d'un bien ────────────────────────────────────────────────

export const getBailAArchiver = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const bail = await BailService.getBailAArchiver(
    req.params.id as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: bail ? "Bail à archiver trouvé" : "Aucun bail à archiver",
      data: bail ?? null,
    })
  );
};

// ─── Terminer un bail ─────────────────────────────────────────────────────────

export const terminerBail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const bail = await BailService.terminerBail(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Bail terminé - le bien est maintenant Libre",
      data: bail,
    })
  );
};

// ─── Résilier un bail ─────────────────────────────────────────────────────────

export const resilierBail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = resilierBailSchema.safeParse(req.body);
  const motif = parsed.success ? parsed.data.motif : undefined;
  const bail = await BailService.resilierBail(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId,
    motif
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Bail résilié - le bien est maintenant Libre",
      data: bail,
    })
  );
};

// ─── Prolonger un bail ────────────────────────────────────────────────────────

export const prolongerBail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = prolongerBailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({
        status: "fail",
        message: parsed.error.issues[0]?.message ?? "Données invalides (duree doit être 6 ou 12)",
        data: parsed.error.flatten(),
      })
    );
    return;
  }

  const bail = await BailService.prolongerBail(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId,
    parsed.data.duree
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Bail prolongé",
      data: bail,
    })
  );
};

// ─── Échéancier ───────────────────────────────────────────────────────────────

export const getEcheancier = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const echeancier = await BailService.getEcheancier(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Échéancier récupéré", data: echeancier }));
};

export const payerEcheance = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = payerEcheanceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: parsed.error.issues[0]?.message ?? "Données invalides", data: null }));
    return;
  }
  const echeance = await BailService.payerEcheance(
    req.params.id as string,
    req.params.bailId as string,
    req.params.echeanceId as string,
    proprietaireId,
    parsed.data
  );
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Paiement enregistré", data: echeance }));
};

// ─── Prolonger l'échéancier d'une année ──────────────────────────────────────

const prolongerEcheancesAnneeSchema = z.object({
  anneeActuelle: z.number().int().min(2020).max(2100),
});

export const prolongerEcheancesAnnee = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = prolongerEcheancesAnneeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({
      status: "fail",
      message: parsed.error.issues[0]?.message ?? "Données invalides",
      data: null,
    }));
    return;
  }
  const result = await BailService.prolongerEcheancesAnnee(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId,
    parsed.data.anneeActuelle
  );
  const msg = result.generated > 0
    ? `${result.generated} échéance(s) générée(s) pour ${result.annee}`
    : `Les paiements de ${result.annee} sont déjà planifiés`;
  res.status(StatusCodes.OK).json(jsonResponse({
    status: "success",
    message: msg,
    data: result,
  }));
};

// ─── Confirmation de réception (propriétaire) ────────────────────────────────

export const confirmerReception = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const echeance = await BailService.confirmerReceptionPaiement(
    req.params.id as string,
    req.params.bailId as string,
    req.params.echeanceId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Réception du paiement confirmée", data: echeance })
  );
};

// ─── Paiement espèces (propriétaire → EN_ATTENTE_CONFIRMATION) ───────────────

const enregistrerEspecesSchema = z.object({
  datePaiement: z.coerce.date(),
  nombreMois: z.number().int().min(1).max(36).optional(),
  montant: z.number().positive().optional(),
  note: z.string().optional(),
});

export const enregistrerPaiementEspeces = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = enregistrerEspecesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: parsed.error.issues[0]?.message ?? "Données invalides", data: null }));
    return;
  }
  const echeance = await BailService.enregistrerPaiementEspeces(
    req.params.id as string,
    req.params.bailId as string,
    req.params.echeanceId as string,
    proprietaireId,
    parsed.data
  );
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Paiement espèces enregistré, en attente de confirmation du locataire", data: echeance }));
};

// ─── Caution ──────────────────────────────────────────────────────────────────

export const getCaution = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const caution = await BailService.getCaution(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: caution ? "Caution récupérée" : "Aucun dépôt de caution", data: caution ?? null }));
};

// ─── Mobile Money ─────────────────────────────────────────────────────────────

export const getMobileMoney = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const result = await BailService.getMobileMoney(req.params.id as string, proprietaireId);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Informations Mobile Money", data: result })
  );
};

// ─── Solde ────────────────────────────────────────────────────────────────────

export const getSolde = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const solde = await BailService.getSolde(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId
  );
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Solde récupéré", data: solde })
  );
};

export const restituerCaution = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = restituerCautionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: parsed.error.issues[0]?.message ?? "Données invalides", data: null }));
    return;
  }
  const caution = await BailService.restituerCaution(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId,
    parsed.data
  );
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Caution mise à jour", data: caution }));
};

// ─── Payer plusieurs mois d'un coup ───────────────────────────────────────────

export const payerMoisMultiples = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const parsed = payerMoisMultiplesSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: parsed.error.issues[0]?.message ?? "Données invalides", data: null }));
    return;
  }
  const result = await BailService.payerMoisMultiples(
    req.params.id as string,
    req.params.bailId as string,
    proprietaireId,
    parsed.data
  );
  res.status(StatusCodes.OK).json(jsonResponse({
    status: "success",
    message: `${result.paye} paiement(s) enregistré(s)`,
    data: result,
  }));
};

// ─── Biens avec bail actif ────────────────────────────────────────────────────

export const getBiensAvecBailActif = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const data = await BailService.getBiensAvecBailActif(proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({
    status: "success",
    message: `${data.length} bien(s) avec bail actif`,
    data,
  }));
};

// ─── Biens avec loyers en retard ──────────────────────────────────────────────

export const getBiensEnRetard = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const data = await BailService.getBiensEnRetard(proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({
    status: "success",
    message: `${data.length} bien(s) avec loyers en retard`,
    data,
  }));
};

// ─── Tableau de bord propriétaire ─────────────────────────────────────────────

export const getTableauDeBord = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = getOwner(req);
  const data = await BailService.getTableauDeBord(proprietaireId);
  res.status(StatusCodes.OK).json(jsonResponse({
    status: "success",
    message: "Tableau de bord récupéré",
    data,
  }));
};
