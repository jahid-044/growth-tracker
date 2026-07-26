import type { TFunction } from "i18next";

const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid credentials": "auth.errors.invalidCredentials",
  "Email already in use": "auth.errors.emailInUse",
};

/**
 * Maps a raw (English, server-generated) error message to a translated string.
 * Unrecognized messages fall back to a generic translated message (or, for a
 * 401 with no message at all, to "Invalid credentials") rather than displaying
 * untranslated server text.
 */
export function translateServerError(
  message: string | undefined,
  status: number | undefined,
  t: TFunction
): string {
  if (message && message in KNOWN_MESSAGES) {
    return t(KNOWN_MESSAGES[message]);
  }
  if (status === 401) return t("auth.errors.invalidCredentials");
  return t("auth.errors.genericServer");
}
