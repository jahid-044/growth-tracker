import { useLayoutEffect } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import i18n, { getStoredLocale, isLocale, setLocale } from "@/lib/i18n";

/**
 * Gatekeeper for the `/:lang` segment. Redirects invalid/unsupported locale
 * segments to a valid one, and keeps i18next in sync with the URL as a safety
 * net for direct navigation (typed URLs, bookmarks, back/forward) — the
 * language switcher itself already triggers the change directly to avoid
 * a wrong-language flash on the common click path.
 */
export function LocaleRoute() {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  useLayoutEffect(() => {
    if (isLocale(lang) && i18n.language !== lang) {
      setLocale(lang);
    }
  }, [lang]);

  if (!isLocale(lang)) {
    const rest = location.pathname.split("/").slice(2).join("/");
    const target = `/${getStoredLocale()}${rest ? `/${rest}` : ""}${location.search}${location.hash}`;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

export default LocaleRoute;
