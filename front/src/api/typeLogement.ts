import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/types-logement`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TypeLogement {
  id: string;
  nom: string;
  slug: string;
  image: string | null;
  actif: boolean;
  ordre: number;
  createdAt: string;
  updatedAt: string;
  count?: number; // Nombre d'annonces publiées pour ce type
}

export interface CreateTypeLogementPayload {
  nom: string;
  imageFile?: File;   // Fichier uploadé depuis le device
  ordre?: number;
}

export interface UpdateTypeLogementPayload {
  nom?: string;
  imageFile?: File;   // Nouveau fichier image (optionnel)
  actif?: boolean;
  ordre?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Construit un FormData à partir du payload (pour les requêtes avec fichier) */
const toFormData = (payload: CreateTypeLogementPayload | UpdateTypeLogementPayload): FormData => {
  const fd = new FormData();
  if ("nom"   in payload && payload.nom   !== undefined) fd.append("nom",   payload.nom);
  if ("ordre" in payload && payload.ordre !== undefined) fd.append("ordre", String(payload.ordre));
  if ("actif" in payload && payload.actif !== undefined) fd.append("actif", String(payload.actif));
  if (payload.imageFile) fd.append("image", payload.imageFile);
  return fd;
};

// ─── Requêtes ─────────────────────────────────────────────────────────────────

/** Types actifs - public */
export const fetchTypesLogement = () =>
  api.get<{ data: TypeLogement[] }>("/").then((r) => r.data.data);

/** Tous les types (actifs + inactifs) - admin */
export const fetchTypesLogementAdmin = () =>
  api.get<{ data: TypeLogement[] }>("/admin").then((r) => r.data.data);

/**
 * Créer un type de logement.
 * Envoie toujours en multipart/form-data pour supporter le fichier image.
 */
export const createTypeLogement = (payload: CreateTypeLogementPayload) =>
  api
    .post<{ data: TypeLogement }>("/", toFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);

/**
 * Modifier un type de logement.
 * - Avec fichier image ou champs nom/ordre → multipart/form-data
 * - Sans fichier (ex: toggle actif) → JSON
 */
export const updateTypeLogement = (id: string, payload: UpdateTypeLogementPayload) => {
  const hasFormFields =
    payload.imageFile !== undefined ||
    payload.nom !== undefined ||
    payload.ordre !== undefined;

  if (hasFormFields) {
    return api
      .put<{ data: TypeLogement }>(`/${id}`, toFormData(payload), {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.data);
  }

  // Toggle actif ou mise à jour JSON simple
  return api.put<{ data: TypeLogement }>(`/${id}`, payload).then((r) => r.data.data);
};

export const deleteTypeLogement = (id: string) => api.delete(`/${id}`);
