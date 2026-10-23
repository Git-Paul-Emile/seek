import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/biens`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutBail = "ACTIF" | "EN_PREAVIS" | "EN_RENOUVELLEMENT" | "TERMINE" | "RESILIE" | "ARCHIVE";

export interface BailLocataire {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  statut: "INVITE" | "ACTIF" | "INACTIF" | "ANCIEN";
  nbOccupants: number;
  presenceEnfants: boolean;
}

export interface Bail {
  id: string;
  bienId: string;
  locataireId: string;
  proprietaireId: string;
  typeBail?: string | null;
  dateDebutBail: string;
  dateFinBail?: string | null;
  renouvellement: boolean;
  montantLoyer: number;
  montantCaution?: number | null;
  cautionVersee: boolean;
  jourLimitePaiement?: number | null;
  delaiGrace: number;
  frequencePaiement?: string | null;
  statut: StatutBail;
  createdAt: string;
  updatedAt: string;
  locataire: BailLocataire;
  etatsDesLieux?: Array<{
    id: string;
    type: "ENTREE" | "SORTIE";
    statut: string;
  }>;
  bien: {
    id: string;
    titre?: string | null;
    ville?: string | null;
    quartier?: string | null;
    prix?: number | null;
    caution?: number | null;
    frequencePaiement?: string | null;
    typeTransaction?: { slug: string } | null;
  };
}

export interface CreateBailPayload {
  locataireId: string;
  typeBail?: string | null;
  dateDebutBail: string;
  dateFinBail?: string | null;
  renouvellement?: boolean;
  montantLoyer: number;
  montantCaution?: number | null;
  cautionVersee?: boolean;
  jourLimitePaiement?: number | null;
  delaiGrace?: number;
  frequencePaiement?: string | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const getBailActifApi = async (bienId: string): Promise<Bail | null> => {
  const { data } = await api.get(`/${bienId}/bail`);
  return data.data;
};

export const creerBailApi = async (
  bienId: string,
  payload: CreateBailPayload
): Promise<Bail> => {
  const { data } = await api.post(`/${bienId}/bail`, payload);
  return data.data;
};

export const terminerBailApi = async (
  bienId: string,
  bailId: string
): Promise<Bail> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/terminer`);
  return data.data;
};

export const resilierBailApi = async (
  bienId: string,
  bailId: string,
  motif?: string
): Promise<Bail> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/resilier`, motif ? { motif } : {});
  return data.data;
};

export const annulerBailApi = async (
  bienId: string,
  bailId: string
): Promise<void> => {
  await api.delete(`/${bienId}/bail/${bailId}`);
};

export const prolongerBailApi = async (
  bienId: string,
  bailId: string,
  duree: 6 | 12
): Promise<Bail> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/prolonger`, { duree });
  return data.data;
};

// ─── Échéancier ───────────────────────────────────────────────────────────────

export type StatutPaiement = "A_VENIR" | "EN_ATTENTE" | "EN_RETARD" | "EN_ATTENTE_CONFIRMATION" | "PAYE" | "ANNULE";

export interface Echeance {
  id: string;
  bailId: string;
  bienId: string;
  dateEcheance: string;
  montant: number;
  statut: StatutPaiement;
  datePaiement?: string | null;
  modePaiement?: string | null;
  reference?: string | null;
  note?: string | null;
  sourceEnregistrement?: "LOCATAIRE" | "PROPRIETAIRE" | null;
  confirmeParProprietaire: boolean;
  dateConfirmation?: string | null;
  confirmeParLocataire: boolean;
  dateConfirmationLocataire?: string | null;
}

export interface PayerEcheancePayload {
  datePaiement: string;
  modePaiement?: string;
  reference?: string;
  note?: string;
}

export const getEcheancierApi = async (bienId: string, bailId: string): Promise<Echeance[]> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/echeancier`);
  return data.data;
};

export const payerEcheanceApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  payload: PayerEcheancePayload
): Promise<Echeance> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/payer`, payload);
  return data.data;
};

export interface PayerMoisMultiplesPayload {
  datePaiement: string;
  nombreMois: number;
  modePaiement?: string;
  reference?: string;
  note?: string;
}

export const payerMoisMultiplesApi = async (
  bienId: string,
  bailId: string,
  payload: PayerMoisMultiplesPayload
): Promise<{ paye: number; ids: string[] }> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/echeancier/payer-multiple`, payload);
  return data.data;
};

// ─── Paiement espèces ─────────────────────────────────────────────────────────

export interface EnregistrerEspecesPayload {
  datePaiement: string;
  /** Nombre d'échéances couvertes par le paiement (1 par défaut côté serveur). */
  nombreMois?: number;
  note?: string;
}

export const enregistrerPaiementEspecesApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string,
  payload: EnregistrerEspecesPayload
): Promise<Echeance> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/especes`, payload);
  return data.data;
};

// ─── Caution ──────────────────────────────────────────────────────────────────

export type StatutDepot = "RECU" | "RESTITUE" | "PARTIELLEMENT_RESTITUE" | "RETENU";

export interface DepotCaution {
  id: string;
  bailId: string;
  montant: number;
  statut: StatutDepot;
  dateReception: string;
  dateRestitution?: string | null;
  montantRestitue?: number | null;
  motifRetenue?: string | null;
}

