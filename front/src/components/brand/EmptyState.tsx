import type { ReactNode } from "react";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import type { IllustrationKind } from "@/components/brand/illustrationKind";

// État vide de la charte : l'illustration dans l'arche (motif signature), un titre qui dit ce
// qui manque, une phrase qui dit quoi faire, et l'action.

interface EmptyStateProps {
  titre: string;
  texte: string;
  illustration?: IllustrationKind;
  action?: ReactNode;
  titreNiveau?: "h1" | "h2";
}

export function EmptyState({ titre, texte, illustration = "appartement", action, titreNiveau = "h2" }: EmptyStateProps) {
  const Titre = titreNiveau;
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="aspect-[3/4] w-40 overflow-hidden rounded-t-full">
        <PropertyIllustration kind={illustration} />
      </div>
      <Titre className="mt-6 text-h3 font-bold text-encre">{titre}</Titre>
      <p className="mt-2 max-w-sm text-body-l text-texte2">{texte}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
