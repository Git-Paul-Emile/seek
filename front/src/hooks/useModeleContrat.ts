import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModelesActifsApi,
  getModelesAdminApi,
  createModeleApi,
  updateModeleApi,
  deleteModeleApi,
  type ModeleContratPayload,
} from "@/api/modeleContrat";

const QK = "modeles-contrat";

/** Owner: modèles actifs pour sélection */
export const useModelesActifs = (typeBail?: string) =>
  useQuery({
    queryKey: [QK, "actifs", typeBail],
    queryFn: () => getModelesActifsApi(typeBail),
    staleTime: 5 * 60 * 1000,
  });

/** Admin: liste paginée */
export const useModelesAdmin = (params: {
  page: number;
  limit: number;
  typeBail?: string;
  actif?: boolean;
}) =>
  useQuery({
    queryKey: [QK, "admin", params],
    queryFn: () => getModelesAdminApi(params),
    staleTime: 1 * 60 * 1000,
  });

export const useCreateModele = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ModeleContratPayload) => createModeleApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
  });
};

export const useUpdateModele = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ModeleContratPayload> }) =>
      updateModeleApi(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
  });
};

export const useDeleteModele = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteModeleApi(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK] });
    },
  });
};
