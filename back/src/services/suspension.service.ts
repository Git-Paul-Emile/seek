import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";
import * as SuspensionRepo from "../repositories/suspension.repository.js";
import * as OwnerRepo from "../repositories/owner.repository.js";
import * as LocataireRepo from "../repositories/locataire.repository.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SuspensionData {
  motif: string;
  masquerAnnonces?: boolean;
  /** Durée de la suspension en jours. Absent = suspension indéfinie (jusqu'à réactivation par un admin). */
  dureeJours?: number;
}

export interface ResultatSuspension {
  id: string;
  type: "PROPRIETAIRE" | "LOCATAIRE";
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: Date | null;
  dateFinSuspension?: Date | null;
  suspenduPar: string | null;
  annoncesMasquees?: number;
}

// Durée de la suspension automatique déclenchée par 3 signalements validés.
export const DUREE_SUSPENSION_AUTO_JOURS = 30;

// ─── Types pour les listings ───────────────────────────────────────────────

export interface ProprietaireListItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: Date | null;
  dateFinSuspension: Date | null;
  suspenduPar: string | null;
  createdAt: Date;
}

export interface LocataireListItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: Date | null;
  suspenduPar: string | null;
  createdAt: Date;
}

export interface ProprietaireDetails extends ProprietaireListItem {
  updatedAt: Date;
}

export interface LocataireDetails extends LocataireListItem {
  updatedAt: Date;
}

// ─── Liste des propriétaires ───────────────────────────────────────────────

export const getProprietaires = async (filter?: {
  estSuspendu?: boolean;
  search?: string;
}): Promise<ProprietaireListItem[]> => {
  return SuspensionRepo.getProprietaires(filter);
};

export const getProprietaireById = async (
  id: string
): Promise<ProprietaireDetails | null> => {
  return SuspensionRepo.getProprietaireById(id);
};

// ─── Liste des locataires ──────────────────────────────────────────────────

export const getLocataires = async (filter?: {
  estSuspendu?: boolean;
  search?: string;
}): Promise<LocataireListItem[]> => {
  return SuspensionRepo.getLocataires(filter);
};

export const getLocataireById = async (
  id: string
): Promise<LocataireDetails | null> => {
  return SuspensionRepo.getLocataireById(id);
};

// ─── Supprimer un propriétaire ───────────────────────────────────────────────

