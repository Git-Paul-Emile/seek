import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const suspensionApi = axios.create({
  baseURL: `${API_URL}/api/suspension`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Types
export interface SuspensionInfo {
  id: string;
  type: "PROPRIETAIRE" | "LOCATAIRE";
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: string | null;
  dateFinSuspension?: string | null;
  suspenduPar: string | null;
}

export interface SuspensionResponse {
  status: string;
  message: string;
  data: SuspensionInfo;
}

// Types pour les listes
export interface ProprietaireListItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: string | null;
  dateFinSuspension: string | null;
  suspenduPar: string | null;
  createdAt: string;
}

export interface LocataireListItem {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  estSuspendu: boolean;
  motifSuspension: string | null;
  dateSuspension: string | null;
  suspenduPar: string | null;
  createdAt: string;
}

export interface ProprietaireDetails extends ProprietaireListItem {
  updatedAt: string;
}

export interface LocataireDetails extends LocataireListItem {
  updatedAt: string;
}

// API: Liste des propriétaires
export const getProprietairesApi = async (params?: {
  estSuspendu?: boolean;
  search?: string;
}): Promise<{ status: string; message: string; data: ProprietaireListItem[] }> => {
  const { data } = await suspensionApi.get("/proprietaires", { params });
  return data;
};

export const getProprietaireByIdApi = async (
  id: string
): Promise<{ status: string; message: string; data: ProprietaireDetails }> => {
  const { data } = await suspensionApi.get(`/proprietaires/${id}`);
  return data;
};

// API: Liste des locataires
export const getLocatairesApi = async (params?: {
  estSuspendu?: boolean;
  search?: string;
}): Promise<{ status: string; message: string; data: LocataireListItem[] }> => {
  const { data } = await suspensionApi.get("/locataires", { params });
  return data;
};

export const getLocataireByIdApi = async (
  id: string
): Promise<{ status: string; message: string; data: LocataireDetails }> => {
  const { data } = await suspensionApi.get(`/locataires/${id}`);
  return data;
};

// API: Supprimer un propriétaire
export const supprimerProprietaireApi = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const { data } = await suspensionApi.delete(`/proprietaires/${id}`);
  return data;
};

// API: Supprimer un locataire
export const supprimerLocataireApi = async (
  id: string
): Promise<{ status: string; message: string }> => {
  const { data } = await suspensionApi.delete(`/locataires/${id}`);
  return data;
};

// Types pour les détails avec logement
export interface BienDetails {
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
  quartierRel: {
    id: string;
    nom: string;
    ville: {
      id: string;
      nom: string;
      pays: {
        id: string;
        nom: string;
        code: string;
      };
    };
  } | null;
  typeLogement: { id: string; nom: string } | null;
  typeTransaction: { id: string; nom: string } | null;
  statutBien: { id: string; nom: string } | null;
}

export interface ProprietaireInfo {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
}

export interface ContratInfo {
  id: string;
  titre: string | null;
  contenu: string | null;
  statut: string;
  createdAt: string;
  updatedAt: string;
  modele: { id: string; titre: string } | null;
}

export interface BailWithBienDetails {
  id: string;
  typeBail: string | null;
  statut: string;
  dateDebutBail: string | null;
  dateFinBail: string | null;
  montantLoyer: number | null;
  montantCaution: number | null;
  cautionVersee: boolean | null;
  frequencePaiement: string | null;
  createdAt: string;
  updatedAt: string;
  bien: BienDetails | null;
  proprietaire: ProprietaireInfo;
  contrat: ContratInfo | null;
}

export interface Bien {
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
}

export interface ProprietaireWithBiens extends ProprietaireListItem {
  updatedAt: string;
  biens: Bien[];
}

export interface LocataireWithBails extends LocataireListItem {
  updatedAt: string;
  proprietaire: ProprietaireInfo;
  bails: BailWithBienDetails[];
}

// API: Détails d'un propriétaire avec ses biens
export const getProprietaireWithBiensApi = async (
  id: string
): Promise<{ status: string; message: string; data: ProprietaireWithBiens }> => {
  const { data } = await suspensionApi.get(`/proprietaires/${id}/details`);
  return data;
};

// API: Détails d'un locataire avec ses baux
export const getLocataireWithBailsApi = async (
  id: string
): Promise<{ status: string; message: string; data: LocataireWithBails }> => {
  const { data } = await suspensionApi.get(`/locataires/${id}/details`);
  return data;
};

// API: Suspension Propriétaire

export const suspendreProprietaireApi = async (
  id: string,
  motif: string,
  masquerAnnonces: boolean = true
): Promise<SuspensionResponse> => {
  const { data } = await suspensionApi.post(`/proprietaire/${id}/suspendre`, {
    motif,
    masquerAnnonces,
  });
  return data;
};

export const reactiverProprietaireApi = async (
  id: string,
  afficherAnnonces: boolean = true
): Promise<SuspensionResponse> => {
  const { data } = await suspensionApi.post(`/proprietaire/${id}/reactiver`, {
    afficherAnnonces,
  });
  return data;
};

export const getStatutSuspensionProprietaireApi = async (
  id: string
): Promise<SuspensionResponse> => {
  const { data } = await suspensionApi.get(`/proprietaire/${id}/statut`);
  return data;
};

// API: Suspension Locataire

export const suspendreLocataireApi = async (
  id: string,
  motif: string
): Promise<SuspensionResponse> => {
  const { data } = await suspensionApi.post(`/locataire/${id}/suspendre`, {
    motif,
  });
  return data;
};

export const reactiverLocataireApi = async (
  id: string
): Promise<SuspensionResponse> => {
  const { data } = await suspensionApi.post(`/locataire/${id}/reactiver`);
  return data;
};

export const getStatutSuspensionLocataireApi = async (
  id: string
): Promise<SuspensionResponse> => {
  const { data } = await suspensionApi.get(`/locataire/${id}/statut`);
  return data;
};

// ─── Locataire avec documents ─────────────────────────────────────────────────

export interface VerificationDocument {
  id: string;
  type: string;
  url: string;
  statut: string;
  createdAt: string;
}

export interface LocataireVerification {
  id: string;
  statut: string;
  typePiece: string;
  motifRejet: string | null;
  verifiedAt: string | null;
  documents: VerificationDocument[];
}

export interface LocataireAvecDocuments extends LocataireListItem {
  proprietaire: ProprietaireInfo | null;
  verification: LocataireVerification | null;
  bails: BailWithBienDetails[];
}

export const getLocataireAvecDocumentsApi = async (
  id: string
): Promise<{ status: string; message: string; data: LocataireAvecDocuments }> => {
  const { data } = await suspensionApi.get(`/locataires/${id}/documents`);
  return data;
};
