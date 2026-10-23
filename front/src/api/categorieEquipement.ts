import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/categories-equipements`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategorieEquipement {
  id: string;
  nom: string;
  slug: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategorieEquipementPayload {
  nom: string;
  ordre?: number;
}

export interface UpdateCategorieEquipementPayload {
  nom?: string;
  actif?: boolean;
  ordre?: number;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/** Catégories actives - public */
export const fetchCategoriesEquipement = () =>
  api.get<{ data: CategorieEquipement[] }>("/").then((r) => r.data.data);

/** Toutes les catégories (actives + inactifs) - admin */
export const fetchCategoriesEquipementAdmin = () =>
  api.get<{ data: CategorieEquipement[] }>("/admin").then((r) => r.data.data);

/** Créer une catégorie d'équipement */
export const createCategorieEquipement = (payload: CreateCategorieEquipementPayload) =>
  api.post<{ data: CategorieEquipement }>("/", payload).then((r) => r.data.data);

/** Modifier une catégorie d'équipement */
export const updateCategorieEquipement = (id: string, payload: UpdateCategorieEquipementPayload) =>
  api.put<{ data: CategorieEquipement }>(`/${id}`, payload).then((r) => r.data.data);

/** Supprimer une catégorie d'équipement */
export const deleteCategorieEquipement = (id: string) => api.delete(`/${id}`);
