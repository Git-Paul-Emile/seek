import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLocatairesApi,
  getLocataireByIdApi,
  createLocataireApi,
  updateLocataireApi,
  deleteLocataireApi,
  getLienActivationApi,
  approveLocataireVerificationApi,
  rejectLocataireVerificationApi,
  getPendingVerificationsCountApi,
  searchLocataireByContactApi,
  type CreateLocatairePayload,
  type UpdateLocatairePayload,
} from "@/api/locataire";

const QK = "locataires";

export const useLocataires = () =>
  useQuery({
    queryKey: [QK],
    queryFn: getLocatairesApi,
    staleTime: 2 * 60 * 1000,
  });

export const useLocataireById = (id: string) =>
  useQuery({
    queryKey: [QK, id],
    queryFn: () => getLocataireByIdApi(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
  });

export const useCreateLocataire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLocatairePayload) => createLocataireApi(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useUpdateLocataire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLocatairePayload }) =>
      updateLocataireApi(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK, id] });
    },
  });
};

export const useDeleteLocataire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLocataireApi(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export const useGetLienActivation = () =>
  useMutation({
    mutationFn: (id: string) => getLienActivationApi(id),
  });

// ─── Vérification du locataire ─────────────────────────────────────────────────

export const useApproveLocataireVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locataireId: string) => approveLocataireVerificationApi(locataireId),
    onSuccess: (_data, locataireId) => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK, locataireId] });
    },
  });
};

export const useRejectLocataireVerification = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locataireId, motif }: { locataireId: string; motif: string }) =>
      rejectLocataireVerificationApi(locataireId, motif),
    onSuccess: (_data, { locataireId }) => {
      qc.invalidateQueries({ queryKey: [QK] });
      qc.invalidateQueries({ queryKey: [QK, locataireId] });
    },
  });
};

// ─── Nombre de vérifications en attente ─────────────────────────────────────

export const usePendingVerificationsCount = () =>
  useQuery({
    queryKey: [QK, "pending-verifications-count"],
    queryFn: getPendingVerificationsCountApi,
    staleTime: 30 * 1000, // 30 secondes
  });

// ─── Recherche globale par téléphone/email ────────────────────────────────────

export const useSearchLocataire = (params: { telephone?: string; email?: string }) =>
  useQuery({
    queryKey: [QK, "search", params.telephone, params.email],
    queryFn: () => searchLocataireByContactApi(params),
    enabled: !!(params.telephone?.trim() || params.email?.trim()),
    staleTime: 30 * 1000,
  });
