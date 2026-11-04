import { Loader2 } from "lucide-react";
import type { ProgressionEnvoi as Progression } from "./useAnnonceForm";

// Progression de l'envoi d'une annonce avec de nouveaux médias : d'abord les fichiers vers le
// serveur, puis leur traitement en arrière-plan (photos, vidéo, soumission à la modération).

const ETAPES: { phase: Progression["phase"]; libelle: string }[] = [
  { phase: "envoi", libelle: "Envoi des fichiers" },
  { phase: "photos", libelle: "Photos" },
  { phase: "video", libelle: "Vidéo" },
  { phase: "soumission", libelle: "Modération" },
];

export function ProgressionEnvoi({ progression }: { progression: Progression }) {
  const indexCourant = ETAPES.findIndex((e) => e.phase === progression.phase);

  return (
    <div role="status" aria-live="polite" className="space-y-5 py-6">
      <div className="flex items-center gap-3">
        <Loader2 aria-hidden className="size-6 shrink-0 animate-spin text-baobab" />
        <p className="text-title font-semibold text-encre">{progression.libelle}</p>
      </div>

      <div
        role="progressbar"
        aria-label={progression.libelle}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progression.pourcent}
        className="h-2 overflow-hidden rounded-full bg-surface"
      >
        <div className="h-full rounded-full bg-baobab transition-[width] duration-300" style={{ width: `${progression.pourcent}%` }} />
      </div>
      <p className="tabular text-body-m text-texte2">{progression.pourcent} %</p>

      <ol className="grid grid-cols-2 gap-2 text-body-m sm:grid-cols-4">
        {ETAPES.map((etape, index) => (
          <li
            key={etape.phase}
            className={index < indexCourant ? "text-baobab" : index === indexCourant ? "font-semibold text-encre" : "text-texte2"}
          >
            {index < indexCourant ? "✓ " : ""}
            {etape.libelle}
          </li>
        ))}
      </ol>

      {progression.nouvelleTentative && (
        <p className="rounded-control bg-soleil-100 p-3 text-body-m text-encre">
          Un envoi a échoué, une nouvelle tentative est en cours. Vous n'avez rien à faire.
        </p>
      )}
      <p className="text-body-m text-texte2">Gardez cette page ouverte jusqu'à la fin de l'envoi.</p>
    </div>
  );
}
