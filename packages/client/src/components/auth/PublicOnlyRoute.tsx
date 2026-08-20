import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { AuthLoading } from "@/components/auth/AuthLoading";

/** Gate for auth pages (/login, /signup). Redirects logged-in users to home. */
function PublicOnlyRoute() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const { lang } = useParams<{ lang: string }>();

  if (isLoading) return <AuthLoading />;
  if (isAuthenticated) return <Navigate to={`/${lang}`} replace />;
  return <Outlet />;
}

export default PublicOnlyRoute;
