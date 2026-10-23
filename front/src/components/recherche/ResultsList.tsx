import type { Bien } from "@/api/bien";
import { ListingCard, ListingCardSkeleton } from "@/components/annonces/ListingCard";
import { Button } from "@/components/ui/button";
import type { VueKey } from "@/hooks/useRechercheFilters";
import { cn } from "@/lib/utils";

// Liste des résultats avec ses trois états : chargement (squelettes), erreur, aucun résultat.

const SKELETONS = 6;

interface ResultsListProps {
  items: Bien[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  isDesktop: boolean;
  vue: VueKey;
  survol: string | null;
  onSurvol: (id: string | null) => void;
}

export function ResultsList({ items, isLoading, isError, onRetry, onClearFilters, isDesktop, vue, survol, onSurvol }: ResultsListProps) {
  if (isError) {
    return (
      <div className="rounded-card border border-encre p-5">
        <p className="text-body-l font-semibold text-encre">Les annonces n'ont pas pu être chargées.</p>
        <p className="mt-1 text-body-m text-texte2">Vérifiez votre connexion internet, puis réessayez.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <div className="rounded-card bg-surface p-6">
        <p className="text-body-l font-semibold text-encre">Aucune annonce ne correspond à ces critères.</p>
        <p className="mt-1 text-body-m text-texte2">Retirez un filtre ou élargissez la zone de recherche.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onClearFilters}>
          Effacer les filtres
        </Button>
      </div>
    );
  }

  const grille = isDesktop && vue === "grille";
  const layout = grille ? "vertical" : "horizontal";
  const lignes: (Bien | null)[] = isLoading ? Array.from({ length: SKELETONS }, () => null) : items;

  return (
    <ul className={cn(grille ? "grid grid-cols-2 gap-6" : "divide-y divide-filet")}>
      {lignes.map((annonce, index) => (
        <li key={annonce?.id ?? `squelette-${index}`}>
          {annonce ? (
            <ListingCard
              annonce={annonce}
              comparable={isDesktop ? annonce : undefined}
              layout={layout}
              onHover={isDesktop ? onSurvol : undefined}
              highlighted={survol === annonce.id}
              priority={index === 0}
            />
          ) : (
            <ListingCardSkeleton layout={layout} />
          )}
        </li>
      ))}
    </ul>
  );
}
