import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentBien {
  id: string;
  bienId: string;
  nom: string;
  type: string;
  url: string;
  taille: number | null;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const listDocumentsBienApi = (bienId: string): Promise<DocumentBien[]> =>
  api
    .get<{ data: DocumentBien[] }>(`/biens/${bienId}/documents`)
    .then((r) => r.data.data);

export const uploadDocumentBienApi = (
  bienId: string,
  file: File,
  type: string
): Promise<DocumentBien> => {
  const form = new FormData();
  form.append("fichier", file);
  form.append("type", type);
  return api
    .post<{ data: DocumentBien }>(`/biens/${bienId}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);
};

export const deleteDocumentBienApi = (
  bienId: string,
  docId: string
): Promise<void> =>
  api.delete(`/biens/${bienId}/documents/${docId}`).then(() => undefined);
