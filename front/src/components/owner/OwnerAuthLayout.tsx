import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DakarSkyline } from "@/components/brand/DakarSkyline";

// Pages de connexion et d'inscription propriétaire : formulaire sur blanc, et sur desktop
// le panneau Baobab 900 avec Dakar dans l'arche (motif signature de la charte).

interface OwnerAuthLayoutProps {
  titre: string;
  sousTitre?: string;
  retour?: { to: string; label: string };
  children: ReactNode;
}

export function OwnerAuthLayout({ titre, sousTitre, retour = { to: "/proprietaires", label: "Retour" }, children }: OwnerAuthLayoutProps) {
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
          <p className="text-overline font-semibold uppercase text-baobab">Espace propriétaire</p>
          <h1 className="mt-2 font-display text-h2 font-bold text-encre lg:text-h1">{titre}</h1>
          {sousTitre && <p className="mt-2 text-body-l text-texte2">{sousTitre}</p>}
          <div className="mt-8">{children}</div>
        </main>
      </div>
      <aside className="hidden flex-col justify-between bg-baobab-900 p-12 text-white lg:flex">
        <p className="max-w-sm font-display text-h2 font-bold">
          Vos biens, vos locataires et vos loyers au même endroit.
        </p>
        <div className="mx-auto w-full max-w-sm">
          <DakarSkyline variant="portrait" />
        </div>
        <p className="text-body-m text-white/75">Annonces relues avant publication, baux et quittances, paiements Mobile Money.</p>
      </aside>
    </div>
  );
}

/** Erreur renvoyée par le serveur, affichée au-dessus du bouton d'envoi. */
export function ErreurServeur({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-3 rounded-control bg-soleil-100 p-4 text-body-m font-semibold text-encre">
      <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 fill-soleil" />
      {message}
    </p>
  );
}
