import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Temoignage {
  id: string;
  nom: string;
  profession?: string;
  temoignage: string;
  actif?: boolean;
  ordre?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTemoignageData {
  nom: string;
  profession?: string;
  temoignage: string;
}

export interface UpdateTemoignageData {
  nom?: string;
  profession?: string;
  temoignage?: string;
  actif?: boolean;
  ordre?: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const fetchTemoignages = (): Promise<Temoignage[]> =>
  api.get<{ data: Temoignage[] }>("/temoignages").then((r) => r.data.data);

export const createTemoignage = (data: CreateTemoignageData): Promise<Temoignage> =>
  api.post<{ data: Temoignage }>("/temoignages", data).then((r) => r.data.data);

export const fetchAllTemoignagesAdmin = (): Promise<Temoignage[]> =>
  api.get<{ data: Temoignage[] }>("/temoignages/admin").then((r) => r.data.data);

export const updateTemoignage = (id: string, data: UpdateTemoignageData): Promise<Temoignage> =>
  api.put<{ data: Temoignage }>(`/temoignages/${id}`, data).then((r) => r.data.data);

export const deleteTemoignage = (id: string): Promise<void> =>
  api.delete(`/temoignages/${id}`);
