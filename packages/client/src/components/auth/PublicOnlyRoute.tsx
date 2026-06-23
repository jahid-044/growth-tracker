import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthLoading } from "@/components/auth/AuthLoading";

/** Gate for auth pages (/login, /signup). Redirects logged-in users to home. */
function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default PublicOnlyRoute;
