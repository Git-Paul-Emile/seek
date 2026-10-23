import type { Etablissement } from "@/api/bien";

// Établissements proches d'un bien via OpenStreetMap (Overpass), quand le backend n'en fournit pas.
// Appel direct depuis le navigateur : service public sans clé, plusieurs miroirs en secours.

export const ETABLISSEMENT_LABELS: Record<string, string> = {
  hopital: "Hôpital", pharmacie: "Pharmacie",
  ecole_maternelle: "École maternelle", ecole_primaire: "École primaire",
  college: "Collège", lycee: "Lycée", universite: "Université",
  supermarche: "Supermarché", marche: "Marché", boulangerie: "Boulangerie",
  mosquee: "Mosquée", eglise: "Église",
  gendarmerie: "Gendarmerie", pompiers: "Caserne des pompiers", mairie: "Mairie",
  arret_bus: "Arrêt de bus", station_brt: "Station BRT", route_principale: "Route principale",
};

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const d = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(d(lat2 - lat1) / 2) ** 2 +
    Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

type OverpassElement = {
  type: string; id: number;
  lat?: number; lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function overpassToType(tags: Record<string, string>): string | null {
  const a = tags.amenity ?? ""; const s = tags.shop ?? "";
  if (a === "hospital" || a === "clinic") return "hopital";
  if (a === "pharmacy") return "pharmacie";
  if (a === "school") return "ecole_primaire";
  if (a === "college") return "college";
  if (a === "university") return "universite";
  if (a === "marketplace") return "marche";
  if (a === "place_of_worship") return tags.religion === "christian" ? "eglise" : "mosquee";
  if (a === "bus_station") return "arret_bus";
  if (a === "police") return "gendarmerie";
  if (a === "fire_station") return "pompiers";
  if (a === "townhall" || a === "public_building") return "mairie";
  if (s === "supermarket") return "supermarche";
  if (s === "bakery") return "boulangerie";
  return null;
}

const OVERPASS_MIRRORS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

export async function fetchOverpassEtabs(lat: number, lng: number): Promise<Etablissement[]> {
  const amenity = "hospital|clinic|pharmacy|school|college|university|marketplace|place_of_worship|bus_station|police|fire_station|townhall";
  const query =
    `[out:json][timeout:20];` +
    `(nwr["amenity"~"^(${amenity})$"](around:1500,${lat},${lng});` +
    `nwr["shop"~"^(supermarket|bakery)$"](around:1000,${lat},${lng});` +
    `);out center;`;
  let lastError: unknown;
  for (const mirror of OVERPASS_MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18_000);
    try {
      // POST (recommandé par Overpass) plutôt que GET : les miroirs publics
      // rejettent souvent les requêtes GET avec querystring longue (406),
      // surtout sous charge : le POST classique est mieux accepté.
      const res = await fetch(mirror, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const all = (data.elements as OverpassElement[])
        .map((el) => {
          const elLat = el.lat ?? el.center?.lat;
          const elLon = el.lon ?? el.center?.lon;
          const type  = overpassToType(el.tags ?? {});
          if (!type || !Number.isFinite(elLat) || !Number.isFinite(elLon)) return null;
          const tags = el.tags ?? {};
          const adresse = tags["addr:full"] ??
            (tags["addr:housenumber"] && tags["addr:street"]
              ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
              : tags["addr:street"] ?? null);
          return {
            id: `overpass-${el.id}`, type,
            nom: tags.name ?? null,
            latitude: elLat as number, longitude: elLon as number,
            distance: Math.round(haversineDist(lat, lng, elLat as number, elLon as number)),
            adresse: adresse ?? null,
          } as Etablissement;
        })
        .filter((e): e is Etablissement => e !== null);
      // Un seul établissement par type : le plus proche.
      const byType = new Map<string, Etablissement>();
      for (const e of all) {
        const existing = byType.get(e.type);
        if (!existing || (e.distance ?? Infinity) < (existing.distance ?? Infinity)) byType.set(e.type, e);
      }
      return Array.from(byType.values());
    } catch (err) { clearTimeout(timer); lastError = err; }
  }
  throw lastError;
}
