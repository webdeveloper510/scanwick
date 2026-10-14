import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import borrowersFile from "../borrowers.json";
import { REFRESH_MS } from "./useBorrowers";
import type { Borrower } from "./types";
import { person, renderBorrowers, settle } from "./test/renderApp";

const borrowers = borrowersFile.borrowers as Borrower[];

describe("a slow API that sometimes fails", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "setInterval", "clearTimeout", "clearInterval"] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("never lets a slow earlier response overwrite a newer one", async () => {
    const { requests } = renderBorrowers();
    expect(requests).toHaveLength(1);

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS);
    });
    expect(requests).toHaveLength(2);

    await act(async () => {
      requests[0].resolve({ borrowers: [person("Older Person")] });
    });
    expect(screen.queryByRole("rowheader", { name: "Older Person" })).not.toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(document.querySelector("[data-current='true']")).toBeNull();

    await settle(requests[1], [person("Newer Person")]);
    expect(screen.getByRole("rowheader", { name: "Newer Person" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Older Person" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-current='true']")).not.toBeNull();
  });

  it("ignores an earlier payload that arrives after the newer list is already on screen", async () => {
    const { requests } = renderBorrowers();
    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS);
    });
    await settle(requests[1], [person("Newer Person")]);
    await act(async () => {
      requests[0].resolve({ borrowers: [person("Older Person")] });
    });
    expect(screen.getByRole("rowheader", { name: "Newer Person" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Older Person" })).not.toBeInTheDocument();
  });

  it("refreshes at 60 seconds and drops the list that is no longer current", async () => {
    const { requests } = renderBorrowers();
    await settle(requests[0], [person("Adaeze Okafor")]);
    expect(screen.getByRole("rowheader", { name: "Adaeze Okafor" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS - 1000);
    });
    expect(requests).toHaveLength(1);
    expect(screen.getByRole("rowheader", { name: "Adaeze Okafor" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(requests).toHaveLength(2);
    expect(screen.queryByRole("rowheader", { name: "Adaeze Okafor" })).not.toBeInTheDocument();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(document.querySelector("[data-current='true']")).toBeNull();
  });

  it("keeps the search, filter, sort and in-progress typing across a refresh", async () => {
    const { requests, router } = renderBorrowers();
    await settle(requests[0], borrowers);

    const search = screen.getByRole("searchbox", { name: "Search borrowers" });
    fireEvent.change(search, { target: { value: "z" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zz" } });
    fireEvent.click(screen.getByRole("combobox", { name: "Filter by most serious signal" }));
    fireEvent.click(screen.getByRole("option", { name: "Watch" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Sort borrowers" }));
    fireEvent.click(screen.getByRole("option", { name: "Next repayment, soonest first" }));
    expect(screen.getByRole("searchbox")).toHaveValue("zz");

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS);
    });

    expect(screen.getByRole("searchbox")).toHaveValue("zz");
    expect(screen.getByRole("combobox", { name: "Filter by most serious signal" })).toHaveTextContent("Watch");
    expect(screen.getByRole("combobox", { name: "Sort borrowers" })).toHaveTextContent("Next repayment, soonest first");
    expect(router.state.location.search).toContain("q=zz");
    expect(router.state.location.search).toContain("signal=watch");
    expect(router.state.location.search).toContain("sort=repayment");
    expect(screen.queryByRole("rowheader")).not.toBeInTheDocument();
    expect(screen.queryByText(/borrowers · amounts in naira/)).not.toBeInTheDocument();

    await settle(requests[1], borrowers);
    expect(screen.getByRole("searchbox")).toHaveValue("zz");
    expect(screen.getByRole("combobox", { name: "Filter by most serious signal" })).toHaveTextContent("Watch");
    expect(screen.getByRole("combobox", { name: "Sort borrowers" })).toHaveTextContent("Next repayment, soonest first");
    expect(screen.getByRole("status")).toHaveTextContent('Nothing matches "zz"');
    expect(screen.queryByRole("rowheader")).not.toBeInTheDocument();
  });

  it("does not show the previous list as current when a refresh fails", async () => {
    const { requests } = renderBorrowers();
    await settle(requests[0], [person("Adaeze Okafor")]);

    await act(async () => {
      vi.advanceTimersByTime(REFRESH_MS);
    });
    await act(async () => {
      requests[1].reject(new Error("unavailable"));
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Nothing below is current");
    expect(screen.queryByRole("rowheader", { name: "Adaeze Okafor" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-current='true']")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.queryByRole("rowheader")).not.toBeInTheDocument();
    await settle(requests[2], [person("Recovered Borrower")]);
    expect(screen.getByRole("rowheader", { name: "Recovered Borrower" })).toBeInTheDocument();
    expect(screen.queryByRole("rowheader", { name: "Adaeze Okafor" })).not.toBeInTheDocument();
  });
});
