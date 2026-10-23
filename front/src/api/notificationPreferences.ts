import axios from "axios";
import type { MoyenPaiement } from "@/api/premium";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/owner/notifications`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CanalNotification = "SMS" | "EMAIL" | "WHATSAPP";

export interface CanauxNotificationData {
  canaux: CanalNotification[];
  canauxDisponibles: CanalNotification[];
  canauxPayes: boolean;
  fraisCanauxSupplementaires: number;
  moyensPaiement: MoyenPaiement[];
}

export interface UpdateCanauxPayload {
  canaux: CanalNotification[];
  modePaiement?: string;
}

export interface UpdateCanauxResult {
  canaux: CanalNotification[];
  canauxPayes: boolean;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const getCanauxNotificationApi = (): Promise<CanauxNotificationData> =>
  api.get<{ data: CanauxNotificationData }>("/canaux").then((r) => r.data.data);

export const updateCanauxNotificationApi = (
  payload: UpdateCanauxPayload
): Promise<UpdateCanauxResult> =>
  api.put<{ data: UpdateCanauxResult }>("/canaux", payload).then((r) => r.data.data);
