import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api/monetisation`,
  withCredentials: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConfigMonetisation {
  id: string;
  miseEnAvantActive: boolean;
  commissionActive: boolean;
  tauxCommission: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const getConfigApi = async (): Promise<ConfigMonetisation> => {
  const res = await api.get("/admin/config");
  return res.data.data;
};

export const updateConfigApi = async (data: Partial<Pick<ConfigMonetisation,
  "miseEnAvantActive" | "commissionActive" | "tauxCommission"
>>): Promise<ConfigMonetisation> => {
  const res = await api.put("/admin/config", data);
  return res.data.data;
};
