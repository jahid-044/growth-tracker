/**
 * Pure JWT helpers. No state, no React, no axios — safe to import anywhere.
 */

/**
 * Clock-skew buffer: a token within this window of expiry is treated as expired
 * so it gets refreshed before it can lapse in transit.
 */
const EXPIRY_SKEW_MS = 30_000;

/**
 * Decodes a JWT's `exp` claim into an epoch-ms timestamp, or null if the token
 * can't be parsed or carries no `exp`. Payload is base64url-encoded; `atob`
 * exists in the browser and in jsdom (tests).
 */
function decodeExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * True when the token is expired or within `skewMs` of expiring. A token whose
 * expiry can't be read returns false (treated as not expired) so an opaque token
 * can't trigger a proactive-refresh loop — the 401 interceptor is the backstop.
 */
export function isAccessTokenExpired(token: string, skewMs = EXPIRY_SKEW_MS): boolean {
  const expiry = decodeExpiry(token);
  if (expiry === null) return false;
  return Date.now() + skewMs >= expiry;
}