export const getCautionApi = async (bienId: string, bailId: string): Promise<DepotCaution | null> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/caution`);
  return data.data;
};

export const restituerCautionApi = async (
  bienId: string,
  bailId: string,
  payload: { montantRestitue: number; motifRetenue?: string; dateRestitution?: string }
): Promise<DepotCaution> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/caution/restituer`, payload);
  return data.data;
};

// ─── Mobile Money ─────────────────────────────────────────────────────────────

export interface MobileMoneyProvider {
  nom: string;
  instructions: string;
}

export interface MobileMoneyInfo {
  pays: string | null;
  providers: MobileMoneyProvider[];
}

export const getMobileMoneyApi = async (bienId: string): Promise<MobileMoneyInfo> => {
  const { data } = await api.get(`/${bienId}/bail/mobile-money`);
  return data.data;
};

// ─── Solde ────────────────────────────────────────────────────────────────────

export interface SoldeData {
  totalEcheances: number;
  nbPaye: number;
  nbEnRetard: number;
  nbEnAttente: number;
  nbAVenir: number;
  montantTotalDu: number;
  montantPaye: number;
  montantEnRetard: number;
  solde: number;
}

export const getSoldeApi = async (bienId: string, bailId: string): Promise<SoldeData> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/solde`);
  return data.data;
};

export const prolongerEcheancesAnneeApi = async (
  bienId: string,
  bailId: string,
  anneeActuelle: number
): Promise<{ generated: number; annee: number; existed?: number }> => {
  const { data } = await api.post(
    `/${bienId}/bail/${bailId}/echeancier/prolonger-annee`,
    { anneeActuelle }
  );
  return data.data;
};

// ─── Fin de bail ──────────────────────────────────────────────────────────────

export const mettreEnPreavisApi = async (bienId: string, bailId: string): Promise<Bail> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/preavis`);
  return data.data;
};

export const mettreEnRenouvellementApi = async (bienId: string, bailId: string): Promise<Bail> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/renouvellement`);
  return data.data;
};

export interface RestitutionCautionPayload {
  montantRestitue: number;
  motifRetenue?: string;
}

export const archiverBailApi = async (bienId: string, bailId: string, restitution?: RestitutionCautionPayload): Promise<Bail> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/archiver`, restitution ? { restitution } : {});
  return data.data;
};

export const getBailAArchiverApi = async (bienId: string): Promise<Bail | null> => {
  const { data } = await api.get(`/${bienId}/bail/a-archiver`);
  return data.data;
};

export const getHistoriqueBailsApi = async (bienId: string): Promise<Bail[]> => {
  const { data } = await api.get(`/${bienId}/bail/historique`);
  return data.data;
};

// ─── Confirmation de réception (propriétaire) ─────────────────────────────────

export const confirmerReceptionApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string
): Promise<Echeance> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/confirmer`);
  return data.data;
};

// ─── Biens avec bail actif ────────────────────────────────────────────────────

export interface BienAvecBailActif {
  bailId: string;
  bienId: string;
  bienTitre: string | null;
  bienVille: string | null;
  locataireId: string;
  locataireNom: string | null;
  locataireTelephone: string | null;
  montantLoyer: number;
  statutBail: string;
}

export const getBiensAvecBailActifApi = async (): Promise<BienAvecBailActif[]> => {
  const { data } = await ownerApi.get("/avec-bail-actif");
  return data.data;
};

// ─── Biens avec loyers en retard ──────────────────────────────────────────────

export interface EcheanceRetard {
  id: string;
  dateEcheance: string;
  montant: number;
  statut: string;
}

export interface BienEnRetard {
  bailId: string;
  bien: {
    id: string;
    titre: string | null;
    adresse: string | null;
    ville: string | null;
    pays: string | null;
    typeTransaction: { slug: string; nom: string } | null;
  };
  locataire: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
    email?: string | null;
  };
  nbEcheancesEnRetard: number;
  totalRetard: number;
  joursRetardMax: number;
  echeancesEnRetard: EcheanceRetard[];
}

const ownerApi = axios.create({
  baseURL: `${API_URL}/api/owner/biens`,
  withCredentials: true,
});

export const getBiensEnRetardApi = async (): Promise<BienEnRetard[]> => {
  const { data } = await ownerApi.get("/loyers-retard");
  return data.data;
};

// ─── Tableau de bord propriétaire ─────────────────────────────────────────────

export interface TableauDeBordProprietaire {
  moisCourant: { attendu: number; payeSurAttendu: number; encaisse: number };
  /** Loyers encaissés par mois (« 2026-10 »), du plus ancien au mois en cours. */
  encaissementsMensuels: { mois: string; montant: number }[];
  biens: { total: number; occupes: number; libres: number; travaux: number };
  /** Statut de l'échéance du mois en cours par identifiant de bien. */
  statutsMoisCourant: Record<string, StatutPaiement>;
  confirmationsEnAttente: {
    echeanceId: string;
    bailId: string;
    bienId: string;
    bienTitre: string | null;
    bienQuartier: string | null;
    locataire: { prenom: string; nom: string };
    montant: number;
  }[];
}

export const getTableauDeBordApi = async (): Promise<TableauDeBordProprietaire> => {
  const { data } = await ownerApi.get("/tableau-de-bord");
  return data.data;
};
