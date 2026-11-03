import { useMemo, useRef, useState, type ReactNode } from "react";
import Map, { Layer, Marker, Source, type MapRef } from "react-map-gl/mapbox";
import { Minus, Plus } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Map as MapboxMap } from "mapbox-gl";
import { iconeEtablissement } from "@/lib/iconesEtablissements";
import { cn } from "@/lib/utils";

// Localisation de la fiche (maquette « Fiche annonce ») : zone approximative de 500 m autour
// du bien, marqueur en arche au centre de la zone, et les établissements proches à leur place,
// chacun avec l'icône de sa catégorie. Survol, focus ou clic : la bulle d'information s'ouvre.
// Le centre est décalé : l'adresse exacte n'est jamais montrée.

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const RAYON_M = 500;
const POINTS_CERCLE = 64;
const METRES_PAR_DEGRE = 111_320;
const ZOOM_QUARTIER = 14.2;
const MARGE_CADRAGE_PX = 48;

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

/** Établissement proche affiché sur la carte (numéro identique à celui de la liste). */
export interface PointProche {
  id: string;
  /** Catégorie brute (« hopital », « Pharmacie »…) : choisit l'icône. */
  type: string;
  categorie: string;
  nom: string | null;
  distance: string;
  latitude: number;
  longitude: number;
}

interface CarteQuartierProps {
  latitude: number;
  longitude: number;
  /** Identifiant de l'annonce, sert de graine au décalage. */
  graine: string;
  points?: PointProche[];
  /** Bulle du marqueur du bien (titre de l'annonce, par exemple). */
  infoBien?: string;
  className?: string;
}

const ID_BIEN = "bien";
const boutonZoom =
  "flex size-10 items-center justify-center rounded-control border border-bord-champ bg-white text-encre hover:bg-surface";

interface MarqueurInfoProps {
  ouvert: boolean;
  onBasculer: () => void;
  onOuvrir: () => void;
  onFermer: () => void;
  label: string;
  bulle: ReactNode;
  children: ReactNode;
}

// Hauteur réservée à la bulle : plus près du haut de la carte, elle s'ouvre vers le bas.
const PLACE_BULLE_PX = 110;

/** Marqueur avec bulle d'information au survol, au focus clavier et au clic. */
function MarqueurInfo({ ouvert, onBasculer, onOuvrir, onFermer, label, bulle, children }: MarqueurInfoProps) {
  const conteneur = useRef<HTMLDivElement | null>(null);
  const [versLeBas, setVersLeBas] = useState(false);

  const ouvrir = () => {
    const marqueur = conteneur.current;
    const carte = marqueur?.closest(".mapboxgl-map");
    if (marqueur && carte) {
      setVersLeBas(marqueur.getBoundingClientRect().top - carte.getBoundingClientRect().top < PLACE_BULLE_PX);
    }
    onOuvrir();
  };

  return (
    <div ref={conteneur} className="relative" onMouseEnter={ouvrir} onMouseLeave={onFermer}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={ouvert}
        onClick={(event) => {
          event.stopPropagation();
          onBasculer();
        }}
        onFocus={ouvrir}
        onBlur={onFermer}
        className="block rounded-full"
      >
        {children}
      </button>
      {ouvert && (
        <div
          role="tooltip"
          className={cn(
            "absolute left-1/2 z-10 w-max max-w-[240px] -translate-x-1/2 rounded-control border border-filet bg-white px-3 py-2 text-left",
            versLeBas ? "top-full mt-2" : "bottom-full mb-2",
          )}
        >
          {bulle}
        </div>
      )}
    </div>
  );
}

/** Cadre englobant la zone de 500 m et tous les établissements affichés. */
const cadre = (latitude: number, longitude: number, points: PointProche[]): [[number, number], [number, number]] => {
  const dLat = RAYON_M / METRES_PAR_DEGRE;
  const dLng = RAYON_M / (METRES_PAR_DEGRE * Math.cos((latitude * Math.PI) / 180));
  const lats = [latitude - dLat, latitude + dLat, ...points.map((p) => p.latitude)];
  const lngs = [longitude - dLng, longitude + dLng, ...points.map((p) => p.longitude)];
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
};

