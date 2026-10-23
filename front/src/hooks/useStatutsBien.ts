import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStatutsBien,
  fetchStatutsBienAdmin,
  createStatutBien,
  updateStatutBien,
  deleteStatutBien,
  type CreateStatutBienPayload,
  type UpdateStatutBienPayload,
} from "@/api/statutBien";

const QUERY_KEY = "statuts-bien";

// ─── Public ───────────────────────────────────────────────────────────────────

export const useStatutsBien = () =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn:  fetchStatutsBien,
    staleTime: 5 * 60 * 1000,
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const useStatutsBienAdmin = () =>
  useQuery({
    queryKey: [QUERY_KEY, "admin"],
    queryFn:  fetchStatutsBienAdmin,
  });

export const useCreateStatutBien = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStatutBienPayload) => createStatutBien(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateStatutBien = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStatutBienPayload }) =>
      updateStatutBien(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteStatutBien = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStatutBien(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
