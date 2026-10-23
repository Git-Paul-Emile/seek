import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBailActifApi,
  creerBailApi,
  annulerBailApi,
  terminerBailApi,
  resilierBailApi,
  prolongerBailApi,
  getEcheancierApi,
  payerEcheanceApi,
  payerMoisMultiplesApi,
  getCautionApi,
  restituerCautionApi,
  getMobileMoneyApi,
  getSoldeApi,
  mettreEnPreavisApi,
  mettreEnRenouvellementApi,
  archiverBailApi,
  getBailAArchiverApi,
  getHistoriqueBailsApi,
  prolongerEcheancesAnneeApi,
  confirmerReceptionApi,
  enregistrerPaiementEspecesApi,
  getBiensAvecBailActifApi,
  type CreateBailPayload,
  type PayerEcheancePayload,
  type PayerMoisMultiplesPayload,
  type EnregistrerEspecesPayload,
  type RestitutionCautionPayload,
  getBiensEnRetardApi,
  getTableauDeBordApi,
} from "@/api/bail";
import { confirmerPaiementEspecesApi } from "@/api/locataireAuth";
import {
  mettreEnPreavisLocataireApi,
  resilierBailLocataireApi,
  getMessagesBailLocataireApi,
  marquerMessagesBailLocataireLusApi,
} from "@/api/locataireAuth";
import {
  getMessagesBailOwnerApi,
  marquerMessagesBailOwnerLusApi,
  getBiensSansEdlApi,
} from "@/api/ownerAuth";

const QK = "bail";
const QK_BIENS = "biens";

export const useBailActif = (bienId: string) =>
  useQuery({
    queryKey: [QK, bienId],
    queryFn: () => getBailActifApi(bienId),
    enabled: !!bienId,
    staleTime: 2 * 60 * 1000,
  });

export const useCreerBail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, payload }: { bienId: string; payload: CreateBailPayload }) =>
      creerBailApi(bienId, payload),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS] });
    },
  });
};

export const useAnnulerBail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId }: { bienId: string; bailId: string }) =>
      annulerBailApi(bienId, bailId),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS] });
    },
  });
};

export const useTerminerBail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId }: { bienId: string; bailId: string }) =>
      terminerBailApi(bienId, bailId),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS] });
    },
  });
};

export const useResilierBail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId, motif }: { bienId: string; bailId: string; motif?: string }) =>
      resilierBailApi(bienId, bailId, motif),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS] });
    },
  });
};

export const useProlongerBail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId,
      bailId,
      duree,
    }: {
      bienId: string;
      bailId: string;
      duree: 6 | 12;
    }) => prolongerBailApi(bienId, bailId, duree),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
    },
  });
};

// ─── Échéancier ───────────────────────────────────────────────────────────────

export const useEcheancier = (bienId: string, bailId: string) =>
  useQuery({
    queryKey: ["echeancier", bailId],
    queryFn: () => getEcheancierApi(bienId, bailId),
    enabled: !!bienId && !!bailId,
    staleTime: 60 * 1000,
  });

export const usePayerEcheance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId, bailId, echeanceId, payload,
    }: { bienId: string; bailId: string; echeanceId: string; payload: PayerEcheancePayload }) =>
      payerEcheanceApi(bienId, bailId, echeanceId, payload),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
    },
  });
};

// ─── Caution ──────────────────────────────────────────────────────────────────

export const useCaution = (bienId: string, bailId: string) =>
  useQuery({
    queryKey: ["caution", bailId],
    queryFn: () => getCautionApi(bienId, bailId),
    enabled: !!bienId && !!bailId,
    staleTime: 2 * 60 * 1000,
  });

export const useRestituerCaution = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId, bailId, payload,
    }: { bienId: string; bailId: string; payload: { montantRestitue: number; motifRetenue?: string; dateRestitution?: string } }) =>
      restituerCautionApi(bienId, bailId, payload),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["caution", bailId] });
    },
  });
};

// ─── Mobile Money ─────────────────────────────────────────────────────────────

export const useMobileMoney = (bienId: string) =>
  useQuery({
    queryKey: ["mobile-money", bienId],
    queryFn: () => getMobileMoneyApi(bienId),
    enabled: !!bienId,
    staleTime: 10 * 60 * 1000,
  });

// ─── Solde ────────────────────────────────────────────────────────────────────

export const useSolde = (bienId: string, bailId: string) =>
  useQuery({
    queryKey: ["solde", bailId],
    queryFn: () => getSoldeApi(bienId, bailId),
    enabled: !!bienId && !!bailId,
    staleTime: 60 * 1000,
  });

export const usePayerEcheanceAvecInvalidation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId, bailId, echeanceId, payload,
    }: { bienId: string; bailId: string; echeanceId: string; payload: PayerEcheancePayload }) =>
      payerEcheanceApi(bienId, bailId, echeanceId, payload),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
      qc.invalidateQueries({ queryKey: ["solde", bailId] });
    },
  });
};

export const usePayerMoisMultiples = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId, bailId, payload,
    }: { bienId: string; bailId: string; payload: PayerMoisMultiplesPayload }) =>
      payerMoisMultiplesApi(bienId, bailId, payload),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
      qc.invalidateQueries({ queryKey: ["solde", bailId] });
    },
  });
};

