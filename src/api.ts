import type { BorrowersResponse } from "./types";

export type BorrowersApi = {
  getBorrowers: (signal: AbortSignal) => Promise<BorrowersResponse>;
};

function isBorrowersResponse(body: unknown): body is BorrowersResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "borrowers" in body &&
    Array.isArray((body as { borrowers: unknown }).borrowers)
  );
}

export function createHttpBorrowersApi(fetchImpl: typeof fetch = fetch): BorrowersApi {
  return {
    async getBorrowers(signal) {
      const response = await fetchImpl("/api/borrowers", {
        signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Could not load borrowers");
      const body: unknown = await response.json();
      if (!isBorrowersResponse(body)) throw new Error("Could not load borrowers");
      return body;
    },
  };
}

export const httpBorrowersApi = createHttpBorrowersApi();
