import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMeubles, fetchMeublesAdmin, createMeubles, updateMeuble, deleteMeuble } from "@/api/meuble";

const QK = "meubles";

export const useMeubles      = () => useQuery({ queryKey: [QK],          queryFn: fetchMeubles,      staleTime: 5 * 60 * 1000 });
export const useMeublesAdmin = () => useQuery({ queryKey: [QK, "admin"], queryFn: fetchMeublesAdmin });

export const useCreateMeubles = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { items: { nom: string; categorieId: string }[] }) => createMeubles(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useUpdateMeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nom?: string; categorieId?: string; actif?: boolean } }) =>
      updateMeuble(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useDeleteMeuble = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMeuble(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};
