import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBien,
  fetchBiens,
  fetchBienById,
  fetchOwnerStats,
  soumettreAnnonce,
  deleteBien,
  retourBrouillon,
  annulerAnnonce,
  fetchStatsFavorisBien,
  fetchDraft,
  saveDraft,
  type SaveDraftPayload,
  type CreateBienPayload,
} from "@/api/bien";

const QK = "biens";

export const useBiens = () =>
  useQuery({ queryKey: [QK], queryFn: fetchBiens, staleTime: 2 * 60 * 1000 });

export const useOwnerStats = () =>
  useQuery({
    queryKey: [QK, "stats"],
    queryFn: fetchOwnerStats,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 10 * 1000,
  });

export const useBienById = (id: string) =>
  useQuery({
    queryKey: [QK, id],
    queryFn: () => fetchBienById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

/** Brouillon en cours du propriétaire (un seul par compte côté serveur). */
export const useBrouillonBien = (enabled: boolean) =>
  useQuery({ queryKey: [QK, "brouillon"], queryFn: fetchDraft, enabled, staleTime: 0 });

/** Enregistrement silencieux du brouillon, sans nouvelle photo (envoyées à la soumission). */
export const useEnregistrerBrouillon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveDraftPayload) => saveDraft(payload, []),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useCreateBien = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      photos,
      video,
    }: {
      payload: CreateBienPayload;
      photos: File[];
      video?: File | null;
    }) => createBien(payload, photos, video),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useSoumettreBien = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => soumettreAnnonce(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useDeleteBien = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBien(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useRetourBrouillon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retourBrouillon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useAnnulerAnnonce = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => annulerAnnonce(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useStatsFavorisBien = (bienId: string | undefined) =>
  useQuery({
    queryKey: ["stats-favoris-bien", bienId],
    queryFn: () => fetchStatsFavorisBien(bienId!),
    enabled: !!bienId,
    staleTime: 60 * 1000,
  });
