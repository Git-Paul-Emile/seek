import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMesAlertesApi,
  creerAlerteCompteApi,
  activerAlerteApi,
  desactiverAlerteApi,
  supprimerAlerteApi,
  type AlerteComptePayload,
} from "@/api/alerte";

const QUERY_KEY = ["mes-alertes"];

export const useMesAlertes = () =>
  useQuery({
    queryKey: QUERY_KEY,
    queryFn: getMesAlertesApi,
  });

export const useCreerAlerteCompte = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AlerteComptePayload) => creerAlerteCompteApi(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useActiverAlerte = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activerAlerteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useDesactiverAlerte = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => desactiverAlerteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};

export const useSupprimerAlerte = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerAlerteApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
};
