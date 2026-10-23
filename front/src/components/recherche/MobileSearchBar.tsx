import { ChevronLeft, Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { useRechercheFilters } from "@/hooks/useRechercheFilters";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { formatFcfa } from "@/lib/fcfa";

// Barre du haut des résultats sur mobile (maquette « Parcours du chercheur », écran 2) :
// retour, résumé de la recherche, bouton filtres avec compteur.

type Filters = ReturnType<typeof useRechercheFilters>;

export function MobileSearchBar({ filters, onOpenFilters }: { filters: Filters; onOpenFilters: () => void }) {
  const navigate = useNavigate();
  const { data: types = [] } = useTypeLogements();

  const quartier = filters.get("quartier");
  const ville = filters.get("ville");
  const pointLabel = filters.get("pointLabel");
  const titre = pointLabel
    ? pointLabel.split(",")[0]
    : quartier
      ? `${quartier} et alentours`
      : ville
        ? `${ville} et alentours`
        : "Tout le Sénégal";

  const type = types.find((t) => t.slug === filters.get("typeLogement"))?.nom;
  const transaction = { location: "Location", vente: "Vente" }[filters.get("typeTransaction")];
  const budget = filters.get("prixMax") ? `≤ ${formatFcfa(Number(filters.get("prixMax")))}` : null;
  const resume = [type, transaction, budget].filter(Boolean).join(" · ") || "Tous les biens";

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        type="button"
        aria-label="Retour"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
        className="flex size-12 shrink-0 items-center justify-center rounded-control text-encre hover:bg-surface"
      >
        <ChevronLeft aria-hidden className="size-6" />
      </button>
      <button
        type="button"
        onClick={onOpenFilters}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-filet bg-white px-4 py-2 text-left shadow-card"
      >
        <Search aria-hidden className="size-5 shrink-0 text-encre" />
        <span className="min-w-0">
          <span className="block truncate text-body-m font-bold text-encre">{titre}</span>
          <span className="block truncate text-caption text-texte2">{resume}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onOpenFilters}
        aria-label={`Filtres${filters.activeFilterCount ? `, ${filters.activeFilterCount} actifs` : ""}`}
        className="relative flex size-14 shrink-0 items-center justify-center rounded-full border border-bord-champ bg-white text-encre"
      >
        <SlidersHorizontal aria-hidden className="size-6" />
        {filters.activeFilterCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-6 items-center justify-center rounded-full bg-baobab text-caption font-bold text-white">
            {filters.activeFilterCount}
          </span>
        )}
      </button>
    </div>
  );
}
