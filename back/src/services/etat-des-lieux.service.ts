import { StatusCodes } from "http-status-codes";
import { getFrontendBaseUrl } from "../config/external.js";
import { AppError } from "../utils/AppError.js";
import * as EtatDesLieuxRepo from "../repositories/etat-des-lieux.repository.js";
import { prisma } from "../config/database.js";
import * as SmsService from "./sms.service.js";
import { envoyerNotification } from "./notification.service.js";

const FRONTEND_URL = getFrontendBaseUrl();

const SORTIE_EDL_BLOCK_MESSAGE =
  "Impossible de faire un état des lieux de sortie sans préavis, fin de bail ou résiliation.";

const canCreateSortieEtatDesLieux = (bail: { statut?: string | null; dateFinBail?: Date | string | null }) => {
  if (["EN_PREAVIS", "TERMINE", "RESILIE"].includes(String(bail.statut ?? ""))) {
    return true;
  }
  if (!bail.dateFinBail) {
    return false;
  }
  const dateFinBail = new Date(bail.dateFinBail);
  return !Number.isNaN(dateFinBail.getTime()) && dateFinBail <= new Date();
};

const assertCanCreateSortieEtatDesLieux = (
  bail: { statut?: string | null; dateFinBail?: Date | string | null },
  type: "ENTREE" | "SORTIE"
) => {
  if (type === "SORTIE" && !canCreateSortieEtatDesLieux(bail)) {
    throw new AppError(SORTIE_EDL_BLOCK_MESSAGE, StatusCodes.BAD_REQUEST);
  }
};

export const createEtatDesLieux = async (proprietaireId: string, data: any) => {
  const bail = await prisma.bailLocation.findUnique({
    where: { id: data.bailId },
  });

  if (!bail) {
    throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  }

  if (bail.proprietaireId !== proprietaireId) {
    throw new AppError("Vous n'êtes pas le propriétaire de ce bail", StatusCodes.FORBIDDEN);
  }

  assertCanCreateSortieEtatDesLieux(bail, data.type);

  // Vérifier si un état des lieux de ce type existe déjà pour ce bail
  const existingId = await EtatDesLieuxRepo.findByBailAndType(data.bailId, data.type);
  if (existingId) {
    throw new AppError(`Un état des lieux ${data.type} existe déjà pour ce bail`, StatusCodes.CONFLICT);
  }

  const payload = {
    ...data,
    bienId: bail.bienId,
    proprietaireId: bail.proprietaireId,
    locataireId: bail.locataireId,
  };

  return EtatDesLieuxRepo.create(payload);
};

export const updateEtatDesLieux = async (id: string, proprietaireId: string, data: any) => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);
  if (edl.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (edl.statut !== "BROUILLON" && edl.statut !== "CONTESTE") {
    throw new AppError("Vous ne pouvez modifier que les états des lieux en brouillon ou contestés", StatusCodes.BAD_REQUEST);
  }

  return EtatDesLieuxRepo.updateBrouillon(id, data);
};

export const getEtatDesLieuxList = async (bailId: string, userId: string, role: "PROPRIETAIRE" | "LOCATAIRE") => {
  const bail = await prisma.bailLocation.findUnique({ where: { id: bailId } });
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);

  if (role === "PROPRIETAIRE" && bail.proprietaireId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (role === "LOCATAIRE" && bail.locataireId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  return EtatDesLieuxRepo.findAllByBail(bailId);
};

export const getEtatDesLieuxById = async (id: string, userId: string, role: "PROPRIETAIRE" | "LOCATAIRE") => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);

  if (role === "PROPRIETAIRE" && edl.proprietaireId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (role === "LOCATAIRE" && edl.locataireId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  return edl;
};

export const submitForValidation = async (id: string, proprietaireId: string) => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);
  if (edl.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  
  if (edl.statut !== "BROUILLON" && edl.statut !== "CONTESTE") {
    throw new AppError("L'état des lieux doit être en brouillon ou contesté", StatusCodes.BAD_REQUEST);
  }

  const updated = await EtatDesLieuxRepo.updateStatus(id, "EN_ATTENTE_VALIDATION");

  // Notifier le locataire
  if (edl.locataire?.telephone) {
    const lien = `${FRONTEND_URL}/locataire/etats-des-lieux/${updated.id}`;
    const bienLabel = edl.bien?.titre || edl.bien?.ville || "votre bien";
    const msg = `Bonjour ${edl.locataire.prenom}, l'état des lieux d'${edl.type.toLowerCase()} pour ${bienLabel} est prêt. Consultez-le et validez-le ici : ${lien}`;
    await SmsService.sendSms(edl.locataire.telephone, msg).catch(e => console.error("Erreur SMS", e));
    await envoyerNotification({
      type: "ETAT_DES_LIEUX_DISPONIBLE",
      target: "locataire",
      telephone: edl.locataire.telephone,
      email: edl.locataire.email,
      sujet: "État des lieux à valider",
      contenu: msg,
      bailId: edl.bailId,
      bienId: edl.bienId,
      proprietaireId: edl.proprietaireId,
      locataireId: edl.locataireId,
      noSmsEmail: true,
    }).catch(() => null);
  }

  return updated;
};

