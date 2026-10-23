import { useQuery } from "@tanstack/react-query";
import type { Bien, Etablissement } from "@/api/bien";
import { fetchOverpassEtabs } from "@/api/overpass";

const UNE_JOURNEE_MS = 24 * 60 * 60 * 1000;

/**
 * Points d'intérêt autour d'un bien : ceux enregistrés par le backend, sinon OpenStreetMap.
 * Triés du plus proche au plus loin.
 */
export function useEtablissementsProches(bien: Bien) {
  const enregistres = bien.etablissements ?? [];
  const aCoordonnees = bien.latitude !== null && bien.longitude !== null;

  const { data: osm = [], isLoading } = useQuery<Etablissement[]>({
    queryKey: ["etablissements-osm", bien.latitude, bien.longitude],
    queryFn: () => fetchOverpassEtabs(bien.latitude as number, bien.longitude as number),
    enabled: aCoordonnees && enregistres.length === 0,
    staleTime: UNE_JOURNEE_MS,
    retry: false,
  });

  const liste = (enregistres.length > 0 ? enregistres : osm)
    .filter((e) => e.distance !== null)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return { etablissements: liste, isLoading: isLoading && enregistres.length === 0 };
}
