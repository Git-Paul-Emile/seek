import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategoriesChamp,
  createCategorieChamp,
  updateCategorieChamp,
  deleteCategorieChamp,
} from "@/api/categorieChamp";

const QK = "categories-champ";

export const useCategoriesChamp = () =>
  useQuery({ queryKey: [QK], queryFn: fetchCategoriesChamp });

export const useCreateCategorieChamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { nom: string; ordre?: number }) => createCategorieChamp(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useUpdateCategorieChamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nom?: string; ordre?: number } }) =>
      updateCategorieChamp(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useDeleteCategorieChamp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategorieChamp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};
