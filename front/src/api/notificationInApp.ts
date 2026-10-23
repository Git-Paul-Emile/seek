import axios from "axios";
import { ownerApiClient } from "./ownerApiClient";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const locataireApi = axios.create({ baseURL: `${API_URL}/api/locataire`, withCredentials: true });
const adminApi = axios.create({ baseURL: `${API_URL}/api/admin`, withCredentials: true });

// ─── Types ────────────────────────────────────────────────────────────────────

export type TypeNotif =
  | "RAPPEL_LOYER" | "CONFIRMATION_PAIEMENT" | "ALERTE_RETARD"
  | "INITIATION_PAIEMENT" | "VERIFICATION_LOCATAIRE" | "PAIEMENT_LOCATAIRE"
  | "PREAVIS" | "RESILIATION" | "FIN_BAIL" | "CONTRAT" | "RESET_PASSWORD"
  | "ALERTE" | "INVITATION_BAIL" | "VERIFICATION_TELEPHONE"
  | "PAIEMENT_ESPECES_LOCATAIRE" | "CONFIRMATION_ESPECES_PROPRIETAIRE"
  | "ETAT_DES_LIEUX_DISPONIBLE" | "ETAT_DES_LIEUX_VALIDE" | "ETAT_DES_LIEUX_MODIFIE";

export interface InAppNotification {
  id: string;
  type: TypeNotif;
  sujet: string | null;
  contenu: string;
  lu: boolean;
  bailId: string | null;
  bienId: string | null;
  locataireId?: string | null;
  createdAt: string;
}

export interface NotificationsData {
  notifications: InAppNotification[];
  unreadCount: number;
}

export type AdminNotifType = "ANNONCE_EN_ATTENTE" | "VERIFICATION_EN_ATTENTE" | "SIGNALEMENT_ACTIF";

export interface AdminNotifItem {
  id: string;
  type: AdminNotifType;
  titre: string;
  message: string;
  lien: string;
  count: number;
  createdAt: string;
}

export interface AdminNotificationsData {
  items: AdminNotifItem[];
  unreadCount: number;
}

// ─── Owner ────────────────────────────────────────────────────────────────────

export const getOwnerNotificationsApi = async (): Promise<NotificationsData> => {
  const { data } = await ownerApiClient.get("/api/owner/notifications");
  return data.data;
};

export const markOwnerNotificationsReadApi = async (): Promise<void> => {
  await ownerApiClient.patch("/api/owner/notifications/mark-all-read");
};

export const markOwnerOneNotificationReadApi = async (id: string): Promise<void> => {
  await ownerApiClient.patch(`/api/owner/notifications/${id}/read`);
};

// ─── Locataire ────────────────────────────────────────────────────────────────

export const getLocataireNotificationsApi = async (): Promise<NotificationsData> => {
  const { data } = await locataireApi.get("/notifications");
  return data.data;
};

export const markLocataireNotificationsReadApi = async (): Promise<void> => {
  await locataireApi.patch("/notifications/mark-all-read");
};

export const markLocataireOneNotificationReadApi = async (id: string): Promise<void> => {
  await locataireApi.patch(`/notifications/${id}/read`);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAdminNotificationsApi = async (): Promise<AdminNotificationsData> => {
  const { data } = await adminApi.get("/notifications");
  return data.data;
};
