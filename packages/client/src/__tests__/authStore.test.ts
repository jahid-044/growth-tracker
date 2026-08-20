import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/auth";

const STORAGE_KEY = "growth-tracker.auth";

const user: User = { id: "u1", email: "test@company.com" };

/** Reads the access token out of zustand's persisted JSON envelope. */
function persistedToken(): string | null | undefined {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  return (JSON.parse(raw) as { state: { accessToken: string | null } }).state.accessToken;
}

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ accessToken: null, user: null, isLoading: true });
  });

  it("persists the access token to localStorage on set", () => {
    useAuthStore.getState().setSession("token-123", user);

    expect(persistedToken()).toBe("token-123");
    expect(useAuthStore.getState().accessToken).toBe("token-123");
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("does not persist the user — it is re-fetched by bootstrap", () => {
    useAuthStore.getState().setSession("token-123", user);

    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as { state: Record<string, unknown> };
    expect(persisted.state).not.toHaveProperty("user");
  });

  it("clears token and user on clearSession", () => {
    useAuthStore.getState().setSession("token-123", user);
    useAuthStore.getState().clearSession();

    expect(persistedToken()).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("rehydrates a pre-seeded localStorage value (page reload)", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { accessToken: "persisted-token" }, version: 0 }),
    );

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().accessToken).toBe("persisted-token");
  });

  it("adopts a token written by another tab", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { accessToken: "other-tab-token" }, version: 0 }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));

    await vi.waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe("other-tab-token");
    });
  });

  it("clears the user when another tab logs out", async () => {
    useAuthStore.getState().setSession("token-123", user);

    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: null }));

    await vi.waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  it("keeps isLoading untouched across a rehydrate", async () => {
    useAuthStore.setState({ isLoading: false });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { accessToken: "t" }, version: 0 }),
    );

    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
