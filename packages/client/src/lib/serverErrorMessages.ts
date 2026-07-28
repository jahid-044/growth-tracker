import type { TFunction } from "i18next";

export interface ServerErrorPayload {
  code?: string;
  message?: string;
}

/**
 * Resolves a display string for a server error response. The server already
 * localizes `message` per the request's Accept-Language header, so it's used
 * verbatim — the client holds no translation mapping of its own. Only a
 * response with no message at all (or a true network failure, handled by the
 * caller) falls back to a generic translated string.
 */
export function translateServerError(payload: ServerErrorPayload | undefined, t: TFunction): string {
  if (payload?.message) return payload.message;
  return t("auth.errors.genericServer");
}
