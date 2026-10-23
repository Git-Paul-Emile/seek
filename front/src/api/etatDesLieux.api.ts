import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/etats-des-lieux`,
  withCredentials: true,
});

const isNotFoundError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404;

export type TypeEtatDesLieux = "ENTREE" | "SORTIE";
export type StatutEtatDesLieux = "BROUILLON" | "EN_ATTENTE_VALIDATION" | "VALIDE" | "CONTESTE" | "EN_LITIGE";
export type StatutContestationElement = "EN_ATTENTE" | "RECTIFIE" | "RESERVE" | "REFUSE";
export type EtatElement = "NEUF" | "BON" | "USAGE" | "MAUVAIS" | "DEGRADE";

export interface ElementEtatDesLieux {
  id?: string;
  nom: string;
  etat: EtatElement;
  commentaire?: string;
  photos?: string[];
  
  // Contestation
  estConteste?: boolean;
  motifContestation?: string;
  photoContestation?: string;
  statutContestation?: StatutContestationElement;
}

export interface PieceEtatDesLieux {
  id?: string;
  nom: string;
  elements: ElementEtatDesLieux[];
}

export interface EtatDesLieux {
  id: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
  type: TypeEtatDesLieux;
  statut: StatutEtatDesLieux;
  dateRealisation: string;
  dateValidation?: string;
  documentPdf?: string;
  nbCles?: number;
  createdAt: string;
  updatedAt: string;
  pieces: PieceEtatDesLieux[];
}

export interface EtatDesLieuxCreateInput {
  bailId: string;
  type: TypeEtatDesLieux;
  nbCles?: number;
  pieces: Omit<PieceEtatDesLieux, "id">[];
}

export interface EtatDesLieuxCreationContext {
  bailId: string;
  statut: string;
  dateFinBail?: string | null;
  canCreateSortie: boolean;
  sortieBlockReason: string | null;
}

// ─── API Propriétaire ───────────────────────────────────────────────────────

export const createEtatDesLieux = (payload: EtatDesLieuxCreateInput): Promise<EtatDesLieux> =>
  api.post<{ data: EtatDesLieux }>("/", payload).then((r) => r.data.data);

export const updateEtatDesLieux = (id: string, payload: Partial<EtatDesLieuxCreateInput>): Promise<EtatDesLieux> =>
  api.put<{ data: EtatDesLieux }>(`/${id}`, payload).then((r) => r.data.data);

export const submitEtatDesLieux = (id: string): Promise<EtatDesLieux> =>
  api.post<{ data: EtatDesLieux }>(`/${id}/submit`).then((r) => r.data.data);

export const deleteEtatDesLieux = (id: string): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);

export const resoudreContestationsProprietaire = (id: string, resolutions: {
  elementId: string;
  decision: "RECTIFIER" | "ACCEPTER_RESERVE" | "REFUSER";
  etat?: EtatElement;
  commentaire?: string;
  photos?: string[];
}[]): Promise<EtatDesLieux> =>
  api.post<{ data: EtatDesLieux }>(`/${id}/resoudre-contestation`, { resolutions }).then((r) => r.data.data);

export const getEtatDesLieuxOwner = (id: string): Promise<EtatDesLieux> =>
  api.get<{ data: EtatDesLieux }>(`/owner/${id}`).then((r) => r.data.data);

export const uploadEtatLieuxImage = (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post<{ url: string }>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data.url);
};

export const getEtatsDesLieuxByBailOwner = (bailId: string): Promise<EtatDesLieux[]> =>
  api.get<{ data: EtatDesLieux[] }>(`/owner/bail/${bailId}`).then((r) => r.data.data);

export const getComparisonOwner = (bailId: string): Promise<{ entree: EtatDesLieux | null; sortie: EtatDesLieux | null }> =>
  api.get<{ data: { entree: EtatDesLieux | null; sortie: EtatDesLieux | null } }>(`/owner/bail/${bailId}/comparison`).then((r) => r.data.data);

export const getCreationContextOwner = (bailId: string): Promise<EtatDesLieuxCreationContext> =>
  api.get<{ data: EtatDesLieuxCreationContext }>(`/owner/bail/${bailId}/context`).then((r) => r.data.data);


// ─── API Locataire ──────────────────────────────────────────────────────────

export const uploadEtatLieuxImageLocataire = (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);
  return api.post<{ url: string }>("/locataire/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data.url);
};

export const contesterElementsLocataire = (id: string, elements: { elementId: string; motifContestation: string; photoContestation: string }[]): Promise<EtatDesLieux> =>
  api.post<{ data: EtatDesLieux }>(`/locataire/${id}/contester`, { elements }).then((r) => r.data.data);

export const validateEtatDesLieux = (id: string, documentPdf?: string): Promise<EtatDesLieux> =>
  api.post<{ data: EtatDesLieux }>(`/locataire/${id}/validate`, { documentPdf }).then((r) => r.data.data);

export const getEtatDesLieuxLocataire = (id: string): Promise<EtatDesLieux> =>
  api.get<{ data: EtatDesLieux }>(`/locataire/${id}`).then((r) => r.data.data);

export const getAllEtatsDesLieuxLocataire = (): Promise<EtatDesLieux[]> =>
  api
    .get<{ data: EtatDesLieux[] }>("/locataire/mes-edl")
    .then((r) => r.data.data)
    .catch((error) => {
      if (!isNotFoundError(error)) {
        throw error;
      }

      return api
        .get<{ data: EtatDesLieux[] }>("/mes-edl")
        .then((r) => r.data.data);
    });

export const getEtatsDesLieuxByBailLocataire = (bailId: string): Promise<EtatDesLieux[]> =>
  api.get<{ data: EtatDesLieux[] }>(`/locataire/bail/${bailId}`).then((r) => r.data.data);

export const getComparisonLocataire = (bailId: string): Promise<{ entree: EtatDesLieux | null; sortie: EtatDesLieux | null }> =>
  api.get<{ data: { entree: EtatDesLieux | null; sortie: EtatDesLieux | null } }>(`/locataire/bail/${bailId}/comparison`).then((r) => r.data.data);
