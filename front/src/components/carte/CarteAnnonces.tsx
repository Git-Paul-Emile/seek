import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Marker, type MapRef } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { LocateFixed, Minus, Plus, Search } from "lucide-react";
import type { Bien } from "@/api/bien";
import { ApercuBien, MarqueurPrix, type BienCarte } from "@/components/carte/CarteMarqueurs";
import { lireAnnoncesVues } from "@/lib/annoncesVues";
import { cn } from "@/lib/utils";

// Carte de la charte (planche « Recherche et carte ») : marqueurs de prix, actif en Baobab,
// Premium en Soleil, déjà vu en gris, regroupements en disque. Carte épurée : mer en teinte
// Baobab, routes blanches, aucun commerce affiché.

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;
const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const DAKAR = { longitude: -17.4467, latitude: 14.6928 };
const MER_BAOBAB = "#CFE3D9";
const KM_PAR_DEGRE = 111;
const ZOOM_UNITAIRE = 13;

interface Groupe {
  lat: number;
  lng: number;
  biens: BienCarte[];
}

function regrouper(items: BienCarte[], zoom: number): Groupe[] {
  const pas = zoom < 11 ? 0.1 : zoom < ZOOM_UNITAIRE ? 0.02 : 0;
  if (pas === 0) return items.map((b) => ({ lat: b.latitude, lng: b.longitude, biens: [b] }));
  const grille = new globalThis.Map<string, BienCarte[]>();
  items.forEach((b) => {
    const cle = `${Math.floor(b.latitude / pas)}_${Math.floor(b.longitude / pas)}`;
    grille.set(cle, [...(grille.get(cle) ?? []), b]);
  });
  return [...grille.values()].map((biens) => ({
    biens,
    lat: biens.reduce((s, b) => s + b.latitude, 0) / biens.length,
    lng: biens.reduce((s, b) => s + b.longitude, 0) / biens.length,
  }));
}

/** Épure le fond de carte : masque commerces et points d'intérêt, teinte la mer. */
function epurerStyle(map: mapboxgl.Map) {
  map.getStyle().layers?.forEach((layer) => {
    if (/poi|transit|airport/.test(layer.id)) map.setLayoutProperty(layer.id, "visibility", "none");
    if (layer.id === "water" && layer.type === "fill") map.setPaintProperty(layer.id, "fill-color", MER_BAOBAB);
  });
}

const boutonCarte = "flex size-12 items-center justify-center rounded-control border border-bord-champ bg-white text-encre shadow-card hover:bg-surface";

interface CarteAnnoncesProps {
  items: Bien[];
  proximityPoint?: { lat: number; lng: number; label?: string } | null;
  highlightedId?: string | null;
  onSearchArea?: (zone: { lat: number; lng: number; radiusKm: number }) => void;
  className?: string;
}

