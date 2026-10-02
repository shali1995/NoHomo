/**
 * The phone home list: one scanner ranking at a time, live.
 *
 * The four views are the API's own (`ScannerView` is `new | trending | topVolume |
 * topGainers`), and each one is asked for with the metric it ranks by — `age` for new,
 * `trending`, `volume`, `price24H`. Sending one body for all four made every view return
 * the trending ranking, so the pairing matters.
 *
 * The first page is a fetch; everything after it is the socket. `scanner:tokens` streams a
 * replacement snapshot for the subscribed window (`SCANNER_TOKENS`) and single-row updates
 * (`SCANNER_UPDATE`), and both are merged by the desktop module's own `mergeScannerFrame` —
 * the same merge the desktop panel runs, so a phone row and a desktop row cannot drift.
 * Without that subscription the list is a photograph: it paints once and never moves.
 *
 * Raw `ScannerItem`s are what is held, not display rows, because the merge works on them
 * (it compares `pairAddress` and keeps a carried-over `sparkline`). `scanRows()` maps them
 * for the list, so a frame that changes one number still re-renders the row.
 */
import { untrack } from "svelte";
import { api } from "./client.js";
import { discoveryRowFromToken, mergeScannerFrame } from "./trending.svelte.js";
import { createCoalescer } from "../utils/coalesce.js";
import { subscribe, unsubscribe } from "../ws/client.js";

/** The window the rankings are read on. */
const TIMEFRAME = "1H";
const ROWS = 40;
/** The scanner topic the desktop panel reads, and the events it carries. */
const SCANNER_TOPIC = "scanner:tokens";
/** How long to wait before re-asking after a failed page or an expired cursor. */
const RETRY_MS = 3000;
/**
 * How long a stream may stay silent before it is treated as dead. The socket client has its
 * own reconnect and recovery probe, but a subscription that is silently gone looks exactly
 * like a quiet market — and a list that stops moving is the one thing this module exists to
 * prevent — so silence past this is answered by re-reading the page, which re-opens the
 * subscription on the cursor that comes back with it.
 */
const QUIET_MS = 45000;

export const SCAN_VIEWS = [
  { id: "trending", label: "Trending", view: "trending", rankBy: "trending", path: `/v2/scanner/tokens/trending/${TIMEFRAME}` }
];

let view = $state("trending");
/** Raw `ScannerItem`s for the live view. */
let tokens = $state.raw([]);
let cursor = $state(null);
let loading = $state(true);
let wsKey = null;
let started = false;
let retryTimer = null;
let quietTimer = null;
/** When a frame last arrived; the quiet timer reads this, not the clock it was armed on. */
let lastFrameAt = 0;

/** One snapshot per view, so switching back is instant instead of blank. */
const cache = new Map();
/** And the cursor each view's snapshot was taken on, so its socket can be re-opened. */
const heldCursors = new Map();

const frames = createCoalescer((batch) => {
  let working = tokens;
  for (const frame of batch) working = mergeScannerFrame(frame.event, frame.data, working);
  tokens = working;
  cache.set(view, working);
  noteFrame();
});

/** A frame arrived: the stream is alive, so the quiet timer starts again. */
function noteFrame() {
  lastFrameAt = Date.now();
  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(() => {
    quietTimer = null;
    if (started && Date.now() - lastFrameAt >= QUIET_MS) void seed();
  }, QUIET_MS + 1000);
}

export function scanView() {
  return view;
}

/** The list's rows, mapped from whatever the socket last delivered. */
export function scanRows() {
  return tokens.map(discoveryRowFromToken).slice(0, ROWS);
}

export function isScanLoading() {
  return loading;
}

export function selectScanView(id) {
  if (!SCAN_VIEWS.some((entry) => entry.id === id)) return;
  if (view !== id) view = id;
  const stored = cache.get(id);
  const held = heldCursors.get(id) ?? null;
  cursor = held;
  if (stored) {
    tokens = stored;
    loading = false;
    openSubscription();
    return;
  }
  // Written only when it differs: a fresh `[]` is a new reference every time, and a caller
  // that reads this state (an effect) would then re-run on its own write.
  if (tokens.length > 0) tokens = [];
  loading = true;
  void seed();
}

/** Opens on the ranking the screen was last left on. */
/**
 * `untrack`: the caller is an effect, and an effect that both reads this state and calls
 * something that writes it re-runs on its own write — which is the update-depth error this
 * avoids. Nothing is lost: opening the list is a mount-time action, not a reactive one, and
 * every change afterwards comes in over the socket.
 */
export function startScan() {
  if (started) return;
  started = true;
  untrack(() => {
    if (tokens.length === 0) selectScanView(view);
  });
}

export function stopScan() {
  if (wsKey) unsubscribe(wsKey);
  wsKey = null;
  frames.clear();
  started = false;
}

function body() {
  const entry = SCAN_VIEWS.find((item) => item.id === view);
  return { view: entry.view, rankBy: entry.rankBy, orderBy: "desc", timeFrame: TIMEFRAME };
}

async function seed() {
  const entry = SCAN_VIEWS.find((item) => item.id === view);
  const asked = entry.id;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    const { data, error } = await api.POST(entry.path, { body: body() });
    if (error) throw new Error("scanner request failed");
    // The facet may have moved on while this page was out; a late answer is not this view's.
    if (view !== asked) return;
    tokens = data?.tokens ?? [];
    cursor = data?.cursor ?? null;
    heldCursors.set(asked, cursor);
    cache.set(asked, tokens);
    loading = false;
    openSubscription();
    noteFrame();
  } catch {
    if (view !== asked) return;
    loading = false;
    // A page can fail and the socket still be the way back: re-open on the cursor in hand,
    // then keep asking. The desktop panel does the same, and it is what stops one bad round
    // trip from leaving the list dead until a reload.
    if (cursor) openSubscription();
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (view === asked && started) void seed();
    }, RETRY_MS);
  }
}

function subscriptionParams() {
  const entry = SCAN_VIEWS.find((item) => item.id === view);
  return {
    view: entry.view,
    timeFrame: TIMEFRAME,
    rankBy: entry.rankBy,
    orderBy: "desc",
    endCursor: cursor
  };
}

/**
 * The live half. A cursor is required: with no page yet there is no window to subscribe to,
 * which is why `seed()` opens this only after a page lands.
 */
function openSubscription() {
  if (wsKey) unsubscribe(wsKey);
  frames.clear();
  if (!cursor) return;
  noteFrame();
  wsKey = subscribe(
    SCANNER_TOPIC,
    (event, data) => {
      if (event === "SCANNER_TOKENS" || event === "SCANNER_UPDATE") frames.push({ event, data });
    },
    subscriptionParams(),
    {
      recovery: "refetch",
      onReconnect: () => void seed(),
      onError: (error) => {
        if (
          error?.reason === "CURSOR_EXPIRED" ||
          error?.reason === "CURSOR_KEY_MISMATCH" ||
          error?.reason === "CURSOR_INVALID"
        ) {
          void seed();
        }
      }
    }
  );
}
