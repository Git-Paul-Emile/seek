import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const ownerApi = axios.create({
  baseURL: `${API_URL}/api/owner/locataires`,
  withCredentials: true,
});

const locataireApi = axios.create({
  baseURL: `${API_URL}/api/locataire/auth`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutBailInvitation = "PENDING" | "ACCEPTEE" | "REFUSEE" | "EXPIREE";

export interface BailInvitation {
  id: string;
  bienId: string;
  locataireId: string;
  proprietaireId: string;
  typeBail?: string | null;
  dateDebutBail: string;
  dateFinBail?: string | null;
  montantLoyer: number;
  montantCaution?: number | null;
  cautionVersee: boolean;
  jourLimitePaiement?: number | null;
  renouvellement: boolean;
  frequencePaiement?: string | null;
  token: string;
  statut: StatutBailInvitation;
  expiresAt: string;
  createdAt: string;
  bien: { id: string; titre?: string | null; ville?: string | null; adresse?: string | null; quartier?: string | null };
  proprietaire?: { id: string; nom: string; prenom: string; telephone: string };
  locataire?: { id: string; nom: string; prenom: string; telephone: string; email?: string | null; statut: string };
}

export interface CreateInvitationPayload {
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

// ─── Owner : créer une invitation ─────────────────────────────────────────────

export const createBailInvitationApi = async (
  payload: CreateInvitationPayload
): Promise<BailInvitation> => {
  const { data } = await ownerApi.post("/inviter", payload);
  return data.data;
};

// ─── Locataire : voir ses invitations ─────────────────────────────────────────

export const getLocataireInvitationsApi = async (): Promise<BailInvitation[]> => {
  const { data } = await locataireApi.get("/invitations");
  return data.data;
};

// ─── Locataire : accepter ─────────────────────────────────────────────────────

export const accepterInvitationApi = async (token: string): Promise<unknown> => {
  const { data } = await locataireApi.post(`/invitations/${token}/accepter`);
  return data.data;
};

// ─── Locataire : refuser ──────────────────────────────────────────────────────

export const refuserInvitationApi = async (token: string): Promise<void> => {
  await locataireApi.post(`/invitations/${token}/refuser`);
};
