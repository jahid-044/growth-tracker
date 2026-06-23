import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  setAccessToken,
  notifyAuthFailure,
} from "@/lib/tokenStore";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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

// ── Request interceptor: attach the in-memory access token ──────────────────────
api.interceptors.request.use((config: AuthRequestConfig) => {
  if (!config._skipAuthRefresh) {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: transparent refresh + retry on 401 ────────────────────

let isRefreshing = false;
let refreshWaiters: Array<(token: string | null) => void> = [];

function flushWaiters(token: string | null) {
  for (const resolve of refreshWaiters) resolve(token);
  refreshWaiters = [];
}

function isRefreshCall(config?: AxiosRequestConfig): boolean {
  return Boolean(config?.url && config.url.endsWith("/api/auth/refresh"));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AuthRequestConfig | undefined;

    // No response (network error) or non-401 — propagate unchanged.
    if (!original || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // The refresh call itself failed → auth is unrecoverable. Don't recurse.
    if (isRefreshCall(original)) {
      setAccessToken(null);
      notifyAuthFailure();
      return Promise.reject(error);
    }

    // Already retried once — give up to avoid an infinite loop.
    if (original._retry) {
      return Promise.reject(error);
    }

    // A refresh is in flight: queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshWaiters.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          original._retry = true;
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    // This request owns the refresh.
    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post<{ accessToken: string }>(
        "/api/auth/refresh",
        undefined,
        { _skipAuthRefresh: true } as AuthRequestConfig,
      );
      const newToken = data.accessToken;
      setAccessToken(newToken);
      flushWaiters(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      flushWaiters(null);
      notifyAuthFailure();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
