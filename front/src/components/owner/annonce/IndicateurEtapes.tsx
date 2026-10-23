import { Check, LoaderCircle, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { ETAPES, type EtapeId } from "./etapes";

// Progression du formulaire (charte, planche 26) : cercles reliés sur desktop,
// huit segments et état du brouillon sur mobile.

interface IndicateurProps {
  indexEtape: number;
  onSelect: (id: EtapeId) => void;
}

export function EtapesDesktop({ indexEtape, onSelect }: IndicateurProps) {
  return (
    <ol className="hidden grid-cols-8 lg:grid">
      {ETAPES.map((etape, i) => {
        const faite = i < indexEtape;
        const active = i === indexEtape;
        return (
          <li key={etape.id} className="relative flex flex-col items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn("absolute right-1/2 top-6 h-0.5 w-full -translate-y-1/2", i <= indexEtape ? "bg-baobab" : "bg-filet")}
              />
            )}
            <button
              type="button"
              onClick={() => onSelect(etape.id)}
              aria-current={active ? "step" : undefined}
              aria-label={`Étape ${i + 1} : ${etape.label}${faite ? ", terminée" : ""}`}
              className={cn(
                "relative z-10 flex size-12 items-center justify-center rounded-full border-2 text-title font-bold transition-colors duration-hover",
                faite && "border-baobab bg-baobab text-white",
                active && "border-baobab bg-white text-baobab ring-4 ring-baobab-100",
                !faite && !active && "border-bord-champ bg-white text-texte2",
              )}
            >
              {faite ? <Check aria-hidden className="size-5" /> : i + 1}
            </button>
            <span className={cn("mt-3 text-center text-body-m", active || faite ? "font-semibold text-encre" : "text-texte2")}>
              {etape.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SegmentsMobile({ indexEtape }: { indexEtape: number }) {
  return (
    <div className="grid grid-cols-8 gap-1.5" aria-hidden>
      {ETAPES.map((etape, i) => (
        <span key={etape.id} className={cn("h-2 rounded-full", i <= indexEtape ? "bg-baobab" : "bg-filet")} />
      ))}
    </div>
  );
}

interface EtatBrouillonProps {
  enregistrement: boolean;
  echec: boolean;
  heure: string | null;
  libelle: string;
  repris: boolean;
}

export function EtatBrouillon({ enregistrement, echec, heure, libelle, repris }: EtatBrouillonProps) {
  if (echec && !enregistrement) {
    return (
      <p className="flex items-center gap-2 text-body-m font-semibold text-encre" role="status">
        <TriangleAlert aria-hidden className="size-4 shrink-0 fill-soleil" />
        Brouillon non enregistré. Il sera réessayé à l'étape suivante.
      </p>
    );
  }
  const texte = enregistrement
    ? "Enregistrement du brouillon…"
    : heure
      ? `Brouillon enregistré à ${heure}`
      : repris
        ? "Brouillon repris là où vous l'aviez laissé"
        : null;
  if (!texte) return null;
  return (
    <p className="flex items-center gap-2 text-body-m text-texte2" aria-live="polite">
      {enregistrement ? (
        <LoaderCircle aria-hidden className="size-4 animate-spin" />
      ) : (
        <Check aria-hidden className="size-4 text-baobab" />
      )}
      <span className="truncate">
        {texte}
        {libelle && ` · ${libelle}`}
      </span>
    </p>
  );
}
