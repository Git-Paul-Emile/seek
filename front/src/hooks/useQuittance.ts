import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getQuittanceApi,
  genererQuittanceApi,
  getQuittancesBailApi,
  envoyerRappelApi,
  getRappelsEcheanceApi,
  initierPaiementLocataireApi,
  getQuittancesLocataireApi,
  type InitierPaiementPayload,
} from "@/api/quittance";

const QK = "quittance";

// ─── Owner ─────────────────────────────────────────────────────────────────────

export const useQuittance = (bienId: string, bailId: string, echeanceId: string) =>
  useQuery({
    queryKey: [QK, echeanceId],
    queryFn: () => getQuittanceApi(bienId, bailId, echeanceId),
    enabled: !!bienId && !!bailId && !!echeanceId,
    staleTime: 5 * 60 * 1000,
  });

export const useGenererQuittance = () =>
  useMutation({
    mutationFn: ({
      bienId,
      bailId,
      echeanceId,
    }: { bienId: string; bailId: string; echeanceId: string }) =>
      genererQuittanceApi(bienId, bailId, echeanceId),
  });

export const useQuittancesBail = (bienId: string, bailId: string) =>
  useQuery({
    queryKey: [QK, "bail", bailId],
    queryFn: () => getQuittancesBailApi(bienId, bailId),
    enabled: !!bienId && !!bailId,
    staleTime: 2 * 60 * 1000,
  });

export const useEnvoyerRappel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId,
      bailId,
      echeanceId,
    }: { bienId: string; bailId: string; echeanceId: string }) =>
      envoyerRappelApi(bienId, bailId, echeanceId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["rappels", vars.echeanceId] });
    },
  });
};

export const useRappelsEcheance = (
  bienId: string,
  bailId: string,
  echeanceId: string,
  enabled = false
) =>
  useQuery({
    queryKey: ["rappels", echeanceId],
    queryFn: () => getRappelsEcheanceApi(bienId, bailId, echeanceId),
    enabled: !!bienId && !!bailId && !!echeanceId && enabled,
    staleTime: 0,
  });

// ─── Locataire ─────────────────────────────────────────────────────────────────

export const useInitierPaiementLocataire = () =>
  useMutation({
    mutationFn: (payload: InitierPaiementPayload) =>
      initierPaiementLocataireApi(payload),
  });

export const useQuittancesLocataire = (enabled = true) =>
  useQuery({
    queryKey: [QK, "locataire"],
    queryFn: () => getQuittancesLocataireApi(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
