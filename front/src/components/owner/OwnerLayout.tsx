import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { socketService, SOCKET_EVENTS, type NotificationPayload, type TransactionStatusPayload } from "@/services/socketService";
import { playNotificationSound } from "@/lib/notificationSound";
import { cn } from "@/lib/utils";
import { OwnerSidebar } from "./OwnerSidebar";
import { OwnerBottomNav, OwnerMobileHeader } from "./OwnerMobileNav";

// Pages plein écran sur mobile : le formulaire d'annonce a sa propre barre (charte, planche 33).
const PAGES_PLEIN_ECRAN_MOBILE = ["/owner/biens/ajouter"];
// Le tableau de bord mobile affiche son propre bandeau Baobab à la place de l'en-tête.
const PAGES_SANS_EN_TETE_MOBILE = ["/owner/dashboard"];

// ─── Hook temps réel owner ────────────────────────────────────────────────────

function useOwnerRealtime(ownerId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!ownerId) return;

    const unsubNotif = socketService.on(SOCKET_EVENTS.NOTIFICATION_NEW, (data: NotificationPayload) => {
      if (data.proprietaireId !== ownerId) return;
      toast.info(data.titre);
      playNotificationSound();
      qc.invalidateQueries({ queryKey: ["owner-messages"] });
      qc.invalidateQueries({ queryKey: ["owner-notifications"] });
    });

    const unsubBadge = socketService.on(SOCKET_EVENTS.BADGE_UPDATE, (data) => {
      if (data.proprietaireId !== ownerId) return;
      qc.invalidateQueries({ queryKey: ["owner-stats"] });
      qc.invalidateQueries({ queryKey: ["biens-retard"] });
      qc.invalidateQueries({ queryKey: ["owner-notifications"] });
    });

    const unsubPayOk = socketService.on(SOCKET_EVENTS.PAYMENT_CONFIRMED, (data: TransactionStatusPayload) => {
      toast.success("Paiement confirmé", {
        description: `${data.montant.toLocaleString("fr-FR")} FCFA reçu`,
      });
      playNotificationSound();
      if (data.proprietaireId !== ownerId) return;
      qc.invalidateQueries({ queryKey: ["bail"] });
      qc.invalidateQueries({ queryKey: ["echeancier"] });
      qc.invalidateQueries({ queryKey: ["owner-notifications"] });
      qc.invalidateQueries({ queryKey: ["owner-tableau-de-bord"] });
    });

    const unsubPayFail = socketService.on(SOCKET_EVENTS.PAYMENT_FAILED, (data: TransactionStatusPayload) => {
      if (data.proprietaireId !== ownerId) return;
      toast.error("Paiement échoué", {
        description: `Transaction ${data.transactionId}, montant ${data.montant.toLocaleString("fr-FR")} FCFA`,
      });
      playNotificationSound();
    });

    const unsubBailUpdated = socketService.on(SOCKET_EVENTS.BAIL_UPDATED, (data) => {
      if (data.proprietaireId !== ownerId) return;
      qc.invalidateQueries({ queryKey: ["bail", data.bienId] });
      qc.invalidateQueries({ queryKey: ["bail_historique", data.bienId] });
      qc.invalidateQueries({ queryKey: ["bail_a_archiver", data.bienId] });
      qc.invalidateQueries({ queryKey: ["echeancier"] });
      qc.invalidateQueries({ queryKey: ["solde"] });
      qc.invalidateQueries({ queryKey: ["biensAvecBailActif"] });
      qc.invalidateQueries({ queryKey: ["biens-en-retard"] });
      qc.invalidateQueries({ queryKey: ["owner-tableau-de-bord"] });
    });

    const unsubBienUpdated = socketService.on(SOCKET_EVENTS.BIEN_UPDATED, (data) => {
      if (data.proprietaireId !== ownerId) return;
      qc.invalidateQueries({ queryKey: ["biens"] });
      qc.invalidateQueries({ queryKey: ["biens", data.bienId] });
    });

    const unsubSignalementUpdated = socketService.on(SOCKET_EVENTS.SIGNALEMENT_UPDATED, (data) => {
      qc.invalidateQueries({ queryKey: ["biens"] });
      qc.invalidateQueries({ queryKey: ["biens", data.bienId] });
    });

    return () => {
      unsubNotif();
      unsubBadge();
      unsubPayOk();
      unsubPayFail();
      unsubBailUpdated();
      unsubBienUpdated();
      unsubSignalementUpdated();
    };
  }, [ownerId, qc]);
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function OwnerLayout() {
  const { owner } = useOwnerAuth();
  useOwnerRealtime(owner?.id);
  const { pathname } = useLocation();

  const pleinEcran = PAGES_PLEIN_ECRAN_MOBILE.includes(pathname);
  const avecEnTete = !pleinEcran && !PAGES_SANS_EN_TETE_MOBILE.includes(pathname);

  return (
    <div className="min-h-screen overflow-x-clip bg-surface">
      <OwnerSidebar />
      {avecEnTete && <OwnerMobileHeader />}
      <main
        className={cn(
          "overflow-x-clip lg:ml-64 lg:px-10 lg:py-10",
          avecEnTete && "pt-14",
          !pleinEcran && "pb-24 lg:pb-10",
        )}
      >
        <div className={cn("mx-auto w-full max-w-[1280px]", avecEnTete && "px-4 py-6 lg:p-0")}>
          <Outlet />
        </div>
      </main>
      {!pleinEcran && <OwnerBottomNav />}
    </div>
  );
}
