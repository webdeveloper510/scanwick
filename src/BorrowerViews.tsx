import { formatCalendarDate, formatLagosDateTime, formatNairaFromKobo, formatStatus, summarizeSignals } from "./format";
import type { Borrower, BorrowerStatus, OpenSignal } from "./types";

export function Missing() {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not available</span>
    </>
  );
}

export function Money({ kobo }: { kobo: number | null }) {
  if (kobo === null) {
    return (
      <span className="num">
        <Missing />
      </span>
    );
  }
  return <span className="num">{formatNairaFromKobo(kobo)}</span>;
}

export function CalendarDate({ value }: { value: string | null }) {
  if (!value) return <Missing />;
  return <>{formatCalendarDate(value)}</>;
}

export function LastRead({ value }: { value: string | null }) {
  return <>{formatLagosDateTime(value)}</>;
}

export function SignalPill({ signals }: { signals: OpenSignal[] }) {
  const summary = summarizeSignals(signals);
  if (!summary) return <Missing />;
  return (
    <span className={`pill signal signal-${summary.severity}`}>
      <span className="dot" aria-hidden="true" />
      {summary.label} · {summary.count}
    </span>
  );
}

export function StatusPill({ status }: { status: BorrowerStatus }) {
  return <span className={`pill status status-${status}`}>{formatStatus(status)}</span>;
}

export function BorrowerName({ name, id }: { name: string; id?: string }) {
  return (
    <span id={id} className="truncate" title={name}>
      {name}
    </span>
  );
}

export function CardFields({ borrower }: { borrower: Borrower }) {
  return (
    <dl className="fields">
      <div className="field">
        <dt>Outstanding</dt>
        <dd>
          <Money kobo={borrower.outstanding_kobo} />
        </dd>
      </div>
      <div className="field">
        <dt>Facility</dt>
        <dd>
          <Money kobo={borrower.facility_amount_kobo} />
        </dd>
      </div>
      <div className="field">
        <dt>Next repayment</dt>
        <dd>
          <CalendarDate value={borrower.next_repayment_date} />
        </dd>
      </div>
      <div className="field">
        <dt>Last read</dt>
        <dd>
          <LastRead value={borrower.last_read_at} />
        </dd>
      </div>
    </dl>
  );
}
