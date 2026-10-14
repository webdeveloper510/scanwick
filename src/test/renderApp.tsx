import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type { BorrowersApi } from "../api";
import { App } from "../App";
import type { Borrower, BorrowersResponse } from "../types";

export type PendingRequest = {
  resolve: (value: BorrowersResponse) => void;
  reject: (reason?: unknown) => void;
};

export function renderBorrowers(initialEntry = "/") {
  const requests: PendingRequest[] = [];
  const api: BorrowersApi = {
    getBorrowers() {
      return new Promise((resolve, reject) => {
        requests.push({ resolve, reject });
      });
    },
  };
  const router = createMemoryRouter([{ path: "/", element: <App api={api} /> }], {
    initialEntries: [initialEntry],
  });
  const user = userEvent.setup({ delay: null });
  render(<RouterProvider router={router} />);
  return { requests, router, user };
}

export async function settle(request: PendingRequest | undefined, borrowers: Borrower[]) {
  if (!request) throw new Error("No borrowers request is in flight");
  await act(async () => {
    request.resolve({ borrowers });
  });
}

export function person(name: string, patch: Partial<Borrower> = {}): Borrower {
  return {
    id: name,
    name,
    facility_amount_kobo: 100000,
    outstanding_kobo: 50000,
    next_repayment_date: "2026-11-05",
    last_read_at: "2026-10-11T09:15:00Z",
    status: "connected",
    open_signals: [],
    ...patch,
  };
}
