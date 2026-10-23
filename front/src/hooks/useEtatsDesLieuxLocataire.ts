import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  contesterElementsLocataire,
  getAllEtatsDesLieuxLocataire,
  getEtatDesLieuxLocataire,
  validateEtatDesLieux,
} from "@/api/etatDesLieux.api";

// États des lieux vus par le locataire : liste, détail, signature et contestation.

const QK = "locataire-etats-des-lieux";

export const useEtatsDesLieuxLocataire = () =>
  useQuery({ queryKey: [QK], queryFn: getAllEtatsDesLieuxLocataire, retry: false });

export const useEtatDesLieuxLocataire = (id: string | undefined) =>
  useQuery({ queryKey: [QK, id], queryFn: () => getEtatDesLieuxLocataire(id as string), enabled: Boolean(id) });

export const useSignerEtatDesLieux = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => validateEtatDesLieux(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};

export interface ContestationElement {
  elementId: string;
  motifContestation: string;
  photoContestation: string;
}

export const useContesterEtatDesLieux = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, elements }: { id: string; elements: ContestationElement[] }) => contesterElementsLocataire(id, elements),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QK] }),
  });
};
