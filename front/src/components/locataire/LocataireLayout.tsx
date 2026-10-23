import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { socketService, SOCKET_EVENTS, type NotificationPayload } from "@/services/socketService";
import { playNotificationSound } from "@/lib/notificationSound";
import { cn } from "@/lib/utils";
import { LocataireSidebar } from "./LocataireSidebar";
import { LocataireBottomNav, LocataireMobileHeader, LogementSousNav } from "./LocataireMobileNav";
import { estSousPageLogement } from "./useLocataireNavigation";

// L'accueil mobile affiche son propre en-tête « Bonjour » (charte, planche 34).
const PAGES_SANS_EN_TETE_MOBILE = ["/locataire/dashboard"];

// ─── Hook temps réel locataire ────────────────────────────────────────────────

function useLocataireRealtime(locataireId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!locataireId) return;

    const unsubNotif = socketService.on(SOCKET_EVENTS.NOTIFICATION_NEW, (data: NotificationPayload) => {
      if (data.locataireId && data.locataireId !== locataireId) return;
      if (data.type !== "CONFIRMATION_PAIEMENT") {
        toast.info(data.titre);
      }
      playNotificationSound();
      qc.invalidateQueries({ queryKey: ["locataire-messages"] });
      qc.invalidateQueries({ queryKey: ["locataire-notifications"] });
    });

    const unsubBailUpdated = socketService.on(SOCKET_EVENTS.BAIL_UPDATED, (data) => {
      qc.invalidateQueries({ queryKey: ["bail", data.bienId] });
      qc.invalidateQueries({ queryKey: ["echeancier"] });
      qc.invalidateQueries({ queryKey: ["locataire-echeancier"] });
      qc.invalidateQueries({ queryKey: ["locataire-notifications"] });
    });

    return () => {
      unsubNotif();
      unsubBailUpdated();
    };
  }, [qc, locataireId]);
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function LocataireLayout() {
  const { locataire } = useLocataireAuth();
  useLocataireRealtime(locataire?.id);
  const { pathname } = useLocation();

  const avecEnTete = !PAGES_SANS_EN_TETE_MOBILE.includes(pathname);

  return (
    <div className="min-h-screen overflow-x-clip bg-surface">
      <LocataireSidebar />
      {avecEnTete && <LocataireMobileHeader />}
      <main className={cn("overflow-x-clip pb-24 lg:ml-64 lg:px-10 lg:py-10", avecEnTete && "pt-14")}>
        <div className={cn("mx-auto w-full max-w-[1200px] px-4 lg:px-0", avecEnTete ? "py-6 lg:py-0" : "pt-6 lg:pt-0")}>
          {estSousPageLogement(pathname) && <LogementSousNav />}
          <Outlet />
        </div>
      </main>
      <LocataireBottomNav />
    </div>
  );
}
