import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import borrowersFile from "../borrowers.json";
import type { Borrower } from "./types";
import { renderBorrowers, settle } from "./test/renderApp";

const borrowers = borrowersFile.borrowers as Borrower[];

async function load(initialEntry?: string) {
  const view = renderBorrowers(initialEntry);
  expect(screen.getByText("Loading…")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await settle(view.requests[0], borrowers);
  return view;
}

describe("monitored borrowers screen", () => {
  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  });

  it("shows the borrowers.json figures, dates and signals in Lagos time", async () => {
    await load();
    expect(screen.getByText("9 borrowers · amounts in naira · times in Lagos time (WAT)")).toBeInTheDocument();

    const order = screen.getAllByRole("rowheader").map((cell) => cell.textContent);
    expect(order).toEqual([
      "Oluwaseun Adebayo-Ogunleye Enterprises Nigeria Limited",
      "Tunde Bakare",
      "Adaeze Okafor",
      "Ifeanyi Nwosu",
      "aisha mohammed",
      "Blessing Okon",
      "Halima Bello",
      "Chinonso Eze",
      "Musa Danjuma Trading",
    ]);

    const oluwaseun = screen.getByRole("row", { name: /Oluwaseun/ });
    expect(oluwaseun).toHaveTextContent("₦12,345,678.90");
    expect(oluwaseun).toHaveTextContent("₦9,876,543.21");
    expect(oluwaseun).toHaveTextContent("28 Oct 2026");
    expect(oluwaseun).toHaveTextContent("12 Oct 2026, 00:40");
    expect(oluwaseun).toHaveTextContent("Urgent · 3");
    expect(oluwaseun).toHaveTextContent("Connected");

    const halima = screen.getByRole("row", { name: /Halima/ });
    expect(halima).toHaveTextContent("₦19.99");
    expect(halima).toHaveTextContent("Consent withdrawn");

    const chinonso = screen.getByRole("row", { name: /Chinonso/ });
    expect(chinonso).toHaveTextContent("₦0.00");
    expect(chinonso).toHaveTextContent("Not available");

    const musa = screen.getByRole("row", { name: /Musa/ });
    expect(musa).toHaveTextContent("Not read yet");
    expect(musa).toHaveTextContent("Not refreshed");
    expect(musa).not.toHaveTextContent("₦0.00");

    expect(screen.getByRole("columnheader", { name: "Outstanding" })).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByRole("columnheader", { name: "Borrower" })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "Next repayment" })).toHaveAttribute("aria-sort", "none");
  });

  it("sorts from the column header with the keyboard and tells the screen reader", async () => {
    const { user } = await load();
    const borrower = screen.getByRole("button", { name: "Borrower" });
    borrower.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("columnheader", { name: "Borrower" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("Adaeze Okafor");
    expect(screen.getAllByRole("rowheader")[1]).toHaveTextContent("aisha mohammed");
  });

  it("keeps search, filter and sort in the URL, including after Back", async () => {
    const { user, router } = await load();
    await user.click(screen.getByRole("combobox", { name: "Sort borrowers" }));
    await user.click(screen.getByRole("option", { name: "Name, A to Z" }));
    expect(router.state.location.search).toContain("sort=name");
    await user.type(screen.getByRole("searchbox", { name: "Search borrowers" }), "musa");
    expect(router.state.location.search).toContain("q=musa");
    expect(router.state.location.search).toContain("sort=name");
    expect(screen.getByRole("rowheader", { name: "Musa Danjuma Trading" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Adaeze Okafor" })).not.toBeInTheDocument();

    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("combobox", { name: "Sort borrowers" })).toHaveTextContent("Name, A to Z");

    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByRole("combobox", { name: "Sort borrowers" })).toHaveTextContent("Outstanding, high to low");
    expect(screen.getAllByRole("rowheader")[0]).toHaveTextContent("Oluwaseun");
  });

  it("restores search, filter and sort from the address bar", async () => {
    await load("/?q=halima&signal=urgent&sort=name");
    expect(screen.getByRole("searchbox")).toHaveValue("halima");
    expect(screen.getByRole("combobox", { name: "Filter by most serious signal" })).toHaveTextContent("Urgent");
    expect(screen.getByRole("combobox", { name: "Sort borrowers" })).toHaveTextContent("Name, A to Z");
    expect(screen.getAllByRole("rowheader").map((cell) => cell.textContent)).toEqual(["Halima Bello"]);
  });

  it("shows the empty state and can clear it", async () => {
    const { user } = await load();
    await user.type(screen.getByRole("searchbox"), "zz");
    expect(screen.getByRole("status")).toHaveTextContent('Nothing matches "zz" with the signal filter you chose.');
    await user.click(screen.getByRole("button", { name: "Clear search and filter" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getAllByRole("rowheader")).toHaveLength(9);
  });

  it("uses one card per borrower below 768px", async () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
    await load();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(9);
    expect(screen.getByText("Times in Lagos time (WAT)")).toBeInTheDocument();
    const card = screen.getByRole("listitem", { name: /Halima Bello/ });
    expect(card).toHaveTextContent("₦19.99");
    expect(card).toHaveTextContent("Urgent · 1");
  });
});
