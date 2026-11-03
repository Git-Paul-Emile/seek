import { useQueries } from "@tanstack/react-query";
import { fetchSignalementsAdmin, type StatutSignalement } from "@/api/signalement";

/** Nombre de signalements par statut, pour les puces de filtre de l'admin. */
export const useCompteursSignalements = (statuts: StatutSignalement[]) =>
  useQueries({
    // Mêmes clés que la liste de la page : une action sur un signalement met aussi les compteurs à jour.
    queries: statuts.map((statut) => ({
      queryKey: ["admin-signalements", statut, ""],
      queryFn: () => fetchSignalementsAdmin({ statut, search: "" }),
    })),
  }).map(({ data }) => data?.length);
