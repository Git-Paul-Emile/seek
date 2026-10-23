import { randomUUID } from "crypto";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";
import { getFrontendBaseUrl } from "../config/external.js";
import * as InvitationRepo from "../repositories/bailInvitation.repository.js";
import * as BailRepo from "../repositories/bail.repository.js";
import { envoyerNotification } from "./notification.service.js";
import { StatutBailInvitation } from "../generated/prisma/enums.js";

const FRONTEND_URL = getFrontendBaseUrl();
const INVITATION_EXPIRY_HOURS = 72;

// ─── Créer une invitation ─────────────────────────────────────────────────────

export const creerInvitation = async (
  proprietaireId: string,
  data: {
    bienId: string;
    locataireId: string;
    typeBail?: string | null;
    dateDebutBail: string;
    dateFinBail?: string | null;
    montantLoyer: number;
    montantCaution?: number | null;
    cautionVersee?: boolean;
    jourLimitePaiement?: number | null;
    renouvellement?: boolean;
    frequencePaiement?: string | null;
  }
) => {
  // Vérifier que le bien appartient au propriétaire
  const bien = await prisma.bien.findUnique({
    where: { id: data.bienId },
    select: { proprietaireId: true, titre: true, ville: true, adresse: true },
  });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId)
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);

  // Vérifier que le locataire existe
  const locataire = await prisma.locataire.findUnique({
    where: { id: data.locataireId },
    select: { id: true, nom: true, prenom: true, telephone: true, email: true, statut: true },
  });
  if (!locataire) throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);

  // Vérifier qu'il n'y a pas déjà un bail actif sur ce bien
  const bailExistant = await BailRepo.findActifByBien(data.bienId);
  if (bailExistant)
    throw new AppError(
      "Ce bien a déjà un bail actif. Terminez-le avant d'en créer un nouveau.",
      StatusCodes.CONFLICT
    );

  // Vérifier qu'il n'y a pas déjà une invitation en attente pour ce locataire + bien
  const invExistante = await InvitationRepo.findPendingByBienAndLocataire(
    data.bienId,
    data.locataireId
  );
  if (invExistante)
    throw new AppError(
      "Une invitation est déjà en attente pour ce locataire sur ce bien.",
      StatusCodes.CONFLICT
    );

  const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);

  const invitation = await InvitationRepo.create({
    bienId: data.bienId,
    locataireId: data.locataireId,
    proprietaireId,
    typeBail: data.typeBail,
    dateDebutBail: new Date(data.dateDebutBail),
    dateFinBail: data.dateFinBail ? new Date(data.dateFinBail) : null,
    montantLoyer: data.montantLoyer,
    montantCaution: data.montantCaution,
    cautionVersee: data.cautionVersee ?? false,
    jourLimitePaiement: data.jourLimitePaiement,
    renouvellement: data.renouvellement ?? true,
    frequencePaiement: data.frequencePaiement,
    expiresAt,
  });

  // Notifier le locataire
  const bienLabel = bien.titre || bien.adresse || bien.ville || "un bien";
  const lien = `${FRONTEND_URL}/locataire/dashboard`;
  const contenu =
    `Un propriétaire vous a envoyé une invitation de bail pour ${bienLabel}. ` +
    `Connectez-vous à votre espace locataire pour accepter ou refuser. - SEEK Immobilier`;
  const htmlEmail = `
    <p>Bonjour ${locataire.prenom} ${locataire.nom},</p>
    <p>Un propriétaire vous a envoyé une <strong>invitation de bail</strong> pour <strong>${bienLabel}</strong>.</p>
    <p>Connectez-vous à votre espace locataire pour accepter ou refuser cette invitation.</p>
    <p><a href="${lien}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Voir l'invitation</a></p>
    <p><small>Cette invitation expire dans 72 heures.</small></p>
  `;

  envoyerNotification({
    type: "INVITATION_BAIL",
    telephone: locataire.telephone,
    email: locataire.email,
    sujet: "Invitation de bail SEEK",
    contenu,
    htmlEmail,
    locataireId: locataire.id,
    proprietaireId,
  }).catch((err) => console.error("[BailInvitation] Erreur envoi notif :", err));

  return invitation;
};

