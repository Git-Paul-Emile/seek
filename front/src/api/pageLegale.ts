import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export interface PageLegale {
  id: string | null;
  slug: string;
  titre: string;
  contenu: string;
  publie: boolean;
  version: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpsertPageLegaleData {
  titre: string;
  contenu: string;
  publie?: boolean;
  version?: string;
}

export const fetchPageLegaleBySlug = (slug: string): Promise<PageLegale> =>
  api.get<{ data: PageLegale }>(`/pages-legales/${slug}`).then((r) => r.data.data);

export const fetchAllPagesLegalesAdmin = (): Promise<PageLegale[]> =>
  api.get<{ data: PageLegale[] }>("/pages-legales/admin").then((r) => r.data.data);

export const upsertPageLegale = (slug: string, data: UpsertPageLegaleData): Promise<PageLegale> =>
  api.put<{ data: PageLegale }>(`/pages-legales/${slug}`, data).then((r) => r.data.data);
