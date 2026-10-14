import type { BorrowerStatus, OpenSignal, SignalSeverity } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const SIGNAL_RANK: Record<SignalSeverity, number> = {
  urgent: 0,
  act: 1,
  watch: 2,
  informational: 3,
};

const SIGNAL_LABEL: Record<SignalSeverity, string> = {
  urgent: "Urgent",
  act: "Act",
  watch: "Watch",
  informational: "Informational",
};

const STATUS_LABEL: Record<BorrowerStatus, string> = {
  connected: "Connected",
  not_refreshed: "Not refreshed",
  consent_withdrawn: "Consent withdrawn",
};

const lagosDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatNairaFromKobo(kobo: number | null): string {
  if (kobo === null || !Number.isFinite(kobo)) return "—";
  const negative = kobo < 0;
  const abs = Math.abs(Math.trunc(kobo));
  const naira = Math.floor(abs / 100);
  const fraction = abs % 100;
  const grouped = String(naira).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}₦${grouped}.${String(fraction).padStart(2, "0")}`;
}

/** Calendar dates have no time zone. Parsing them with Date would shift the day. */
export function formatCalendarDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return "—";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "—";
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/**
 * Instants are stored in UTC and shown in Lagos (WAT).
 * The host zone is never used: month and clock come from Africa/Lagos.
 */
export function formatLagosDateTime(isoDateTime: string | null): string {
  if (!isoDateTime) return "Not read yet";
  const instant = new Date(isoDateTime);
  if (Number.isNaN(instant.getTime())) return "—";
  const parts = lagosDateTime.formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const day = Number(read("day"));
  const month = Number(read("month"));
  const year = read("year");
  let hour = read("hour").replace(/\D/g, "");
  const minute = read("minute").replace(/\D/g, "").padStart(2, "0");
  if (hour === "24") hour = "00";
  hour = hour.padStart(2, "0");
  if (!day || month < 1 || month > 12 || !year) return "—";
  return `${day} ${MONTHS[month - 1]} ${year}, ${hour}:${minute}`;
}

export function signalSeverity(value: string): SignalSeverity | null {
  if (value === "urgent" || value === "act" || value === "watch" || value === "informational") {
    return value;
  }
  return null;
}

export type SignalSummary = {
  severity: SignalSeverity;
  label: string;
  count: number;
};

/** Most serious open signal, plus how many signals are open in total. */
export function summarizeSignals(signals: OpenSignal[]): SignalSummary | null {
  let best: SignalSeverity | null = null;
  let count = 0;
  for (const signal of signals) {
    const severity = signalSeverity(signal.severity);
    if (!severity) continue;
    count += 1;
    if (!best || SIGNAL_RANK[severity] < SIGNAL_RANK[best]) best = severity;
  }
  if (!best || count === 0) return null;
  return { severity: best, label: SIGNAL_LABEL[best], count };
}

export function formatSignals(signals: OpenSignal[]): string {
  const summary = summarizeSignals(signals);
  if (!summary) return "—";
  return `${summary.label} · ${summary.count}`;
}

export function formatStatus(status: BorrowerStatus): string {
  return STATUS_LABEL[status] ?? status;
}
