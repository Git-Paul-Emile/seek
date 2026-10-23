import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as SignalementRepo from "../repositories/signalement.repository.js";
import * as SuspenionService from "./suspension.service.js";
import * as SmsService from "./sms.service.js";
import { Prisma } from "../generated/prisma/client.js";
import { emitSignalementNew, emitSignalementUpdated, emitBienUpdated } from "./socket.service.js";

// -- Récupérer liste
export const getSignalements = async (filter?: { statut?: string; search?: string }) => {
  return SignalementRepo.findSignalements(filter);
};

// -- Récupérer by ID
export const getSignalementById = async (id: string) => {
  const signalement = await SignalementRepo.findById(id);
  if (!signalement) {
    throw new AppError("Signalement introuvable", StatusCodes.NOT_FOUND);
  }
  return signalement;
};

// -- Créer (Public)
export const createSignalement = async (data: Prisma.SignalementUncheckedCreateInput) => {
  // Vérification Anti-Abus
  const existing = await SignalementRepo.getExisting(
    data.bienId,
    data.comptePublicId ?? undefined,
    data.telephone
  );

  if (existing) {
    throw new AppError("Vous avez déjà signalé cette annonce", StatusCodes.CONFLICT);
  }

  const signalement = await SignalementRepo.create(data);

  // Todo: Envoi Email à l'équipe admin (Si NotifQueueService existant)
  console.log(`[Admin Alert] Nouveau signalement #${signalement.id} pour le bien ${signalement.bienId}`);
  emitSignalementNew(signalement.bienId);

  return signalement;
};

// -- Valider (Admin)
export const validerSignalement = async (id: string, adminId: string) => {
  const signalement = await SignalementRepo.findById(id);
  if (!signalement) {
    throw new AppError("Signalement introuvable", StatusCodes.NOT_FOUND);
  }

  if (signalement.statut !== "EN_ATTENTE") {
    throw new AppError(`Ce signalement est déjà traité (${signalement.statut})`, StatusCodes.BAD_REQUEST);
  }

  const bien = signalement.bien;
  if (!bien || !bien.proprietaire) {
    throw new AppError("Le bien de ce signalement est introuvable ou n'a pas de propriétaire", StatusCodes.NOT_FOUND);
  }

  // Effectuer la transaction
  const result = await SignalementRepo.valider(
    id,
    adminId,
    bien.id,
    bien.proprietaire.id
  );

  // SMS Propriétaire
  const propPhone = bien.proprietaire.telephone;
  const avertissementSms = `Bonjour ${bien.proprietaire.prenom}. Votre annonce a été supprimée suite à un signalement avéré de la communauté. Attention: au bout de 3 signalements validés, votre compte sera suspendu ${SuspenionService.DUREE_SUSPENSION_AUTO_JOURS} jours. L'équipe Seek.`;
  await SmsService.sendSms(propPhone, avertissementSms);

  // SMS Signaleur
  const repPhone = signalement.telephone;
  const merciSms = `Bonjour ${signalement.nom}. Merci pour votre vigilance ! L'annonce signalée a bien été retirée grâce à vous. L'équipe Seek.`;
  await SmsService.sendSms(repPhone, merciSms);

  // Règle métier : suspension automatique du propriétaire après 3 signalements validés,
  // pour une durée fixe (cf. SuspenionService.DUREE_SUSPENSION_AUTO_JOURS). La suspension
  // se lève d'elle-même à l'échéance, ou plus tôt si un admin réactive le compte manuellement
  // — dans les deux cas, nbSignalementsValides repart à 0 pour ne pas re-suspendre le compte
  // au premier signalement suivant.
  if (result.proprietaire.nbSignalementsValides >= 3 && !result.proprietaire.estSuspendu) {
    try {
      await SuspenionService.suspendreProprietaire(
        result.proprietaire.id,
        {
          motif: `Suspension automatique : ${result.proprietaire.nbSignalementsValides} signalements validés`,
          dureeJours: SuspenionService.DUREE_SUSPENSION_AUTO_JOURS,
        },
        adminId,
        true // masquerAnnonces = true
      );
      console.log(`[Suspension Auto] Propriétaire ${result.proprietaire.id} suspendu (>= 3 signalements).`);
    } catch (e) {
      console.error("Erreur lors de la suspension automatique:", e);
    }
  }

  // Émettre mise à jour temps réel — le bien est supprimé, les listes owner/admin se rafraîchissent
  emitSignalementUpdated(bien.id, bien.proprietaire.id);
  emitBienUpdated(bien.proprietaire.id, bien.id);

  return result.signalement;
};

// -- Rejeter (Admin)
export const rejeterSignalement = async (id: string, adminId: string) => {
  const signalement = await SignalementRepo.findById(id);
  if (!signalement) {
    throw new AppError("Signalement introuvable", StatusCodes.NOT_FOUND);
  }

  if (signalement.statut !== "EN_ATTENTE") {
    throw new AppError(`Ce signalement est déjà traité (${signalement.statut})`, StatusCodes.BAD_REQUEST);
  }

  const result = await SignalementRepo.rejeter(id, adminId);
  emitSignalementUpdated(signalement.bienId);
  return result;
};
