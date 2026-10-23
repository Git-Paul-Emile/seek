import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchPays,
  fetchVilles,
  fetchQuartiersByVille,
  fetchAllPaysAdmin,
  fetchAllVillesAdmin,
  fetchAllQuartiersAdmin,
  createPaysApi,
  updatePaysApi,
  deletePaysApi,
  createVilleApi,
  updateVilleApi,
  deleteVilleApi,
  createQuartierApi,
  updateQuartierApi,
  deleteQuartierApi,
} from "@/api/geo";

// ─── Public ───────────────────────────────────────────────────────────────────

export const usePays = () =>
  useQuery({ queryKey: ["pays"], queryFn: fetchPays, staleTime: 10 * 60 * 1000 });

export const useVilles = (paysId: string | null) =>
  useQuery({
    queryKey: ["villes", paysId],
    queryFn: () => fetchVilles(paysId!),
    enabled: !!paysId,
    staleTime: 10 * 60 * 1000,
  });

export const useQuartiers = (villeId: string | null) =>
  useQuery({
    queryKey: ["quartiers", villeId],
    queryFn: () => fetchQuartiersByVille(villeId!),
    enabled: !!villeId,
    staleTime: 10 * 60 * 1000,
  });

// ─── Admin - Pays ─────────────────────────────────────────────────────────────

export const useAllPaysAdmin = () =>
  useQuery({ queryKey: ["admin", "pays"], queryFn: fetchAllPaysAdmin });

export const useCreatePays = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPaysApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pays"] });
      qc.invalidateQueries({ queryKey: ["pays"] });
    },
  });
};

export const useUpdatePays = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nom?: string; code?: string } }) =>
      updatePaysApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pays"] });
      qc.invalidateQueries({ queryKey: ["pays"] });
    },
  });
};

export const useDeletePays = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePaysApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "pays"] });
      qc.invalidateQueries({ queryKey: ["pays"] });
    },
  });
};

// ─── Admin - Villes ───────────────────────────────────────────────────────────

export const useAllVillesAdmin = (paysId?: string) =>
  useQuery({
    queryKey: ["admin", "villes", paysId ?? "all"],
    queryFn: () => fetchAllVillesAdmin(paysId),
  });

export const useCreateVille = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createVilleApi,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "villes"] });
      qc.invalidateQueries({ queryKey: ["villes", vars.paysId] });
    },
  });
};

export const useUpdateVille = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { nom?: string; paysId?: string } }) =>
      updateVilleApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "villes"] });
      qc.invalidateQueries({ queryKey: ["villes"] });
    },
  });
};

export const useDeleteVille = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteVilleApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "villes"] });
      qc.invalidateQueries({ queryKey: ["villes"] });
    },
  });
};

// ─── Admin - Quartiers ────────────────────────────────────────────────────────

export const useAllQuartiersAdmin = (villeId?: string) =>
  useQuery({
    queryKey: ["admin", "quartiers", villeId ?? "all"],
    queryFn: () => fetchAllQuartiersAdmin(villeId),
  });

export const useCreateQuartier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createQuartierApi,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "quartiers"] });
      qc.invalidateQueries({ queryKey: ["quartiers", vars.villeId] });
    },
  });
};

export const useUpdateQuartier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { nom?: string; villeId?: string; latitude?: number; longitude?: number };
    }) => updateQuartierApi(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quartiers"] });
      qc.invalidateQueries({ queryKey: ["quartiers"] });
    },
  });
};

export const useDeleteQuartier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteQuartierApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "quartiers"] });
      qc.invalidateQueries({ queryKey: ["quartiers"] });
    },
  });
};
