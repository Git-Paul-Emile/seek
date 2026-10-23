import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/meubles`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface Meuble {
  id: string;
  nom: string;
  categorieId: string;
  categorie: { id: string; nom: string; slug: string };
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fetchMeubles      = () => api.get<{ data: Meuble[] }>("/").then((r) => r.data.data);
export const fetchMeublesAdmin = () => api.get<{ data: Meuble[] }>("/admin").then((r) => r.data.data);

export const createMeubles = (payload: { items: { nom: string; categorieId: string }[] }) =>
  api.post<{ data: Meuble[] }>("/", payload).then((r) => r.data.data);

export const updateMeuble = (id: string, payload: { nom?: string; categorieId?: string; actif?: boolean }) =>
  api.put<{ data: Meuble }>(`/${id}`, payload).then((r) => r.data.data);

export const deleteMeuble = (id: string) => api.delete(`/${id}`);
