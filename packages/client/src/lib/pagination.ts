export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Builds a compressed page-number sequence for a numbered pager, e.g.
 * `1 2 3 … 10 11`. Always includes the first/last `boundaryCount` pages and
 * `current ± siblingCount`; a gap is only collapsed to an ellipsis when it
 * hides 2+ pages — a lone hidden page is shown directly instead.
 */
export function getPaginationItems(
  current: number,
  total: number,
  {
    siblingCount = 2,
    boundaryCount = 2,
  }: { siblingCount?: number; boundaryCount?: number } = {},
): PaginationItem[] {
  if (total <= 0) return [];

  const shown = new Set<number>();
  for (let p = 1; p <= Math.min(boundaryCount, total); p++) shown.add(p);
  for (let p = Math.max(1, total - boundaryCount + 1); p <= total; p++)
    shown.add(p);
  for (
    let p = Math.max(1, current - siblingCount);
    p <= Math.min(total, current + siblingCount);
    p++
  )
    shown.add(p);

  const sorted = Array.from(shown).sort((a, b) => a - b);

  const items: PaginationItem[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i];
    if (i > 0) {
      const prev = sorted[i - 1];
      const gap = page - prev;
      if (gap === 2) {
        items.push(prev + 1);
      } else if (gap > 2) {
        items.push(page <= current ? "ellipsis-start" : "ellipsis-end");
      }
    }
    items.push(page);
  }

  return items;
}
