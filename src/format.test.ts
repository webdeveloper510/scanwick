import { describe, expect, it } from "vitest";
import borrowersFile from "../borrowers.json";
import { formatCalendarDate, formatLagosDateTime, formatNairaFromKobo, formatSignals, formatStatus } from "./format";
import type { Borrower } from "./types";

const borrowers = borrowersFile.borrowers as Borrower[];

const shown = {
  b01: ["₦1,500,000.00", "₦1,125,000.00", "5 Nov 2026", "11 Oct 2026, 10:15", "Watch · 1", "Connected"],
  b02: ["₦5,000,000.00", "—", "1 Nov 2026", "Not read yet", "—", "Not refreshed"],
  b03: ["₦800,000.00", "₦0.00", "—", "10 Oct 2026, 17:02", "—", "Connected"],
  b04: ["₦12,345,678.90", "₦9,876,543.21", "28 Oct 2026", "12 Oct 2026, 00:40", "Urgent · 3", "Connected"],
  b05: ["₦250,000.00", "₦19.99", "15 Oct 2026", "9 Oct 2026, 08:00", "Urgent · 1", "Consent withdrawn"],
  b06: ["₦600,000.00", "₦450,000.50", "20 Nov 2026", "11 Oct 2026, 13:30", "Informational · 2", "Connected"],
  b07: ["₦1,000,000.00", "₦90,000.00", "31 Dec 2026", "11 Oct 2026, 23:59", "Act · 1", "Connected"],
  b08: ["₦3,000,000.00", "₦2,100,000.00", "20 Oct 2026", "12 Oct 2026, 00:00", "Act · 2", "Connected"],
  b09: ["₦400,000.00", "₦320,000.00", "12 Nov 2026", "11 Oct 2026, 09:45", "—", "Connected"],
} as const;

function shownFor(borrower: Borrower): string[] {
  return [
    formatNairaFromKobo(borrower.facility_amount_kobo),
    formatNairaFromKobo(borrower.outstanding_kobo),
    formatCalendarDate(borrower.next_repayment_date),
    formatLagosDateTime(borrower.last_read_at),
    formatSignals(borrower.open_signals),
    formatStatus(borrower.status),
  ];
}

describe("figures", () => {
  it("turns kobo into naira with kobo, and keeps zero", () => {
    expect(formatNairaFromKobo(145000000)).toBe("₦1,450,000.00");
    expect(formatNairaFromKobo(0)).toBe("₦0.00");
    expect(formatNairaFromKobo(1)).toBe("₦0.01");
    expect(formatNairaFromKobo(1999)).toBe("₦19.99");
    expect(formatNairaFromKobo(45000050)).toBe("₦450,000.50");
    expect(formatNairaFromKobo(1234567890)).toBe("₦12,345,678.90");
  });

  it("shows an em dash when the figure is missing", () => {
    expect(formatNairaFromKobo(null)).toBe("—");
  });
});

describe("dates", () => {
  it("formats a calendar date without consulting the host time zone", () => {
    expect(formatCalendarDate("2026-11-05")).toBe("5 Nov 2026");
    expect(formatCalendarDate("2026-10-09")).toBe("9 Oct 2026");
    expect(formatCalendarDate("2026-09-01")).toBe("1 Sep 2026");
    expect(formatCalendarDate(null)).toBe("—");
    expect(formatCalendarDate("not-a-date")).toBe("—");
  });

  it("shows UTC instants in Lagos time, including midnight and the next day", () => {
    expect(formatLagosDateTime("2026-10-11T09:15:00Z")).toBe("11 Oct 2026, 10:15");
    expect(formatLagosDateTime("2026-10-11T22:59:00Z")).toBe("11 Oct 2026, 23:59");
    expect(formatLagosDateTime("2026-10-11T23:00:00Z")).toBe("12 Oct 2026, 00:00");
    expect(formatLagosDateTime("2026-10-11T23:40:00Z")).toBe("12 Oct 2026, 00:40");
    expect(formatLagosDateTime("2026-09-01T23:30:00Z")).toBe("2 Sep 2026, 00:30");
    expect(formatLagosDateTime(null)).toBe("Not read yet");
  });
});

describe("signals and status", () => {
  it("names the most serious signal and counts every open signal", () => {
    expect(formatSignals([])).toBe("—");
    expect(formatSignals([{ severity: "watch" }])).toBe("Watch · 1");
    expect(formatSignals([{ severity: "informational" }, { severity: "informational" }])).toBe("Informational · 2");
    expect(formatSignals([{ severity: "watch" }, { severity: "act" }])).toBe("Act · 2");
    expect(formatSignals([{ severity: "watch" }, { severity: "urgent" }, { severity: "act" }])).toBe("Urgent · 3");
    expect(formatSignals([{ severity: "unknown" }])).toBe("—");
  });

  it("uses the status words from the design", () => {
    expect(formatStatus("connected")).toBe("Connected");
    expect(formatStatus("not_refreshed")).toBe("Not refreshed");
    expect(formatStatus("consent_withdrawn")).toBe("Consent withdrawn");
  });

  it("matches every borrower in borrowers.json", () => {
    for (const borrower of borrowers) {
      const expected = shown[borrower.id as keyof typeof shown];
      expect(shownFor(borrower), borrower.id).toEqual([...expected]);
    }
  });
});
