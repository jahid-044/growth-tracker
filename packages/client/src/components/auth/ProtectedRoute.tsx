import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { AuthLoading } from "@/components/auth/AuthLoading";

/** Gate for private routes. Redirects unauthenticated users to /login. */
function ProtectedRoute() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const location = useLocation();
  const { lang } = useParams<{ lang: string }>();

  if (isLoading) return <AuthLoading />;
  if (!isAuthenticated) {
    return <Navigate to={`/${lang}/login`} replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
