import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { socketService, SOCKET_EVENTS } from "@/services/socketService";
import { playNotificationSound } from "@/lib/notificationSound";
import { AdminSidebar } from "./AdminSidebar";
import { AdminBottomNav, AdminMobileHeader } from "./AdminMobileNav";

// ─── Hook temps réel admin ────────────────────────────────────────────────────

function useAdminRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsubVerifCount = socketService.on(SOCKET_EVENTS.VERIFICATION_COUNT_UPDATE, () => {
      qc.invalidateQueries({ queryKey: ["admin-verifications-count"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    });

    const unsubVerifNew = socketService.on(SOCKET_EVENTS.VERIFICATION_SUBMITTED, () => {
      toast.info("Nouvelle vérification soumise", {
        description: "Un propriétaire a soumis ses documents d'identité.",
      });
      playNotificationSound();
      qc.invalidateQueries({ queryKey: ["admin-verifications-count"] });
      qc.invalidateQueries({ queryKey: ["admin-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    });

    const unsubStats = socketService.on(SOCKET_EVENTS.STATS_UPDATE, () => {
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    });

    const unsubSignalementNew = socketService.on(SOCKET_EVENTS.SIGNALEMENT_NEW, () => {
      toast.info("Nouveau signalement", {
        description: "Une annonce vient d'être signalée par un utilisateur.",
      });
      playNotificationSound();
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-signalements-count"] });
    });

    const unsubSignalementUpdated = socketService.on(SOCKET_EVENTS.SIGNALEMENT_UPDATED, () => {
      qc.invalidateQueries({ queryKey: ["admin-signalements"] });
      qc.invalidateQueries({ queryKey: ["admin-signalements-count"] });
    });

    const unsubBienUpdated = socketService.on(SOCKET_EVENTS.BIEN_UPDATED, () => {
      qc.invalidateQueries({ queryKey: ["admin-biens"] });
      qc.invalidateQueries({ queryKey: ["annonces-admin"] });
      qc.invalidateQueries({ queryKey: ["annonces-status-counts"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      // Une annonce peut passer en attente de validation → rafraîchir la cloche de notifications
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    });

    const unsubFeedbackNew = socketService.on(SOCKET_EVENTS.FEEDBACK_SUBMITTED, () => {
      toast.info("Nouveau feedback reçu", {
        description: "Un utilisateur a partagé son retour sur l'expérience.",
      });
      playNotificationSound();
      qc.invalidateQueries({ queryKey: ["admin-feedbacks"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    });

    const unsubTemoignageNew = socketService.on(SOCKET_EVENTS.TEMOIGNAGE_SUBMITTED, () => {
      toast.info("Nouveau témoignage reçu", {
        description: "Un utilisateur a partagé son témoignage.",
      });
      playNotificationSound();
      qc.invalidateQueries({ queryKey: ["admin-temoignages"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    });

    return () => {
      unsubVerifCount();
      unsubVerifNew();
      unsubStats();
      unsubSignalementNew();
      unsubSignalementUpdated();
      unsubBienUpdated();
      unsubFeedbackNew();
      unsubTemoignageNew();
    };
  }, [qc]);
}

// ─── Layout principal ─────────────────────────────────────────────────────────

// Administration (charte, planche 41) : barre latérale encre sur desktop, onglets sur mobile.
export default function AdminLayout() {
  useAdminRealtime();
  return (
    <div className="min-h-screen overflow-x-clip bg-surface">
      <AdminSidebar />
      <AdminMobileHeader />
      <main className="overflow-x-clip pb-24 pt-14 lg:ml-64 lg:px-8 lg:py-8 xl:px-6">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:p-0">
          <Outlet />
        </div>
      </main>
      <AdminBottomNav />
    </div>
  );
}
