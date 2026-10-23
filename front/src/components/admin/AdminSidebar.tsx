import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { estActif, useAdminNavigation, useDeconnexionAdmin, type AdminNavLien } from "./useAdminNavigation";

// Barre latérale de l'administration (charte, planches 27 et 41) : fond encre, badge ADMIN,
// sections en capitales, élément actif en blanc, compteurs en pastille Soleil.

const MAX_BADGE = 99;

export function BadgeAdmin({ className }: { className?: string }) {
  return (
    <span className={cn("rounded-marker bg-soleil px-2 py-0.5 text-caption font-bold tracking-wide text-encre", className)}>
      ADMIN
    </span>
  );
}

export function Compteur({ valeur, max = MAX_BADGE }: { valeur?: number; max?: number }) {
  if (!valeur) return null;
  return (
    <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-soleil px-1.5 text-caption font-bold text-encre">
      {valeur > max ? `${max}+` : valeur}
    </span>
  );
}

function LienSection({ lien, pathname, onNavigate }: { lien: AdminNavLien; pathname: string; onNavigate?: () => void }) {
  const actif = estActif(pathname, lien);
  const Icon = lien.icon;
  return (
    <li>
      <Link
        to={lien.to}
        onClick={onNavigate}
        aria-current={actif && !lien.enfants ? "page" : undefined}
        className={cn(
          "flex min-h-12 items-center gap-3 rounded-control px-4 py-2 text-body-l font-medium transition-colors duration-hover",
          actif ? "bg-white font-semibold text-encre" : "text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        <Icon aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 leading-tight">{lien.label}</span>
        <Compteur valeur={lien.badge} />
      </Link>
      {actif && lien.enfants && (
        <ul className="mb-2 ml-6 mt-1 space-y-0.5 border-l border-white/15 pl-4">
          {lien.enfants.map((enfant) => {
            const enfantActif = pathname === enfant.to;
            return (
              <li key={enfant.to}>
                <Link
                  to={enfant.to}
                  onClick={onNavigate}
                  aria-current={enfantActif ? "page" : undefined}
                  className={cn(
                    "flex min-h-10 items-center rounded-control px-3 text-body-m transition-colors duration-hover",
                    enfantActif ? "font-semibold text-soleil" : "text-white/70 hover:text-white",
                  )}
                >
                  {enfant.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/** Liste de navigation complète, réutilisée dans le panneau « Plus » sur mobile. */
export function NavigationAdmin({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { sections } = useAdminNavigation();
  return (
    <nav aria-label="Administration" className="space-y-6">
      {sections.map((section, index) => (
        <div key={section.titre ?? index}>
          {section.titre && <p className="mb-2 px-4 text-overline font-semibold uppercase text-white/55">{section.titre}</p>}
          <ul className="space-y-1">
            {section.liens.map((lien) => (
              <LienSection key={lien.to} lien={lien} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const { email, initiale } = useAdminNavigation();
  const seDeconnecter = useDeconnexionAdmin();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-encre lg:flex">
      <Link to="/admin/dashboard" className="flex h-24 shrink-0 items-center gap-3 px-6" aria-label="Tableau de bord">
        <Logo variant="blanc" height={32} />
        <BadgeAdmin />
      </Link>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <NavigationAdmin />
      </div>
      <div className="mx-4 flex shrink-0 items-center gap-3 border-t border-white/15 py-5">
        <Link to="/admin/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-control">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soleil font-display text-body-l font-bold text-encre">
            {initiale}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body-m font-semibold text-white">{email}</span>
            <span className="block text-body-m text-white/65">Administrateur</span>
          </span>
        </Link>
        <Link
          to="/"
          aria-label="Voir le site"
          title="Voir le site"
          className="flex size-10 shrink-0 items-center justify-center rounded-control text-white/70 hover:bg-white/10 hover:text-white"
        >
          <ArrowUpRight aria-hidden className="size-5" />
        </Link>
        <button
          type="button"
          onClick={seDeconnecter}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex size-10 shrink-0 items-center justify-center rounded-control text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut aria-hidden className="size-5" />
        </button>
      </div>
    </aside>
  );
}
