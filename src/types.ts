export type SignalSeverity = "urgent" | "act" | "watch" | "informational";

export type BorrowerStatus = "connected" | "not_refreshed" | "consent_withdrawn";

export type OpenSignal = {
  severity: string;
};

export type Borrower = {
  id: string;
  name: string;
  facility_amount_kobo: number;
  outstanding_kobo: number | null;
  next_repayment_date: string | null;
  last_read_at: string | null;
  status: BorrowerStatus;
  open_signals: OpenSignal[];
};

export type BorrowersResponse = {
  borrowers: Borrower[];
};

export type SignalFilter = "all" | SignalSeverity | "none";

export type SortKey = "outstanding" | "repayment" | "name";

export type ThemeName = "light" | "dark";
