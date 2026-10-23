import { Navigate, Outlet } from "react-router-dom";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useAuth } from "@/context/AuthContext";
import { useLocataireAuth } from "@/context/LocataireAuthContext";

/**
 * Accessible uniquement si NON connecté en tant que propriétaire/locataire/admin.
 * Un ComptePublic (compte visiteur léger, auto-créé pour les favoris) n'est PAS un
 * rôle métier : il ne doit pas bloquer l'accès à ce formulaire, sinon tout visiteur
 * ayant simplement ajouté un favori se retrouve silencieusement redirigé vers "/"
 * en cliquant sur "Publier une annonce" / "Espace propriétaires" dans le header.
 */
const OwnerGuestRoute = () => {
  const { owner, isAuthenticated: isOwner, isLoading: ownerLoading } = useOwnerAuth();
  const { isAuthenticated: isAdmin, isLoading: adminLoading } = useAuth();
  const { isAuthenticated: isLocataire, isLoading: locataireLoading } = useLocataireAuth();

  if (ownerLoading || adminLoading || locataireLoading) return null;

  if (isOwner) return <Navigate to={owner?.telephoneVerifie === false ? "/owner/verify-phone" : "/owner/dashboard"} replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;
  if (isLocataire) return <Navigate to="/locataire/dashboard" replace />;

  return <Outlet />;
};

export default OwnerGuestRoute;