export function CarteQuartier({ latitude: latBien, longitude: lngBien, graine, points = [], infoBien, className }: CarteQuartierProps) {
  const { latitude, longitude } = useMemo(() => centreDecale(latBien, lngBien, graine), [latBien, lngBien, graine]);
  const zone = useMemo(() => cercle(latitude, longitude, RAYON_M), [latitude, longitude]);
  const mapRef = useRef<MapRef | null>(null);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const basculer = (id: string) => setOuvert((actuel) => (actuel === id ? null : id));

  return (
    <div className={cn("relative aspect-[16/9] overflow-hidden rounded-card bg-surface", className)}>
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        mapStyle={MAP_STYLE}
        // La carte se cadre sur la zone et les établissements ; sans établissement, vue du quartier.
        key={points.length}
        initialViewState={
          points.length > 0
            ? { bounds: cadre(latitude, longitude, points), fitBoundsOptions: { padding: MARGE_CADRAGE_PX } }
            : { latitude, longitude, zoom: ZOOM_QUARTIER }
        }
        style={{ width: "100%", height: "100%" }}
        scrollZoom={false}
        dragRotate={false}
        onLoad={(event) => epurer(event.target)}
        onClick={() => setOuvert(null)}
      >
        <Source id="zone-approximative" type="geojson" data={zone}>
          <Layer id="zone-fond" type="fill" paint={{ "fill-color": "#0A5C43", "fill-opacity": 0.08 }} />
          <Layer id="zone-bord" type="line" paint={{ "line-color": "#0A5C43", "line-width": 2, "line-dasharray": [2, 2] }} />
        </Source>
        <Marker latitude={latitude} longitude={longitude} anchor="center" style={{ zIndex: ouvert === ID_BIEN ? 2 : 1 }}>
          <MarqueurInfo
            ouvert={ouvert === ID_BIEN}
            onBasculer={() => basculer(ID_BIEN)}
            onOuvrir={() => setOuvert(ID_BIEN)}
            onFermer={() => setOuvert(null)}
            label="Le bien, dans sa zone approximative"
            bulle={
              <>
                {infoBien && <p className="text-body-m font-semibold text-encre">{infoBien}</p>}
                <p className="text-caption text-texte2">Position approximative : le propriétaire communique l'adresse exacte.</p>
              </>
            }
          >
            <span className="flex size-14 items-center justify-center rounded-full border-4 border-white bg-baobab">
              <svg viewBox="0 0 518 723" aria-hidden className="h-6 w-auto">
                <path fill="#FFFFFF" d="M0 723V259A259 259 0 0 1 518 259V723Z" />
              </svg>
            </span>
          </MarqueurInfo>
        </Marker>
        {points.map((point) => {
          const Icon = iconeEtablissement(point.type);
          return (
            <Marker
              key={point.id}
              latitude={point.latitude}
              longitude={point.longitude}
              anchor="center"
              style={{ zIndex: ouvert === point.id ? 2 : 1 }}
            >
              <MarqueurInfo
                ouvert={ouvert === point.id}
                onBasculer={() => basculer(point.id)}
                onOuvrir={() => setOuvert(point.id)}
                onFermer={() => setOuvert(null)}
                label={`${point.categorie}${point.nom ? `, ${point.nom}` : ""}, à ${point.distance}`}
                bulle={
                  <>
                    <p className="text-caption font-semibold uppercase text-texte2">{point.categorie}</p>
                    {point.nom && <p className="text-body-m font-semibold text-encre">{point.nom}</p>}
                    <p className="text-caption text-texte2">À {point.distance} du bien</p>
                  </>
                }
              >
                <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-encre text-white">
                  <Icon aria-hidden className="size-4" strokeWidth={2} />
                </span>
              </MarqueurInfo>
            </Marker>
          );
        })}
      </Map>
      <span className="pointer-events-none absolute left-3 top-3 rounded-control border border-filet bg-white px-3 py-1.5 text-body-m font-semibold text-encre">
        Zone approximative · 500 m
      </span>
      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button type="button" aria-label="Zoomer" className={boutonZoom} onClick={() => mapRef.current?.zoomIn()}>
          <Plus aria-hidden className="size-5" />
        </button>
        <button type="button" aria-label="Dézoomer" className={boutonZoom} onClick={() => mapRef.current?.zoomOut()}>
          <Minus aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  );
}
