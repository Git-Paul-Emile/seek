import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLocataireEcheancierApi,
  payerEcheancesLocataireApi,
  getLocataireHistoriqueApi,
  supprimerCompteLocataireApi,
  getAlerteEdlManquantApi,
  demanderEtatDesLieuxApi,
  type PayerEcheancesLocatairePayload,
} from "@/api/locataireAuth";

export const useLocataireEcheancier = (enabled: boolean) =>
  useQuery({
    queryKey: ["locataire-echeancier"],
    queryFn: getLocataireEcheancierApi,
    enabled,
  });

export const usePayerEcheancesLocataire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayerEcheancesLocatairePayload) =>
      payerEcheancesLocataireApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locataire-echeancier"] });
    },
  });
};

export const useLocataireHistorique = () =>
  useQuery({
    queryKey: ["locataire-historique"],
    queryFn: getLocataireHistoriqueApi,
    staleTime: 2 * 60 * 1000,
  });

export const useSupprimerCompteLocataire = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supprimerCompteLocataireApi,
    onSuccess: () => {
      qc.clear();
    },
  });
};

export const useAlerteEdlManquant = (enabled: boolean) =>
  useQuery({
    queryKey: ["locataire-edl-manquant"],
    queryFn: getAlerteEdlManquantApi,
    enabled,
    staleTime: 30 * 1000,
  });

export const useDemanderEtatDesLieux = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: demanderEtatDesLieuxApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["locataire-edl-manquant"] });
      qc.invalidateQueries({ queryKey: ["messages-bail-owner"] });
      qc.invalidateQueries({ queryKey: ["owner-notifications"] });
    },
  });
};
