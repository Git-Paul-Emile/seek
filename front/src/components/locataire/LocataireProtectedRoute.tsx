import { Navigate, Outlet } from "react-router-dom";
import { useLocataireAuth } from "@/context/LocataireAuthContext";

/** Accessible uniquement si connecté - redirige vers /locataire/login sinon */
const LocataireProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useLocataireAuth();

  if (isLoading) return null;

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/locataire/login" replace />;
};

export default LocataireProtectedRoute;
