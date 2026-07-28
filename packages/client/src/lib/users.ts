import { api } from "@/lib/axiosClient";
import type { UsersListResponse, UsersQuery } from "@/types/users";

/** Fetches a page of users from `/api/users`. Throws on error; caller handles it. */
export async function listUsers(query: UsersQuery, signal?: AbortSignal): Promise<UsersListResponse> {
  const { data } = await api.get<UsersListResponse>("/api/users", { params: query, signal });
  return data;
}
