import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import ar from "@/locales/ar.json";

export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = "growth-tracker.locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value != null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function getStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : "en";
  } catch {
    return "en";
  }
}

function persistLocale(locale: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable — the session-only i18next state still works.
  }
}

function applyDomLocale(locale: string): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

void i18next
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ar: { translation: ar } },
    lng: getStoredLocale(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  })
  .then(() => applyDomLocale(i18next.language));

i18next.on("languageChanged", (locale) => {
  persistLocale(locale);
  applyDomLocale(locale);
});

/** Switches the active language; persistence and `<html>` lang/dir sync happen via the `languageChanged` listener above. */
export function setLocale(locale: Locale): void {
  void i18next.changeLanguage(locale);
}

export default i18next;
