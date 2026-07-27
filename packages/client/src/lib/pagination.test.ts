import { describe, it, expect } from "vitest";
import { getPaginationItems } from "@/lib/pagination";

describe("getPaginationItems", () => {
  it("shows every page with no ellipsis when the total is small", () => {
    expect(getPaginationItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("matches the page-1-of-11 case: 1 2 3 … 10 11", () => {
    expect(getPaginationItems(1, 11)).toEqual([1, 2, 3, "ellipsis-end", 10, 11]);
  });

  it("mirrors for the last page: 1 2 … 9 10 11", () => {
    expect(getPaginationItems(11, 11)).toEqual([1, 2, "ellipsis-start", 9, 10, 11]);
  });

  it("shows two ellipses when the current page is in the middle of a large total", () => {
    expect(getPaginationItems(15, 30)).toEqual([
      1,
      2,
      "ellipsis-start",
      13,
      14,
      15,
      16,
      17,
      "ellipsis-end",
      29,
      30,
    ]);
  });

  it("fills in a lone hidden page instead of collapsing it to an ellipsis", () => {
    // boundary {1,2}, siblings of page 5 with siblingCount=1 -> {4,5,6}; page 3 is the
    // single hidden page between them and should be shown directly, not "…".
    expect(getPaginationItems(5, 12, { siblingCount: 1 })).toEqual([1, 2, 3, 4, 5, 6, "ellipsis-end", 11, 12]);
  });

  it("returns an empty list for zero total pages", () => {
    expect(getPaginationItems(1, 0)).toEqual([]);
  });
});
