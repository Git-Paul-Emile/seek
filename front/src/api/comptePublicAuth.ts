import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/public/auth`,
  withCredentials: true,
});

// Sur 401, tente un refresh silencieux puis retente la requête une seule fois
let isRefreshing = false;
let pendingQueue: Array<{ resolve: () => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Évite la boucle infinie sur /refresh lui-même
    if (error.response?.status !== 401 || original._retry || original.url?.includes("/refresh")) {
      return Promise.reject(error);
    }
    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(api(original)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      await api.post("/refresh");
      pendingQueue.forEach((p) => p.resolve());
      pendingQueue = [];
      return api(original);
    } catch (refreshError) {
      pendingQueue.forEach((p) => p.reject(refreshError));
      pendingQueue = [];
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export interface ComptePublic {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string | null;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  password: string;
}

export const registerComptePublicApi = async (data: RegisterData): Promise<ComptePublic> => {
  const res = await api.post("/register", data);
  return res.data.data;
};

export const loginComptePublicApi = async (telephone: string, password: string): Promise<ComptePublic> => {
  const res = await api.post("/login", { telephone, password });
  return res.data.data;
};

export const refreshComptePublicApi = async (): Promise<ComptePublic> => {
  const res = await api.post("/refresh");
  return res.data.data;
};

export const logoutComptePublicApi = async (): Promise<void> => {
  await api.post("/logout");
};

export const meComptePublicApi = async (): Promise<ComptePublic> => {
  const res = await api.get("/me");
  return res.data.data;
};

export interface UpdateProfileData {
  nom?: string;
  prenom?: string;
  email?: string | null;
}

export const updateComptePublicApi = async (data: UpdateProfileData): Promise<ComptePublic> => {
  const res = await api.put("/profile", data);
  return res.data.data;
};

export const changePasswordApi = async (data: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> => {
  await api.put("/change-password", data);
};

export const deleteComptePublicApi = async (password: string): Promise<void> => {
  await api.delete("/account", { data: { password } });
};
