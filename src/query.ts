import { summarizeSignals } from "./format";
import type { Borrower, SignalFilter, SortKey } from "./types";

export function parseSignalFilter(value: string | null): SignalFilter {
  if (
    value === "urgent" ||
    value === "act" ||
    value === "watch" ||
    value === "informational" ||
    value === "none" ||
    value === "all"
  ) {
    return value;
  }
  return "all";
}

export function parseSortKey(value: string | null): SortKey {
  if (value === "repayment" || value === "name" || value === "outstanding") return value;
  return "outstanding";
}

export function matchesSearch(name: string, query: string): boolean {
  const needle = query.toLowerCase();
  if (!needle) return true;
  return name.toLowerCase().includes(needle);
}

export function matchesSignalFilter(borrower: Borrower, filter: SignalFilter): boolean {
  if (filter === "all") return true;
  const summary = summarizeSignals(borrower.open_signals);
  if (filter === "none") return summary === null;
  return summary?.severity === filter;
}

function missingLast<T>(left: T | null | undefined, right: T | null | undefined, compare: (left: T, right: T) => number): number {
  const leftMissing = left === null || left === undefined || left === "";
  const rightMissing = right === null || right === undefined || right === "";
  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;
  return compare(left, right);
}

function compareBorrowers(left: Borrower, right: Borrower, sort: SortKey): number {
  if (sort === "outstanding") {
    return missingLast(left.outstanding_kobo, right.outstanding_kobo, (a, b) => b - a);
  }
  if (sort === "repayment") {
    return missingLast(left.next_repayment_date, right.next_repayment_date, (a, b) => a.localeCompare(b));
  }
  return missingLast(left.name, right.name, (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function sortBorrowers(borrowers: Borrower[], sort: SortKey): Borrower[] {
  return borrowers
    .map((borrower, index) => ({ borrower, index }))
    .sort((left, right) => {
      const compared = compareBorrowers(left.borrower, right.borrower, sort);
      return compared === 0 ? left.index - right.index : compared;
    })
    .map((entry) => entry.borrower);
}

export function selectBorrowers(borrowers: Borrower[], query: string, filter: SignalFilter, sort: SortKey): Borrower[] {
  const visible = borrowers.filter(
    (borrower) => matchesSearch(borrower.name, query) && matchesSignalFilter(borrower, filter),
  );
  return sortBorrowers(visible, sort);
}

export function signalFilterLabel(filter: SignalFilter): string {
  switch (filter) {
    case "all":
      return "All";
    case "urgent":
      return "Urgent";
    case "act":
      return "Act";
    case "watch":
      return "Watch";
    case "informational":
      return "Informational";
    case "none":
      return "None";
  }
}

export function sortLabel(sort: SortKey): string {
  switch (sort) {
    case "outstanding":
      return "Outstanding, high to low";
    case "repayment":
      return "Next repayment, soonest first";
    case "name":
      return "Name, A to Z";
  }
}
