import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Protège les routes admin.
 * Redirige vers /admin/login si l'utilisateur n'est pas authentifié.
 * Affiche un écran de chargement pendant la vérification de la session.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center bg-surface">
        <Loader2 aria-hidden className="size-8 animate-spin text-baobab" />
        <span className="sr-only">Vérification de la session</span>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
