import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  suspendreProprietaireApi,
  reactiverProprietaireApi,
  getStatutSuspensionProprietaireApi,
  suspendreLocataireApi,
  reactiverLocataireApi,
  getStatutSuspensionLocataireApi,
  getProprietairesApi,
  getProprietaireByIdApi,
  getLocatairesApi,
  getLocataireByIdApi,
  supprimerProprietaireApi,
  supprimerLocataireApi,
  getProprietaireWithBiensApi,
  getLocataireWithBailsApi,
  getLocataireAvecDocumentsApi,
  type SuspensionInfo,
  type ProprietaireListItem,
  type LocataireListItem,
} from "@/api/suspension";

// ─── Hooks pour la liste des propriétaires ───────────────────────────────────

export function useProprietaires(filter?: { estSuspendu?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["suspensionProprietaires", filter],
    queryFn: () => getProprietairesApi(filter),
  });
}

export function useProprietaireById(id: string) {
  return useQuery({
    queryKey: ["suspensionProprietaire", id],
    queryFn: () => getProprietaireByIdApi(id),
    enabled: !!id,
  });
}

// ─── Hooks pour la liste des locataires ─────────────────────────────────────

export function useLocataires(filter?: { estSuspendu?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["suspensionLocataires", filter],
    queryFn: () => getLocatairesApi(filter),
  });
}

export function useLocataireById(id: string) {
  return useQuery({
    queryKey: ["suspensionLocataire", id],
    queryFn: () => getLocataireByIdApi(id),
    enabled: !!id,
  });
}

// ─── Hooks pour Propriétaire ───────────────────────────────────────────────────

export function useSuspendreProprietaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motif, masquerAnnonces = true }: { id: string; motif: string; masquerAnnonces?: boolean }) =>
      suspendreProprietaireApi(id, motif, masquerAnnonces),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proprietaires"] });
      queryClient.invalidateQueries({ queryKey: ["adminProprietaires"] });
      queryClient.invalidateQueries({ queryKey: ["suspensionProprietaires"] });
    },
  });
}

export function useReactiverProprietaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, afficherAnnonces = true }: { id: string; afficherAnnonces?: boolean }) =>
      reactiverProprietaireApi(id, afficherAnnonces),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proprietaires"] });
      queryClient.invalidateQueries({ queryKey: ["adminProprietaires"] });
      queryClient.invalidateQueries({ queryKey: ["suspensionProprietaires"] });
    },
  });
}

export function useStatutSuspensionProprietaire(id: string) {
  return useMutation({
    mutationFn: () => getStatutSuspensionProprietaireApi(id),
  });
}

// ─── Hooks pour Locataire ─────────────────────────────────────────────────────

export function useSuspendreLocataire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, motif }: { id: string; motif: string }) =>
      suspendreLocataireApi(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locataires"] });
      queryClient.invalidateQueries({ queryKey: ["adminLocataires"] });
      queryClient.invalidateQueries({ queryKey: ["suspensionLocataires"] });
    },
  });
}

export function useReactiverLocataire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => reactiverLocataireApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locataires"] });
      queryClient.invalidateQueries({ queryKey: ["adminLocataires"] });
      queryClient.invalidateQueries({ queryKey: ["suspensionLocataires"] });
    },
  });
}

export function useStatutSuspensionLocataire(id: string) {
  return useMutation({
    mutationFn: () => getStatutSuspensionLocataireApi(id),
  });
}

// ─── Supprimer un propriétaire ─────────────────────────────────────────────────

export function useSupprimerProprietaire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supprimerProprietaireApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspensionProprietaires"] });
    },
  });
}

// ─── Supprimer un locataire ─────────────────────────────────────────────────

export function useSupprimerLocataire() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supprimerLocataireApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspensionLocataires"] });
    },
  });
}

// ─── Détails d'un propriétaire avec ses biens ────────────────────────────────

export function useProprietaireWithBiens(id: string) {
  return useQuery({
    queryKey: ["proprietaireWithBiens", id],
    queryFn: () => getProprietaireWithBiensApi(id),
    enabled: !!id,
  });
}

// ─── Détails d'un locataire avec ses baux ───────────────────────────────────

export function useLocataireWithBails(id: string) {
  return useQuery({
    queryKey: ["locataireWithBails", id],
    queryFn: () => getLocataireWithBailsApi(id),
    enabled: !!id,
  });
}

// ─── Locataire avec documents de vérification ────────────────────────────────

export function useLocataireAvecDocuments(id: string) {
  return useQuery({
    queryKey: ["locataireAvecDocuments", id],
    queryFn: () => getLocataireAvecDocumentsApi(id),
    enabled: !!id,
  });
}
