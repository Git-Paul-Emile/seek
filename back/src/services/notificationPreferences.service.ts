import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";
import { ModePaiement, MOYENS_PAIEMENT } from "../types/premium.types.js";
import {
  CANAUX_DISPONIBLES,
  FRAIS_CANAUX_SUPPLEMENTAIRES,
  estCanalValide,
  type CanalNotification,
} from "../types/notificationChannels.types.js";

const generateTransactionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `SIM-${timestamp}-${random}`;
};

/**
 * Récupère les préférences de canaux de notification du propriétaire
 */
export const getCanauxProprietaire = async (proprietaireId: string) => {
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { canauxNotification: true, canauxNotificationPayes: true },
  });

  if (!proprietaire) {
    throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);
  }

  return {
    canaux: proprietaire.canauxNotification,
    canauxDisponibles: CANAUX_DISPONIBLES,
    canauxPayes: proprietaire.canauxNotificationPayes,
    fraisCanauxSupplementaires: FRAIS_CANAUX_SUPPLEMENTAIRES,
    moyensPaiement: MOYENS_PAIEMENT,
  };
};

/**
 * Met à jour les canaux de notification choisis par le propriétaire.
 * Choisir plusieurs canaux à la fois nécessite un paiement unique (frais fixe)
 * qui débloque définitivement la sélection multi-canaux.
 */
export const updateCanauxProprietaire = async (
  proprietaireId: string,
  canaux: string[],
  modePaiement?: ModePaiement
) => {
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { email: true, telephone: true, canauxNotificationPayes: true },
  });

  if (!proprietaire) {
    throw new AppError("Compte introuvable", StatusCodes.NOT_FOUND);
  }

  if (!Array.isArray(canaux) || canaux.length === 0) {
    throw new AppError("Sélectionnez au moins un canal de notification", StatusCodes.BAD_REQUEST);
  }

  const canauxUniques = Array.from(new Set(canaux));
  const canauxInvalides = canauxUniques.filter((c) => !estCanalValide(c));
  if (canauxInvalides.length > 0) {
    throw new AppError(
      `Canal(aux) invalide(s) : ${canauxInvalides.join(", ")}`,
      StatusCodes.BAD_REQUEST
    );
  }
  const canauxValides = canauxUniques as CanalNotification[];

  if (canauxValides.includes("EMAIL") && !proprietaire.email) {
    throw new AppError(
      "Ajoutez un email à votre profil avant d'activer le canal Email.",
      StatusCodes.BAD_REQUEST
    );
  }

  let canauxNotificationPayes = proprietaire.canauxNotificationPayes;
  let transaction = null;

  if (canauxValides.length > 1 && !proprietaire.canauxNotificationPayes) {
    if (!modePaiement) {
      throw new AppError(
        `Le choix de plusieurs canaux nécessite un paiement unique de ${FRAIS_CANAUX_SUPPLEMENTAIRES} FCFA. Indiquez un moyen de paiement pour continuer.`,
        StatusCodes.PAYMENT_REQUIRED
      );
    }

    transaction = await prisma.transaction.create({
      data: {
        proprietaireId,
        type: "PAIEMENT_CANAUX_NOTIFICATION",
        statut: "CONFIRME",
        montant: FRAIS_CANAUX_SUPPLEMENTAIRES,
        devise: "XOF",
        modePaiement,
        provider: modePaiement,
        transactionId: generateTransactionId(),
        dateConfirmation: new Date(),
        instructions: "Paiement simulation - Déblocage canaux de notification multiples",
      },
    });

    canauxNotificationPayes = true;
  }

  const updated = await prisma.proprietaire.update({
    where: { id: proprietaireId },
    data: {
      canauxNotification: canauxValides,
      canauxNotificationPayes,
    },
    select: { canauxNotification: true, canauxNotificationPayes: true },
  });

  return {
    canaux: updated.canauxNotification,
    canauxPayes: updated.canauxNotificationPayes,
    transaction,
  };
};
