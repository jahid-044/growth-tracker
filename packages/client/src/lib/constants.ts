/** Shared signup form constants and date helpers. */

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Operations",
  "HR",
  "Other",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Oldest selectable birth year. */
const MIN_BIRTH_YEAR = 1940;
/** Minimum age (years) — the most recent selectable birth year. */
const MIN_AGE_YEARS = 10;

const CURRENT_YEAR = new Date().getFullYear();

/** Selectable years, newest first is not required — kept ascending to match prior behavior. */
export const YEARS = Array.from(
  { length: CURRENT_YEAR - MIN_AGE_YEARS - MIN_BIRTH_YEAR + 1 },
  (_, i) => String(MIN_BIRTH_YEAR + i),
);

/** Zero-padded month strings "01".."12". */
export const MONTHS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

/** Number of days in the given (1-based) month/year. Falls back to 31 when incomplete. */
export function getDaysInMonth(year: string, month: string): number {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

/** Zero-padded day strings "01".."<maxDays>". */
export function buildDays(maxDays: number): string[] {
  return Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0"));
}
