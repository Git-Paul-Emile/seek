import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/signalements`,
  withCredentials: true,
});

export type MotifSignalement =
  | "ARNAQUE"
  | "INAPPROPRIE"
  | "INDISPONIBLE"
  | "FAUSSES_INFOS"
  | "DOUBLON"
  | "AUTRE";

export type StatutSignalement = "EN_ATTENTE" | "VALIDE" | "REJETE";

export interface Signalement {
  id: string;
  bienId: string;
  comptePublicId?: string;
  nom: string;
  telephone: string;
  motif: MotifSignalement;
  commentaire?: string;
  statut: StatutSignalement;
  traitePar?: string;
  dateTraitement?: string;
  createdAt: string;
  updatedAt: string;
  bien?: {
    id: string;
    titre: string;
    proprietaire: {
      id: string;
      nom: string;
      prenom: string;
      telephone: string;
      nbSignalementsValides: number;
      estSuspendu: boolean;
    };
  };
}

export interface CreateSignalementPayload {
  bienId: string;
  nom: string;
  telephone: string;
  motif: MotifSignalement;
  commentaire?: string;
}

// ─── API Publique ───────────────────────────────────────────────────────────

export const createSignalement = (
  payload: CreateSignalementPayload
): Promise<Signalement> =>
  api.post<{ data: Signalement }>("/", payload).then((r) => r.data.data);

// ─── API Admin ──────────────────────────────────────────────────────────────

export const fetchSignalementsAdmin = (params?: {
  statut?: StatutSignalement;
  search?: string;
}): Promise<Signalement[]> =>
  api.get<{ data: Signalement[] }>("/admin", { params }).then((r) => r.data.data);

export const validerSignalement = (id: string): Promise<Signalement> =>
  api.post<{ data: Signalement }>(`/admin/${id}/valider`).then((r) => r.data.data);

export const rejeterSignalement = (id: string): Promise<Signalement> =>
  api.post<{ data: Signalement }>(`/admin/${id}/rejeter`).then((r) => r.data.data);
