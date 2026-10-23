import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchAdminStats, fetchProprietairesStats, fetchProprietaireDetail, fetchRevenusStats } from "@/api/stats";

export const useStats = () =>
  useQuery({
    queryKey: ["site-stats"],
    queryFn:  fetchStats,
    staleTime: 5 * 60 * 1000, // 5 min
  });

export const useAdminStats = () =>
  useQuery({
    queryKey: ["admin-stats"],
    queryFn:  fetchAdminStats,
    staleTime: 2 * 60 * 1000, // 2 min
  });

export const useProprietairesStats = () =>
  useQuery({
    queryKey: ["proprietaires-stats"],
    queryFn:  fetchProprietairesStats,
    staleTime: 2 * 60 * 1000, // 2 min
  });

export const useProprietaireDetail = (id: string) =>
  useQuery({
    queryKey: ["proprietaire-detail", id],
    queryFn:  () => fetchProprietaireDetail(id),
    staleTime: 1 * 60 * 1000, // 1 min
    enabled: !!id,
  });

export const useRevenusStats = () =>
  useQuery({
    queryKey: ["revenus-stats"],
    queryFn:  fetchRevenusStats,
    staleTime: 2 * 60 * 1000,
  });
