import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Bell,
  ChevronRight,
  IdCard,
  LogOut,
  Menu,
  TriangleAlert,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useOwnerNavigation } from "./useOwnerNavigation";

// Navigation mobile de l'espace propriétaire (charte, planches 27 et 33) :
// en-tête blanc, cinq onglets Tableau / Biens / Locataires / Paiements / Plus.

const ONGLETS_PRINCIPAUX = 4;

/** En-tête mobile des pages internes. Le tableau de bord a son propre bandeau. */
export function OwnerMobileHeader() {
  const { nbNonLues } = useOwnerNavigation();
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-filet bg-white px-4 lg:hidden">
      <Link to="/owner/dashboard" aria-label="Tableau de bord">
        <Logo height={24} />
      </Link>
      <Link
        to="/owner/notifications"
        aria-label={nbNonLues ? `Notifications, ${nbNonLues} non lues` : "Notifications"}
        className="relative flex size-11 items-center justify-center rounded-full text-encre hover:bg-surface"
      >
        <Bell aria-hidden className="size-6" strokeWidth={1.75} />
        {nbNonLues ? (
          <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-soleil px-1 text-caption font-bold text-encre">
            {nbNonLues > 9 ? "9+" : nbNonLues}
          </span>
        ) : null}
      </Link>
    </header>
  );
}

interface LienPlus {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

function PlusSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout } = useOwnerAuth();
  const navigate = useNavigate();
  const { nbNonLues, initiales, nomComplet, sousTitre } = useOwnerNavigation();

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

  const liens: LienPlus[] = [
    { to: "/owner/notifications", label: "Notifications", icon: Bell, badge: nbNonLues },
    { to: "/owner/loyers-retard", label: "Loyers en retard", icon: TriangleAlert },
    { to: "/owner/verification", label: "Vérification d'identité", icon: IdCard },
    { to: "/owner/profile", label: "Mon profil", icon: UserRound },
    { to: "/proprietaires", label: "Voir le site", icon: ArrowUpRight },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/proprietaires", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Plus d'options">
      <div className="absolute inset-0 bg-encre/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 rounded-t-sheet bg-white px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3 animate-slide-up">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-filet" aria-hidden />
        <div className="flex items-center gap-3 border-b border-filet pb-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-soleil font-display text-body-l font-bold text-encre">
            {initiales}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-title font-semibold text-encre">{nomComplet}</p>
            <p className="truncate text-body-m text-texte2">{sousTitre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-11 items-center justify-center rounded-full text-encre hover:bg-surface"
          >
            <X aria-hidden className="size-6" />
          </button>
        </div>
        <ul className="divide-y divide-filet">
          {liens.map(({ to, label, icon: Icon, badge }) => (
            <li key={to}>
              <Link to={to} onClick={onClose} className="flex min-h-14 items-center gap-3 text-body-l text-encre">
                <Icon aria-hidden className="size-6 text-baobab" strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {badge ? (
                  <span className="flex min-w-6 items-center justify-center rounded-full bg-soleil px-1.5 text-caption font-bold text-encre">
                    {badge}
                  </span>
                ) : null}
                <ChevronRight aria-hidden className="size-5 text-texte2" />
              </Link>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-14 w-full items-center gap-3 text-left text-body-l text-encre"
            >
              <LogOut aria-hidden className="size-6 text-texte2" strokeWidth={1.75} />
              Se déconnecter
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Onglets du bas de l'écran et panneau « Plus ». */
export function OwnerBottomNav() {
  const { items } = useOwnerNavigation();
  const [plusOpen, setPlusOpen] = useState(false);
  const location = useLocation();
  const fermerPlus = useCallback(() => setPlusOpen(false), []);

  useEffect(() => setPlusOpen(false), [location.pathname]);

  const principaux = items.slice(0, ONGLETS_PRINCIPAUX);
  const estActif = (to: string, actifSur: string[] = []) =>
    [to, ...actifSur].some((route) => location.pathname.startsWith(route));
  const surOngletPrincipal = principaux.some(({ to, actifSur }) => estActif(to, actifSur));

  const onglets: BottomNavItem[] = [
    ...principaux.map(({ to, shortLabel, icon, badge, actifSur }) => ({
      to,
      label: shortLabel,
      icon,
      badge,
      active: actifSur ? estActif(to, actifSur) : undefined,
    })),
    { label: "Plus", icon: Menu, onSelect: () => setPlusOpen(true), active: plusOpen || !surOngletPrincipal },
  ];

  return (
    <>
      <BottomNav items={onglets} />
      <PlusSheet open={plusOpen} onClose={fermerPlus} />
    </>
  );
}
