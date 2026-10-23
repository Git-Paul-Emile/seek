import { useQuery, useMutation, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import {
  getPendingVerificationsApi,
  getPendingVerificationsCountApi,
  approveVerificationApi,
  rejectVerificationApi,
  type PendingVerification,
} from "@/api/ownerAuth";

export function usePendingVerificationsCount() {
  const query = useQuery<number, Error>({
    queryKey: ["adminPendingVerificationsCount"],
    queryFn: async () => {
      const { data } = await getPendingVerificationsCountApi();
      // L'API retourne { status: "success", data: { count: number } }
      return data.data.count;
    },
    staleTime: 30 * 1000,
    refetchInterval: 10 * 1000, // Actualisation toutes les 10 secondes
  });

  return query;
}

export function usePendingVerifications(): UseQueryResult<PendingVerification[], Error> {
  const query = useQuery<PendingVerification[], Error>({
    queryKey: ["adminPendingVerifications"],
    queryFn: async () => {
      const { data } = await getPendingVerificationsApi();
      return data.data;
    },
    staleTime: 30 * 1000,
    refetchInterval: 10 * 1000, // Actualisation toutes les 10 secondes
  });

  return query;
}

export function useApproveVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proprietaireId: string) =>
      approveVerificationApi(proprietaireId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerificationsCount"] });
    },
  });
}

export function useRejectVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ proprietaireId, motif }: { proprietaireId: string; motif: string }) =>
      rejectVerificationApi(proprietaireId, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerifications"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingVerificationsCount"] });
    },
  });
}
