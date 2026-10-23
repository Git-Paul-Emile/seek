import { useQuery } from "@tanstack/react-query";
import { fetchTemoignages, type Temoignage } from "@/api/temoignage";

export const useTemoignages = () =>
  useQuery<Temoignage[]>({
    queryKey: ["temoignages"],
    queryFn: fetchTemoignages,
    staleTime: 5 * 60 * 1000, // 5 min
  });
