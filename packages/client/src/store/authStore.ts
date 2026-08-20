/**
 * Auth state: the access token, the current user, and whether the initial
 * session restore is still running.
 *
 * The access token is persisted to localStorage so the session survives page
 * reloads and stays consistent across tabs without an upfront
 * `POST /api/auth/refresh`. Tradeoff: localStorage is readable by any script on
 * the page, so an XSS payload could exfiltrate the token — the exposure is
 * bounded by the access token's 15-minute TTL, and the durable credential (the
 * refresh token) remains in an httpOnly cookie out of script reach.
 *
 * `user` is deliberately NOT persisted: it is re-fetched by `bootstrap()` from
 * `/api/auth/me`, so a stale profile can never outlive the server's view of it.
 *
 * This module imports nothing from React, axios, or the request helpers, so the
 * axios interceptors (`lib/axiosClient.ts`) can read and write auth state
 * without a circular dependency. The async flows that do talk to the API live
 * in `lib/authActions.ts`.
 */

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { User } from "@/types/auth";

const STORAGE_KEY = "growth-tracker.auth";

/**
 * localStorage with an in-memory fallback for when storage is unavailable
 * (e.g. disabled by the browser). The current page session still works; it
 * just won't survive a reload.
 */
const memoryFallback = new Map<string, string>();

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return memoryFallback.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      memoryFallback.set(name, value);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      memoryFallback.delete(name);
    }
  },
};

interface AuthState {
  accessToken: string | null;
  user: User | null;
  /** True until the initial session restore settles, so route guards can wait. */
  isLoading: boolean;
  setSession: (accessToken: string, user: User) => void;
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: User | null) => void;
  clearSession: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isLoading: true,

      setSession: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      clearSession: () => set({ accessToken: null, user: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ accessToken: state.accessToken }),
      // Runs on load and on every cross-tab rehydrate below. A null token means
      // the other tab logged out (or refresh failed unrecoverably), so drop the
      // user too and let the route guards redirect.
      merge: (persisted, current) => {
        const accessToken = (persisted as { accessToken?: string | null } | undefined)?.accessToken ?? null;
        return { ...current, accessToken, user: accessToken ? current.user : null };
      },
    },
  ),
);

// `persist` writes to storage but does not listen for other tabs writing to it,
// so wire the `storage` event up by hand. It only fires for changes made by
// other tabs, which is exactly the case we need to mirror.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      void useAuthStore.persist.rehydrate();
    }
  });
}