export const supprimerProprietaire = async (id: string): Promise<void> => {
  const proprietaire = await OwnerRepo.findById(id);
  if (!proprietaire) {
    throw new AppError("Propriétaire introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérifier si le propriétaire a des biens actifs (annonces en ligne)
  const hasBiensActifs = await SuspensionRepo.hasBiensActifs(id);
  if (hasBiensActifs) {
    throw new AppError(
      "Ce propriétaire a des annonces actives. Désactivez les annonces avant de supprimer ce compte.",
      StatusCodes.CONFLICT
    );
  }

  // Vérifier si le propriétaire a des baux actifs (locataires associés)
  const hasBauxActifs = await SuspensionRepo.hasBauxActifs(id);
  if (hasBauxActifs) {
    throw new AppError(
      "Ce propriétaire a des locataires actifs (baux actifs). Utilisez la suspension au lieu de la suppression pour conserver l'historique.",
      StatusCodes.CONFLICT
    );
  }

  // Vérifier si le propriétaire a des paiements de mise en avant
  const hasPaiements = await SuspensionRepo.hasPaiementsPromotion(id);
  if (hasPaiements) {
    throw new AppError(
      "Ce propriétaire a des historiques de paiement (mises en avant). Pour des raisons comptables, les données doivent être conservées. Utilisez la suspension au lieu de la suppression.",
      StatusCodes.CONFLICT
    );
  }

  await SuspensionRepo.supprimerProprietaire(id);
};

// ─── Supprimer un locataire ─────────────────────────────────────────────────

export const supprimerLocataire = async (id: string): Promise<void> => {
  const locataire = await LocataireRepo.findById(id);
  if (!locataire) {
    throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérifier si le locataire a un bail actif
  const bailActif = locataire.bails?.find((b) => b.statut === "ACTIF");
  if (bailActif) {
    throw new AppError(
      "Ce locataire a un bail actif. Vous ne pouvez pas supprimer ce compte.",
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

  await SuspensionRepo.supprimerLocataire(id);
};

// ─── Types pour les détails avec logement ───────────────────────────────────

export interface ProprietaireWithBiens {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: Date | null;
  dateFinSuspension: Date | null;
  suspenduPar: string | null;
  createdAt: Date;
  updatedAt: Date;
  biens: {
    id: string;
    titre: string | null;
    pays: string | null;
    region: string | null;
    ville: string | null;
    quartier: string | null;
    adresse: string | null;
    prix: number | null;
    surface: number | null;
    nbChambres: number | null;
    nbSdb: number | null;
    nbPieces: number | null;
    typeLogement: string | null;
    typeTransaction: string | null;
    statutAnnonce: string | null;
    statutBien: string | null;
    statut: string | null;
    actif: boolean;
  }[];
}

export interface ProprietaireInfo {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
}

export interface PaysInfo {
  id: string;
  nom: string;
  code: string;
}

export interface VilleInfo {
  id: string;
  nom: string;
  pays: PaysInfo;
}

export interface QuartierInfo {
  id: string;
  nom: string;
  ville: VilleInfo;
}

export interface TypeLogementInfo {
  id: string;
  nom: string;
}

export interface TypeTransactionInfo {
  id: string;
  nom: string;
}

export interface StatutBienInfo {
  id: string;
  nom: string;
}

export interface ModeleContratInfo {
  id: string;
  titre: string;
}

export interface BienInfo {
  id: string;
  titre: string | null;
  description: string | null;
  pays: string | null;
  region: string | null;
  ville: string | null;
  quartier: string | null;
  adresse: string | null;
  surface: number | null;
  nbChambres: number | null;
  nbSdb: number | null;
  nbPieces: number | null;
  etage: number | null;
  actif: boolean;
  quartierRel: QuartierInfo | null;
  typeLogement: TypeLogementInfo | null;
  typeTransaction: TypeTransactionInfo | null;
  statutBien: StatutBienInfo | null;
}

export interface ContratInfo {
  id: string;
  titre: string | null;
  contenu: string | null;
  statut: string;
  createdAt: Date;
  updatedAt: Date;
  modele: ModeleContratInfo | null;
}

export interface BailWithDetails {
  id: string;
  typeBail: string | null;
  statut: string;
  dateDebutBail: Date | null;
  dateFinBail: Date | null;
  montantLoyer: number | null;
  montantCaution: number | null;
  cautionVersee: boolean | null;
  frequencePaiement: string | null;
  createdAt: Date;
  updatedAt: Date;
  bien: BienInfo | null;
  proprietaire: ProprietaireInfo;
  contrat: ContratInfo | null;
}

export interface LocataireWithBails {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: Date | null;
  suspenduPar: string | null;
  createdAt: Date;
  updatedAt: Date;
  proprietaire: ProprietaireInfo;
  bails: BailWithDetails[];
}

// ─── Détails d'un propriétaire avec ses biens ────────────────────────────────

export const getProprietaireWithBiens = async (
  id: string
): Promise<ProprietaireWithBiens | null> => {
  const proprietaire = await SuspensionRepo.getProprietaireWithBiens(id);
  if (!proprietaire) return null;

  const biens = proprietaire.biens.map((bien) => ({
    id: bien.id,
    titre: bien.titre,
    pays: bien.pays,
    region: bien.region,
    ville: bien.ville,
    quartier: bien.quartier,
    adresse: bien.adresse,
    prix: bien.prix,
    surface: bien.surface,
    nbChambres: bien.nbChambres,
    nbSdb: bien.nbSdb,
    nbPieces: bien.nbPieces,
    typeLogement: bien.typeLogement?.nom ?? null,
    typeTransaction: bien.typeTransaction?.nom ?? null,
    statutAnnonce: bien.statutAnnonce ?? null,
    statutBien: bien.statutBien?.nom ?? null,
    // Maintient la compatibilite API historique: "statut" texte affiche dans l'admin
    statut: bien.statutBien?.nom ?? bien.statutAnnonce ?? null,
    actif: bien.actif,
  }));

  return {
    ...proprietaire,
    biens,
  };
};

// ─── Détails d'un locataire avec ses baux ─────────────────────────────────────
export const getLocataireWithBails = async (
  id: string
): Promise<LocataireWithBails | null> => {
  return SuspensionRepo.getLocataireWithBails(id);
};

// ─── Suspersion Propriétaire ─────────────────────────────────────────────────

export const suspendreProprietaire = async (
  proprietaireId: string,
  data: SuspensionData,
  adminId: string,
  masquerAnnonces: boolean = true
): Promise<ResultatSuspension> => {
  // Vérifier que le propriétaire existe
  const proprietaire = await OwnerRepo.findById(proprietaireId);
  if (!proprietaire) {
    throw new AppError("Propriétaire introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérifier si déjà suspendu
  if (proprietaire.estSuspendu) {
    throw new AppError("Ce compte est déjà suspendu", StatusCodes.CONFLICT);
  }

  // Suspendre le propriétaire
  const dateFinSuspension = data.dureeJours
    ? new Date(Date.now() + data.dureeJours * 24 * 60 * 60 * 1000)
    : null;
  await SuspensionRepo.suspendreProprietaire(proprietaireId, data.motif, adminId, dateFinSuspension);

  // Masquer les annonces si demandé
  let annoncesMasquees = 0;
  if (masquerAnnonces) {
    const result = await SuspensionRepo.masquerAnnoncesProprietaire(proprietaireId);
    annoncesMasquees = result.count;
  }

  return {
    id: proprietaireId,
    type: "PROPRIETAIRE",
    estSuspendu: true,
    motifSuspension: data.motif,
    dateSuspension: new Date(),
    dateFinSuspension,
    suspenduPar: adminId,
    annoncesMasquees,
  };
};

export const reactiverProprietaire = async (
  proprietaireId: string,
  afficherAnnonces: boolean = true
): Promise<ResultatSuspension> => {
  // Vérifier que le propriétaire existe
  const proprietaire = await OwnerRepo.findById(proprietaireId);
  if (!proprietaire) {
    throw new AppError("Propriétaire introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérifier si pas suspendu
  if (!proprietaire.estSuspendu) {
    throw new AppError("Ce compte n'est pas suspendu", StatusCodes.CONFLICT);
  }

  // Réactiver le propriétaire
  await SuspensionRepo.reactiverProprietaire(proprietaireId);

  // Réafficher les annonces si demandé
  let annoncesMasquees = 0;
  if (afficherAnnonces) {
    const result = await SuspensionRepo.afficherAnnoncesProprietaire(proprietaireId);
    annoncesMasquees = result.count;
  }

  return {
    id: proprietaireId,
    type: "PROPRIETAIRE",
    estSuspendu: false,
    motifSuspension: null,
    dateSuspension: null,
    suspenduPar: null,
    annoncesMasquees,
  };
};

export const getStatutSuspensionProprietaire = async (
  proprietaireId: string
): Promise<ResultatSuspension | null> => {
  const suspension = await SuspensionRepo.getProprietaireSuspendu(proprietaireId);
  if (!suspension) return null;

  return {
    id: proprietaireId,
    type: "PROPRIETAIRE",
    estSuspendu: suspension.estSuspendu,
    motifSuspension: suspension.motifSuspension,
    dateSuspension: suspension.dateSuspension,
    dateFinSuspension: suspension.dateFinSuspension,
    suspenduPar: suspension.suspenduPar,
  };
};

// ─── Expiration automatique ────────────────────────────────────────────────
// Une suspension à durée déterminée (ex: suspension auto après 3 signalements)
// se lève elle-même dès que dateFinSuspension est dépassée. Vérifié à chaque
// authentification, pour rester cohérent avec le fait que estSuspendu est déjà
// revérifié à chaque requête (pas de tâche planifiée nécessaire).

export const proprietaireEstToujoursSuspendu = async (proprietaire: {
  id: string;
  estSuspendu: boolean;
  dateFinSuspension: Date | null;
}): Promise<boolean> => {
  if (!proprietaire.estSuspendu) return false;

  if (proprietaire.dateFinSuspension && proprietaire.dateFinSuspension <= new Date()) {
    await reactiverProprietaire(proprietaire.id, true);
    return false;
  }

  return true;
};

// ─── Suspension Locataire ───────────────────────────────────────────────────

export const suspendreLocataire = async (
  locataireId: string,
  data: SuspensionData,
  adminId: string
): Promise<ResultatSuspension> => {
  // Vérifier que le locataire existe
  const locataire = await LocataireRepo.findById(locataireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérifier si déjà suspendu
  if (locataire.estSuspendu) {
    throw new AppError("Ce compte est déjà suspendu", StatusCodes.CONFLICT);
  }

  // Suspendre le locataire
  await SuspensionRepo.suspendreLocataire(locataireId, data.motif, adminId);

  // Révoquer les tokens de refresh du locataire
  await LocataireRepo.revokeAllRefreshTokens(locataireId);

  return {
    id: locataireId,
    type: "LOCATAIRE",
    estSuspendu: true,
    motifSuspension: data.motif,
    dateSuspension: new Date(),
    suspenduPar: adminId,
  };
};

export const reactiverLocataire = async (
  locataireId: string
): Promise<ResultatSuspension> => {
  // Vérifier que le locataire existe
  const locataire = await LocataireRepo.findById(locataireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  }

  // Vérifier si pas suspendu
  if (!locataire.estSuspendu) {
    throw new AppError("Ce compte n'est pas suspendu", StatusCodes.CONFLICT);
  }

  // Réactiver le locataire
  await SuspensionRepo.reactiverLocataire(locataireId);

  return {
    id: locataireId,
    type: "LOCATAIRE",
    estSuspendu: false,
    motifSuspension: null,
    dateSuspension: null,
    suspenduPar: null,
  };
};

export const getStatutSuspensionLocataire = async (
  locataireId: string
): Promise<ResultatSuspension | null> => {
  const suspension = await SuspensionRepo.getLocataireSuspendu(locataireId);
  if (!suspension) return null;

  return {
    id: locataireId,
    type: "LOCATAIRE",
    estSuspendu: suspension.estSuspendu,
    motifSuspension: suspension.motifSuspension,
    dateSuspension: suspension.dateSuspension,
    suspenduPar: suspension.suspenduPar,
  };
};

// ─── Vérification de suspension (pour les middlewares) ────────────────────────

export const verifierSuspensionProprietaire = async (
  proprietaireId: string
): Promise<{ suspendu: boolean; motif?: string }> => {
  const proprietaire = await OwnerRepo.findById(proprietaireId);
  if (!proprietaire) {
    throw new AppError("Propriétaire introuvable", StatusCodes.NOT_FOUND);
  }

  return {
    suspendu: proprietaire.estSuspendu,
    motif: proprietaire.motifSuspension ?? undefined,
  };
};

export const verifierSuspensionLocataire = async (
  locataireId: string
): Promise<{ suspendu: boolean; motif?: string }> => {
  const locataire = await LocataireRepo.findById(locataireId);
  if (!locataire) {
    throw new AppError("Locataire introuvable", StatusCodes.NOT_FOUND);
  }

  return {
    suspendu: locataire.estSuspendu,
    motif: locataire.motifSuspension ?? undefined,
  };
};
