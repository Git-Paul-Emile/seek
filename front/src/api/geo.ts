import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({ baseURL: `${API_URL}/api/geo`, withCredentials: true });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Pays {
  id: string;
  nom: string;
  code: string;
  _count?: { villes: number };
}

export interface Ville {
  id: string;
  nom: string;
  paysId: string;
  pays?: { id: string; nom: string; code: string };
  _count?: { quartiers: number };
}

export interface Quartier {
  id: string;
  nom: string;
  villeId: string;
  latitude: number;
  longitude: number;
  ville?: {
    id: string;
    nom: string;
    pays?: { id: string; nom: string };
  };
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const fetchPays = (): Promise<Pays[]> =>
  api.get<{ data: Pays[] }>("/pays").then((r) => r.data.data);

export const fetchVilles = (paysId: string): Promise<Ville[]> =>
  api.get<{ data: Ville[] }>(`/pays/${paysId}/villes`).then((r) => r.data.data);

export const fetchQuartiersByVille = (villeId: string): Promise<Quartier[]> =>
  api.get<{ data: Quartier[] }>(`/villes/${villeId}/quartiers`).then((r) => r.data.data);

// ─── Admin - Pays ─────────────────────────────────────────────────────────────

export const fetchAllPaysAdmin = (): Promise<Pays[]> =>
  api.get<{ data: Pays[] }>("/admin/pays").then((r) => r.data.data);

export const createPaysApi = (data: { nom: string; code: string }): Promise<Pays> =>
  api.post<{ data: Pays }>("/pays", data).then((r) => r.data.data);

export const updatePaysApi = (id: string, data: { nom?: string; code?: string }): Promise<Pays> =>
  api.put<{ data: Pays }>(`/pays/${id}`, data).then((r) => r.data.data);

export const deletePaysApi = (id: string): Promise<void> =>
  api.delete(`/pays/${id}`).then(() => undefined);

// ─── Admin - Villes ───────────────────────────────────────────────────────────

export const fetchAllVillesAdmin = (paysId?: string): Promise<Ville[]> =>
  api
    .get<{ data: Ville[] }>("/admin/villes", { params: paysId ? { paysId } : undefined })
    .then((r) => r.data.data);

export const createVilleApi = (data: { nom: string; paysId: string }): Promise<Ville> =>
  api.post<{ data: Ville }>("/villes", data).then((r) => r.data.data);

export const updateVilleApi = (id: string, data: { nom?: string; paysId?: string }): Promise<Ville> =>
  api.put<{ data: Ville }>(`/villes/${id}`, data).then((r) => r.data.data);

export const deleteVilleApi = (id: string): Promise<void> =>
  api.delete(`/villes/${id}`).then(() => undefined);

// ─── Admin - Quartiers ────────────────────────────────────────────────────────

export const fetchAllQuartiersAdmin = (villeId?: string): Promise<Quartier[]> =>
  api
    .get<{ data: Quartier[] }>("/admin/quartiers", { params: villeId ? { villeId } : undefined })
    .then((r) => r.data.data);

export const createQuartierApi = (data: {
  nom: string;
  villeId: string;
  latitude: number;
  longitude: number;
}): Promise<Quartier> =>
  api.post<{ data: Quartier }>("/quartiers", data).then((r) => r.data.data);

export const updateQuartierApi = (
  id: string,
  data: { nom?: string; villeId?: string; latitude?: number; longitude?: number }
): Promise<Quartier> =>
  api.put<{ data: Quartier }>(`/quartiers/${id}`, data).then((r) => r.data.data);

export const deleteQuartierApi = (id: string): Promise<void> =>
  api.delete(`/quartiers/${id}`).then(() => undefined);
