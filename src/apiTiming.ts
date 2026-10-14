/** Production GET /api/borrowers waits between 2 and 5 seconds. */
export const MIN_DELAY_MS = 2000;
export const MAX_DELAY_MS = 5000;

/** About one request in four fails. */
export const FAILURE_RATE = 0.25;

export function delayMs(unit: number): number {
  const clamped = Math.min(1, Math.max(0, unit));
  return MIN_DELAY_MS + Math.round(clamped * (MAX_DELAY_MS - MIN_DELAY_MS));
}

export function shouldFail(unit: number): boolean {
  return unit < FAILURE_RATE;
}
