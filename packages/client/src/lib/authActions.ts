/**
 * The async auth flows. These live outside `store/authStore.ts` so the store
 * stays a dependency-free leaf that `lib/axiosClient.ts` can import: the chain
 * here is authActions → lib/auth → axiosClient → authStore, with no cycle.
 */

import { loginRequest, refreshRequest, meRequest, logoutRequest } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth";

export async function login(email: string, password: string): Promise<User> {
  const { accessToken, user } = await loginRequest(email, password);
  useAuthStore.getState().setSession(accessToken, user);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await logoutRequest();
  } finally {
    useAuthStore.getState().clearSession();
  }
}

/**
 * The in-flight bootstrap, so concurrent callers (and React StrictMode's
 * double-mount) share one attempt instead of racing the backend's
 * refresh-token rotation with two /refresh calls.
 */
let bootstrapPromise: Promise<void> | null = null;

/**
 * Restore the session on load. With a persisted access token, go straight to
 * `/me` — if the token is expired, the axios request interceptor refreshes it
 * before the call goes out. Without one, fall back to the httpOnly refresh
 * cookie (e.g. localStorage was cleared). Silent on 401 either way.
 */
export function bootstrap(): Promise<void> {
  bootstrapPromise ??= runBootstrap().finally(() => {
    bootstrapPromise = null;
  });
  return bootstrapPromise;
}

async function runBootstrap(): Promise<void> {
  const { setAccessToken, setUser, clearSession, setLoading } = useAuthStore.getState();
  setLoading(true);
  try {
    if (!useAuthStore.getState().accessToken) {
      const { accessToken } = await refreshRequest();
      setAccessToken(accessToken);
    }
    const { user } = await meRequest();
    setUser(user);
  } catch {
    // No valid token or refresh cookie → user simply isn't logged in. Stay silent.
    clearSession();
  } finally {
    setLoading(false);
  }
}
