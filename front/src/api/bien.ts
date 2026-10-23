import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/biens`,
  withCredentials: true,
});

const annonceApi = axios.create({
  baseURL: `${API_URL}/api/annonces`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatutAnnonce = "BROUILLON" | "EN_ATTENTE" | "PUBLIE" | "REJETE" | "ANNULE";

export interface BienEquipement {
  equipementId: string;
  equipement: { id: string; nom: string };
}

export interface BienMeuble {
  meubleId: string;
  quantite: number;
  meuble: { id: string; nom: string };
}

export interface Etablissement {
  id: string;
  type: string;
  nom: string | null;
  latitude: number;
  longitude: number;
  distance: number | null;
  adresse?: string | null;
}

export interface Bien {
  id: string;
  titre: string | null;
  description: string | null;
  typeLogementId: string | null;
  typeTransactionId: string | null;
  statutBienId: string | null;
  proprietaireId: string;
  pays: string | null;
  region: string | null;
  ville: string | null;
  quartier: string | null;
  adresse: string | null;
  pointRepere: string | null;
  latitude: number | null;
  longitude: number | null;
  surface: number | null;
  nbChambres: number | null;
  nbSdb: number | null;
  nbSalons: number | null;
  nbCuisines: number | null;
  nbWc: number | null;
  etage: number | null;
  nbEtages: number | null;
  meuble: boolean;
  fumeurs: boolean;
  animaux: boolean;
  parking: boolean;
  ascenseur: boolean;
  prix: number | null;
  prixAncien: number | null;
  dateDerniereModificationPrix: string | null;
  frequencePaiement: string | null;
  chargesIncluses: boolean;
  caution: number | null;
  disponibleLe: string | null;
  photos: string[];
  videoUrl: string | null;
  actif: boolean;
  statutAnnonce: StatutAnnonce;
  noteAdmin: string | null;
  hasBailActif?: boolean;
  // Champs de promotion
  estMisEnAvant?: boolean;
  dateDebutPromotion?: string | null;
  dateFinPromotion?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  typeLogement?: { id: string; nom: string; slug: string } | null;
  typeTransaction?: { id: string; nom: string; slug: string } | null;
  statutBien?: { id: string; nom: string; slug: string } | null;
  equipements?: BienEquipement[];
  meubles?: BienMeuble[];
  champsValeurs?: { champId: string; valeur: string; champ?: { id: string; nom: string; type: string; unite: string | null } }[];
  etablissements?: Etablissement[];
  proprietaire?: { id: string; prenom: string; nom: string; telephone: string; email: string | null; statutVerification?: "NOT_VERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" };
  // Nombre d'annonces du propriétaire (pour affichage public)
  nombreAnnoncesProprietaire?: number;
  // Score de confiance du propriétaire
  scoreProprietaire?: {
    total: number;
    badges: ("identite_verifiee" | "anciennete_1an")[];
    nbAnnonces: number;
    moisAnciennete: number;
  } | null;
  // Vues
  nbVues?: number;
  // Distance calculée (mode recherche par proximité)
  distance?: number;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface SaveDraftPayload {
  id?: string;
  titre?: string;
  description?: string;
  typeLogementId?: string;
  typeTransactionId?: string;
  statutBienId?: string;
  pays?: string;
  region?: string;
  ville?: string;
  quartier?: string;
  adresse?: string;
  pointRepere?: string;
  latitude?: number | null;
  longitude?: number | null;
  surface?: number;
  nbChambres?: number;
  nbSdb?: number;
  nbSalons?: number;
  nbCuisines?: number;
  nbWc?: number;
  etage?: number;
  nbEtages?: number;
  meuble?: boolean;
  fumeurs?: boolean;
  animaux?: boolean;
  parking?: boolean;
  ascenseur?: boolean;
  prix?: number;
  frequencePaiement?: string;
  chargesIncluses?: boolean;
  caution?: number;
  disponibleLe?: string;
  equipementIds?: string[];
  meubles?: { meubleId: string; quantite: number }[];
  existingPhotos?: string[];
  existingVideoUrl?: string | null;
  champsValeurs?: { champId: string; valeur: string }[];
  brouillon?: boolean;
}

// Keep for backward compat
export type CreateBienPayload = SaveDraftPayload;

export interface PaginatedAnnonces {
  items: Bien[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Owner Stats ──────────────────────────────────────────────────────────────

export interface OwnerStats {
  totalBiens: number;
  byStatut: { statut: string; count: number }[];
  recentBiens: {
    id: string;
    titre: string | null;
    statutAnnonce: string;
    ville: string | null;
    prix: number | null;
    photos: string[];
    updatedAt: string;
  }[];
  nbLocatairesActifs: number;
  nbBailsActifs: number;
  montantMensuelLoyers: number;
  nbEcheancesEnRetard: number;
}

export const fetchOwnerStats = (): Promise<OwnerStats> =>
  api.get<{ data: OwnerStats }>("/stats").then((r) => r.data.data);

// ─── Owner API calls ──────────────────────────────────────────────────────────

export const fetchDraft = (): Promise<Bien | null> =>
  api.get<{ data: Bien | null }>("/draft").then((r) => r.data.data);

export const saveDraft = (
  payload: SaveDraftPayload,
  newPhotos: File[],
  newVideo?: File | null
): Promise<Bien> => {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  newPhotos.forEach((f) => formData.append("photos", f));
  if (newVideo) formData.append("video", newVideo);
  return api
    .post<{ data: Bien }>("/draft", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data.data);
};

// Backward-compatible create flow:
// save as draft, then optionally submit for publication.
export const createBien = async (
  payload: CreateBienPayload,
  newPhotos: File[],
  newVideo?: File | null
): Promise<Bien> => {
  const { brouillon = true, ...draftPayload } = payload;
  const draft = await saveDraft(draftPayload, newPhotos, newVideo);
  if (brouillon) return draft;
  return soumettreAnnonce(draft.id);
};

export const soumettreAnnonce = (id: string): Promise<Bien> =>
  api.patch<{ data: Bien }>(`/${id}/soumettre`).then((r) => r.data.data);

export const fetchBiens = (): Promise<Bien[]> =>
  api.get<{ data: Bien[] }>("/").then((r) => r.data.data);

export const fetchBienById = (id: string): Promise<Bien> =>
  api.get<{ data: Bien }>(`/${id}`).then((r) => r.data.data);

export const deleteBien = (id: string): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);

export const retourBrouillon = (id: string): Promise<Bien> =>
  api.patch<{ data: Bien }>(`/${id}/retour-brouillon`).then((r) => r.data.data);

export const annulerAnnonce = (id: string): Promise<void> =>
  api.patch(`/${id}/annuler`).then(() => undefined);

// ─── Admin API calls ──────────────────────────────────────────────────────────

export const fetchAnnoncesPendingCount = (): Promise<{ count: number }> =>
  annonceApi.get<{ data: { count: number } }>("/count-pending").then((r) => r.data.data);

export interface AnnoncesAdminParams {
  statut?: StatutAnnonce;
  page?: number;
  limit?: number;
  /** Titre, référence (SK-XXXXXXXX), prénom, nom ou téléphone du propriétaire. */
  search?: string;
  ville?: string;
  typeLogementId?: string;
  /** Seulement les annonces qui ont un signalement en attente. */
  signalees?: boolean;
}

export const fetchAnnoncesAdmin = (params?: AnnoncesAdminParams): Promise<PaginatedAnnonces> =>
  annonceApi
    .get<{ data: PaginatedAnnonces }>("/", { params })
    .then((r) => r.data.data);

export interface AnnoncesCounts {
  BROUILLON: number;
  EN_ATTENTE: number;
  PUBLIE: number;
  REJETE: number;
  ANNULE: number;
  /** Annonces avec au moins un signalement en attente. */
  SIGNALEES: number;
}

export const fetchAnnoncesStatusCounts = (): Promise<AnnoncesCounts> =>
  annonceApi.get<{ data: AnnoncesCounts }>("/counts").then((r) => r.data.data);

export const validerAnnonce = (
  id: string,
  action: "APPROUVER" | "REJETER",
  note?: string
): Promise<Bien> =>
  annonceApi
    .patch<{ data: Bien }>(`/${id}/valider`, { action, note })
    .then((r) => r.data.data);

export const deleteAnnonceAdmin = (id: string): Promise<void> =>
  annonceApi.delete(`/${id}`).then(() => undefined);

// ─── Public API calls (pour page d'accueil) ─────────────────────────────────────

export interface BienAvecIsNew extends Bien {
  isNew: boolean;
}

export const fetchDernieresAnnonces = (limit: number = 10): Promise<BienAvecIsNew[]> =>
  api
    .get<{ data: BienAvecIsNew[] }>("/public/dernieres", { params: { limit } })
    .then((r) => r.data.data);

// ─── Public API: fetch single published announcement ───────────────────────────

export const fetchAnnoncePublique = (id: string): Promise<Bien> =>
  api.get<{ data: Bien }>(`/public/${id}`).then((r) => r.data.data);

// ─── Public API: fetch similar announcements ─────────────────────────────────

export const fetchAnnoncesSimilaires = (id: string, limit: number = 4): Promise<Bien[]> =>
  api
    .get<{ data: Bien[] }>(`/public/${id}/similaires`, { params: { limit } })
    .then((r) => r.data.data);

// ─── Public API: recherche avec filtres ──────────────────────────────────────

export interface RechercheParams {
  ville?: string;
  quartier?: string;
  typeLogement?: string;
  typeTransaction?: string;
  statutBien?: string;
  proprietaireVerification?: "VERIFIED" | "NON_VERIFIED";
  prixMin?: number;
  prixMax?: number;
  chambres?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  meuble?: "1";
  parking?: "1";
  ascenseur?: "1";
  fumeurs?: "1";
  animaux?: "1";
  equipementIds?: string; // IDs séparés par virgule
  misEnAvant?: "1";
  featuredFirst?: "1";
  sortBy?: "prix" | "createdAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  // Recherche par proximité
  lat?: number;
  lng?: number;
  radius?: number; // km (5 à 30, par pas de 5)
}

export interface RechercheResult {
  items: Bien[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const fetchRecherchePublique = (params: RechercheParams): Promise<RechercheResult> =>
  api
    .get<{ data: RechercheResult }>("/public/recherche", { params })
    .then((r) => r.data.data);

// ─── Public API: lieux distincts (quartiers + villes) ────────────────────────

export interface LieuxData {
  quartiers: { nom: string; ville: string }[];
  villes: string[];
}

export const fetchLieux = (): Promise<LieuxData> =>
  api.get<{ data: LieuxData }>("/public/lieux").then((r) => r.data.data);

// ─── Stats favoris ───────────────────────────────────────────────────────────────

export interface StatsFavorisBien {
  favorisTotaux: number;
}

export const fetchStatsFavorisBien = (bienId: string): Promise<StatsFavorisBien> =>
  api.get<{ data: StatsFavorisBien }>(`/${bienId}/stats-favoris`).then((r) => r.data.data);
