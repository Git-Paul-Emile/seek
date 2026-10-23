import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOwnerNotificationsApi,
  markOwnerNotificationsReadApi,
  markOwnerOneNotificationReadApi,
  getLocataireNotificationsApi,
  markLocataireNotificationsReadApi,
  markLocataireOneNotificationReadApi,
  getAdminNotificationsApi,
} from "@/api/notificationInApp";

// ─── Owner ────────────────────────────────────────────────────────────────────

export function useOwnerNotifications() {
  return useQuery({
    queryKey: ["owner-notifications"],
    queryFn: getOwnerNotificationsApi,
    refetchInterval: 30_000,
  });
}

export function useMarkOwnerNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markOwnerNotificationsReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-notifications"] }),
  });
}

export function useMarkOwnerOneNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markOwnerOneNotificationReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-notifications"] }),
  });
}

// ─── Locataire ────────────────────────────────────────────────────────────────

export function useLocataireNotifications() {
  return useQuery({
    queryKey: ["locataire-notifications"],
    queryFn: getLocataireNotificationsApi,
    refetchInterval: 30_000,
  });
}

export function useMarkLocataireNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markLocataireNotificationsReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locataire-notifications"] }),
  });
}

export function useMarkLocataireOneNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markLocataireOneNotificationReadApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locataire-notifications"] }),
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export function useAdminNotifications() {
  return useQuery({
    queryKey: ["admin-notifications"],
    queryFn: getAdminNotificationsApi,
    refetchInterval: 15_000,
  });
}
