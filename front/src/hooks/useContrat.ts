import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContratApi,
  genererContratApi,
  updateContratApi,
  activerContratApi,
  envoyerContratApi,
} from "@/api/contrat";

const QK = "contrat";

export const useContrat = (bienId: string, bailId: string) =>
  useQuery({
    queryKey: [QK, bienId, bailId],
    queryFn: () => getContratApi(bienId, bailId),
    enabled: !!bienId && !!bailId,
    staleTime: 2 * 60 * 1000,
  });

export const useGenererContrat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId }: { bienId: string; bailId: string }) =>
      genererContratApi(bienId, bailId),
    onSuccess: (_data, { bienId, bailId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId, bailId] });
    },
  });
};

export const useUpdateContrat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId,
      bailId,
      contratId,
      contenu,
    }: {
      bienId: string;
      bailId: string;
      contratId: string;
      contenu: string;
    }) => updateContratApi(bienId, bailId, contratId, contenu),
    onSuccess: (_data, { bienId, bailId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId, bailId] });
    },
  });
};

export const useActiverContrat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId,
      bailId,
      contratId,
    }: {
      bienId: string;
      bailId: string;
      contratId: string;
    }) => activerContratApi(bienId, bailId, contratId),
    onSuccess: (_data, { bienId, bailId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId, bailId] });
    },
  });
};

export const useEnvoyerContrat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId,
      bailId,
      contratId,
    }: {
      bienId: string;
      bailId: string;
      contratId: string;
    }) => envoyerContratApi(bienId, bailId, contratId),
    onSuccess: (_data, { bienId, bailId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId, bailId] });
    },
  });
};
