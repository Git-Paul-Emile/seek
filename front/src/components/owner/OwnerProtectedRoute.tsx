import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useOwnerAuth } from "@/context/OwnerAuthContext";

/** Accessible uniquement si connecté - redirige vers /owner/register sinon */
const OwnerProtectedRoute = () => {
  const location = useLocation();
  const { owner, isAuthenticated, isLoading } = useOwnerAuth();

  if (isLoading) return null;

  if (isAuthenticated && owner?.telephoneVerifie === false && location.pathname !== "/owner/verify-phone") {
    return <Navigate to="/owner/verify-phone" replace />;
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/owner/register" replace />;
};

export default OwnerProtectedRoute;
