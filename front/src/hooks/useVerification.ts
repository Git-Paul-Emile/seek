import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getVerificationStatusApi,
  submitVerificationApi,
  cancelVerificationApi,
  type VerificationStatus,
  type SubmitVerificationPayload,
} from "@/api/ownerAuth";

export function useVerificationStatus() {
  return useQuery({
    queryKey: ["ownerVerification"],
    queryFn: async () => {
      const { data } = await getVerificationStatusApi();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSubmitVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitVerificationPayload) =>
      submitVerificationApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerVerification"] });
    },
  });
}

export function useCancelVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelVerificationApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerVerification"] });
    },
  });
}
