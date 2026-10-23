import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertOwnerBien = async (bienId: string, proprietaireId: string) => {
  const bien = await prisma.bien.findUnique({ where: { id: bienId }, select: { proprietaireId: true } });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
};

/** Génère un numéro de quittance unique : Q-YYYYMM-XXXXX */
const genererNumero = async (): Promise<string> => {
  const moisAnnee = new Date().toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" }).replace("/", "");
  const count = await prisma.quittance.count();
  const seq = String(count + 1).padStart(5, "0");
  return `Q-${moisAnnee}-${seq}`;
};

// ─── Récupérer la quittance d'une échéance ────────────────────────────────────

export const getQuittance = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  proprietaireId: string
) => {
  await assertOwnerBien(bienId, proprietaireId);

  const echeance = await prisma.echeancierLoyer.findUnique({
    where: { id: echeanceId },
    include: { quittance: true },
  });
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.bailId !== bailId) throw new AppError("Données incohérentes", StatusCodes.BAD_REQUEST);

  return echeance.quittance ?? null;
};

// ─── Générer (créer ou récupérer) la quittance d'une échéance ─────────────────

export const genererQuittance = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  proprietaireId: string
) => {
  await assertOwnerBien(bienId, proprietaireId);

  const echeance = await prisma.echeancierLoyer.findUnique({
    where: { id: echeanceId },
    include: { quittance: true },
  });
  if (!echeance) throw new AppError("Échéance introuvable", StatusCodes.NOT_FOUND);
  if (echeance.bailId !== bailId) throw new AppError("Données incohérentes", StatusCodes.BAD_REQUEST);
  if (echeance.statut !== "PAYE")
    throw new AppError("La quittance n'est disponible que pour les paiements effectués", StatusCodes.BAD_REQUEST);

  // Retourner la quittance existante si déjà générée
  if (echeance.quittance) return echeance.quittance;

  // Récupérer le bail pour locataireId
  const bail = await prisma.bailLocation.findUnique({
    where: { id: bailId },
    select: { locataireId: true },
  });
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);

  const numero = await genererNumero();

  return prisma.quittance.create({
    data: {
      echeanceId,
      bailId,
      bienId,
      proprietaireId,
      locataireId: bail.locataireId,
      numero,
    },
  });
};

// ─── Lister toutes les quittances d'un bail ───────────────────────────────────

export const getQuittancesBail = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  await assertOwnerBien(bienId, proprietaireId);

  return prisma.quittance.findMany({
    where: { bailId },
    include: {
      echeance: {
        select: {
          dateEcheance: true,
          montant: true,
          statut: true,
          datePaiement: true,
          modePaiement: true,
          reference: true,
        },
      },
    },
    orderBy: { dateGeneration: "desc" },
  });
};

// ─── Générer une quittance en interne (sans vérification d'accès) ─────────────

/**
 * Génère (ou récupère si déjà existante) la quittance d'une échéance payée.
 * Usage interne uniquement - ne vérifie pas les droits propriétaire.
 */
export const genererQuittanceInterne = async (echeanceId: string): Promise<void> => {
  const echeance = await prisma.echeancierLoyer.findUnique({
    where: { id: echeanceId },
    include: {
      quittance: true,
      bail: { select: { locataireId: true } },
    },
  });
  if (!echeance) return;
  if (echeance.statut !== "PAYE") return;
  if (echeance.quittance) return; // déjà générée

  const numero = await genererNumero();
  await prisma.quittance.create({
    data: {
      echeanceId,
      bailId: echeance.bailId,
      bienId: echeance.bienId,
      proprietaireId: echeance.proprietaireId,
      locataireId: echeance.bail.locataireId,
      numero,
    },
  });
};

// ─── Récupérer quittance côté locataire ───────────────────────────────────────

export const getQuittancesLocataire = async (locataireId: string) =>
  prisma.quittance.findMany({
    where: { locataireId },
    include: {
      echeance: {
        select: {
          dateEcheance: true,
          montant: true,
          statut: true,
          datePaiement: true,
          modePaiement: true,
          reference: true,
        },
      },
    },
    orderBy: { dateGeneration: "desc" },
  });
