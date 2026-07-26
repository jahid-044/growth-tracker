import type { ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import type { UserListItem } from "@/types/users";

/** Column defs for the users table. `id` matches the server's `sortBy` values so
 *  sort-state can be forwarded straight to the API. Cell values are rendered
 *  exactly as returned by the API — no translation or reformatting — only the
 *  column headers are localized. */
export function getUsersColumns(t: TFunction): ColumnDef<UserListItem>[] {
  return [
    {
      id: "email",
      accessorKey: "email",
      header: t("users.columns.email"),
      enableSorting: true,
    },
    {
      id: "role",
      accessorKey: "role",
      header: t("users.columns.role"),
      enableSorting: true,
    },
    {
      id: "department",
      accessorKey: "department",
      header: t("users.columns.department"),
      enableSorting: true,
    },
    {
      id: "experienceLevel",
      accessorKey: "experienceLevel",
      header: t("users.columns.experienceLevel"),
      enableSorting: true,
    },
    {
      id: "teamName",
      accessorKey: "teamName",
      header: t("users.columns.teamName"),
      enableSorting: false,
      cell: ({ row }) => row.original.teamName ?? "",
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: t("users.columns.createdAt"),
      enableSorting: true,
    },
  ];
}
