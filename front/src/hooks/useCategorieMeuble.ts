import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCategoriesMeuble,
  fetchCategoriesMeubleAdmin,
  createCategorieMeuble,
  updateCategorieMeuble,
  deleteCategorieMeuble,
  type CreateCategorieMeublePayload,
  type UpdateCategorieMeublePayload,
} from "@/api/categorieMeuble";

const QUERY_KEY = "categories-meuble";

// ─── Public ───────────────────────────────────────────────────────────────────

export const useCategoriesMeuble = () =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn:  fetchCategoriesMeuble,
    staleTime: 5 * 60 * 1000, // 5 min - données stables
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const useCategoriesMeubleAdmin = () =>
  useQuery({
    queryKey: [QUERY_KEY, "admin"],
    queryFn:  fetchCategoriesMeubleAdmin,
  });

export const useCreateCategorieMeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategorieMeublePayload) => createCategorieMeuble(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateCategorieMeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategorieMeublePayload }) =>
      updateCategorieMeuble(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteCategorieMeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategorieMeuble(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
