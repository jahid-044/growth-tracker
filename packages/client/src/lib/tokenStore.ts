/**
 * Framework-agnostic store for the access token, persisted to localStorage.
 *
 * Persisting the token lets the session survive page reloads and stay
 * consistent across tabs without an upfront `POST /api/auth/refresh`.
 * Tradeoff: localStorage is readable by any script on the page, so an XSS
 * payload could exfiltrate the token — the exposure is bounded by the access
 * token's 15-minute TTL, and the durable credential (the refresh token)
 * remains in an httpOnly cookie out of script reach.
 *
 * If localStorage is unavailable (e.g. storage disabled), the store falls
 * back to module memory so the current page session still works.
 *
 * This module deliberately imports nothing from React or axios so that both the
 * axios interceptors (`axiosClient.ts`) and the React context (`AuthContext.tsx`)
 * can import it without creating a circular dependency.
 */

const STORAGE_KEY = "growth-tracker.accessToken";

/** In-memory fallback used only when localStorage throws. */
let memoryToken: string | null = null;

type TokenListener = (token: string | null) => void;
const listeners = new Set<TokenListener>();

let onAuthFailure: (() => void) | null = null;

function notifyListeners(token: string | null): void {
  for (const listener of listeners) listener(token);
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryToken;
  }
}

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

/** Persists the token (or removes it when null) and notifies subscribers. */
export function setAccessToken(token: string | null): void {
  try {
    if (token === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, token);
  } catch {
    memoryToken = token;
  }
  notifyListeners(token);
}

/** Subscribe to token changes. Returns an unsubscribe function. */
export function subscribeToToken(listener: TokenListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Registers a handler invoked when token refresh ultimately fails — lets the
 * React context clear `user` so route guards can redirect to /login.
 */
export function registerAuthFailureHandler(handler: () => void): void {
  onAuthFailure = handler;
}

/** Called by the axios response interceptor when auth can no longer be recovered. */
export function notifyAuthFailure(): void {
  onAuthFailure?.();
}

// Keep this tab's subscribers (React auth state) in sync when another tab
// logs in or out. The `storage` event only fires for changes made by other tabs.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      notifyListeners(getAccessToken());
    }
  });
}
