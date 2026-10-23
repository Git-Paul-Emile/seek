import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTypesTransaction,
  fetchTypesTransactionAdmin,
  createTypeTransaction,
  updateTypeTransaction,
  deleteTypeTransaction,
  type CreateTypeTransactionPayload,
  type UpdateTypeTransactionPayload,
} from "@/api/typeTransaction";

const QUERY_KEY = "types-transaction";

// ─── Public ───────────────────────────────────────────────────────────────────

export const useTypeTransactions = () =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn:  fetchTypesTransaction,
    staleTime: 5 * 60 * 1000,
  });

// ─── Admin ────────────────────────────────────────────────────────────────────

export const useTypeTransactionsAdmin = () =>
  useQuery({
    queryKey: [QUERY_KEY, "admin"],
    queryFn:  fetchTypesTransactionAdmin,
  });

export const useCreateTypeTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTypeTransactionPayload) => createTypeTransaction(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useUpdateTypeTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTypeTransactionPayload }) =>
      updateTypeTransaction(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};

export const useDeleteTypeTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTypeTransaction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
};
