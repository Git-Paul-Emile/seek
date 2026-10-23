import { ChevronDown, LayoutGrid, List, Map as MapIcon, X } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { SORT_OPTIONS, type SortKey, type VueKey, type useRechercheFilters } from "@/hooks/useRechercheFilters";
import { formatMontant } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Puces de filtres rapides et barre d'outils des résultats (nombre, tri, vue).

type Filters = ReturnType<typeof useRechercheFilters>;

const CHAMBRES_RAPIDE = "2";

export function QuickFilters({ filters, children }: { filters: Filters; children?: React.ReactNode }) {
  const pointLabel = filters.get("pointLabel");
  return (
    <div className="hide-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filtres rapides">
      {filters.isProximite && (
        <Chip
          selected
          onClick={() => filters.update({ lat: null, lng: null, pointLabel: null, radius: null })}
          aria-label={`Retirer le filtre de zone ${pointLabel}`}
        >
          {pointLabel ? pointLabel.split(",")[0] : "Zone de la carte"}
          <X aria-hidden className="size-4" />
        </Chip>
      )}
      <Chip
        selected={filters.get("typeTransaction") === "location"}
        onClick={() =>
          filters.update({
            typeTransaction: filters.get("typeTransaction") === "location" ? null : "location",
            prixMin: null,
            prixMax: null,
          })
        }
      >
        Location
      </Chip>
      <Chip selected={filters.isOn("meuble")} onClick={() => filters.toggle("meuble")}>
        Meublé
      </Chip>
      <Chip
        selected={filters.get("chambres") === CHAMBRES_RAPIDE}
        onClick={() => filters.update({ chambres: filters.get("chambres") === CHAMBRES_RAPIDE ? null : CHAMBRES_RAPIDE })}
      >
        2 ch. et +
      </Chip>
      <Chip selected={filters.isOn("parking")} onClick={() => filters.toggle("parking")}>
        Parking
      </Chip>
      <Chip selected={filters.isOn("misEnAvant")} onClick={() => filters.toggle("misEnAvant")}>
        Premium uniquement
      </Chip>
      {children}
    </div>
  );
}

export function SortSelect({ value, onChange }: { value: SortKey; onChange: (sort: SortKey) => void }) {
  return (
    <div className="relative">
      <label htmlFor="tri-resultats" className="sr-only">
        Trier les annonces
      </label>
      <select
        id="tri-resultats"
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className="h-12 cursor-pointer appearance-none rounded-control bg-transparent pl-3 pr-9 text-body-l font-medium text-encre hover:bg-surface lg:bg-surface"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-encre" />
    </div>
  );
}

const VUES: { value: VueKey; label: string; icon: typeof List }[] = [
  { value: "grille", label: "Grille", icon: LayoutGrid },
  { value: "liste", label: "Liste", icon: List },
  { value: "carte", label: "Carte seule", icon: MapIcon },
];

export function VueToggle({ value, onChange }: { value: VueKey; onChange: (vue: VueKey) => void }) {
  return (
    <div role="radiogroup" aria-label="Affichage des résultats" className="flex rounded-control bg-surface p-1">
      {VUES.map(({ value: vue, label, icon: Icon }) => (
        <button
          key={vue}
          type="button"
          role="radio"
          aria-checked={value === vue}
          aria-label={label}
          title={label}
          onClick={() => onChange(vue)}
          className={cn(
            "flex size-10 items-center justify-center rounded-[10px] text-texte2 transition-colors duration-tab",
            value === vue && "bg-white text-encre shadow-sm",
          )}
        >
          <Icon aria-hidden className="size-5" />
        </button>
      ))}
    </div>
  );
}

export function ResultCount({ total, isLoading }: { total: number; isLoading: boolean }) {
  return (
    <p className="text-body-l text-texte2" aria-live="polite">
      {isLoading ? (
        "Recherche en cours…"
      ) : (
        <>
          <strong className="font-bold text-encre">{formatMontant(total)}</strong> annonce{total > 1 ? "s" : ""}
        </>
      )}
    </p>
  );
}
