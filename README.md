# Monitored borrowers

Scanwick screen for the borrowers returned by `GET /api/borrowers`. Amounts are kobo shown as naira, dates and times are Lagos time (WAT), and the list can be searched, filtered and sorted.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. The borrowers call waits 2 to 5 seconds and fails about one time in four. Search, signal filter and sort are stored in the query string, so a reload or Back restores them. The theme follows the device until you pick Light or Dark.

## Tests

```bash
npm test
```

The same suite has to pass in America/Mexico_City and in Asia/Karachi. Dates are formatted in Africa/Lagos, not in the machine zone, and a date-only value such as `2026-11-05` is not parsed as a UTC instant (that would become 4 Nov in Mexico City).

```bash
TZ=America/Mexico_City npm test
TZ=Asia/Karachi npm test
```

Or `npm run test:mexico` and `npm run test:karachi`.

## Answers

1. A figure can be wrong with correct JSON when the conversion is wrong. Kobo divided by 100 in binary floating point does not always land on the two decimal places you expect, so ₦19.99 can round the wrong way. A timestamp formatted in the viewer's zone is the other trap: `2026-10-11T23:40:00Z` is still 11 October in Mexico City and already `12 Oct 2026, 00:40` in Lagos. A date-only string parsed with `new Date` is UTC midnight, which is the previous evening in Mexico City, so the repayment day moves. This screen splits kobo with integer arithmetic and formats every instant in Africa/Lagos.

2. With 10,000 borrowers I would stop sending the whole list to the browser. Search, signal and sort would be query parameters, and the API would return one page plus a total. The table would only paint the rows on screen. The 60-second refresh would reload that page, still dropping any response that is not the latest request, and search would stay debounced so a keystroke does not walk ten thousand names on the main thread.

3. There is no paging, because this file has nine borrowers. Watch and Informational are not drawn on the design pages, so those pill colours are chosen to match the other pills and to clear the contrast minimum. There is no browser end-to-end test; the suite is unit and component tests. After you pick Light or Dark, the screen does not offer a way back to “follow the device” without clearing the saved choice.
