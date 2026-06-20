import type { AddressInput } from "@/types/address";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface SignupPayload {
  email: string;
  password: string;
  role: "LEARNER" | "MANAGER";
  department: string;
  experienceLevel: "JUNIOR" | "MID" | "SENIOR";
  birthdate: string;
  addresses: AddressInput[];
  teamName?: string;
  bio?: string;
}

export interface SignupResult {
  ok: boolean;
  data: {
    accessToken?: string;
    message?: string;
    [key: string]: unknown;
  };
}

/**
 * Checks whether an email is available for signup.
 * Network/server errors resolve to `true` so a transient failure never blocks the user.
 */
export async function checkEmailAvailable(email: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`,
    );
    const data = await res.json();
    return Boolean(data.available);
  } catch {
    return true;
  }
}

/** Registers a new user. Caller inspects `ok`/`data` to branch on success vs. error. */
export async function signup(payload: SignupPayload): Promise<SignupResult> {
  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}
