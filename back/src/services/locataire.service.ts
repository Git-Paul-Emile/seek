import { randomUUID } from "crypto";
import { StatusCodes } from "http-status-codes";
import { getFrontendBaseUrl } from "../config/external.js";
import { AppError } from "../utils/AppError.js";
import * as LocataireRepo from "../repositories/locataire.repository.js";
import { prisma } from "../config/database.js";
import * as CloudinaryService from "./cloudinary.service.js";
import { envoyerLienActivationLocataire } from "./notification.service.js";
import { envoyerNotification } from "./notification.service.js";

const FRONTEND_URL = getFrontendBaseUrl();
const TOKEN_EXPIRY_HOURS = 72;

// ─── Liste ────────────────────────────────────────────────────────────────────

export const getByProprietaire = async (proprietaireId: string) => {
  return LocataireRepo.findByProprietaire(proprietaireId);
};

// ─── Détail ───────────────────────────────────────────────────────────────────

export const getById = async (id: string, proprietaireId: string) => {
  // Accès autorisé si créateur OU si bail lié (locataire d'un autre proprio avec bail actif/passé)
  const locataire = await LocataireRepo.findById(id, proprietaireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable ou accès refusé", StatusCodes.NOT_FOUND);
  }
  return locataire;
};

// ─── Création ─────────────────────────────────────────────────────────────────

export const create = async (
  proprietaireId: string,
  data: {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string | null;
    nbOccupants?: number;
    presenceEnfants?: boolean;
  }
) => {
  const telephone = data.telephone.replace(/\s/g, "");

  const activationToken = randomUUID();
  const tokenExpiresAt = new Date(
    Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
  );

  const locataire = await LocataireRepo.create({
    proprietaireId,
    nom: data.nom.trim(),
    prenom: data.prenom.trim(),
    telephone,
    email: data.email?.trim() || null,
    nbOccupants: data.nbOccupants ?? 1,
    presenceEnfants: data.presenceEnfants ?? false,
    activationToken,
    tokenExpiresAt,
  });

  // Le lien d'activation est envoyé uniquement lors de l'association du locataire à un bien (validation du contrat)
  return locataire;
};

// ─── Modification (partie owner) ──────────────────────────────────────────────

export const updateOwner = async (
  id: string,
  proprietaireId: string,
  data: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    email?: string | null;
    nbOccupants?: number;
    presenceEnfants?: boolean;
  }
) => {
  const existing = await LocataireRepo.findById(id, proprietaireId);
  if (!existing) {
    throw new AppError("Locataire introuvable ou accès refusé", StatusCodes.NOT_FOUND);
  }

  const updateData: import("../repositories/locataire.repository.js").UpdateLocataireOwnerData = {};
  if (data.nom !== undefined) updateData.nom = data.nom.trim();
  if (data.prenom !== undefined) updateData.prenom = data.prenom.trim();
  if (data.telephone !== undefined)
    updateData.telephone = data.telephone.replace(/\s/g, "");
  if (data.email !== undefined)
    updateData.email = data.email?.trim() || null;
  if (data.nbOccupants !== undefined) updateData.nbOccupants = data.nbOccupants;
  if (data.presenceEnfants !== undefined)
    updateData.presenceEnfants = data.presenceEnfants;

  return LocataireRepo.update(id, updateData);
};

// ─── Suppression ──────────────────────────────────────────────────────────────

export const remove = async (id: string, proprietaireId: string) => {
  const locataire = await LocataireRepo.findById(id, proprietaireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable ou accès refusé", StatusCodes.NOT_FOUND);
  }

  const bailActif = locataire.bails?.find((b) =>
    ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT", "EN_ATTENTE"].includes(b.statut as string)
  );
  if (bailActif) {
    throw new AppError(
      "Ce locataire a un bail actif ou en cours. Terminez ou résiliez le bail avant de supprimer.",
      StatusCodes.CONFLICT
    );
  }

  // Vérifier si le locataire est associé à un logement actif
  const logementActif = locataire.bails?.find(
    (b) => b.bien && b.bien.actif === true
  );
  if (logementActif) {
    throw new AppError(
      "Ce locataire est associé à un logement actif. Vous ne pouvez pas supprimer ce compte.",
      StatusCodes.CONFLICT
    );
  }

  const verif = await prisma.locataireVerification.findUnique({
    where: { locataireId: id },
    select: { pieceIdentiteRecto: true, pieceIdentiteVerso: true, selfie: true },
  });
  if (verif) {
    await CloudinaryService.deleteUrls([verif.pieceIdentiteRecto, verif.pieceIdentiteVerso, verif.selfie]);
  }

  await LocataireRepo.remove(id);
};

// ─── Lien d'activation ────────────────────────────────────────────────────────

