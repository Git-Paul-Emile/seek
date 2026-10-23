import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { RechercheParams } from "@/api/bien";

// Filtres de la page Recherche. L'URL est la seule source de vérité (rules/10-stack/frontend.md) :
// partage de lien, retour arrière et rechargement donnent exactement la même liste.

export type SortKey = "recent" | "ancien" | "prix_asc" | "prix_desc";
export type VueKey = "grille" | "liste" | "carte";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Plus récentes" },
  { value: "ancien", label: "Plus anciennes" },
  { value: "prix_asc", label: "Prix croissant" },
  { value: "prix_desc", label: "Prix décroissant" },
];

export const FLAG_KEYS = ["meuble", "parking", "ascenseur", "animaux", "fumeurs", "misEnAvant"] as const;
export type FlagKey = (typeof FLAG_KEYS)[number];

const VALUE_KEYS = [
  "ville",
  "quartier",
  "typeLogement",
  "typeTransaction",
  "prixMin",
  "prixMax",
  "chambres",
  "surfaceMin",
  "surfaceMax",
  "equipementIds",
] as const;
export type ValueKey = (typeof VALUE_KEYS)[number];

const PROXIMITY_KEYS = ["lat", "lng", "pointLabel", "radius"] as const;

/** Clés qui changent la liste de résultats (le tri, la page et la vue n'en font pas partie). */
const FILTER_KEYS = [...VALUE_KEYS, ...FLAG_KEYS, ...PROXIMITY_KEYS];

const PAGE_SIZE = 30;
const DEFAULT_RADIUS_KM = 5;

const SORT_TO_API: Record<SortKey, Pick<RechercheParams, "sortBy" | "sortOrder">> = {
  recent: { sortBy: "createdAt", sortOrder: "desc" },
  ancien: { sortBy: "createdAt", sortOrder: "asc" },
  prix_asc: { sortBy: "prix", sortOrder: "asc" },
  prix_desc: { sortBy: "prix", sortOrder: "desc" },
};

const toNumber = (value: string | null) => (value ? Number(value) : undefined);

/** Traduit une URL de recherche en paramètres d'API. Exporté pour le compteur du tiroir de filtres. */
export function toApiParams(sp: URLSearchParams, pageSize = PAGE_SIZE): RechercheParams {
  const lat = toNumber(sp.get("lat"));
  const lng = toNumber(sp.get("lng"));
  const proximite = lat !== undefined && lng !== undefined;
  const sort = (sp.get("sort") as SortKey | null) ?? "recent";
  const flag = (key: FlagKey) => (sp.get(key) === "1" ? ("1" as const) : undefined);

  return {
    ville: sp.get("ville") || undefined,
    quartier: sp.get("quartier") || undefined,
    typeLogement: sp.get("typeLogement") || undefined,
    typeTransaction: sp.get("typeTransaction") || undefined,
    prixMin: toNumber(sp.get("prixMin")),
    prixMax: toNumber(sp.get("prixMax")),
    chambres: toNumber(sp.get("chambres")),
    surfaceMin: toNumber(sp.get("surfaceMin")),
    surfaceMax: toNumber(sp.get("surfaceMax")),
    meuble: flag("meuble"),
    parking: flag("parking"),
    ascenseur: flag("ascenseur"),
    animaux: flag("animaux"),
    fumeurs: flag("fumeurs"),
    misEnAvant: flag("misEnAvant"),
    equipementIds: sp.get("equipementIds") || undefined,
    featuredFirst: "1",
    ...(proximite ? {} : SORT_TO_API[sort] ?? SORT_TO_API.recent),
    page: Number(sp.get("page") ?? "1") || 1,
    limit: pageSize,
    lat,
    lng,
    radius: proximite ? toNumber(sp.get("radius")) ?? DEFAULT_RADIUS_KM : undefined,
  };
}

export function useRechercheFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const apiParams = useMemo(() => toApiParams(searchParams), [searchParams]);

  /** Applique des changements de filtres et revient à la page 1. `null` ou "" retire la clé. */
  const update = (changes: Record<string, string | null>, options: { resetPage?: boolean } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    });
    if (options.resetPage !== false) next.delete("page");
    setSearchParams(next);
  };

  const get = (key: string) => searchParams.get(key) ?? "";
  const isOn = (key: FlagKey) => searchParams.get(key) === "1";
  const toggle = (key: FlagKey) => update({ [key]: isOn(key) ? null : "1" });

  const activeFilterCount = FILTER_KEYS.filter((key) => key !== "pointLabel" && key !== "lng" && key !== "radius")
    .filter((key) => searchParams.get(key))
    .reduce((count, key) => (key === "equipementIds" ? count + get(key).split(",").filter(Boolean).length : count + 1), 0);

  const clearAll = () => {
    const next = new URLSearchParams();
    const vue = searchParams.get("vue");
    if (vue) next.set("vue", vue);
    setSearchParams(next);
  };

  /** Remplace tous les filtres par ceux du tiroir, en gardant tri et vue. */
  const replaceFilters = (filters: URLSearchParams) => {
    const next = new URLSearchParams(filters);
    ["sort", "vue"].forEach((key) => {
      const value = searchParams.get(key);
      if (value) next.set(key, value);
    });
    next.delete("page");
    setSearchParams(next);
  };

  return {
    searchParams,
    apiParams,
    get,
    isOn,
    toggle,
    update,
    clearAll,
    replaceFilters,
    activeFilterCount,
    sort: (searchParams.get("sort") as SortKey | null) ?? "recent",
    setSort: (sort: SortKey) => update({ sort: sort === "recent" ? null : sort }),
    vue: (searchParams.get("vue") as VueKey | null) ?? "grille",
    setVue: (vue: VueKey) => update({ vue: vue === "grille" ? null : vue }, { resetPage: false }),
    page: apiParams.page ?? 1,
    setPage: (page: number) => update({ page: page > 1 ? String(page) : null }, { resetPage: false }),
    isProximite: apiParams.lat !== undefined && apiParams.lng !== undefined,
    pageSize: PAGE_SIZE,
  };
}
