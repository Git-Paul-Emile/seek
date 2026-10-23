import { Check, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Contrôles du formulaire d'annonce (charte, planche 33) : compteur rond, carte de choix,
// case à cocher en puce, intitulé de groupe.

export function IntituleGroupe({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 text-body-m font-semibold text-encre">{children}</h3>;
}

interface CompteurProps {
  label: string;
  valeur: number;
  onChange: (valeur: number) => void;
  min?: number;
  max?: number;
}

const COMPTEUR_MAX = 20;

export function Compteur({ label, valeur, onChange, min = 0, max = COMPTEUR_MAX }: CompteurProps) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-filet last:border-b-0">
      <span className="text-body-l text-encre">{label}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, valeur - 1))}
          disabled={valeur <= min}
          aria-label={`Retirer une unité : ${label}`}
          className="flex size-12 items-center justify-center rounded-full border-[1.5px] border-bord-champ bg-white text-encre transition-colors duration-hover hover:bg-surface disabled:opacity-40"
        >
          <Minus aria-hidden className="size-5" />
        </button>
        <span aria-live="polite" className="w-6 text-center text-h3 font-bold text-encre">
          {valeur}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, valeur + 1))}
          disabled={valeur >= max}
          aria-label={`Ajouter une unité : ${label}`}
          className="flex size-12 items-center justify-center rounded-full border-[1.5px] border-baobab bg-baobab-100 text-baobab transition-colors duration-hover hover:bg-baobab hover:text-white disabled:opacity-40"
        >
          <Plus aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}

interface CarteChoixProps {
  selectionne: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Carte sélectionnable (type de bien, transaction, statut). */
export function CarteChoix({ selectionne, onClick, disabled, children, className }: CarteChoixProps) {
  return (
    <button
      type="button"
      aria-pressed={selectionne}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex rounded-card border-[1.5px] bg-white text-left transition-colors duration-hover disabled:opacity-60",
        selectionne ? "border-baobab bg-baobab-100/60" : "border-filet hover:border-bord-champ",
        className,
      )}
    >
      {selectionne && (
        <span className="absolute right-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-baobab text-white">
          <Check aria-hidden className="size-4" />
        </span>
      )}
      {children}
    </button>
  );
}

/** Équipement ou meuble à cocher, présenté en puce. */
export function PuceCase({ coche, onClick, children }: { coche: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={coche}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-body-m font-medium transition-colors duration-hover",
        coche ? "border-baobab bg-baobab-100 text-baobab" : "border-bord-champ bg-white text-encre hover:bg-surface",
      )}
    >
      {coche && <Check aria-hidden className="size-4" />}
      {children}
    </button>
  );
}
