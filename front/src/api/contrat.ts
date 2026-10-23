import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/biens`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutContrat = "BROUILLON" | "ACTIF" | "ARCHIVE";

export interface Contrat {
  id: string;
  bailId: string;
  modeleId?: string | null;
  titre: string;
  contenu: string;
  statut: StatutContrat;
  createdAt: string;
  updatedAt: string;
  modele?: { id: string; titre: string; typeBail?: string | null } | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const getContratApi = async (bienId: string, bailId: string): Promise<Contrat | null> => {
  const { data } = await api.get(`/${bienId}/bail/${bailId}/contrat`);
  return data.data;
};

/** Génération automatique - le backend sélectionne le bon modèle selon le type de bail */
export const genererContratApi = async (bienId: string, bailId: string): Promise<Contrat> => {
  const { data } = await api.post(`/${bienId}/bail/${bailId}/contrat`);
  return data.data;
};

export const updateContratApi = async (
  bienId: string,
  bailId: string,
  contratId: string,
  contenu: string
): Promise<Contrat> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/contrat/${contratId}`, { contenu });
  return data.data;
};

export const activerContratApi = async (
  bienId: string,
  bailId: string,
  contratId: string
): Promise<{ contrat: Contrat; lienActivation: string | null }> => {
  const { data } = await api.patch(`/${bienId}/bail/${bailId}/contrat/${contratId}/activer`);
  return data.data;
};

/** Active le contrat ET envoie un email au locataire */
export const envoyerContratApi = async (
  bienId: string,
  bailId: string,
  contratId: string
): Promise<{ sent: boolean; email: string | null; lienActivation: string | null }> => {
  const { data } = await api.post(`/${bienId}/bail/${bailId}/contrat/${contratId}/envoyer`);
  return data.data;
};
