import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";
import { BadgeAdmin, NavigationAdmin } from "./AdminSidebar";
import { estActif, useAdminNavigation, useDeconnexionAdmin } from "./useAdminNavigation";

// Navigation mobile de l'administration : en-tête blanc avec badge ADMIN, quatre onglets
// de modération et un panneau « Plus » qui reprend toute la barre latérale.

const ONGLETS = ["/admin/dashboard", "/admin/annonces", "/admin/verifications", "/admin/signalements"];
const MAX_BADGE = 9;

export function AdminMobileHeader() {
  const { nbNonLues } = useAdminNavigation();
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-filet bg-white px-4 lg:hidden">
      <Link to="/admin/dashboard" aria-label="Tableau de bord" className="flex items-center gap-2">
        <Logo height={24} />
        <BadgeAdmin />
      </Link>
      <Link
        to="/admin/notifications"
        aria-label={nbNonLues ? `Notifications, ${nbNonLues} non lues` : "Notifications"}
        className="relative flex size-11 items-center justify-center rounded-full text-encre hover:bg-surface"
      >
        <Bell aria-hidden className="size-6" strokeWidth={1.75} />
        {nbNonLues ? (
          <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-soleil px-1 text-caption font-bold text-encre">
            {nbNonLues > MAX_BADGE ? `${MAX_BADGE}+` : nbNonLues}
          </span>
        ) : null}
      </Link>
    </header>
  );
}

function PanneauPlus({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { email } = useAdminNavigation();
  const seDeconnecter = useDeconnexionAdmin();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-encre px-4 pb-[calc(24px+env(safe-area-inset-bottom))] lg:hidden" role="dialog" aria-modal="true" aria-label="Administration">
      <div className="sticky top-0 flex h-16 items-center justify-between bg-encre">
        <span className="flex items-center gap-2">
          <Logo variant="blanc" height={24} />
          <BadgeAdmin />
        </span>
        <button type="button" onClick={onClose} aria-label="Fermer" className="flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10">
          <X aria-hidden className="size-6" />
        </button>
      </div>
      <NavigationAdmin onNavigate={onClose} />
      <div className="mt-6 border-t border-white/15 pt-4">
        <Link to="/admin/profile" onClick={onClose} className="block truncate px-4 py-2 text-body-m text-white/80">
          {email}
        </Link>
        <button type="button" onClick={seDeconnecter} className="flex min-h-12 w-full items-center gap-3 rounded-control px-4 text-body-l text-white hover:bg-white/10">
          <LogOut aria-hidden className="size-5" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}

export function AdminBottomNav() {
  const { sections } = useAdminNavigation();
  const { pathname } = useLocation();
  const [plus, setPlus] = useState(false);
  const fermer = useCallback(() => setPlus(false), []);
  useEffect(() => setPlus(false), [pathname]);

  const liens = sections.flatMap(({ liens }) => liens).filter(({ to }) => ONGLETS.includes(to));
  const surOnglet = liens.some((lien) => estActif(pathname, lien));
  const onglets: BottomNavItem[] = [
    ...liens.map((lien) => ({ to: lien.to, label: lien.shortLabel ?? lien.label, icon: lien.icon, badge: lien.badge, active: estActif(pathname, lien) })),
    { label: "Plus", icon: Menu, onSelect: () => setPlus(true), active: plus || !surOnglet },
  ];

  return (
    <>
      <BottomNav items={onglets} />
      <PanneauPlus open={plus} onClose={fermer} />
    </>
  );
}
