import { Navigate, Outlet } from "react-router-dom";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useAuth } from "@/context/AuthContext";

/**
 * Accessible uniquement si NON connecté en tant que locataire/propriétaire/admin.
 * Un ComptePublic (compte visiteur léger, auto-créé pour les favoris) n'est PAS un
 * rôle métier : il ne doit pas bloquer l'accès à ce formulaire, sinon tout visiteur
 * ayant simplement ajouté un favori se retrouve silencieusement redirigé vers "/"
 * en cliquant sur "Espace locataire" dans le header.
 */
const LocataireGuestRoute = () => {
  const { isAuthenticated: isLocataire, isLoading: locataireLoading } = useLocataireAuth();
  const { isAuthenticated: isOwner, isLoading: ownerLoading } = useOwnerAuth();
  const { isAuthenticated: isAdmin, isLoading: adminLoading } = useAuth();

  if (locataireLoading || ownerLoading || adminLoading) return null;

  if (isLocataire) return <Navigate to="/locataire/dashboard" replace />;
  if (isOwner) return <Navigate to="/owner/dashboard" replace />;
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />;

  return <Outlet />;
};

export default LocataireGuestRoute;
