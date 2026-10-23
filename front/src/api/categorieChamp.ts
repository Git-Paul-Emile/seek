import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/admin/categories-champ`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export interface CategorieChamp {
  id: string;
  nom: string;
  ordre: number;
  createdAt: string;
  updatedAt: string;
}

export const fetchCategoriesChamp = () =>
  api.get<{ data: CategorieChamp[] }>("/").then((r) => r.data.data);

export const createCategorieChamp = (payload: { nom: string; ordre?: number }) =>
  api.post<{ data: CategorieChamp }>("/", payload).then((r) => r.data.data);

export const updateCategorieChamp = (id: string, payload: { nom?: string; ordre?: number }) =>
  api.put<{ data: CategorieChamp }>(`/${id}`, payload).then((r) => r.data.data);

export const deleteCategorieChamp = (id: string) =>
  api.delete(`/${id}`);
