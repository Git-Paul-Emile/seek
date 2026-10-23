import { useMemo } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap } from "mapbox-gl";
import { cn } from "@/lib/utils";

// Localisation de la fiche (maquette « Fiche annonce ») : zone approximative de 500 m autour
// du bien, marqueur en arche au centre de la zone. Le centre est décalé : l'adresse exacte
// n'est jamais montrée publiquement.

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const RAYON_M = 500;
const POINTS_CERCLE = 64;
const METRES_PAR_DEGRE = 111_320;
const ZOOM_QUARTIER = 14.2;

/** Polygone GeoJSON approchant un cercle de `rayon` mètres. */
const cercle = (lat: number, lng: number, rayon: number): GeoJSON.Feature<GeoJSON.Polygon> => {
  const coordonnees = Array.from({ length: POINTS_CERCLE + 1 }, (_, i) => {
    const angle = (i / POINTS_CERCLE) * 2 * Math.PI;
    const dLat = (rayon * Math.sin(angle)) / METRES_PAR_DEGRE;
    const dLng = (rayon * Math.cos(angle)) / (METRES_PAR_DEGRE * Math.cos((lat * Math.PI) / 180));
    return [lng + dLng, lat + dLat];
  });
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coordonnees] } };
};

const DECALAGE_MIN_M = 150;
const DECALAGE_MAX_M = 300;

/** Décalage stable (même annonce, même décalage) pour ne pas désigner l'adresse exacte. */
const centreDecale = (lat: number, lng: number, graine: string) => {
  const hash = [...graine].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  const angle = ((hash % 360) * Math.PI) / 180;
  const distance = DECALAGE_MIN_M + (hash % (DECALAGE_MAX_M - DECALAGE_MIN_M));
  return {
    latitude: lat + (distance * Math.sin(angle)) / METRES_PAR_DEGRE,
    longitude: lng + (distance * Math.cos(angle)) / (METRES_PAR_DEGRE * Math.cos((lat * Math.PI) / 180)),
  };
};

const epurer = (map: MapboxMap) =>
  map.getStyle().layers?.forEach((layer) => {
    if (/poi|transit/.test(layer.id)) map.setLayoutProperty(layer.id, "visibility", "none");
  });

interface CarteQuartierProps {
  latitude: number;
  longitude: number;
  /** Identifiant de l'annonce, sert de graine au décalage. */
  graine: string;
  className?: string;
}

export function CarteQuartier({ latitude: latBien, longitude: lngBien, graine, className }: CarteQuartierProps) {
  const { latitude, longitude } = useMemo(() => centreDecale(latBien, lngBien, graine), [latBien, lngBien, graine]);
  const zone = useMemo(() => cercle(latitude, longitude, RAYON_M), [latitude, longitude]);

  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden rounded-card bg-surface", className)}>
      <Map
        mapboxAccessToken={TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{ latitude, longitude, zoom: ZOOM_QUARTIER }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        dragRotate={false}
        onLoad={(event) => epurer(event.target)}
      >
        <Source id="zone-approximative" type="geojson" data={zone}>
          <Layer id="zone-fond" type="fill" paint={{ "fill-color": "#0A5C43", "fill-opacity": 0.08 }} />
          <Layer id="zone-bord" type="line" paint={{ "line-color": "#0A5C43", "line-width": 2, "line-dasharray": [2, 2] }} />
        </Source>
        <Marker latitude={latitude} longitude={longitude} anchor="center">
          <span className="flex size-14 items-center justify-center rounded-full border-4 border-white bg-baobab shadow-float">
            <svg viewBox="0 0 518 723" aria-hidden className="h-6 w-auto">
              <path fill="#FFFFFF" d="M0 723V259A259 259 0 0 1 518 259V723Z" />
            </svg>
          </span>
        </Marker>
      </Map>
      <span className="pointer-events-none absolute left-3 top-3 rounded-control bg-white px-3 py-1.5 text-body-m font-semibold text-encre shadow-card">
        Zone approximative · 500 m
      </span>
    </div>
  );
}
