import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTypesLogement,
  fetchTypesLogementAdmin,
  createTypeLogement,
  updateTypeLogement,
  deleteTypeLogement,
  type CreateTypeLogementPayload,
  type UpdateTypeLogementPayload,
} from "@/api/typeLogement";

const QUERY_KEY = "types-logement";

// ─── Public ───────────────────────────────────────────────────────────────────

export const useTypeLogements = () =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn:  fetchTypesLogement,
    staleTime: 5 * 60 * 1000, // 5 min - données stables
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const useTypeLogementsAdmin = () =>
  useQuery({
    queryKey: [QUERY_KEY, "admin"],
    queryFn:  fetchTypesLogementAdmin,
  });

export const useCreateTypeLogement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTypeLogementPayload) => createTypeLogement(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateTypeLogement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTypeLogementPayload }) =>
      updateTypeLogement(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteTypeLogement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTypeLogement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
