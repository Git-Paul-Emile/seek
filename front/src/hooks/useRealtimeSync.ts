/**
 * useRealtimeSync — Synchronisation temps réel via WebSocket → React Query
 *
 * Écoute les événements Socket.io et invalide automatiquement les caches
 * React Query correspondants. À appeler une seule fois dans chaque layout
 * (OwnerLayout, AdminLayout, LocataireLayout).
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService, SOCKET_EVENTS } from "@/services/socketService";

// ─── Owner ─────────────────────────────────────────────────────────────────────

export function useOwnerRealtimeSync(proprietaireId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!proprietaireId) return;

    const unsubs = [
      // Nouvelle notification → badge + liste notifs
      socketService.on(SOCKET_EVENTS.NOTIFICATION_NEW, (data) => {
        if (data.proprietaireId !== proprietaireId) return;
        qc.invalidateQueries({ queryKey: ["owner-notifications"] });
        qc.invalidateQueries({ queryKey: ["badge-count"] });
      }),

      // Mise à jour badge
      socketService.on(SOCKET_EVENTS.BADGE_UPDATE, (data) => {
        if (data.proprietaireId !== proprietaireId) return;
        qc.invalidateQueries({ queryKey: ["badge-count"] });
      }),

      // Bail mis à jour (créer, terminer, résilier, archiver, paiement)
      socketService.on(SOCKET_EVENTS.BAIL_UPDATED, (data) => {
        if (data.proprietaireId !== proprietaireId) return;
        qc.invalidateQueries({ queryKey: ["bail", data.bienId] });
        qc.invalidateQueries({ queryKey: ["bail_historique", data.bienId] });
        qc.invalidateQueries({ queryKey: ["bail_a_archiver", data.bienId] });
        qc.invalidateQueries({ queryKey: ["echeancier"] });
        qc.invalidateQueries({ queryKey: ["solde"] });
        qc.invalidateQueries({ queryKey: ["biensAvecBailActif"] });
        qc.invalidateQueries({ queryKey: ["biens-en-retard"] });
      }),

      // Bien mis à jour (statut changé)
      socketService.on(SOCKET_EVENTS.BIEN_UPDATED, (data) => {
        if (data.proprietaireId !== proprietaireId) return;
        qc.invalidateQueries({ queryKey: ["biens"] });
        qc.invalidateQueries({ queryKey: ["biens", data.bienId] });
      }),

      // Signalement validé → l'annonce a été supprimée
      socketService.on(SOCKET_EVENTS.SIGNALEMENT_UPDATED, (data) => {
        qc.invalidateQueries({ queryKey: ["biens"] });
        qc.invalidateQueries({ queryKey: ["biens", data.bienId] });
      }),

      // Statut transaction mis à jour
      socketService.on(SOCKET_EVENTS.TRANSACTION_STATUS, (data) => {
        if (data.proprietaireId !== proprietaireId) return;
        qc.invalidateQueries({ queryKey: ["transactions"] });
        qc.invalidateQueries({ queryKey: ["badge-count"] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [qc, proprietaireId]);
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminRealtimeSync() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsubs = [
      // Nouveau signalement reçu → badge + liste signalements
      socketService.on(SOCKET_EVENTS.SIGNALEMENT_NEW, () => {
        qc.invalidateQueries({ queryKey: ["admin-signalements"] });
        qc.invalidateQueries({ queryKey: ["admin-signalements-count"] });
      }),

      // Signalement traité (validé/rejeté) → rafraîchir liste
      socketService.on(SOCKET_EVENTS.SIGNALEMENT_UPDATED, () => {
        qc.invalidateQueries({ queryKey: ["admin-signalements"] });
        qc.invalidateQueries({ queryKey: ["admin-signalements-count"] });
      }),

      // Bien modifié (suppression après validation de signalement, etc.)
      socketService.on(SOCKET_EVENTS.BIEN_UPDATED, () => {
        qc.invalidateQueries({ queryKey: ["admin-biens"] });
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      }),

      // Mise à jour stats globales
      socketService.on(SOCKET_EVENTS.STATS_UPDATE, () => {
        qc.invalidateQueries({ queryKey: ["admin-stats"] });
      }),

      // Nouvelle vérification d'identité
      socketService.on(SOCKET_EVENTS.VERIFICATION_SUBMITTED, () => {
        qc.invalidateQueries({ queryKey: ["admin-verifications"] });
        qc.invalidateQueries({ queryKey: ["verification-count"] });
      }),

      socketService.on(SOCKET_EVENTS.VERIFICATION_COUNT_UPDATE, () => {
        qc.invalidateQueries({ queryKey: ["verification-count"] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [qc]);
}

// ─── Locataire ─────────────────────────────────────────────────────────────────

export function useLocataireRealtimeSync(locataireId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!locataireId) return;

    const unsubs = [
      // Bail mis à jour (paiement confirmé, bail terminé, etc.)
      socketService.on(SOCKET_EVENTS.BAIL_UPDATED, (data) => {
        qc.invalidateQueries({ queryKey: ["bail", data.bienId] });
        qc.invalidateQueries({ queryKey: ["echeancier"] });
        qc.invalidateQueries({ queryKey: ["locataire-notifications"] });
      }),

      // Nouvelle notification
      socketService.on(SOCKET_EVENTS.NOTIFICATION_NEW, (data) => {
        if (data.locataireId && data.locataireId !== locataireId) return;
        qc.invalidateQueries({ queryKey: ["locataire-notifications"] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [qc, locataireId]);
}
