import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listDocumentsBienApi,
  uploadDocumentBienApi,
  deleteDocumentBienApi,
} from "@/api/documentBien";

export function useDocumentsBien(bienId: string) {
  return useQuery({
    queryKey: ["documents-bien", bienId],
    queryFn: () => listDocumentsBienApi(bienId),
    enabled: !!bienId,
  });
}

export function useUploadDocumentBien(bienId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, type }: { file: File; type: string }) =>
      uploadDocumentBienApi(bienId, file, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents-bien", bienId] }),
  });
}

export function useDeleteDocumentBien(bienId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => deleteDocumentBienApi(bienId, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents-bien", bienId] }),
  });
}
