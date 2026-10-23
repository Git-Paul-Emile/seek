/**
 * useFavoris - Favoris stockés en base.
 * Nécessite un compte public (ComptePublic) authentifié.
 * Retourne aussi `isAuthenticated` pour savoir si l'utilisateur est connecté.
 *
 * Utilise TanStack Query pour que toutes les instances (header, cartes, page favoris)
 * partagent le même cache : un toggle depuis une carte met immédiatement à jour le
 * compteur du header, sans rechargement manuel.
 */

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { getFavoriIdsApi, toggleFavoriApi, removeFavoriApi } from "@/api/favori";
import { useFavorisAuthModal } from "@/context/FavorisAuthModalContext";

const IDS_QK  = ["public-favoris-ids"];
const LIST_QK = ["public-favoris"];

export function useFavoris() {
  const { isAuthenticated, isLoading: authLoading } = useComptePublicAuth();
  const { getPendingBienId, clearPendingBienId } = useFavorisAuthModal();
  const qc = useQueryClient();
  const pendingHandled = useRef(false);

  const { data: rawIds = [], isLoading: idsLoading } = useQuery<string[]>({
    queryKey: IDS_QK,
    queryFn: getFavoriIdsApi,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    retry: false,
  });

  const ids = isAuthenticated ? rawIds : [];
  const idsLoaded = !authLoading && (!isAuthenticated || !idsLoading);

  // Si un bien était en attente (cliqué avant connexion), le toggler dès que l'auth est connue.
  useEffect(() => {
    if (authLoading || !isAuthenticated || pendingHandled.current) return;
    const pendingId = getPendingBienId();
    if (!pendingId) return;
    pendingHandled.current = true;
    clearPendingBienId();
    toggleFavoriApi(pendingId).finally(() => {
      qc.invalidateQueries({ queryKey: IDS_QK });
      qc.invalidateQueries({ queryKey: LIST_QK });
    });
  }, [isAuthenticated, authLoading, getPendingBienId, clearPendingBienId, qc]);

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleFavoriApi(id),
    onSuccess: (result, id) => {
      qc.setQueryData<string[]>(IDS_QK, (prev = []) =>
        result.action === "added" ? [...prev, id] : prev.filter((x) => x !== id)
      );
      qc.invalidateQueries({ queryKey: LIST_QK });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFavoriApi(id),
    onSuccess: (_result, id) => {
      qc.setQueryData<string[]>(IDS_QK, (prev = []) => prev.filter((x) => x !== id));
      qc.invalidateQueries({ queryKey: LIST_QK });
    },
  });

  const isFavori = (id: string) => ids.includes(id);

  const toggleFavori = async (id: string) => {
    if (!isAuthenticated) return; // caller doit gérer la modale d'auth
    await toggleMutation.mutateAsync(id);
  };

  const removeFavori = async (id: string) => {
    if (!isAuthenticated) return;
    await removeMutation.mutateAsync(id);
  };

  return {
    ids,
    count: ids.length,
    idsLoaded,
    isAuthenticated,
    isFavori,
    toggleFavori,
    removeFavori,
  };
}
