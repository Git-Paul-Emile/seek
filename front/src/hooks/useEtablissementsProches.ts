import { useQuery } from "@tanstack/react-query";
import { fetchEtablissementsProches, type Bien, type Etablissement } from "@/api/bien";

const UNE_JOURNEE_MS = 24 * 60 * 60 * 1000;

/**
 * L'établissement le plus proche de chaque catégorie autour d'un bien. La fiche publique
 * les fournit quand ils sont déjà enregistrés ; sinon le backend les recherche et les enregistre.
 * Triés du plus proche au plus loin.
 */
export function useEtablissementsProches(bien: Bien) {
  const enregistres = bien.etablissements ?? [];
  const aCoordonnees = bien.latitude !== null && bien.longitude !== null;

  const { data: recherches = [], isLoading, isError } = useQuery<Etablissement[]>({
    queryKey: ["etablissements-proches", bien.id],
    queryFn: () => fetchEtablissementsProches(bien.id),
    enabled: aCoordonnees && enregistres.length === 0,
    staleTime: UNE_JOURNEE_MS,
    retry: false,
  });

  const aRechercher = enregistres.length === 0;
  const liste = (aRechercher ? recherches : enregistres)
    .filter((e) => e.distance !== null)
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  return { etablissements: liste, isLoading: aRechercher && isLoading, isError: aRechercher && isError };
}
