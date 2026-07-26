import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthLoading } from "@/components/auth/AuthLoading";

/** Gate for private routes. Redirects unauthenticated users to /login. */
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to={`/${lang}/login`} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
