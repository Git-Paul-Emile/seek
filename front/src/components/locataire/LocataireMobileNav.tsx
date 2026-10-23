import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";
import { cn } from "@/lib/utils";
import { SOUS_PAGES_LOGEMENT, useLocataireNavigation } from "./useLocataireNavigation";

// Navigation mobile de l'espace locataire (charte, planche 34) : en-tête blanc et
// cinq onglets Accueil / Paiements / Documents / Logement / Profil.

const ONGLETS_MOBILES = ["/locataire/dashboard", "/locataire/paiements", "/locataire/documents", "/locataire/etats-des-lieux"];
const MAX_BADGE = 9;

/** En-tête mobile des pages internes. L'accueil a son propre en-tête « Bonjour ». */
export function LocataireMobileHeader() {
  const { nbNonLues } = useLocataireNavigation();
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-filet bg-white px-4 lg:hidden">
      <Link to="/locataire/dashboard" aria-label="Accueil de mon espace">
        <Logo height={24} />
      </Link>
      <Link
        to="/locataire/notifications"
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

/** Onglets du bas de l'écran. */
export function LocataireBottomNav() {
  const { items } = useLocataireNavigation();
  const { pathname } = useLocation();

  const onglets: BottomNavItem[] = [
    ...items
      .filter(({ to }) => ONGLETS_MOBILES.includes(to))
      .map(({ to, shortLabel, icon, badge, actifSur = [], actifSurMobile = [] }) => {
        const routesRattachees = [...actifSur, ...actifSurMobile];
        return {
          to,
          label: shortLabel,
          icon,
          badge,
          active: routesRattachees.length ? [to, ...routesRattachees].some((route) => pathname.startsWith(route)) : undefined,
        };
      }),
    { to: "/locataire/profil", label: "Profil", icon: UserRound },
  ];

  return <BottomNav items={onglets} />;
}

/** Sous-navigation de l'onglet « Logement » : trois pages regroupées sous un seul onglet. */
export function LogementSousNav() {
  return (
    <nav aria-label="Mon logement" className="-mx-4 mb-6 overflow-x-auto px-4 lg:hidden">
      <ul className="flex gap-2">
        {SOUS_PAGES_LOGEMENT.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "inline-flex h-10 items-center whitespace-nowrap rounded-full border px-4 text-body-m font-medium transition-colors duration-hover",
                  isActive ? "border-baobab bg-baobab-100 text-baobab" : "border-bord-champ bg-white text-encre",
                )
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
