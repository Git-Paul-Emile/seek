import { useQuery } from "@tanstack/react-query";
import { getLocataireContratApi } from "@/api/locataireAuth";

// Contrat du bail en cours : sert à l'accueil (caution) et à la fenêtre « Voir le contrat ».
export const useContratLocataire = (enabled: boolean) =>
  useQuery({
    queryKey: ["locataire-contrat"],
    queryFn: getLocataireContratApi,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