export default function CarteAnnonces({ items, proximityPoint, highlightedId, onSearchArea, className }: CarteAnnoncesProps) {
  const mapRef = useRef<MapRef | null>(null);
  const [zoom, setZoom] = useState(12);
  const [selection, setSelection] = useState<BienCarte | null>(null);
  const [deplacee, setDeplacee] = useState(false);
  const [chargee, setChargee] = useState(false);
  const vues = useMemo(() => lireAnnoncesVues(), []);

  const placees = useMemo(
    () => items.filter((b): b is BienCarte => b.latitude !== null && b.longitude !== null),
    [items],
  );
  const groupes = useMemo(() => regrouper(placees, zoom), [placees, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !chargee) return;
    const points: [number, number][] = placees.map((b) => [b.longitude, b.latitude]);
    if (proximityPoint) points.push([proximityPoint.lng, proximityPoint.lat]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 14 });
      return;
    }
    const bounds = points.reduce((b, pt) => b.extend(pt), new mapboxgl.LngLatBounds(points[0], points[0]));
    map.fitBounds(bounds, { padding: 64, maxZoom: 15 });
    setDeplacee(false);
  }, [placees, proximityPoint, chargee]);

  const rechercherIci = () => {
    const map = mapRef.current;
    if (!map || !onSearchArea) return;
    const centre = map.getCenter();
    const bounds = map.getBounds();
    if (!bounds) return;
    const demiLargeurKm = (Math.abs(bounds.getEast() - bounds.getWest()) / 2) * KM_PAR_DEGRE * Math.cos((centre.lat * Math.PI) / 180);
    const demiHauteurKm = (Math.abs(bounds.getNorth() - bounds.getSouth()) / 2) * KM_PAR_DEGRE;
    onSearchArea({ lat: centre.lat, lng: centre.lng, radiusKm: Math.max(1, Math.round(Math.max(demiLargeurKm, demiHauteurKm))) });
    setDeplacee(false);
  };

  const localiser = () =>
    navigator.geolocation?.getCurrentPosition((position) =>
      mapRef.current?.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 14 }),
    );

  return (
    <div className={cn("relative h-full min-h-[320px] overflow-hidden bg-surface", className)}>
      <Map
        ref={mapRef}
        mapboxAccessToken={TOKEN}
        mapStyle={MAP_STYLE}
        initialViewState={{ ...DAKAR, zoom: 12 }}
        style={{ width: "100%", height: "100%" }}
        onLoad={(event) => {
          epurerStyle(event.target);
          setChargee(true);
        }}
        onZoom={(event) => setZoom(event.viewState.zoom)}
        onDragEnd={() => setDeplacee(true)}
        onClick={() => setSelection(null)}
        attributionControl
      >
        {proximityPoint && (
          <Marker longitude={proximityPoint.lng} latitude={proximityPoint.lat} anchor="center">
            <span aria-label={proximityPoint.label ?? "Point recherché"} className="block size-5 rounded-full border-[3px] border-white bg-encre shadow-card" />
          </Marker>
        )}
        {groupes.map((groupe) => {
          if (groupe.biens.length > 1) {
            return (
              <Marker
                key={`g-${groupe.lat}-${groupe.lng}`}
                longitude={groupe.lng}
                latitude={groupe.lat}
                anchor="center"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  mapRef.current?.flyTo({ center: [groupe.lng, groupe.lat], zoom: zoom + 2 });
                }}
              >
                <span className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-baobab text-body-m font-bold text-white ring-8 ring-baobab/20">
                  {groupe.biens.length}
                </span>
              </Marker>
            );
          }
          const bien = groupe.biens[0];
          const actif = bien.id === highlightedId || bien.id === selection?.id;
          return (
            <Marker
              key={bien.id}
              longitude={bien.longitude}
              latitude={bien.latitude}
              anchor="bottom"
              style={{ zIndex: actif ? 10 : 1 }}
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setSelection(bien);
              }}
            >
              <button type="button" aria-label={`${bien.titre ?? "Annonce"}, voir l'aperçu`} className="cursor-pointer">
                <MarqueurPrix bien={bien} actif={actif} vu={vues.has(bien.id)} />
              </button>
            </Marker>
          );
        })}
        {selection && (
          <Marker longitude={selection.longitude} latitude={selection.latitude} anchor="bottom" offset={[0, -40]} style={{ zIndex: 20 }}>
            <ApercuBien bien={selection} />
          </Marker>
        )}
      </Map>

      {onSearchArea && deplacee && (
        <button
          type="button"
          onClick={rechercherIci}
          className="absolute left-1/2 top-4 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-white px-5 text-body-m font-semibold text-encre shadow-float"
        >
          <Search aria-hidden className="size-5" />
          Rechercher dans cette zone
        </button>
      )}

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button type="button" aria-label="Zoomer" className={boutonCarte} onClick={() => mapRef.current?.zoomIn()}>
          <Plus aria-hidden className="size-5" />
        </button>
        <button type="button" aria-label="Dézoomer" className={boutonCarte} onClick={() => mapRef.current?.zoomOut()}>
          <Minus aria-hidden className="size-5" />
        </button>
        <button type="button" aria-label="Centrer sur ma position" className={boutonCarte} onClick={localiser}>
          <LocateFixed aria-hidden className="size-5" />
        </button>
      </div>

      {placees.length < items.length && (
        <p className="absolute bottom-4 left-4 max-w-[60%] rounded-control bg-white px-3 py-2 text-caption text-texte2 shadow-card">
          {items.length - placees.length} annonce{items.length - placees.length > 1 ? "s" : ""} sans position GPS, visible
          {items.length - placees.length > 1 ? "s" : ""} dans la liste.
        </p>
      )}
    </div>
  );
}
