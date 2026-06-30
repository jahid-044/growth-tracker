/**
 * Framework-agnostic store for the in-memory access token.
 *
 * The access token is never persisted to localStorage (XSS exposure). It lives
 * only here, in module memory, and is restored on page load via a silent
 * `POST /api/auth/refresh` (the durable credential is the httpOnly refresh cookie).
 *
 * This module deliberately imports nothing from React or axios so that both the
 * axios interceptors (`axiosClient.ts`) and the React context (`AuthContext.tsx`)
 * can import it without creating a circular dependency.
 */

let accessToken: string | null = null;

type TokenListener = (token: string | null) => void;
const listeners = new Set<TokenListener>();

let onAuthFailure: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

/** Updates the in-memory token and notifies subscribers (e.g. the React context). */
export function setAccessToken(token: string | null): void {
  accessToken = token;
  for (const listener of listeners) listener(token);
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
