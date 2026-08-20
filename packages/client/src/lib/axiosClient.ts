import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { isAccessTokenExpired } from "@/lib/jwt";
import { useAuthStore } from "@/store/authStore";
import i18n from "@/lib/i18n";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Extra per-request flags this client understands. */
interface AuthRequestConfig extends InternalAxiosRequestConfig {
  /** Skip attaching the Authorization header and skip the 401 refresh dance. */
  _skipAuthRefresh?: boolean;
  /** Set after a request has already been retried once post-refresh. */
  _retry?: boolean;
}

/** Shared axios instance. `withCredentials` is required so the refreshToken cookie flows. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: refresh ahead of expiry, then attach the access token ──
// Decoding the token's `exp` here lets us swap an expired token for a fresh one
// *before* the request goes out, avoiding the guaranteed 401 + retry the response
// interceptor would otherwise incur. The refresh is deduped via `refreshPromise`
// below, so concurrent expired requests share a single /refresh call.
api.interceptors.request.use(async (config: AuthRequestConfig) => {
  // Sent on every request (including login/refresh, which skip the auth dance
  // below) so the server can localize error messages to the current UI language.
  config.headers["Accept-Language"] = i18n.language;

  if (config._skipAuthRefresh) return config;
  let token = useAuthStore.getState().accessToken;
  if (token && isAccessTokenExpired(token)) {
    // On failure `refreshAccessToken` clears the session, then rethrows —
    // rejecting here fails the request fast instead of firing a doomed 401.
    token = await refreshAccessToken();
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: transparent refresh + retry on 401 ────────────────────

// The in-flight refresh, shared by every request that hits a 401 while it runs.
// Memoizing the promise de-dupes concurrent refreshes: the first 401 starts it,
// the rest await the same result. Cleared in `finally` so the next 401 retries.
let refreshPromise: Promise<string | null> | null = null;

function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= api
    .post<{ accessToken: string }>("/api/auth/refresh", undefined, {
      _skipAuthRefresh: true,
    } as AuthRequestConfig)
    .then(({ data }) => {
      useAuthStore.getState().setAccessToken(data.accessToken);
      return data.accessToken;
    })
    .catch((refreshError) => {
      // Auth can no longer be recovered: drop the token *and* the user so the
      // route guards redirect to /login.
      useAuthStore.getState().clearSession();
      throw refreshError;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AuthRequestConfig | undefined;

    // Propagate unchanged when there's nothing to recover:
    //   - no config / not a 401 → not our concern
    //   - `_skipAuthRefresh` → login/signup and the refresh call itself opt out,
    //     so callers see the real error and the interceptor never recurses
    //   - `_retry` → already retried once; bail to avoid an infinite loop
    if (
      !original ||
      error.response?.status !== 401 ||
      original._skipAuthRefresh ||
      original._retry
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    const token = await refreshAccessToken().catch(() => null);
    if (!token) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);
