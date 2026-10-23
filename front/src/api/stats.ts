import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/stats`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SiteStats {
  annoncesActives: number;
  proprietaires:   number;
  villesCouvertes: number;
}

export interface AdminStats {
  annoncesByStatut: { statut: string; count: number }[];
  annoncesByTypeLogement: { nom: string; count: number }[];
  annoncesByTypeTransaction: { nom: string; count: number }[];
  topVilles: { ville: string; count: number }[];
  totalProprietaires: number;
  totalBiens: number;
  recentEnAttente: {
    id: string;
    titre: string | null;
    ville: string | null;
    proprietaire: { prenom: string | null; nom: string | null } | null;
    createdAt: string;
    statutAnnonce: string;
  }[];
}

export interface ProprietaireStats {
  total: number;
  byStatutVerification: { statut: string; count: number }[];
  byVille: { ville: string; count: number }[];
  topProprietaires: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string | null;
    totalBiens: number;
    biensActifs: number;
    totalLocataires: number;
  }[];
  recentProprietaires: {
    id: string;
    nom: string;
    prenom: string;
    telephone: string;
    email: string | null;
    statutVerification: string;
    createdAt: string;
  }[];
}

export interface ProprietaireDetail {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string | null;
  statutVerification: string;
  verifiedAt: string | null;
  createdAt: string;
  totalBiens: number;
  biens: {
    id: string;
    titre: string | null;
    ville: string | null;
    statutAnnonce: string;
    prix: number | null;
    createdAt: string;
  }[];
  totalLocataires: number;
  totalBails: number;
  bailsActifs: number;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export const fetchStats = () =>
  api.get<{ data: SiteStats }>("/").then((r) => r.data.data);

export const fetchAdminStats = () =>
  api.get<{ data: AdminStats }>("/admin").then((r) => r.data.data);

export const fetchProprietairesStats = () =>
  api.get<{ data: ProprietaireStats }>("/proprietaires").then((r) => r.data.data);

export const fetchProprietaireDetail = (id: string) =>
  api.get<{ data: ProprietaireDetail }>(`/proprietaires/${id}`).then((r) => r.data.data);

// ─── Revenus ──────────────────────────────────────────────────────────────────

export interface RevenusStats {
  totalRevenus: number;
  revenusMois: number;
  revenusPremium: number;
  revenus12Mois: { mois: string; total: number }[];
  revenus12MoisPremium: { mois: string; total: number }[];
  topProprietairesLoyer: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
    totalLoyer: number;
  }[];
}

export const fetchRevenusStats = () =>
  api.get<{ data: RevenusStats }>("/revenus").then((r) => r.data.data);