export const deleteEtatDesLieux = async (id: string, proprietaireId: string) => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);
  if (edl.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (edl.statut !== "BROUILLON") {
    throw new AppError("Seul un brouillon peut être supprimé", StatusCodes.BAD_REQUEST);
  }
  await EtatDesLieuxRepo.deleteById(id);
};

export const contesterElementsLocataire = async (
  id: string,
  locataireId: string,
  elements: { elementId: string; motifContestation: string; photoContestation: string }[]
) => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);
  if (edl.locataireId !== locataireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  if (edl.statut !== "EN_ATTENTE_VALIDATION") {
    throw new AppError("L'état des lieux n'est pas en attente de validation", StatusCodes.BAD_REQUEST);
  }

  const updated = await EtatDesLieuxRepo.contesterElements(id, elements);

  if (edl.proprietaire?.telephone) {
    const lien = `${FRONTEND_URL}/owner/etats-des-lieux/${updated!.id}`;
    const bienLabel = edl.bien?.titre || edl.bien?.ville || "le bien";
    const msg = `Bonjour ${edl.proprietaire.prenom}, votre locataire a contesté l'état des lieux d'${edl.type.toLowerCase()} pour ${bienLabel}. Consultez les remarques ici : ${lien}`;
    await SmsService.sendSms(edl.proprietaire.telephone, msg).catch((e) => console.error("Erreur SMS", e));
    await envoyerNotification({
      type: "ETAT_DES_LIEUX_MODIFIE",
      target: "owner",
      telephone: edl.proprietaire.telephone,
      email: edl.proprietaire.email,
      sujet: "État des lieux contesté",
      contenu: msg,
      bailId: edl.bailId,
      bienId: edl.bienId,
      proprietaireId: edl.proprietaireId,
      locataireId: edl.locataireId,
      noSmsEmail: true,
    }).catch(() => null);
  }

  return updated;
};

export const resoudreContestationsProprietaire = async (
  id: string,
  proprietaireId: string,
  resolutions: {
    elementId: string;
    decision: "RECTIFIER" | "ACCEPTER_RESERVE" | "REFUSER";
    etat?: "NEUF" | "BON" | "USAGE" | "MAUVAIS" | "DEGRADE";
    commentaire?: string;
    photos?: string[];
  }[]
) => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);
  if (edl.proprietaireId !== proprietaireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  if (edl.statut !== "CONTESTE") {
    throw new AppError("L'état des lieux n'est pas en cours de contestation", StatusCodes.BAD_REQUEST);
  }

  const updated = await EtatDesLieuxRepo.resoudreContestations(id, resolutions);

  if (edl.locataire?.telephone) {
    const lien = `${FRONTEND_URL}/locataire/etats-des-lieux/${updated.id}`;
    const bienLabel = edl.bien?.titre || edl.bien?.ville || "votre logement";
    let msg = "";
    if ((updated.statut as string) === "EN_LITIGE") {
      msg = `Bonjour ${edl.locataire.prenom}, le propriétaire a refusé certaines contestations sur l'état des lieux de ${bienLabel}. Le dossier est maintenant en litige. Voir le détail ici : ${lien}`;
    } else {
      msg = `Bonjour ${edl.locataire.prenom}, le propriétaire a répondu à vos contestations sur l'état des lieux de ${bienLabel}. Vous pouvez le consulter et le valider ici : ${lien}`;
    }
    await SmsService.sendSms(edl.locataire.telephone, msg).catch((e) => console.error("Erreur SMS", e));
    await envoyerNotification({
      type: "ETAT_DES_LIEUX_MODIFIE",
      target: "locataire",
      telephone: edl.locataire.telephone,
      email: edl.locataire.email,
      sujet: (updated.statut as string) === "EN_LITIGE" ? "État des lieux en litige" : "État des lieux mis à jour",
      contenu: msg,
      bailId: edl.bailId,
      bienId: edl.bienId,
      proprietaireId: edl.proprietaireId,
      locataireId: edl.locataireId,
      noSmsEmail: true,
    }).catch(() => null);
  }

  return updated;
};

