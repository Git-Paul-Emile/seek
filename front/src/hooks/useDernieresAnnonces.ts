import { useQuery } from "@tanstack/react-query";
import { fetchDernieresAnnonces, type BienAvecIsNew } from "@/api/bien";

export const useDernieresAnnonces = (limit: number = 10) =>
  useQuery<BienAvecIsNew[]>({
    queryKey: ["dernieres-annonces", limit],
    queryFn: () => fetchDernieresAnnonces(limit),
    staleTime: 2 * 60 * 1000, // 2 min - données mises en cache
  });
