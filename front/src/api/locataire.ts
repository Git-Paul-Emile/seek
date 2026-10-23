import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/owner/locataires`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutLocataire = "INVITE" | "ACTIF" | "INACTIF";
export type TypePieceIdentite = "CNI" | "PASSEPORT" | "CARTE_CONSULAIRE" | "AUTRE";
export type StatutVerificationLocataire = "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

export interface LocataireVerification {
  id: string;
  typePiece: string;
  pieceIdentiteRecto?: string | null;
  pieceIdentiteVerso?: string | null;
  selfie?: string | null;
  statut: StatutVerificationLocataire;
  conditionsAcceptees: boolean;
  motifRejet?: string | null;
  dateTraitement?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BailResume {
  id: string;
  statut: "EN_ATTENTE" | "ACTIF" | "EN_PREAVIS" | "EN_RENOUVELLEMENT" | "TERMINE" | "RESILIE" | "ARCHIVE";
  dateDebutBail: string;
  dateFinBail?: string | null;
  montantLoyer: number;
  bienId: string;
  bien: { id: string; titre?: string | null; ville?: string | null; quartier?: string | null };
  locataireId: string;
  typeBail?: string | null;
  contrat?: { id: string; statut: string } | null;
}

export interface Locataire {
  id: string;
  proprietaireId: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  nbOccupants: number;
  presenceEnfants: boolean;
  // Date et lieu de naissance
  dateNaissance: string | null;
  lieuNaissance: string | null;
  // Pièce d'identité
  nationalite?: string | null;
  sexe?: string | null;
  numPieceIdentite?: string | null;
  typePiece?: TypePieceIdentite | null;
  dateDelivrance?: string | null;
  autoriteDelivrance?: string | null;
  dateExpirationPiece?: string | null;
  situationProfessionnelle?: string | null;
  statut: StatutLocataire;
  activationToken?: string | null;
  tokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  bails?: BailResume[];
  verification?: LocataireVerification | null;
}

export interface CreateLocatairePayload {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string | null;
  nbOccupants?: number;
  presenceEnfants?: boolean;
}

export interface UpdateLocatairePayload {
  nom?: string;
  prenom?: string;
  telephone?: string;
  email?: string | null;
  nbOccupants?: number;
  presenceEnfants?: boolean;
}

export interface LienActivation {
  lien: string;
  statut: StatutLocataire;
  services: { email: null; whatsapp: null; sms: null };
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const getLocatairesApi = async (): Promise<Locataire[]> => {
  const { data } = await api.get("/");
  return data.data;
};

export const getLocataireByIdApi = async (id: string): Promise<Locataire> => {
  const { data } = await api.get(`/${id}`);
  return data.data;
};

export const createLocataireApi = async (
  payload: CreateLocatairePayload
): Promise<Locataire> => {
  const { data } = await api.post("/", payload);
  return data.data;
};

export const updateLocataireApi = async (
  id: string,
  payload: UpdateLocatairePayload
): Promise<Locataire> => {
  const { data } = await api.patch(`/${id}`, payload);
  return data.data;
};

export const deleteLocataireApi = async (id: string): Promise<void> => {
  await api.delete(`/${id}`);
};

export const getLienActivationApi = async (
  id: string
): Promise<LienActivation> => {
  const { data } = await api.get(`/${id}/lien`);
  return data.data;
};

// ─── Vérification du locataire ─────────────────────────────────────────────────

export const approveLocataireVerificationApi = async (
  locataireId: string
): Promise<{ status: string; message: string }> => {
  const { data } = await api.post(`/${locataireId}/verification/approve`);
  return data;
};

export const rejectLocataireVerificationApi = async (
  locataireId: string,
  motif: string
): Promise<{ status: string; message: string }> => {
  const { data } = await api.post(`/${locataireId}/verification/reject`, { motif });
  return data;
};

// ─── Nombre de vérifications en attente ────────────────────────────────────

export const getPendingVerificationsCountApi = async (): Promise<{ count: number }> => {
  const { data } = await api.get("/verifications/pending/count");
  return data.data;
};

// ─── Recherche globale par téléphone/email ─────────────────────────────────

export interface SearchLocataireResult {
  found: boolean;
  locataire: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    statut: StatutLocataire;
    estDansMaListe: boolean;
  } | null;
}

export const searchLocataireByContactApi = async (params: {
  telephone?: string;
  email?: string;
}): Promise<SearchLocataireResult> => {
  const query = new URLSearchParams();
  if (params.telephone) query.set("telephone", params.telephone);
  if (params.email) query.set("email", params.email);
  const { data } = await api.get(`/search?${query.toString()}`);
  return data.data;
};
