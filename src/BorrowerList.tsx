import { BorrowerName, CalendarDate, CardFields, LastRead, Money, SignalPill, StatusPill } from "./BorrowerViews";
import { sortLabel } from "./query";
import type { Borrower, SortKey } from "./types";

type Props = {
  borrowers: Borrower[];
  sort: SortKey;
  onSort: (sort: SortKey) => void;
  phone: boolean;
};

export function BorrowerList({ borrowers, sort, onSort, phone }: Props) {
  if (phone) {
    return (
      <ul className="cards" data-current="true">
        {borrowers.map((borrower) => (
          <li key={borrower.id} className="borrower-card" aria-labelledby={`${borrower.id}-name`}>
            <div className="card-top">
              <BorrowerName id={`${borrower.id}-name`} name={borrower.name} />
              <SignalPill signals={borrower.open_signals} />
            </div>
            <CardFields borrower={borrower} />
            <div className="card-status">
              <StatusPill status={borrower.status} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  const sortValue = (key: SortKey) => {
    if (sort !== key) return "none" as const;
    return key === "outstanding" ? ("descending" as const) : ("ascending" as const);
  };

  return (
    <div className="surface" data-current="true">
    <div className="table-scroll">
      <table>
        <caption className="sr-only">Monitored borrowers, sorted by {sortLabel(sort)}</caption>
        <colgroup>
          <col className="col-name" />
          <col className="col-facility" />
          <col className="col-outstanding" />
          <col className="col-repay" />
          <col className="col-read" />
          <col className="col-signals" />
          <col className="col-status" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" aria-sort={sortValue("name")}>
              <button type="button" className="th-button" onClick={() => onSort("name")}>
                Borrower
              </button>
            </th>
            <th scope="col" className="th-end">Facility</th>
            <th scope="col" className="th-end" aria-sort={sortValue("outstanding")}>
              <button type="button" className="th-button th-button-end" onClick={() => onSort("outstanding")}>
                Outstanding
              </button>
            </th>
            <th scope="col" aria-sort={sortValue("repayment")}>
              <button type="button" className="th-button" onClick={() => onSort("repayment")}>
                Next repayment
              </button>
            </th>
            <th scope="col">Last read</th>
            <th scope="col">Signals</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {borrowers.map((borrower) => (
            <tr key={borrower.id}>
              <th scope="row" className="name">
                <BorrowerName name={borrower.name} />
              </th>
              <td className="money">
                <Money kobo={borrower.facility_amount_kobo} />
              </td>
              <td className="money">
                <Money kobo={borrower.outstanding_kobo} />
              </td>
              <td>
                <CalendarDate value={borrower.next_repayment_date} />
              </td>
              <td>
                <LastRead value={borrower.last_read_at} />
              </td>
              <td>
                <SignalPill signals={borrower.open_signals} />
              </td>
              <td>
                <StatusPill status={borrower.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
