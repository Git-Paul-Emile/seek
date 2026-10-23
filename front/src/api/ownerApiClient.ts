import axios from "axios";
import { refreshOwnerApi } from "./ownerAuth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * Instance Axios partagée pour toutes les requêtes owner authentifiées.
 * Intercepteur 401 : refresh automatique du token puis retry.
 */
export const ownerApiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const flushQueue = (error: unknown) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(undefined)
  );
  pendingQueue = [];
};

ownerApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Pas de 401, ou déjà retryé, ou c'est la route /refresh elle-même
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Mettre en attente jusqu'à la fin du refresh en cours
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then(() => ownerApiClient(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await refreshOwnerApi();
      flushQueue(null);
      return ownerApiClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError);
      // Rediriger vers login si le refresh échoue
      window.location.href = "/owner/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
