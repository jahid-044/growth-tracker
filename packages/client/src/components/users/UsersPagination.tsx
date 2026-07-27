import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getPaginationItems } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const pagerButtonClassName = "rounded-md border border-neutral-300 px-3 py-1.5 disabled:opacity-40";
const pageButtonClassName = "min-w-8 rounded-md border px-2 py-1.5";

export function UsersPagination({ page, totalPages, onPageChange }: UsersPaginationProps) {
  const { t } = useTranslation();
  const items = useMemo(() => getPaginationItems(page, totalPages), [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <nav aria-label={t("users.pagination.label")} className="flex items-center justify-center gap-1 text-sm text-neutral-600">
      <button
        type="button"
        data-testid="users-prev-page"
        className={pagerButtonClassName}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        {t("users.pagination.prev")}
      </button>

      {items.map((item, idx) =>
        typeof item === "number" ? (
          <button
            key={item}
            type="button"
            data-testid={`users-page-${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              pageButtonClassName,
              item === page
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-50",
            )}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={`${item}-${idx}`} className="px-1.5 text-neutral-400">
            …
          </span>
        ),
      )}

      <button
        type="button"
        data-testid="users-next-page"
        className={pagerButtonClassName}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        {t("users.pagination.next")}
      </button>
    </nav>
  );
}
