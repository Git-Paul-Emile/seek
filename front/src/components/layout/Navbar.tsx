import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, LogOut, Menu, Plus, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { usePublicSession } from "@/hooks/usePublicSession";
import { cn } from "@/lib/utils";

// En-tête public de la charte (planches « Accueil desktop » et « Accueil mobile »).
// Sur l'accueil il est posé sur l'aplat Baobab du hero ; ailleurs il est blanc.

export type NavbarTone = "baobab" | "blanc";

const NAV_LINKS = [
  { to: "/annonces?typeTransaction=location", label: "Louer", match: "location" },
  { to: "/annonces?typeTransaction=vente", label: "Acheter", match: "vente" },
  { to: "/annonces?vue=carte", label: "Carte", match: "carte" },
  { to: "/proprietaires", label: "Propriétaires", match: "proprietaires" },
];

interface NavbarProps {
  tone?: NavbarTone;
  /** Contenu central sur desktop (barre de recherche compacte de la page Recherche). */
  center?: ReactNode;
  /** Masque l'en-tête sur mobile quand la page affiche sa propre barre. */
  hideOnMobile?: boolean;
}

function isLinkActive(match: string, pathname: string, search: string) {
  if (match === "proprietaires") return pathname === "/proprietaires";
  if (match === "carte") return search.includes("vue=carte");
  return search.includes(`typeTransaction=${match}`);
}

function MobileMenu({ tone }: { tone: NavbarTone }) {
  const [open, setOpen] = useState(false);
  const session = usePublicSession();
  const close = () => setOpen(false);
  const linkClass = "flex h-12 items-center rounded-control px-4 text-body-l font-medium text-encre hover:bg-surface";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className={cn(
            "flex size-12 items-center justify-center rounded-control",
            tone === "baobab" ? "bg-baobab-900 text-white" : "bg-surface text-encre",
          )}
        >
          <Menu aria-hidden className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-encre/50 data-[state=open]:animate-overlay-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-[61] flex w-[86%] max-w-sm flex-col rounded-l-sheet bg-white p-4 shadow-float focus:outline-none">
          <div className="flex items-center justify-between pb-4">
            <Logo height={28} />
            <Dialog.Close asChild>
              <button type="button" aria-label="Fermer le menu" className="flex size-12 items-center justify-center rounded-control hover:bg-surface">
                <X aria-hidden className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">Navigation de Seek</Dialog.Description>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} onClick={close} className={linkClass}>
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-filet" />
            <Link to={session.espaceProprietaireHref} onClick={close} className={linkClass}>
              Espace propriétaire
            </Link>
            <Link to={session.espaceLocataireHref} onClick={close} className={linkClass}>
              Espace locataire
            </Link>
            <Link to="/a-propos" onClick={close} className={linkClass}>
              À propos
            </Link>
          </nav>
          <div className="space-y-2 border-t border-filet pt-4">
            <Button asChild variant="soleil" className="w-full">
              <Link to={session.publierHref} onClick={close}>
                <Plus aria-hidden />
                Publier une annonce
              </Link>
            </Button>
            {session.isConnected ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void session.logout();
                  close();
                }}
              >
                <LogOut aria-hidden />
                Se déconnecter
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  close();
                  session.openConnexion();
                }}
              >
                Se connecter
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DesktopActions({ tone, compact }: { tone: NavbarTone; compact: boolean }) {
  const session = usePublicSession();
  const onBaobab = tone === "baobab";
  return (
    <div className="flex items-center gap-3">
      {session.isConnected && (
        <Link
          to="/favoris"
          aria-label={`Favoris${session.favorisCount ? `, ${session.favorisCount} annonces` : ""}`}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-control transition-colors duration-hover",
            onBaobab ? "text-white hover:bg-white/10" : "text-encre hover:bg-surface",
          )}
        >
          <Heart aria-hidden className="size-6" strokeWidth={1.75} />
          {session.favorisCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex min-w-5 items-center justify-center rounded-full bg-soleil px-1 text-caption font-bold text-encre">
              {session.favorisCount}
            </span>
          )}
        </Link>
      )}
      {!session.isConnected && !compact && (
        <Button variant={onBaobab ? "outline-inverse" : "outline"} onClick={session.openConnexion}>
          Se connecter
        </Button>
      )}
      <Button asChild variant="soleil">
        <Link to={session.publierHref}>
          <Plus aria-hidden />
          Publier une annonce
        </Link>
      </Button>
      {session.isConnected && (
        <Link
          to="/mon-compte"
          aria-label="Mon compte"
          className="flex size-12 items-center justify-center rounded-full bg-baobab-100 text-body-m font-bold text-baobab"
        >
          {session.initiales || "Moi"}
        </Link>
      )}
      {!session.isConnected && compact && (
        <Button variant="outline" onClick={session.openConnexion}>
          Se connecter
        </Button>
      )}
    </div>
  );
}

const Navbar = ({ tone = "blanc", center, hideOnMobile = false }: NavbarProps) => {
  const { pathname, search } = useLocation();
  const session = usePublicSession();
  const onBaobab = tone === "baobab";

  return (
    <header
      className={cn(
        "sticky top-0 z-50",
        onBaobab ? "bg-baobab" : "border-b border-filet bg-white",
        hideOnMobile && "hidden lg:block",
      )}
    >
      <div className={cn("flex h-20 items-center gap-6", center ? "px-4 lg:px-6" : "container")}>
        <Link to="/" aria-label="Seek, accueil" className="shrink-0">
          <Logo variant={onBaobab ? "blanc" : "principal"} height={center ? 30 : 36} />
        </Link>

        {center ? (
          <div className="hidden min-w-0 flex-1 lg:block">{center}</div>
        ) : (
          <nav aria-label="Navigation principale" className="hidden flex-1 items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.match, pathname, search);
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-control px-3 py-2 text-body-l font-medium transition-colors duration-hover",
                    onBaobab ? "text-white hover:bg-white/10" : "text-encre hover:bg-surface",
                    active && (onBaobab ? "underline underline-offset-8" : "text-baobab underline underline-offset-8"),
                  )}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>
        )}

        <div className="ml-auto hidden lg:block">
          <DesktopActions tone={tone} compact={Boolean(center)} />
        </div>

        <div className="ml-auto flex items-center gap-3 lg:hidden">
          <Button asChild variant={onBaobab ? "inverse" : "soleil"} size="sm" className="h-12 px-4">
            <Link to={session.publierHref}>
              <Plus aria-hidden />
              Publier
            </Link>
          </Button>
          <MobileMenu tone={tone} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
