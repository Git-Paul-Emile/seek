import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/statuts-bien`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatutBien {
  id: string;
  nom: string;
  slug: string;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStatutBienPayload {
  nom: string;
  ordre?: number;
}

export interface UpdateStatutBienPayload {
  nom?: string;
  actif?: boolean;
  ordre?: number;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/** Statuts actifs - public */
export const fetchStatutsBien = () =>
  api.get<{ data: StatutBien[] }>("/").then((r) => r.data.data);

/** Tous les statuts - admin */
export const fetchStatutsBienAdmin = () =>
  api.get<{ data: StatutBien[] }>("/admin").then((r) => r.data.data);

export const createStatutBien = (payload: CreateStatutBienPayload) =>
  api.post<{ data: StatutBien }>("/", payload).then((r) => r.data.data);

export const updateStatutBien = (id: string, payload: UpdateStatutBienPayload) =>
  api.put<{ data: StatutBien }>(`/${id}`, payload).then((r) => r.data.data);

export const deleteStatutBien = (id: string) => api.delete(`/${id}`);
