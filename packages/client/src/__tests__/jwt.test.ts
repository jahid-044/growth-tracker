import { describe, it, expect } from "vitest";
import { isAccessTokenExpired } from "@/lib/jwt";

/** Builds a JWT-shaped string whose payload carries the given `exp` (seconds). */
function makeToken(payload: Record<string, unknown>): string {
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.sig`;
}

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
