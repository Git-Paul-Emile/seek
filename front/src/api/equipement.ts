import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/equipements`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface Equipement {
  id: string;
  nom: string;
  categorieId: string;
  categorie: { id: string; nom: string; slug: string };
  actif: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fetchEquipements      = () => api.get<{ data: Equipement[] }>("/").then((r) => r.data.data);
export const fetchEquipementsAdmin = () => api.get<{ data: Equipement[] }>("/admin").then((r) => r.data.data);

export const createEquipements = (payload: { items: { nom: string; categorieId: string }[] }) =>
  api.post<{ data: Equipement[] }>("/", payload).then((r) => r.data.data);

export const updateEquipement = (id: string, payload: { nom?: string; categorieId?: string; actif?: boolean }) =>
  api.put<{ data: Equipement }>(`/${id}`, payload).then((r) => r.data.data);

export const deleteEquipement = (id: string) => api.delete(`/${id}`);