// ─── Lister les invitations d'un locataire ───────────────────────────────────

export const getInvitationsByLocataire = async (locataireId: string) => {
  await InvitationRepo.expireOldInvitations();
  return InvitationRepo.findByLocataireId(locataireId);
};

// ─── Accepter une invitation ─────────────────────────────────────────────────

export const accepterInvitation = async (token: string, locataireId: string) => {
  const invitation = await InvitationRepo.findByToken(token);
  if (!invitation) throw new AppError("Invitation introuvable", StatusCodes.NOT_FOUND);
  if (invitation.locataireId !== locataireId)
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (invitation.statut !== StatutBailInvitation.PENDING)
    throw new AppError("Cette invitation n'est plus en attente", StatusCodes.BAD_REQUEST);
  if (invitation.expiresAt < new Date()) {
    await InvitationRepo.updateStatut(invitation.id, StatutBailInvitation.EXPIREE);
    throw new AppError("Cette invitation a expiré", StatusCodes.GONE);
  }

  // Vérifier qu'il n'y a pas déjà un bail actif sur ce bien
  const bailExistant = await BailRepo.findActifByBien(invitation.bienId);
  if (bailExistant)
    throw new AppError(
      "Ce bien a déjà un bail actif.",
      StatusCodes.CONFLICT
    );

  // Créer le bail (bypass du check proprietaireId sur le locataire)
  const bail = await BailRepo.create({
    bienId: invitation.bienId,
    locataireId: invitation.locataireId,
    proprietaireId: invitation.proprietaireId,
    typeBail: invitation.typeBail,
    dateDebutBail: invitation.dateDebutBail,
    dateFinBail: invitation.dateFinBail,
    renouvellement: invitation.renouvellement,
    montantLoyer: invitation.montantLoyer,
    montantCaution: invitation.montantCaution,
    cautionVersee: invitation.cautionVersee,
    jourLimitePaiement: invitation.jourLimitePaiement,
    frequencePaiement: invitation.frequencePaiement,
  });

  // Marquer l'invitation comme acceptée
  await InvitationRepo.updateStatut(invitation.id, StatutBailInvitation.ACCEPTEE);

  // Notifier le propriétaire via MessageInterne
  await prisma.messageInterne.create({
    data: {
      proprietaireId: invitation.proprietaireId,
      bailId: bail.id,
      bienId: invitation.bienId,
      type: "INVITATION_ACCEPTEE",
      titre: "Invitation de bail acceptée",
      corps: `${invitation.locataire?.prenom} ${invitation.locataire?.nom} a accepté votre invitation de bail.`,
    },
  });

  return bail;
};

// ─── Refuser une invitation ───────────────────────────────────────────────────

export const refuserInvitation = async (token: string, locataireId: string) => {
  const invitation = await InvitationRepo.findByToken(token);
  if (!invitation) throw new AppError("Invitation introuvable", StatusCodes.NOT_FOUND);
  if (invitation.locataireId !== locataireId)
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  if (invitation.statut !== StatutBailInvitation.PENDING)
    throw new AppError("Cette invitation n'est plus en attente", StatusCodes.BAD_REQUEST);

  await InvitationRepo.updateStatut(invitation.id, StatutBailInvitation.REFUSEE);

  // Notifier le propriétaire via MessageInterne
  await prisma.messageInterne.create({
    data: {
      proprietaireId: invitation.proprietaireId,
      bailId: null,
      bienId: invitation.bienId,
      type: "INVITATION_REFUSEE",
      titre: "Invitation de bail refusée",
      corps: `${invitation.locataire?.prenom} ${invitation.locataire?.nom} a refusé votre invitation de bail.`,
    },
  });

  return { message: "Invitation refusée" };
};
