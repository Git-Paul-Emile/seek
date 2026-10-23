import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEquipements, fetchEquipementsAdmin, createEquipements, updateEquipement, deleteEquipement } from "@/api/equipement";

const QK = "equipements";

export const useEquipements      = () => useQuery({ queryKey: [QK],          queryFn: fetchEquipements,      staleTime: 5 * 60 * 1000 });
export const useEquipementsAdmin = () => useQuery({ queryKey: [QK, "admin"], queryFn: fetchEquipementsAdmin });

export const useCreateEquipements = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { items: { nom: string; categorieId: string }[] }) => createEquipements(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useUpdateEquipement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nom?: string; categorieId?: string; actif?: boolean } }) =>
      updateEquipement(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useDeleteEquipement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEquipement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};
