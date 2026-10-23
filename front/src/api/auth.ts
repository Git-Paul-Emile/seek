import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Instance Axios partagée - withCredentials pour envoyer les cookies HttpOnly */
export const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AdminInfo {
  id: string;
  email: string;
}

// ─── Requêtes ─────────────────────────────────────────────────────────────────

export const loginApi = (payload: LoginPayload) =>
  authApi.post<{ status: string; message: string }>("/login", payload);

export const refreshApi = () =>
  authApi.post<{ status: string; message: string }>("/refresh");

export const logoutApi = () =>
  authApi.post<{ status: string; message: string }>("/logout");

export const meApi = () =>
  authApi.get<{ status: string; message: string; data: AdminInfo }>("/me");

export interface UpdateProfilePayload {
  email?: string;
  password?: string;
}

export const updateProfileApi = (payload: UpdateProfilePayload) =>
  authApi.put<{ status: string; message: string; data: AdminInfo }>(
    "/profile",
    payload
  );

// ─── Changement de mot de passe ──────────────────────────────────────────────

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const changePasswordApi = (payload: ChangePasswordPayload) =>
  authApi.put<{ status: string; message: string }>(
    "/change-password",
    payload
  );