// ─── Fin de bail ──────────────────────────────────────────────────────────────

export const useHistoriqueBails = (bienId: string) =>
  useQuery({
    queryKey: [QK + "_historique", bienId],
    queryFn: () => getHistoriqueBailsApi(bienId),
    enabled: !!bienId,
    staleTime: 2 * 60 * 1000,
  });

export const useBailAArchiver = (bienId: string) =>
  useQuery({
    queryKey: [QK + "_a_archiver", bienId],
    queryFn: () => getBailAArchiverApi(bienId),
    enabled: !!bienId,
    staleTime: 60 * 1000,
  });

export const useMettreEnPreavis = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId }: { bienId: string; bailId: string }) =>
      mettreEnPreavisApi(bienId, bailId),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
    },
  });
};

export const useMettreEnRenouvellement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId }: { bienId: string; bailId: string }) =>
      mettreEnRenouvellementApi(bienId, bailId),
    onSuccess: (_data, { bienId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
    },
  });
};

export const useProlongerEcheancesAnnee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId, anneeActuelle }: { bienId: string; bailId: string; anneeActuelle: number }) =>
      prolongerEcheancesAnneeApi(bienId, bailId, anneeActuelle),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
      qc.invalidateQueries({ queryKey: ["solde", bailId] });
    },
  });
};

export const useConfirmerReception = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId, echeanceId }: { bienId: string; bailId: string; echeanceId: string }) =>
      confirmerReceptionApi(bienId, bailId, echeanceId),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
      qc.invalidateQueries({ queryKey: ["owner-tableau-de-bord"] });
    },
  });
};

export const useEnregistrerPaiementEspeces = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      bienId, bailId, echeanceId, payload,
    }: { bienId: string; bailId: string; echeanceId: string; payload: EnregistrerEspecesPayload }) =>
      enregistrerPaiementEspecesApi(bienId, bailId, echeanceId, payload),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
      qc.invalidateQueries({ queryKey: ["solde", bailId] });
    },
  });
};

export const useConfirmerPaiementEspeces = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ echeanceId, bailId }: { echeanceId: string; bailId: string }) =>
      confirmerPaiementEspecesApi(echeanceId),
    onSuccess: (_data, { bailId }) => {
      qc.invalidateQueries({ queryKey: ["echeancier", bailId] });
      qc.invalidateQueries({ queryKey: ["locataire-echeancier"] });
      qc.invalidateQueries({ queryKey: ["quittance", "locataire"] });
    },
  });
};

export const useArchiverBail = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bienId, bailId, restitution }: { bienId: string; bailId: string; restitution?: RestitutionCautionPayload }) =>
      archiverBailApi(bienId, bailId, restitution),
    onSuccess: (_data, { bienId, bailId }) => {
      qc.invalidateQueries({ queryKey: [QK, bienId] });
      qc.invalidateQueries({ queryKey: [QK + "_a_archiver", bienId] });
      qc.invalidateQueries({ queryKey: ["caution", bailId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS, bienId] });
      qc.invalidateQueries({ queryKey: [QK_BIENS] });
    },
  });
};

// ─── Actions bail côté locataire ──────────────────────────────────────────────

export const useMettreEnPreavisLocataire = () =>
  useMutation({
    mutationFn: ({ motif }: { motif?: string }) => mettreEnPreavisLocataireApi(motif),
  });

export const useResilierBailLocataire = () =>
  useMutation({
    mutationFn: ({ motif }: { motif?: string }) => resilierBailLocataireApi(motif),
  });

// ─── Messages bail owner ───────────────────────────────────────────────────────

export const useMessagesBailOwner = () =>
  useQuery({
    queryKey: ["messages-bail-owner"],
    queryFn: getMessagesBailOwnerApi,
    staleTime: 30 * 1000,
  });

export const useMarquerMessagesBailOwnerLus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marquerMessagesBailOwnerLusApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages-bail-owner"] }),
  });
};

// ─── Messages bail locataire ───────────────────────────────────────────────────

export const useMessagesBailLocataire = () =>
  useQuery({
    queryKey: ["messages-bail-locataire"],
    queryFn: getMessagesBailLocataireApi,
    staleTime: 30 * 1000,
  });

export const useMarquerMessagesBailLocataireLus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: marquerMessagesBailLocataireLusApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages-bail-locataire"] }),
  });
};

export const useBiensSansEdl = () =>
  useQuery({
    queryKey: ["biens-sans-edl"],
    queryFn: getBiensSansEdlApi,
    staleTime: 30 * 1000,
  });

// ─── Biens avec loyers en retard ──────────────────────────────────────────────

export const useBiensAvecBailActif = () =>
  useQuery({
    queryKey: ["biensAvecBailActif"],
    queryFn: getBiensAvecBailActifApi,
    staleTime: 2 * 60 * 1000,
  });

export const useBiensEnRetard = () =>
  useQuery({
    queryKey: ["biens-en-retard"],
    queryFn: getBiensEnRetardApi,
    staleTime: 60 * 1000,
  });

export const useTableauDeBord = () =>
  useQuery({
    queryKey: ["owner-tableau-de-bord"],
    queryFn: getTableauDeBordApi,
    staleTime: 60 * 1000,
  });
