import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Type pour les horaires d'un jour
export interface ServiceHoursDay {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

export interface ConfigSite {
  id: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  serviceClientHours: ServiceHoursDay[];
  logoFiligrane?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useConfigSite = () => {
  return useQuery({
    queryKey: ["config-site"],
    queryFn: async (): Promise<ConfigSite> => {
      const { data } = await api.get("/config-site");
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateConfigSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<ConfigSite>) => {
      const { data } = await api.put("/config-site", payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config-site"], data);
    },
  });
};

export const useUploadLogoFiligrane = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const { data } = await api.post("/config-site/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as ConfigSite;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config-site"], data);
    },
  });
};

export const useDeleteLogoFiligrane = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete("/config-site/logo");
      return data as ConfigSite;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config-site"], data);
    },
  });
};
