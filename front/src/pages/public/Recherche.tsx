import { useState } from "react";
import { List, Map as MapIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";
import CarteAnnonces from "@/components/carte/CarteAnnonces";
import { FiltersSheet } from "@/components/recherche/FiltersSheet";
import { MobileSearchBar } from "@/components/recherche/MobileSearchBar";
import { QuickFilters, ResultCount, SortSelect, VueToggle } from "@/components/recherche/ResultsControls";
import { ResultsList } from "@/components/recherche/ResultsList";
import { Chip } from "@/components/ui/Chip";
import Pagination from "@/components/ui/Pagination";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useRecherchePublique } from "@/hooks/useRecherche";
import { useRechercheFilters } from "@/hooks/useRechercheFilters";
import { cn } from "@/lib/utils";

// Recherche (planches « Recherche : liste et carte » et « Parcours du chercheur ») :
// liste et carte côte à côte sur desktop, liste compacte et bouton Carte flottant sur mobile.

const PAGE_WINDOW = 5;
/** En-tête (80 px) + barre de filtres (74 px) : la carte desktop occupe le reste de l'écran. */
const DESKTOP_TOP_OFFSET = "top-[154px] h-[calc(100vh-154px)]";

const fenetrePages = (page: number, totalPages: number) => {
  const debut = Math.max(1, Math.min(page - Math.floor(PAGE_WINDOW / 2), totalPages - PAGE_WINDOW + 1));
  return Array.from({ length: Math.min(PAGE_WINDOW, totalPages) }, (_, i) => debut + i);
};

const RecherchePage = () => {
  const filters = useRechercheFilters();
  const isDesktop = useIsDesktop();
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [survol, setSurvol] = useState<string | null>(null);
  const [carteMobile, setCarteMobile] = useState(filters.vue === "carte");
  const { data, isLoading, isError, refetch } = useRecherchePublique(filters.apiParams);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const { lat, lng } = filters.apiParams;
  const proximityPoint =
    lat !== undefined && lng !== undefined ? { lat, lng, label: filters.get("pointLabel") || undefined } : null;

  const changerPage = (page: number) => {
    filters.setPage(page);
    window.scrollTo({ top: 0 });
  };

  const pagination = (
    <Pagination
      page={filters.page}
      totalPages={totalPages}
      pageWindow={fenetrePages(filters.page, totalPages)}
      total={total}
      pageSize={filters.pageSize}
      goTo={changerPage}
      goNext={() => changerPage(filters.page + 1)}
      goPrev={() => changerPage(filters.page - 1)}
      reset={() => changerPage(1)}
    />
  );

  const liste = (
    <ResultsList
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      onClearFilters={filters.clearAll}
      isDesktop={isDesktop}
      vue={filters.vue}
      survol={survol}
      onSurvol={setSurvol}
    />
  );

  const carte = (
    <CarteAnnonces
      items={items}
      proximityPoint={proximityPoint}
      highlightedId={survol}
      onSearchArea={(zone) =>
        filters.update({
          lat: String(zone.lat),
          lng: String(zone.lng),
          radius: String(zone.radiusKm),
          pointLabel: "Zone de la carte",
          ville: null,
          quartier: null,
        })
      }
    />
  );

  return (
    <div className="bg-white">
      <Helmet>
        <title>Annonces immobilières au Sénégal | Seek</title>
      </Helmet>
      <h1 className="sr-only">Annonces immobilières</h1>

      <div className="sticky top-0 z-30 border-b border-filet bg-white lg:top-20">
        {!isDesktop && <MobileSearchBar filters={filters} onOpenFilters={() => setFiltresOuverts(true)} />}
        <div className="flex items-center gap-4 px-4 pb-3 lg:px-6 lg:py-3">
          <div className="min-w-0 flex-1">
            <QuickFilters filters={filters}>
              {isDesktop && (
                <Chip onClick={() => setFiltresOuverts(true)}>
                  Tous les filtres{filters.activeFilterCount ? ` (${filters.activeFilterCount})` : ""}
                </Chip>
              )}
            </QuickFilters>
          </div>
          {isDesktop && (
            <div className="flex shrink-0 items-center gap-4">
              <ResultCount total={total} isLoading={isLoading} />
              <SortSelect value={filters.sort} onChange={filters.setSort} />
              <VueToggle value={filters.vue} onChange={filters.setVue} />
            </div>
          )}
        </div>
      </div>

      {isDesktop ? (
        <div className="flex">
          {filters.vue !== "carte" && (
            <div className="min-w-0 flex-1 p-6">
              {liste}
              {pagination}
            </div>
          )}
          <div className={cn("sticky border-l border-filet", DESKTOP_TOP_OFFSET, filters.vue === "carte" ? "flex-1" : "w-[36%] shrink-0")}>
            {carte}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 pt-4">
            <ResultCount total={total} isLoading={isLoading} />
            <SortSelect value={filters.sort} onChange={filters.setSort} />
          </div>
          {carteMobile ? (
            <div className="h-[calc(100dvh-280px)] overflow-hidden px-4 pt-3 [&>*]:rounded-card">{carte}</div>
          ) : (
            <div className="px-4">
              {liste}
              {pagination}
            </div>
          )}
          <button
            type="button"
            onClick={() => setCarteMobile((visible) => !visible)}
            className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 z-40 inline-flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-encre px-6 text-body-l font-bold text-white shadow-float"
          >
            {carteMobile ? <List aria-hidden className="size-5" /> : <MapIcon aria-hidden className="size-5" />}
            {carteMobile ? "Liste" : "Carte"}
          </button>
        </>
      )}

      <FiltersSheet
        open={filtresOuverts}
        onOpenChange={setFiltresOuverts}
        current={filters.searchParams}
        onApply={filters.replaceFilters}
      />
    </div>
  );
};

export default RecherchePage;
