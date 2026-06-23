import type { AddressResponse } from "@/types/address";

/**
 * The authenticated user. `/api/auth/login` returns only `id`/`email`, while
 * `/api/auth/signup` and `/api/auth/me` return the full profile, so the extra
 * fields are optional.
 */
export interface User {
  id: string;
  email: string;
  role?: "LEARNER" | "MANAGER";
  department?: string;
  experienceLevel?: "JUNIOR" | "MID" | "SENIOR";
  teamName?: string | null;
  bio?: string | null;
  birthdate?: string;
  createdAt?: string;
  addresses?: AddressResponse[];
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  user: User;
}
