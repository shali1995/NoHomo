/**
 * The params a live trade subscription takes: the cursor and nothing else.
 *
 * `trades:active` and `trades:completed` accept `LivecursorWindowParams` — `{ endCursor }` (and
 * an optional `startCursor`) — and *only* that; the sibling topic documents that unknown fields
 * cause a subscription error. A `chain` I added here on a summary's word did exactly that: the
 * client marked the subscription failed with no retry and no `onError` wired, so the window went
 * quiet while the rows still rendered from REST — which is why the P&L sat still.
 *
 * The cursor is the page's own, not the one a load-more asks for: it is where the window
 * resumes from, and the client drops frames for a window it has not acknowledged.
 *
 * @param {string | null | undefined} cursor the `cursor` of the page just read
 * @returns {{ endCursor?: string }}
 */
export function liveAccumulatedParams(cursor) {
  return cursor ? { endCursor: cursor } : {};
}
