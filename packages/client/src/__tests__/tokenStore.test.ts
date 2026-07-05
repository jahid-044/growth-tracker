import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getAccessToken,
  setAccessToken,
  subscribeToToken,
} from "@/lib/tokenStore";

const STORAGE_KEY = "growth-tracker.accessToken";

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