export const getLien = async (id: string, proprietaireId: string) => {
  const locataire = await LocataireRepo.findById(id, proprietaireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable ou accès refusé", StatusCodes.NOT_FOUND);
  }

  if (locataire.statut === "ACTIF") {
    return {
      lien: null,
      statut: locataire.statut,
      envoye: false,
    };
  }

  // Regénérer le token si expiré ou absent
  let token = locataire.activationToken;
  if (!token || (locataire.tokenExpiresAt && locataire.tokenExpiresAt < new Date())) {
    token = randomUUID();
    const tokenExpiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
    );
    await LocataireRepo.update(id, { activationToken: token, tokenExpiresAt });
  }

  const lien = `${FRONTEND_URL}/locataire/activer?token=${token}`;

  // Renvoi du lien par SMS uniquement en arrière-plan
  envoyerLienActivationLocataire({
    locataireTelephone: locataire.telephone,
    locataireNom:       `${locataire.prenom} ${locataire.nom}`,
    lien,
  }).catch((err) => console.error("[Locataire] Erreur renvoi lien activation :", err));

  return {
    // Le lien est retourné pour usage interne (ex: email contrat via contrat.service.ts)
    // mais n'est PAS exposé dans la réponse API du contrôleur locataire.
    lien,
    statut: locataire.statut,
    envoye: true,
  };
};

// ─── Validation de la vérification par le propriétaire ────────────────────────────

export const approveLocataireVerification = async (
  locataireId: string,
  proprietaireId: string
) => {
  // Vérifier que le locataire existe et appartient au propriétaire
  const locataire = await LocataireRepo.findById(locataireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  }
  if (locataire.proprietaireId !== proprietaireId) {
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  }

  // Vérifier qu'il y a une vérification en cours
  const verification = await LocataireRepo.getVerificationByLocataireId(locataireId);
  if (!verification) {
    throw new AppError(
      "Aucune demande de vérification trouvée pour ce locataire",
      StatusCodes.NOT_FOUND
    );
  }
  if (verification.statut !== "PENDING") {
    throw new AppError(
      "Cette demande de vérification n'est pas en attente",
      StatusCodes.BAD_REQUEST
    );
  }

  // Approuver la vérification
  const updated = await LocataireRepo.approveVerification(locataireId, proprietaireId);
  if (!updated) {
    throw new AppError("Erreur lors de l'approbation", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (locataire.telephone) {
    await envoyerNotification({
      type: "VERIFICATION_LOCATAIRE",
      target: "locataire",
      telephone: locataire.telephone,
      email: locataire.email,
      sujet: "Identité approuvée",
      contenu: "Votre vérification d'identité a été approuvée par votre propriétaire.",
      proprietaireId,
      locataireId,
      noSmsEmail: true,
    }).catch(() => null);
  }

  return updated;
};

export const rejectLocataireVerification = async (
  locataireId: string,
  proprietaireId: string,
  motifRejet: string
) => {
  // Vérifier que le locataire existe et appartient au propriétaire
  const locataire = await LocataireRepo.findById(locataireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  }
  if (locataire.proprietaireId !== proprietaireId) {
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  }

  if (!motifRejet || motifRejet.trim().length === 0) {
    throw new AppError("Le motif de rejet est obligatoire", StatusCodes.BAD_REQUEST);
  }

  // Vérifier qu'il y a une vérification en cours
  const verification = await LocataireRepo.getVerificationByLocataireId(locataireId);
  if (!verification) {
    throw new AppError(
      "Aucune demande de vérification trouvée pour ce locataire",
      StatusCodes.NOT_FOUND
    );
  }
  if (verification.statut !== "PENDING") {
    throw new AppError(
      "Cette demande de vérification n'est pas en attente",
      StatusCodes.BAD_REQUEST
    );
  }

  // Rejeter la vérification
  const updated = await LocataireRepo.rejectVerification(locataireId, proprietaireId, motifRejet);
  if (!updated) {
    throw new AppError("Erreur lors du rejet", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  if (locataire.telephone) {
    await envoyerNotification({
      type: "VERIFICATION_LOCATAIRE",
      target: "locataire",
      telephone: locataire.telephone,
      email: locataire.email,
      sujet: "Identité rejetée",
      contenu: `Votre vérification d'identité a été rejetée. Motif du rejet : ${motifRejet}`,
      proprietaireId,
      locataireId,
      noSmsEmail: true,
    }).catch(() => null);
  }

  return updated;
};

// ─── Recherche globale par téléphone/email ────────────────────────────────────

export const searchByContact = async (
  proprietaireId: string,
  params: { telephone?: string; email?: string }
) => {
  const locataire = await LocataireRepo.searchByContact(params);
  if (!locataire) return { found: false, locataire: null };

  // Vérifier si ce locataire est déjà dans la liste de CE propriétaire
  let estDansMaListe = locataire.proprietaireId === proprietaireId;
  if (!estDansMaListe) {
    const bailCommun = await prisma.bailLocation.findFirst({
      where: { locataireId: locataire.id, proprietaireId },
    });
    estDansMaListe = !!bailCommun;
  }

  return {
    found: true,
    locataire: {
      id: locataire.id,
      nom: locataire.nom,
      prenom: locataire.prenom,
      telephone: locataire.telephone,
      statut: locataire.statut,
      estDansMaListe,
    },
  };
};

// ─── Nombre de vérifications en attente ─────────────────────────────────────

export const getPendingVerificationsCount = async (proprietaireId: string) => {
  return LocataireRepo.getPendingVerificationsCount(proprietaireId);
};
