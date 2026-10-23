import { useState, useEffect, useRef } from "react";

// ─── Types internes (brut API Nominatim) ──────────────────────────────────────

/** Résultat brut de l'API Nominatim - seuls les champs utiles sont déclarés */
interface NominatimRawResult {
  place_id: number;
  display_name: string;
  /** Type sémantique OSM : "suburb", "neighbourhood", "city", etc. */
  type: string;
  lat: string;
  lon: string;
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

// ─── Type public - données propres stockées dans le formulaire ────────────────

/**
 * Données complètes d'un quartier sélectionné.
 * Stocker cet objet dans le state du formulaire permet de conserver
 * le nom court, les coordonnées et les données de contexte.
 */
export interface QuartierSuggestion {
  placeId: number;
  /** Nom court du quartier à afficher et stocker (suburb ou neighbourhood) */
  nom: string;
  /** display_name complet Nominatim, conservé pour référence / debug */
  displayName: string;
  lat: number;
  lon: number;
  address: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    /** Région / état - utile pour auto-sélectionner la ville dans le formulaire */
    state?: string;
    country?: string;
    countryCode?: string;
  };
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";

/**
 * Identifiant obligatoire selon les CGU Nominatim.
 * Ne pas spammer : max 1 req/s - géré par le debounce 500 ms.
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */
const NOMINATIM_HEADERS: HeadersInit = {
  "Accept-Language": "fr",
  "User-Agent": "seek-immobilier/1.0 (contact@seek-immobilier.sn)",
};

/** Types OSM acceptés comme "quartier" */
const QUARTIER_TYPES = new Set<string>(["suburb", "neighbourhood"]);

/** Nombre de caractères minimum pour déclencher une requête */
const MIN_QUERY_LENGTH = 2;

/** Délai debounce en ms - respecte la règle 1 req/s de Nominatim */
const DEBOUNCE_MS = 500;

/** Nombre maximum de résultats affichés */
const MAX_SUGGESTIONS = 5;

// ─── Mapping brut → propre ────────────────────────────────────────────────────

/**
 * Mappe un résultat brut Nominatim vers une QuartierSuggestion.
 * Retourne `null` si le résultat n'est pas un suburb/neighbourhood valide.
 */
function mapResult(raw: NominatimRawResult): QuartierSuggestion | null {
  // 1. Filtrer sur le type OSM
  if (!QUARTIER_TYPES.has(raw.type)) return null;

  // 2. Extraire le nom court du quartier
  const nom = raw.address?.suburb ?? raw.address?.neighbourhood;
  if (!nom) return null;

  return {
    placeId: raw.place_id,
    nom,
    displayName: raw.display_name,
    lat: parseFloat(raw.lat),
    lon: parseFloat(raw.lon),
    address: {
      suburb: raw.address?.suburb,
      neighbourhood: raw.address?.neighbourhood,
      city: raw.address?.city,
      town: raw.address?.town,
      village: raw.address?.village,
      state: raw.address?.state,
      country: raw.address?.country,
      countryCode: raw.address?.country_code,
    },
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseNominatimQuartierReturn {
  suggestions: QuartierSuggestion[];
  loading: boolean;
  /** Message d'erreur affiché à l'utilisateur, null si pas d'erreur */
  error: string | null;
  /** Vide manuellement les suggestions (ex : après sélection) */
  clear: () => void;
}

/**
 * Hook d'autocomplete de quartier via OpenStreetMap Nominatim.
 *
 * Bonnes pratiques Nominatim respectées :
 * - User-Agent identifiant l'application
 * - Debounce 500 ms (max 1 req/s)
 * - AbortController pour annuler les requêtes obsolètes
 * - countrycodes pour restreindre au pays sélectionné
 *
 * @param query      - Texte saisi par l'utilisateur
 * @param countryCode - Code ISO 2 lettres du pays (ex : "sn" pour Sénégal)
 */
export function useNominatimQuartier(
  query: string,
  countryCode: string
): UseNominatimQuartierReturn {
  const [suggestions, setSuggestions] = useState<QuartierSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Annuler le timer précédent
    if (timerRef.current) clearTimeout(timerRef.current);
    // Annuler la requête HTTP en cours (évite les race conditions)
    if (abortRef.current) abortRef.current.abort();

    // Pas assez de caractères → réinitialiser sans requête
    if (query.length <= MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Nominatim accepte limit > MAX_SUGGESTIONS pour compenser le filtrage
        const params = new URLSearchParams({
          format: "json",
          q: query,
          countrycodes: countryCode.toLowerCase() || "sn",
          limit: "10",
          addressdetails: "1",
        });

        const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
          headers: NOMINATIM_HEADERS,
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);

        const data: NominatimRawResult[] = await res.json();

        // Mapper, filtrer (suburb/neighbourhood), dédupliquer par nom, tronquer
        const seen = new Set<string>();
        const mapped = data
          .map(mapResult)
          .filter((s): s is QuartierSuggestion => s !== null)
          .filter((s) => {
            if (seen.has(s.nom.toLowerCase())) return false;
            seen.add(s.nom.toLowerCase());
            return true;
          })
          .slice(0, MAX_SUGGESTIONS);

        setSuggestions(mapped);
        setError(null);
      } catch (err) {
        // Ignorer les AbortError (requête volontairement annulée)
        if (err instanceof DOMException && err.name === "AbortError") return;
        console.error("[useNominatimQuartier]", err);
        setError("Impossible de charger les suggestions.");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, countryCode]);

  return {
    suggestions,
    loading,
    error,
    clear: () => {
      setSuggestions([]);
      setError(null);
    },
  };
}