export const validerEtatDesLieux = async (id: string, locataireId: string, documentPdfUrl?: string) => {
  const edl = await EtatDesLieuxRepo.findById(id);
  if (!edl) throw new AppError("État des lieux introuvable", StatusCodes.NOT_FOUND);
  if (edl.locataireId !== locataireId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  if (edl.statut !== "EN_ATTENTE_VALIDATION") {
    throw new AppError("L'état des lieux n'est pas en attente de validation", StatusCodes.BAD_REQUEST);
  }

  const updated = await EtatDesLieuxRepo.updateStatus(id, "VALIDE", documentPdfUrl);

  // Notifier le propriétaire
  if (edl.proprietaire?.telephone) {
    const lien = `${FRONTEND_URL}/owner/etats-des-lieux/${updated.id}`;
    const bienLabel = edl.bien?.titre || edl.bien?.ville || "le bien";
    const msg = `Bonjour ${edl.proprietaire.prenom}, l'état des lieux d'${edl.type.toLowerCase()} pour ${bienLabel} a été validé par votre locataire. Consultez le document ici : ${lien}`;
    await SmsService.sendSms(edl.proprietaire.telephone, msg).catch(e => console.error("Erreur SMS", e));
    await envoyerNotification({
      type: "ETAT_DES_LIEUX_VALIDE",
      target: "owner",
      telephone: edl.proprietaire.telephone,
      email: edl.proprietaire.email,
      sujet: "État des lieux validé",
      contenu: msg,
      bailId: edl.bailId,
      bienId: edl.bienId,
      proprietaireId: edl.proprietaireId,
      locataireId: edl.locataireId,
      noSmsEmail: true,
    }).catch(() => null);
  }

  return updated;
};

export const getAllEtatsDesLieuxLocataire = async (locataireId: string) => {
  return EtatDesLieuxRepo.findAllByLocataire(locataireId);
};

export const getComparison = async (bailId: string, userId: string, role: "PROPRIETAIRE" | "LOCATAIRE") => {
  const bail = await prisma.bailLocation.findUnique({ where: { id: bailId } });
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);

  if (role === "PROPRIETAIRE" && bail.proprietaireId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (role === "LOCATAIRE" && bail.locataireId !== userId) throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  const entree = await EtatDesLieuxRepo.findByBailAndType(bailId, "ENTREE");
  const sortie = await EtatDesLieuxRepo.findByBailAndType(bailId, "SORTIE");

  return { entree, sortie };
};

export const getOwnerCreationContext = async (bailId: string, proprietaireId: string) => {
  const bail = await prisma.bailLocation.findUnique({
    where: { id: bailId },
    select: {
      id: true,
      proprietaireId: true,
      statut: true,
      dateFinBail: true,
    },
  });

  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.proprietaireId !== proprietaireId) throw new AppError("AccÃ¨s refusÃ©", StatusCodes.FORBIDDEN);

  const canCreateSortie = canCreateSortieEtatDesLieux(bail);

  return {
    bailId: bail.id,
    statut: bail.statut,
    dateFinBail: bail.dateFinBail,
    canCreateSortie,
    sortieBlockReason: canCreateSortie ? null : SORTIE_EDL_BLOCK_MESSAGE,
  };
};
