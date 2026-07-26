import { Navigate, useLocation } from "react-router-dom";
import { getStoredLocale } from "@/lib/i18n";

/** Element for the literal `/` route — `:lang` can't match an empty path. */
export function RootRedirect() {
  const location = useLocation();
  return <Navigate to={`/${getStoredLocale()}${location.search}${location.hash}`} replace />;
}

export default RootRedirect;
