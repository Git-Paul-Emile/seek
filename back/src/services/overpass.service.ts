/**
 * Établissements proches d'un point via OpenStreetMap (API Overpass, service public sans clé).
 *
 * Seul fichier du backend qui connaît Overpass : le reste du code ne manipule que des
 * `EtablissementProche`. Les instances publiques sont souvent saturées (502 « at capacity »)
 * ou muettes : chaque requête essaie les miroirs tour à tour, avec un délai par miroir.
 *
 * Recherche en deux passes : toutes les catégories dans un rayon court, puis les seules
 * catégories manquantes dans un rayon plus large. On garde, par catégorie, le plus proche.
 */

const MIROIRS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const DELAI_MIROIR_MS = 12_000;
const RAYON_PROCHE_M = 3_000;
const RAYON_ELARGI_M = 15_000;

export interface EtablissementProche {
  type: string;
  nom: string | null;
  latitude: number;
  longitude: number;
  /** Distance au point de recherche, en mètres. */
  distance: number;
}

/** Aucun miroir Overpass n'a répondu : la recherche pourra être relancée plus tard. */
export class EtablissementsIndisponiblesError extends Error {
  constructor(cause?: unknown) {
    super("Service des établissements proches indisponible");
    this.name = "EtablissementsIndisponiblesError";
    this.cause = cause;
  }
}

type Tags = Record<string, string>;

interface Categorie {
  type: string;
  label: string;
  /** Filtre Overpass QL, appliqué aux nœuds, chemins et relations. */
  filtre: string;
  correspond: (tags: Tags) => boolean;
}

const CATEGORIES: readonly Categorie[] = [
  { type: "hopital", label: "Hôpital", filtre: '["amenity"~"^(hospital|clinic)$"]', correspond: (t) => t.amenity === "hospital" || t.amenity === "clinic" },
  { type: "pharmacie", label: "Pharmacie", filtre: '["amenity"="pharmacy"]', correspond: (t) => t.amenity === "pharmacy" },
  { type: "gendarmerie", label: "Gendarmerie", filtre: '["amenity"="police"]', correspond: (t) => t.amenity === "police" },
  { type: "pompiers", label: "Caserne des pompiers", filtre: '["amenity"="fire_station"]', correspond: (t) => t.amenity === "fire_station" },
  { type: "universite", label: "Université", filtre: '["amenity"="university"]', correspond: (t) => t.amenity === "university" },
  { type: "supermarche", label: "Supermarché", filtre: '["shop"="supermarket"]', correspond: (t) => t.shop === "supermarket" },
  { type: "marche", label: "Marché", filtre: '["amenity"="marketplace"]', correspond: (t) => t.amenity === "marketplace" },
  { type: "boulangerie", label: "Boulangerie", filtre: '["shop"="bakery"]', correspond: (t) => t.shop === "bakery" },
  { type: "ecole_maternelle", label: "École maternelle", filtre: '["amenity"="kindergarten"]', correspond: (t) => t.amenity === "kindergarten" },
  { type: "ecole_primaire", label: "École primaire", filtre: '["amenity"="school"]', correspond: (t) => t.amenity === "school" && (!t.school || t.school === "primary") },
  { type: "college", label: "Collège", filtre: '["amenity"="school"]["school"="secondary"]', correspond: (t) => t.amenity === "school" && t.school === "secondary" },
  { type: "lycee", label: "Lycée", filtre: '["amenity"="school"]["school"~"^(high_school|lycee)$"]', correspond: (t) => t.amenity === "school" && (t.school === "high_school" || t.school === "lycee") },
  { type: "mosquee", label: "Mosquée", filtre: '["amenity"="place_of_worship"]["religion"="muslim"]', correspond: (t) => t.amenity === "place_of_worship" && t.religion === "muslim" },
  { type: "eglise", label: "Église", filtre: '["amenity"="place_of_worship"]["religion"="christian"]', correspond: (t) => t.amenity === "place_of_worship" && t.religion === "christian" },
  { type: "mairie", label: "Mairie", filtre: '["amenity"="townhall"]', correspond: (t) => t.amenity === "townhall" },
  { type: "arret_bus", label: "Arrêt de bus", filtre: '["highway"="bus_stop"]', correspond: (t) => t.highway === "bus_stop" },
  { type: "station_brt", label: "Station BRT", filtre: '["railway"="station"]', correspond: (t) => t.railway === "station" },
];

interface ElementOverpass {
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Tags;
}

function distanceMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function construireRequete(lat: number, lon: number, categories: readonly Categorie[], rayon: number): string {
  const filtres = [...new Set(categories.map((c) => c.filtre))]
    .map((filtre) => `nwr${filtre}(around:${rayon},${lat},${lon});`)
    .join("");
  return `[out:json][timeout:25];(${filtres});out center tags;`;
}

async function interroger(requete: string): Promise<ElementOverpass[]> {
  let derniereErreur: unknown;
  for (const miroir of MIROIRS) {
    try {
      const reponse = await fetch(miroir, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: `data=${encodeURIComponent(requete)}`,
        signal: AbortSignal.timeout(DELAI_MIROIR_MS),
      });
      if (!reponse.ok) throw new Error(`${miroir} : HTTP ${reponse.status}`);
      const json = (await reponse.json()) as { elements?: ElementOverpass[] };
      return json.elements ?? [];
    } catch (erreur) {
      derniereErreur = erreur;
    }
  }
  throw new EtablissementsIndisponiblesError(derniereErreur);
}

function plusProcheParCategorie(
  elements: ElementOverpass[],
  lat: number,
  lon: number,
  categories: readonly Categorie[],
): Map<string, EtablissementProche> {
  const trouves = new Map<string, EtablissementProche>();
  for (const element of elements) {
    const elLat = element.lat ?? element.center?.lat;
    const elLon = element.lon ?? element.center?.lon;
    if (elLat === undefined || elLon === undefined) continue;
    const tags = element.tags ?? {};
    const distance = Math.round(distanceMetres(lat, lon, elLat, elLon));
    for (const categorie of categories) {
      if (!categorie.correspond(tags)) continue;
      const actuel = trouves.get(categorie.type);
      if (actuel && actuel.distance <= distance) continue;
      trouves.set(categorie.type, {
        type: categorie.type,
        nom: tags.name ?? categorie.label,
        latitude: elLat,
        longitude: elLon,
        distance,
      });
    }
  }
  return trouves;
}

/**
 * L'établissement le plus proche de chaque catégorie, trié du plus proche au plus loin.
 * Lève `EtablissementsIndisponiblesError` si aucun miroir ne répond à la première passe.
 */
export async function rechercherEtablissementsProches(lat: number, lon: number): Promise<EtablissementProche[]> {
  const proches = await interroger(construireRequete(lat, lon, CATEGORIES, RAYON_PROCHE_M));
  const trouves = plusProcheParCategorie(proches, lat, lon, CATEGORIES);

  const manquantes = CATEGORIES.filter((c) => !trouves.has(c.type));
  if (manquantes.length > 0) {
    try {
      const lointains = await interroger(construireRequete(lat, lon, manquantes, RAYON_ELARGI_M));
      plusProcheParCategorie(lointains, lat, lon, manquantes).forEach((e, type) => trouves.set(type, e));
    } catch (erreur) {
      // La passe élargie est un complément : on garde ce que la première a trouvé.
      if (!(erreur instanceof EtablissementsIndisponiblesError)) throw erreur;
    }
  }

  return [...trouves.values()].sort((a, b) => a.distance - b.distance);
}
