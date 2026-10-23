import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchChampsForTypeLogement,
  fetchChampsAdminState,
  setChampsForTypeLogement,
} from "@/api/typeLogementChamp";

const QK = "type-logement-champs";

export const useChampsForTypeLogement = (typeLogementId: string) =>
  useQuery({
    queryKey: [QK, typeLogementId],
    queryFn: () => fetchChampsForTypeLogement(typeLogementId),
    enabled: !!typeLogementId,
    staleTime: 5 * 60 * 1000,
  });

export const useChampsAdminState = (typeLogementId: string) =>
  useQuery({
    queryKey: [QK, typeLogementId, "admin"],
    queryFn: () => fetchChampsAdminState(typeLogementId),
    enabled: !!typeLogementId,
  });

export const useSetChampsForTypeLogement = (typeLogementId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (champs: { champId: string; obligatoire: boolean; ordre: number }[]) =>
      setChampsForTypeLogement(typeLogementId, champs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK, typeLogementId] });
      qc.invalidateQueries({ queryKey: [QK, typeLogementId, "admin"] });
    },
  });
};
