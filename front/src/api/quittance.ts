import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/biens`,
  withCredentials: true,
});

const apiLocataire = axios.create({
  baseURL: `${API_URL}/api/locataire/auth`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Quittance {
  id: string;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
  numero: string;
  dateGeneration: string;
  createdAt: string;
  echeance?: {
    dateEcheance: string;
    montant: number;
    statut: string;
    datePaiement: string | null;
    modePaiement: string | null;
    reference: string | null;
  };
}

// ─── Owner API ────────────────────────────────────────────────────────────────

/** Récupère la quittance d'une échéance (null si non générée) */
export const getQuittanceApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string
): Promise<Quittance | null> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/quittance`);
  return data.data;
};

/** Génère (ou récupère) la quittance d'une échéance PAYE */
export const genererQuittanceApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string
): Promise<Quittance> => {
  const { data } = await api.post(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/quittance`);
  return data.data;
};

/** Liste toutes les quittances d'un bail */
export const getQuittancesBailApi = async (
  bienId: string,
  bailId: string
): Promise<Quittance[]> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/quittances`);
  return data.data;
};

// ─── Notification / Rappel ────────────────────────────────────────────────────

export interface NotificationResult {
  stub: boolean;
  message: string;
  notification: {
    id: string;
    type: string;
    canal: string;
    destinataire: string;
    statut: string;
    contenu: string;
  };
}

export const envoyerRappelApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string
): Promise<NotificationResult> => {
  const { data } = await api.post(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/rappel`);
  return data.data;
};

export interface RappelHistorique {
  id: string;
  type: string;
  canal: string;
  statut: string;
  contenu: string;
  messageRetour: string | null;
  envoyeAt: string | null;
  createdAt: string;
}

export const getRappelsEcheanceApi = async (
  bienId: string,
  bailId: string,
  echeanceId: string
): Promise<RappelHistorique[]> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/echeancier/${echeanceId}/rappels`);
  return data.data;
};

// ─── Locataire API ────────────────────────────────────────────────────────────

export interface InitierPaiementPayload {
  echeanceId: string;
  provider: string;
}

export interface InitierPaiementResult {
  statut: string;
  stub: true;
  instructions: string;
  message: string;
}

export const initierPaiementLocataireApi = async (
  payload: InitierPaiementPayload
): Promise<InitierPaiementResult> => {
  const { data } = await apiLocataire.post("/paiement/initier", payload);
  return data.data;
};

export const getQuittancesLocataireApi = async (): Promise<Quittance[]> => {
  const { data } = await apiLocataire.get("/quittances");
  return data.data;
};
