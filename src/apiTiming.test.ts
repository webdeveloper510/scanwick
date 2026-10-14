import { describe, expect, it } from "vitest";
import { delayMs, MAX_DELAY_MS, MIN_DELAY_MS, shouldFail } from "./apiTiming";

describe("slow API timing", () => {
  it("waits between 2 and 5 seconds", () => {
    expect(delayMs(0)).toBe(MIN_DELAY_MS);
    expect(delayMs(1)).toBe(MAX_DELAY_MS);
    expect(delayMs(0.5)).toBe(3500);
    expect(MIN_DELAY_MS).toBe(2000);
    expect(MAX_DELAY_MS).toBe(5000);
  });

  it("fails about one time in four", () => {
    expect(shouldFail(0)).toBe(true);
    expect(shouldFail(0.249)).toBe(true);
    expect(shouldFail(0.25)).toBe(false);
    expect(shouldFail(0.99)).toBe(false);
  });
});
