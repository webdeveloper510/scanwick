import { describe, expect, it } from "vitest";
import borrowersFile from "../borrowers.json";
import { matchesSearch, selectBorrowers } from "./query";
import type { Borrower } from "./types";

const borrowers = borrowersFile.borrowers as Borrower[];
const names = (rows: Borrower[]) => rows.map((row) => row.name);

describe("search, filter and sort", () => {
  it("matches any part of the name, in any case", () => {
    expect(matchesSearch("Adaeze Okafor", "EZE")).toBe(true);
    expect(matchesSearch("Musa Danjuma Trading", "trading")).toBe(true);
    expect(matchesSearch("Halima Bello", "zz")).toBe(false);
    expect(names(selectBorrowers(borrowers, "eze", "all", "name"))).toEqual(["Adaeze Okafor", "Chinonso Eze"]);
  });

  it("filters by the most serious signal, not by a weaker one that is also open", () => {
    expect(names(selectBorrowers(borrowers, "", "urgent", "name"))).toEqual([
      "Halima Bello",
      "Oluwaseun Adebayo-Ogunleye Enterprises Nigeria Limited",
    ]);
    expect(names(selectBorrowers(borrowers, "", "act", "name"))).toEqual(["Blessing Okon", "Tunde Bakare"]);
    expect(names(selectBorrowers(borrowers, "", "watch", "name"))).toEqual(["Adaeze Okafor"]);
    expect(names(selectBorrowers(borrowers, "", "informational", "name"))).toEqual(["Ifeanyi Nwosu"]);
    expect(names(selectBorrowers(borrowers, "", "none", "name"))).toEqual([
      "aisha mohammed",
      "Chinonso Eze",
      "Musa Danjuma Trading",
    ]);
  });

  it("sorts outstanding high to low and leaves a missing figure last, after zero", () => {
    expect(names(selectBorrowers(borrowers, "", "all", "outstanding"))).toEqual([
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
  });

  it("sorts the next repayment soonest first, with a missing date last", () => {
    expect(names(selectBorrowers(borrowers, "", "all", "repayment"))).toEqual([
      "Halima Bello",
      "Tunde Bakare",
      "Oluwaseun Adebayo-Ogunleye Enterprises Nigeria Limited",
      "Musa Danjuma Trading",
      "Adaeze Okafor",
      "aisha mohammed",
      "Ifeanyi Nwosu",
      "Blessing Okon",
      "Chinonso Eze",
    ]);
  });

  it("sorts names A to Z without caring about case", () => {
    expect(names(selectBorrowers(borrowers, "", "all", "name"))).toEqual([
      "Adaeze Okafor",
      "aisha mohammed",
      "Blessing Okon",
      "Chinonso Eze",
      "Halima Bello",
      "Ifeanyi Nwosu",
      "Musa Danjuma Trading",
      "Oluwaseun Adebayo-Ogunleye Enterprises Nigeria Limited",
      "Tunde Bakare",
    ]);
  });

  it("sorts a missing name last", () => {
    const rows = selectBorrowers(
      [
        { ...borrowers[0], id: "named", name: "Zed" },
        { ...borrowers[0], id: "blank", name: "" },
      ],
      "",
      "all",
      "name",
    );
    expect(names(rows)).toEqual(["Zed", ""]);
  });
});
