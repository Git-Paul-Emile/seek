import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLocataireVerificationStatusApi,
  submitLocataireVerificationApi,
  cancelLocataireVerificationApi,
  type LocataireVerificationStatus,
  type SubmitLocataireVerificationPayload,
} from "@/api/locataireAuth";

export function useLocataireVerificationStatus() {
  return useQuery({
    queryKey: ["locataireVerification"],
    queryFn: async () => {
      const { data } = await getLocataireVerificationStatusApi();
      return data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true,
  });
}

export function useSubmitLocataireVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitLocataireVerificationPayload) => {
      const { data } = await submitLocataireVerificationApi(payload);
      return data.data;
    },
    onSuccess: () => {
      // Invalider et forcer le rechargement après un petit délai
      queryClient.invalidateQueries({ queryKey: ["locataireVerification"] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["locataireVerification"] });
      }, 100);
    },
  });
}

export function useCancelLocataireVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await cancelLocataireVerificationApi();
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locataireVerification"] });
    },
  });
}
