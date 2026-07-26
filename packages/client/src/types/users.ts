import type { Department } from "@/lib/constants";

export type UserRole = "LEARNER" | "MANAGER";
export type UserExperienceLevel = "JUNIOR" | "MID" | "SENIOR";
export type UsersSortBy = "createdAt" | "email" | "role" | "department" | "experienceLevel";
export type SortOrder = "asc" | "desc";

export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  department: Department;
  experienceLevel: UserExperienceLevel;
  teamName: string | null;
  bio: string | null;
  birthdate: string;
  createdAt: string;
}

export interface UsersQuery {
  page?: number;
  pageSize?: number;
  role?: UserRole;
  department?: Department;
  experienceLevel?: UserExperienceLevel;
  search?: string;
  sortBy?: UsersSortBy;
  sortOrder?: SortOrder;
}

export interface UsersListResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  sort: {
    sortBy: UsersSortBy;
    sortOrder: SortOrder;
  };
  filters: {
    role: UserRole | null;
    department: Department | null;
    experienceLevel: UserExperienceLevel | null;
    search: string | null;
  };
}
