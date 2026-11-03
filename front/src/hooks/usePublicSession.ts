import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useFavorisAuthModal } from "@/context/FavorisAuthModalContext";
import { useFavoris } from "@/hooks/useFavoris";

/**
 * État de session vu depuis l'espace public : compte visiteur, propriétaire ou locataire.
 * Centralise les liens qui en dépendent (publier, espaces, compte, déconnexion) pour l'en-tête,
 * le menu mobile, le pied de page et les appels à l'action des pages publiques.
 */
export function usePublicSession() {
  const { compte, isAuthenticated: isPublicAuth, logout: logoutPublic } = useComptePublicAuth();
  const { owner, isAuthenticated: isOwnerAuth, logout: logoutOwner } = useOwnerAuth();
  const { locataire, isAuthenticated: isLocataireAuth, logout: logoutLocataire } = useLocataireAuth();
  const { openModal } = useFavorisAuthModal();
  const { count: favorisCount } = useFavoris();

  const isConnected = isPublicAuth || isOwnerAuth || isLocataireAuth;
  // Le compte affiché dans l'en-tête : propriétaire, puis locataire, puis visiteur.
  const personne = isOwnerAuth ? owner : isLocataireAuth ? locataire : compte;
  const initiales = personne
    ? [personne.prenom, personne.nom]
        .filter(Boolean)
        .map((part) => part?.charAt(0).toUpperCase())
        .join("")
    : "";

  const espaceProprietaireHref = isOwnerAuth ? "/owner/dashboard" : "/owner/login";
  const espaceLocataireHref = isLocataireAuth ? "/locataire/dashboard" : "/locataire/login";

  const logout = async () => {
    if (isOwnerAuth) await logoutOwner();
    if (isLocataireAuth) await logoutLocataire();
    if (isPublicAuth) await logoutPublic();
  };

  return {
    isConnected,
    isOwnerAuth,
    isLocataireAuth,
    initiales,
    favorisCount,
    /** Publier : le formulaire pour un propriétaire connecté, sinon sa page de connexion. */
    publierHref: isOwnerAuth ? "/owner/biens/ajouter" : "/owner/login",
    /** « Commencer gratuitement » : le tableau de bord si le compte existe déjà, sinon l'inscription. */
    commencerHref: isOwnerAuth ? "/owner/dashboard" : "/owner/register",
    espaceProprietaireHref,
    espaceLocataireHref,
    /** Avatar de l'en-tête : l'espace du rôle connecté, ou le compte visiteur. */
    compteHref: isOwnerAuth ? espaceProprietaireHref : isLocataireAuth ? espaceLocataireHref : "/mon-compte",
    openConnexion: () => openModal(),
    logout,
  };
}
