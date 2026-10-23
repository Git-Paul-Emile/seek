import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Onglets mobiles de la charte (planche « Navigation ») : cinq au plus, libellés toujours
// visibles, pastille Baobab clair sous l'icône active, compteur Soleil.

export interface BottomNavItem {
  label: string;
  icon: LucideIcon;
  /** Destination. Sans `to`, l'onglet est un bouton et appelle `onSelect`. */
  to?: string;
  onSelect?: () => void;
  /** Compteur affiché en pastille Soleil (paiements, notifications en attente). */
  badge?: number;
  /** Force l'état actif (onglet bouton ou route partagée). */
  active?: boolean;
}

interface BottomNavProps {
  items: BottomNavItem[];
  className?: string;
}

const MAX_BADGE = 9;

function TabContent({ item, isActive }: { item: BottomNavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <>
      <span
        className={cn(
          "relative flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-tab",
          isActive && "bg-baobab-100",
        )}
      >
        <Icon aria-hidden className={cn("size-6", isActive ? "text-baobab" : "text-texte2")} strokeWidth={1.75} />
        {item.badge ? (
          <span className="absolute -top-1 right-2 flex min-w-5 items-center justify-center rounded-full bg-soleil px-1 text-caption font-bold text-encre">
            {item.badge > MAX_BADGE ? `${MAX_BADGE}+` : item.badge}
            <span className="sr-only"> en attente</span>
          </span>
        ) : null}
      </span>
      <span className={cn("text-caption", isActive ? "font-bold text-encre" : "font-medium text-texte2")}>
        {item.label}
      </span>
    </>
  );
}

const tabClass = "flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1";

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-filet bg-white pb-[env(safe-area-inset-bottom)] lg:hidden",
        className,
      )}
    >
      <div className="flex items-stretch">
        {items.map((item) =>
          item.to ? (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/" || /(dashboard|profil|profile)$/.test(item.to)}
              className={tabClass}
            >
              {({ isActive }) => <TabContent item={item} isActive={item.active ?? isActive} />}
            </NavLink>
          ) : (
            <button key={item.label} type="button" onClick={item.onSelect} className={tabClass}>
              <TabContent item={item} isActive={item.active ?? false} />
            </button>
          ),
        )}
      </div>
    </nav>
  );
}
