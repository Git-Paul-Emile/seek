import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getConfigApi, updateConfigApi } from "@/api/monetisation";

// ─── Config ───────────────────────────────────────────────────────────────────

export function useConfigMonetisation() {
  return useQuery({
    queryKey: ["monetisation-config"],
    queryFn: getConfigApi,
  });
}

export function useUpdateConfigMonetisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateConfigApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["monetisation-config"] });
    },
  });
}
