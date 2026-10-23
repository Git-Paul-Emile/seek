import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/types-transaction`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TypeTransaction {
  id: string;
  nom: string;
  slug: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTypeTransactionPayload {
  nom: string;
  ordre?: number;
}

export interface UpdateTypeTransactionPayload {
  nom?: string;
  actif?: boolean;
  ordre?: number;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/** Types actifs - public */
export const fetchTypesTransaction = () =>
  api.get<{ data: TypeTransaction[] }>("/").then((r) => r.data.data);

/** Tous les types (actifs + inactifs) - admin */
export const fetchTypesTransactionAdmin = () =>
  api.get<{ data: TypeTransaction[] }>("/admin").then((r) => r.data.data);

export const createTypeTransaction = (payload: CreateTypeTransactionPayload) =>
  api.post<{ data: TypeTransaction }>("/", payload).then((r) => r.data.data);

export const updateTypeTransaction = (id: string, payload: UpdateTypeTransactionPayload) =>
  api.put<{ data: TypeTransaction }>(`/${id}`, payload).then((r) => r.data.data);

export const deleteTypeTransaction = (id: string) => api.delete(`/${id}`);
