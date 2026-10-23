import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useFavorisAuthModal } from "@/context/FavorisAuthModalContext";
import { useFavoris } from "@/hooks/useFavoris";

/**
 * État de session vu depuis l'espace public : compte visiteur, propriétaire ou locataire.
 * Centralise les liens qui en dépendent (publier, espace, compte) pour l'en-tête,
 * le menu mobile et les onglets du bas.
 */
export function usePublicSession() {
  const { compte, isAuthenticated: isPublicAuth, logout } = useComptePublicAuth();
  const { isAuthenticated: isOwnerAuth } = useOwnerAuth();
  const { isAuthenticated: isLocataireAuth } = useLocataireAuth();
  const { openModal } = useFavorisAuthModal();
  const { count: favorisCount } = useFavoris();

  const isConnected = isPublicAuth || isOwnerAuth || isLocataireAuth;
  const initiales = compte
    ? [compte.prenom, compte.nom]
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
    : "";

  return {
    isConnected,
    isOwnerAuth,
    isLocataireAuth,
    initiales,
    favorisCount,
    publierHref: isOwnerAuth ? "/owner/biens/ajouter" : "/proprietaires",
    espaceProprietaireHref: isOwnerAuth ? "/owner/dashboard" : "/owner/login",
    espaceLocataireHref: isLocataireAuth ? "/locataire/dashboard" : "/locataire/login",
    openConnexion: () => openModal(),
    logout,
  };
}
