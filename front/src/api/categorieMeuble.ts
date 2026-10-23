import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/categories-meubles`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CategorieMeuble {
  id: string;
  nom: string;
  slug: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategorieMeublePayload {
  nom: string;
  ordre?: number;
}

export interface UpdateCategorieMeublePayload {
  nom?: string;
  actif?: boolean;
  ordre?: number;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/** Catégories actives - public */
export const fetchCategoriesMeuble = () =>
  api.get<{ data: CategorieMeuble[] }>("/").then((r) => r.data.data);

/** Toutes les catégories (actives + inactifs) - admin */
export const fetchCategoriesMeubleAdmin = () =>
  api.get<{ data: CategorieMeuble[] }>("/admin").then((r) => r.data.data);

/** Créer une catégorie de meuble */
export const createCategorieMeuble = (payload: CreateCategorieMeublePayload) =>
  api.post<{ data: CategorieMeuble }>("/", payload).then((r) => r.data.data);

/** Modifier une catégorie de meuble */
export const updateCategorieMeuble = (id: string, payload: UpdateCategorieMeublePayload) =>
  api.put<{ data: CategorieMeuble }>(`/${id}`, payload).then((r) => r.data.data);

/** Supprimer une catégorie de meuble */
export const deleteCategorieMeuble = (id: string) => api.delete(`/${id}`);
