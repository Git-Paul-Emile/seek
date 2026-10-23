import { useQuery } from "@tanstack/react-query";
import { getProprietaireLocataireApi } from "@/api/locataireAuth";

const QK = "proprietaire-locataire";

export const useProprietaireLocataire = (enabled = true) =>
  useQuery({
    queryKey: [QK],
    queryFn: () => getProprietaireLocataireApi(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
