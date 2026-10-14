import { useCallback, useEffect, useRef, useState } from "react";
import type { BorrowersApi } from "./api";
import type { Borrower } from "./types";

export const REFRESH_MS = 60_000;

export type BorrowersState =
  | { phase: "loading" }
  | { phase: "ready"; borrowers: Borrower[] }
  | { phase: "error" };

function isAbort(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && (error as { name: string }).name === "AbortError";
}

/**
 * Loads borrowers and refreshes on a timer.
 * Each call gets a new id. A response is applied only when its id is still the latest,
 * so a slow earlier response cannot paint over a newer request.
 * While a request is in flight the previous list is dropped, so it is not shown as current.
 */
export function useBorrowers(api: BorrowersApi, refreshMs = REFRESH_MS) {
  const [state, setState] = useState<BorrowersState>({ phase: "loading" });
  const sequence = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const apiRef = useRef(api);
  apiRef.current = api;

  const load = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++sequence.current;
    setState({ phase: "loading" });

    apiRef.current.getBorrowers(controller.signal).then(
      (data) => {
        if (requestId !== sequence.current) return;
        setState({ phase: "ready", borrowers: data.borrowers });
      },
      (error: unknown) => {
        if (requestId !== sequence.current) return;
        if (isAbort(error)) return;
        setState({ phase: "error" });
      },
    );
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, refreshMs);
    return () => {
      window.clearInterval(timer);
      sequence.current += 1;
      abortRef.current?.abort();
    };
  }, [load, refreshMs]);

  return { state, retry: load };
}
