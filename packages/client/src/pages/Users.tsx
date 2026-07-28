import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown } from "lucide-react";
import axios from "axios";
import { UsersPagination } from "@/components/users/UsersPagination";
import { listUsers } from "@/lib/users";
import { getUsersColumns } from "@/lib/usersColumns";
import { DEPARTMENTS } from "@/lib/constants";
import { getRoleLabel, getDepartmentLabel, getExperienceLevelLabel } from "@/lib/enumLabels";
import { fieldClassName, labelClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { UserExperienceLevel, UserRole, UsersSortBy } from "@/types/users";

const ROLES: UserRole[] = ["LEARNER", "MANAGER"];
const EXPERIENCE_LEVELS: UserExperienceLevel[] = ["JUNIOR", "MID", "SENIOR"];
// Mirrors SORTABLE_FIELDS in packages/server/src/controllers/users.ts.
const SORTABLE_FIELDS: UsersSortBy[] = ["createdAt", "email", "role", "department", "experienceLevel"];
const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

function parsePage(searchParams: URLSearchParams): number {
  const n = parseInt(searchParams.get("page") ?? "", 10);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function parsePageSize(searchParams: URLSearchParams): number {
  const n = parseInt(searchParams.get("pageSize") ?? "", 10);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}

function parseEnumParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T | "" {
  const raw = searchParams.get(key);
  return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : "";
}

/** A patch of URL params to apply; `null` (or `""`) removes the key. */
type ParamPatch = Record<string, string | number | null>;

function Users() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Derive all table state from the URL (the single source of truth) ──
  const page = parsePage(searchParams);
  const pageSize = parsePageSize(searchParams);
  const role = parseEnumParam(searchParams, "role", ROLES);
  const department = parseEnumParam(searchParams, "department", DEPARTMENTS);
  const experienceLevel = parseEnumParam(searchParams, "experienceLevel", EXPERIENCE_LEVELS);
  const search = searchParams.get("search")?.trim() ?? "";

  const rawSortBy = searchParams.get("sortBy");
  const sortBy = rawSortBy && (SORTABLE_FIELDS as readonly string[]).includes(rawSortBy) ? (rawSortBy as UsersSortBy) : undefined;
  const sortOrder: "asc" | "desc" | undefined = sortBy ? (searchParams.get("sortOrder") === "desc" ? "desc" : "asc") : undefined;

  const sorting = useMemo<SortingState>(
    () => (sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []),
    [sortBy, sortOrder],
  );

  // Draft state for the search box so typing feels instant; debounced into the URL below.
  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  /** Applies a patch of params to the URL (in place, replacing history so filtering doesn't spam back/forward). */
  const updateParams = useCallback(
    (patch: ParamPatch, { resetPage = false }: { resetPage?: boolean } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === "") {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  // Debounce the search draft into the URL.
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === search) return;
    const handle = setTimeout(() => {
      updateParams({ search: trimmed || null }, { resetPage: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchInput, search, updateParams]);

  const usersQuery = {
    page,
    pageSize,
    role: role || undefined,
    department: department || undefined,
    experienceLevel: experienceLevel || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
  };

  const { data, isPending, isFetching, error } = useQuery({
    queryKey: ["users", usersQuery],
    queryFn: ({ signal }) => listUsers(usersQuery, signal),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(() => getUsersColumns(t), [t]);

  const handleSortingChange = useCallback(
    (updater: Updater<SortingState>) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const nextSort = next[0];
      updateParams(
        {
          sortBy: nextSort ? nextSort.id : null,
          sortOrder: nextSort ? (nextSort.desc ? "desc" : "asc") : null,
        },
        { resetPage: true },
      );
    },
    [sorting, updateParams],
  );

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    enableMultiSort: false,
    manualSorting: true,
    manualPagination: true,
    manualFiltering: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const pagination = data?.pagination;

  return (
    <div className="w-full max-w-5xl space-y-6 rounded-xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-neutral-900">{t("users.title")}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="space-y-1">
          <label className={labelClassName} htmlFor="users-filter-role">
            {t("common.role")}
          </label>
          <select
            id="users-filter-role"
            data-testid="users-role-select"
            className={fieldClassName}
            value={role}
            onChange={(e) => updateParams({ role: e.target.value || null }, { resetPage: true })}
          >
            <option value="">{t("users.filters.allRoles")}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {getRoleLabel(t, r)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClassName} htmlFor="users-filter-department">
            {t("common.department")}
          </label>
          <select
            id="users-filter-department"
            data-testid="users-department-select"
            className={fieldClassName}
            value={department}
            onChange={(e) => updateParams({ department: e.target.value || null }, { resetPage: true })}
          >
            <option value="">{t("users.filters.allDepartments")}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {getDepartmentLabel(t, d)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClassName} htmlFor="users-filter-experience">
            {t("auth.signup.experienceLevel")}
          </label>
          <select
            id="users-filter-experience"
            data-testid="users-experience-select"
            className={fieldClassName}
            value={experienceLevel}
            onChange={(e) => updateParams({ experienceLevel: e.target.value || null }, { resetPage: true })}
          >
            <option value="">{t("users.filters.allLevels")}</option>
            {EXPERIENCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {getExperienceLevelLabel(t, level)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className={labelClassName} htmlFor="users-filter-search">
            {t("users.filters.search")}
          </label>
          <input
            id="users-filter-search"
            data-testid="users-search-input"
            type="text"
            className={fieldClassName}
            placeholder={t("users.filters.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClassName} htmlFor="users-filter-page-size">
            {t("users.filters.pageSize")}
          </label>
          <select
            id="users-filter-page-size"
            data-testid="users-page-size-select"
            className={fieldClassName}
            value={pageSize}
            onChange={(e) => {
              const value = Number(e.target.value);
              updateParams({ pageSize: value === DEFAULT_PAGE_SIZE ? null : value }, { resetPage: true });
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p data-testid="users-error" className="text-sm text-red-600">
          {(axios.isAxiosError(error) && error.response?.data?.message) || t("users.error")}
        </p>
      )}

      {isPending ? (
        <p data-testid="users-loading" className="text-sm text-neutral-500">
          {t("common.loading")}
        </p>
      ) : data && data.users.length === 0 ? (
        <p data-testid="users-empty" className="text-sm text-neutral-500">
          {t("users.empty")}
        </p>
      ) : (
        <div className={cn("overflow-x-auto", isFetching && "opacity-60")}>
          <table data-testid="users-table" className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-2 text-left font-medium text-neutral-500",
                        header.column.getCanSort() && "cursor-pointer select-none",
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && <ArrowUp className="size-3" />}
                        {header.column.getIsSorted() === "desc" && <ArrowDown className="size-3" />}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-neutral-100">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 text-neutral-900">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <UsersPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={(p) => updateParams({ page: p <= 1 ? null : p })}
        />
      )}
    </div>
  );
}

export default Users;
