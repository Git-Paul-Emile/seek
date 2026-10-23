import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBailInvitationApi,
  getLocataireInvitationsApi,
  accepterInvitationApi,
  refuserInvitationApi,
  type CreateInvitationPayload,
} from "@/api/bailInvitation";

const QK_INVITATIONS = "bail-invitations";

// ─── Owner : créer une invitation ─────────────────────────────────────────────

export const useCreateBailInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvitationPayload) => createBailInvitationApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_INVITATIONS] });
    },
  });
};

// ─── Locataire : voir ses invitations ─────────────────────────────────────────

export const useLocataireInvitations = () =>
  useQuery({
    queryKey: [QK_INVITATIONS, "locataire"],
    queryFn: getLocataireInvitationsApi,
    staleTime: 30 * 1000,
  });

// ─── Locataire : accepter ─────────────────────────────────────────────────────

export const useAccepterInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => accepterInvitationApi(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_INVITATIONS] });
      // Invalide aussi le me locataire pour récupérer le nouveau bail
      qc.invalidateQueries({ queryKey: ["locataire-me"] });
    },
  });
};

// ─── Locataire : refuser ──────────────────────────────────────────────────────

export const useRefuserInvitation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => refuserInvitationApi(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QK_INVITATIONS] });
    },
  });
};
