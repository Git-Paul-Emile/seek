import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";

// Pages de connexion et d'activation locataire : formulaire sur blanc, et sur desktop
// le panneau surface (couleur de l'espace locataire, planche 27) avec le logement dans l'arche.

interface LocataireAuthLayoutProps {
  titre: string;
  sousTitre?: string;
  retour?: { to: string; label: string };
  children: ReactNode;
}

export function LocataireAuthLayout({ titre, sousTitre, retour = { to: "/", label: "Retour au site" }, children }: LocataireAuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_minmax(420px,44%)]">
      <div className="flex flex-col px-4 pb-10 pt-4 sm:px-8 lg:px-16">
        <header className="flex h-14 items-center justify-between">
          <Link to="/" aria-label="Accueil Seek">
            <Logo height={28} />
          </Link>
          <Link to={retour.to} className="inline-flex min-h-11 items-center gap-1.5 text-body-m font-semibold text-baobab">
            <ArrowLeft aria-hidden className="size-4" />
            {retour.label}
          </Link>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <p className="text-overline font-semibold uppercase text-baobab">Espace locataire</p>
          <h1 className="mt-2 font-display text-h2 font-bold text-encre lg:text-h1">{titre}</h1>
          {sousTitre && <p className="mt-2 text-body-l text-texte2">{sousTitre}</p>}
          <div className="mt-8">{children}</div>
        </main>
      </div>
      <aside className="hidden flex-col justify-between border-l border-filet bg-surface p-12 lg:flex">
        <p className="max-w-sm font-display text-h2 font-bold text-encre">Votre bail, vos loyers et vos quittances au même endroit.</p>
        <div className="mx-auto aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-t-full">
          <PropertyIllustration kind="appartement" />
        </div>
        <p className="text-body-m text-texte2">Déclarez vos paiements, téléchargez vos quittances et suivez vos états des lieux.</p>
      </aside>
    </div>
  );
}
