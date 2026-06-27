import type { AxiosRequestConfig } from "axios";
import { api } from "@/lib/axiosClient";
import type { LoginResponse, MeResponse, RefreshResponse } from "@/types/auth";

/**
 * POST /api/auth/login — returns access token + minimal user. Uses `_skipAuthRefresh`
 * so a 401 (bad credentials) propagates as-is instead of being mistaken for an expired
 * access token and triggering a spurious /refresh attempt.
 */
export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/api/auth/login", { email, password }, {
    _skipAuthRefresh: true,
  } as AxiosRequestConfig);
  return data;
}

/**
 * POST /api/auth/refresh — exchanges the httpOnly refresh cookie for a new access
 * token. Uses `_skipAuthRefresh` so the request carries no (possibly stale)
 * Authorization header and the response interceptor does not recurse on a 401.
 */
export async function refreshRequest(): Promise<RefreshResponse> {
  const { data } = await api.post<RefreshResponse>("/api/auth/refresh", undefined, {
    _skipAuthRefresh: true,
  } as AxiosRequestConfig);
  return data;
}

/** GET /api/auth/me — full profile of the current user (Bearer token attached). */
export async function meRequest(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/api/auth/me");
  return data;
}

/** POST /api/auth/logout — clears the refresh cookie + DB token server-side. */
export async function logoutRequest(): Promise<void> {
  await api.post("/api/auth/logout");
}
