import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAnnoncesPendingCount,
  fetchAnnoncesAdmin,
  fetchAnnoncesStatusCounts,
  validerAnnonce,
  deleteAnnonceAdmin,
  type AnnoncesAdminParams,
} from "@/api/bien";

const QK_COUNT = "annonces-pending-count";
const QK_COUNTS = "annonces-status-counts";
const QK_LIST = "annonces-admin";

export const useAnnoncesPendingCount = () =>
  useQuery({
    queryKey: [QK_COUNT],
    queryFn: fetchAnnoncesPendingCount,
    staleTime: 30 * 1000,
    refetchInterval: 10 * 1000,
  });

export const useAnnoncesStatusCounts = () =>
  useQuery({
    queryKey: [QK_COUNTS],
    queryFn: fetchAnnoncesStatusCounts,
    staleTime: 30 * 1000,
  });

export const useAnnoncesAdmin = (params?: AnnoncesAdminParams) =>
  useQuery({
    queryKey: [QK_LIST, params],
    queryFn: () => fetchAnnoncesAdmin(params),
    staleTime: 30 * 1000,
    // Garde la page affichée pendant la frappe dans la recherche, au lieu d'un écran vide.
    placeholderData: keepPreviousData,
  });

export const useValiderAnnonce = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: "APPROUVER" | "REJETER";
      note?: string;
    }) => validerAnnonce(id, action, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_LIST] });
      qc.invalidateQueries({ queryKey: [QK_COUNT] });
      qc.invalidateQueries({ queryKey: [QK_COUNTS] });
    },
  });
};

export const useDeleteAnnonceAdmin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAnnonceAdmin(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_LIST] });
      qc.invalidateQueries({ queryKey: [QK_COUNT] });
      qc.invalidateQueries({ queryKey: [QK_COUNTS] });
    },
  });
};
