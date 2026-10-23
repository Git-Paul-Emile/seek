import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, LogOut, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { cn } from "@/lib/utils";
import { useOwnerNavigation } from "./useOwnerNavigation";

// Barre latérale desktop de la charte (planches 27 et 40) : fond Baobab 900,
// élément actif en blanc, compteurs en pastille Soleil, identité en pied.

const MAX_BADGE = 99;

const lienClass = (isActive: boolean) =>
  cn(
    "flex h-12 items-center gap-3 rounded-control px-4 text-body-l font-medium transition-colors duration-hover",
    isActive ? "bg-white font-semibold text-baobab" : "text-white/85 hover:bg-white/10 hover:text-white",
  );

export function OwnerSidebar() {
  const { logout } = useOwnerAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { items, initiales, nomComplet, sousTitre } = useOwnerNavigation();

  const handleLogout = async () => {
    await logout();
    navigate("/proprietaires", { replace: true });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-baobab-900 lg:flex">
      <Link to="/owner/dashboard" className="flex h-24 shrink-0 items-center px-6" aria-label="Tableau de bord">
        <Logo variant="blanc" height={32} />
      </Link>

      <nav aria-label="Espace propriétaire" className="flex-1 overflow-y-auto px-4">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, badge, actifSur = [] }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === "/owner/dashboard"}
                className={({ isActive }) => lienClass(isActive || actifSur.some((route) => pathname.startsWith(route)))}
              >
                <Icon aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
                <span className="flex-1">{label}</span>
                {badge ? (
                  <span className="flex size-7 items-center justify-center rounded-full bg-soleil text-caption font-bold text-encre">
                    {badge > MAX_BADGE ? `${MAX_BADGE}+` : badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/owner/profile" className={({ isActive }) => lienClass(isActive)}>
              <UserRound aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">Mon profil</span>
            </NavLink>
          </li>
          <li>
            <Link to="/proprietaires" className={lienClass(false)}>
              <ArrowUpRight aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
              <span className="flex-1">Voir le site</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mx-4 flex shrink-0 items-center gap-3 border-t border-white/15 py-5">
        <Link to="/owner/profile" className="flex min-w-0 flex-1 items-center gap-3 rounded-control">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soleil font-display text-body-l font-bold text-encre">
            {initiales}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-body-l font-semibold text-white">{nomComplet}</span>
            <span className="block truncate text-body-m text-white/70">{sousTitre}</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="flex size-10 shrink-0 items-center justify-center rounded-control text-white/70 transition-colors duration-hover hover:bg-white/10 hover:text-white"
        >
          <LogOut aria-hidden className="size-5" />
        </button>
      </div>
    </aside>
  );
}
