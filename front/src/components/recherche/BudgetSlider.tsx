import * as Slider from "@radix-ui/react-slider";
import { formatMontant } from "@/lib/fcfa";

// Curseur double du budget (planche « Alertes et fenêtres », tiroir Filtres).

const BORNES = {
  location: { max: 2_000_000, pas: 25_000 },
  vente: { max: 500_000_000, pas: 1_000_000 },
} as const;

interface BudgetSliderProps {
  transaction: "location" | "vente";
  min: string;
  max: string;
  onChange: (min: string | null, max: string | null) => void;
}

export function BudgetSlider({ transaction, min, max, onChange }: BudgetSliderProps) {
  const bornes = BORNES[transaction];
  const valeurMin = min ? Math.min(Number(min), bornes.max) : 0;
  const valeurMax = max ? Math.min(Number(max), bornes.max) : bornes.max;
  const libelleMax = max ? formatMontant(valeurMax) : `${formatMontant(bornes.max)} et +`;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span id="budget-label" className="text-body-m font-semibold text-encre">
          {transaction === "location" ? "Budget mensuel" : "Budget"}
        </span>
        <span className="tabular text-body-m font-semibold text-encre">
          {formatMontant(valeurMin)} à {libelleMax} FCFA
        </span>
      </div>
      <Slider.Root
        aria-labelledby="budget-label"
        className="relative mt-4 flex h-6 touch-none select-none items-center"
        min={0}
        max={bornes.max}
        step={bornes.pas}
        minStepsBetweenThumbs={1}
        value={[valeurMin, valeurMax]}
        onValueChange={([nextMin, nextMax]) =>
          onChange(nextMin > 0 ? String(nextMin) : null, nextMax < bornes.max ? String(nextMax) : null)
        }
      >
        <Slider.Track className="relative h-1 flex-1 rounded-full bg-filet">
          <Slider.Range className="absolute h-full rounded-full bg-baobab" />
        </Slider.Track>
        {["Budget minimum", "Budget maximum"].map((label) => (
          <Slider.Thumb
            key={label}
            aria-label={label}
            className="block size-6 rounded-full border-2 border-baobab bg-white shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
        ))}
      </Slider.Root>
    </div>
  );
}
