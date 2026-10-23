import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchChamps,
  fetchChampsAdmin,
  createChamp,
  updateChamp,
  deleteChamp,
} from "@/api/champ";
import type { CreateChampPayload } from "@/api/champ";

const QK = "champs";

export const useChamps = () =>
  useQuery({ queryKey: [QK], queryFn: fetchChamps, staleTime: 5 * 60 * 1000 });

export const useChampsAdmin = () =>
  useQuery({ queryKey: [QK, "admin"], queryFn: fetchChampsAdmin });

export const useCreateChamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChampPayload) => createChamp(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useUpdateChamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateChampPayload & { actif: boolean }> }) =>
      updateChamp(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useDeleteChamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChamp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};
