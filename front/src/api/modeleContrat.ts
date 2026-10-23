import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/modeles-contrat`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ModeleContrat {
  id: string;
  titre: string;
  typeBail?: string | null;
  contenu: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModeleContratResume {
  id: string;
  titre: string;
  typeBail?: string | null;
  ordre: number;
}

export interface ModeleContratPayload {
  titre: string;
  typeBail?: string | null;
  contenu: string;
  actif?: boolean;
  ordre?: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/** Owner: récupérer les modèles actifs (pour choisir lors de génération) */
export const getModelesActifsApi = async (typeBail?: string): Promise<ModeleContratResume[]> => {
  const params = typeBail ? { typeBail } : {};
  const { data } = await api.get("/", { params });
  return data.data;
};

/** Admin: récupérer la liste paginée */
export const getModelesAdminApi = async (params: {
  page?: number;
  limit?: number;
  typeBail?: string;
  actif?: boolean;
}): Promise<{ items: ModeleContrat[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
  const { data } = await api.get("/admin", { params });
  return { items: data.data, meta: data.meta };
};

/** Admin: récupérer un modèle complet (avec contenu) */
export const getModeleByIdApi = async (id: string): Promise<ModeleContrat> => {
  const { data } = await api.get(`/admin?id=${id}`);
  return data.data;
};

/** Admin: créer un modèle */
export const createModeleApi = async (payload: ModeleContratPayload): Promise<ModeleContrat> => {
  const { data } = await api.post("/", payload);
  return data.data;
};

/** Admin: modifier un modèle */
export const updateModeleApi = async (id: string, payload: Partial<ModeleContratPayload>): Promise<ModeleContrat> => {
  const { data } = await api.patch(`/${id}`, payload);
  return data.data;
};

/** Admin: supprimer un modèle */
export const deleteModeleApi = async (id: string): Promise<void> => {
  await api.delete(`/${id}`);
};
