import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategoriesEquipement,
  fetchCategoriesEquipementAdmin,
  createCategorieEquipement,
  updateCategorieEquipement,
  deleteCategorieEquipement,
  type CreateCategorieEquipementPayload,
  type UpdateCategorieEquipementPayload,
} from "@/api/categorieEquipement";

const QUERY_KEY = "categories-equipement";

// ─── Public ───────────────────────────────────────────────────────────────────

export const useCategoriesEquipement = () =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn:  fetchCategoriesEquipement,
    staleTime: 5 * 60 * 1000, // 5 min - données stables
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const useCategoriesEquipementAdmin = () =>
  useQuery({
    queryKey: [QUERY_KEY, "admin"],
    queryFn:  fetchCategoriesEquipementAdmin,
  });

export const useCreateCategorieEquipement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategorieEquipementPayload) => createCategorieEquipement(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateCategorieEquipement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategorieEquipementPayload }) =>
      updateCategorieEquipement(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteCategorieEquipement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategorieEquipement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
