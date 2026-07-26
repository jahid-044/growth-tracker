import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { setLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ar: "العربية",
};

/** Two-option toggle for switching between English and Arabic. */
export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  function handleClick(locale: Locale) {
    // Trigger the language change directly (rather than only via the URL's
    // LocaleRoute effect) so the active click path never flashes the old
    // language/direction before the route updates.
    setLocale(locale);
    const rest = location.pathname.split("/").slice(2).join("/");
    navigate(`/${locale}${rest ? `/${rest}` : ""}${location.search}${location.hash}`);
  }

  return (
    <div
      role="group"
      aria-label={t("nav.language")}
      className="inline-flex overflow-hidden rounded-md border border-neutral-300 text-xs"
    >
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          data-testid={`locale-${locale}`}
          onClick={() => handleClick(locale)}
          aria-pressed={i18n.language === locale}
          className={cn(
            "px-2.5 py-1.5 font-medium transition-colors",
            i18n.language === locale
              ? "bg-neutral-900 text-white"
              : "bg-white text-neutral-600 hover:bg-neutral-100"
          )}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
