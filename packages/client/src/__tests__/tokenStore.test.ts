import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAccessToken,
  setAccessToken,
  subscribeToToken,
  isAccessTokenExpired,
} from "@/lib/tokenStore";

const STORAGE_KEY = "growth-tracker.accessToken";

/** Builds a JWT-shaped string whose payload carries the given `exp` (seconds). */
function makeToken(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.sig`;
}

describe("tokenStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists the token to localStorage on set", () => {
    setAccessToken("token-123");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("token-123");
    expect(getAccessToken()).toBe("token-123");
  });

  it("removes the token from localStorage when set to null", () => {
    setAccessToken("token-123");
    setAccessToken(null);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it("reads a pre-seeded localStorage value (page reload)", () => {
    localStorage.setItem(STORAGE_KEY, "persisted-token");
    expect(getAccessToken()).toBe("persisted-token");
  });

  it("notifies subscribers on set and stops after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToToken(listener);

    setAccessToken("token-123");
    expect(listener).toHaveBeenCalledWith("token-123");

    setAccessToken(null);
    expect(listener).toHaveBeenCalledWith(null);

    unsubscribe();
    setAccessToken("token-456");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies subscribers when another tab changes the token", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToToken(listener);

    localStorage.setItem(STORAGE_KEY, "other-tab-token");
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: "other-tab-token" }),
    );

    expect(listener).toHaveBeenCalledWith("other-tab-token");
    unsubscribe();
  });
});

describe("isAccessTokenExpired", () => {
  const nowSeconds = () => Math.floor(Date.now() / 1000);

  it("returns false for a token expiring comfortably in the future", () => {
    const token = makeToken({ exp: nowSeconds() + 600 });
    expect(isAccessTokenExpired(token)).toBe(false);
  });

  it("returns true for an already-expired token", () => {
    const token = makeToken({ exp: nowSeconds() - 60 });
    expect(isAccessTokenExpired(token)).toBe(true);
  });

  it("returns true for a token within the skew window", () => {
    // Expires in 10s, inside the default 30s skew buffer.
    const token = makeToken({ exp: nowSeconds() + 10 });
    expect(isAccessTokenExpired(token)).toBe(true);
  });

  it("returns false for a malformed token", () => {
    expect(isAccessTokenExpired("not-a-jwt")).toBe(false);
  });

  it("returns false for a token whose payload has no exp", () => {
    const token = makeToken({ sub: "user-1" });
    expect(isAccessTokenExpired(token)).toBe(false);
  });
});
