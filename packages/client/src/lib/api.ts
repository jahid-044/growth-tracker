import axios from "axios";
import { api } from "@/lib/axiosClient";
import type { AddressInput } from "@/types/address";

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
    const { data } = await api.get("/api/auth/check-email", { params: { email } });
    return Boolean(data.available);
  } catch {
    return true;
  }
}

/** Registers a new user. Caller inspects `ok`/`data` to branch on success vs. error. */
export async function signup(payload: SignupPayload): Promise<SignupResult> {
  try {
    const { data } = await api.post("/api/auth/signup", payload);
    return { ok: true, data };
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      return { ok: false, data: err.response.data };
    }
    throw err; // Network error → handled by caller's catch.
  }
}
