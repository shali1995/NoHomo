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

export const SCAN_VIEWS = [
  { id: "trending", label: "Trending", view: "trending", rankBy: "trending", path: `/v2/scanner/tokens/trending/${TIMEFRAME}` },
  { id: "gainers", label: "Gainers", view: "topGainers", rankBy: "price24H", path: `/v2/scanner/tokens/top-gainers/${TIMEFRAME}` },
  { id: "volume", label: "Volume", view: "topVolume", rankBy: "volume", path: `/v2/scanner/tokens/top-volume/${TIMEFRAME}` },
  { id: "new", label: "New", view: "new", rankBy: "age", path: "/v2/scanner/tokens/new" }
];

let view = $state("trending");
/** Raw `ScannerItem`s for the live view. */
let tokens = $state.raw([]);
let cursor = $state(null);
let loading = $state(true);
let wsKey = null;
let started = false;

/** One snapshot per view, so switching back is instant instead of blank. */
const cache = new Map();

const frames = createCoalescer((batch) => {
  let working = tokens;
  for (const frame of batch) working = mergeScannerFrame(frame.event, frame.data, working);
  tokens = working;
});

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
  view = id;
  const stored = cache.get(id);
  if (stored) {
    tokens = stored;
    loading = false;
    openSubscription();
    return;
  }
  tokens = [];
  loading = true;
  cursor = null;
  void seed();
}

/** Opens on the ranking the screen was last left on. */
export function startScan() {
  if (started) return;
  started = true;
  if (tokens.length === 0) selectScanView(view);
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
  try {
    const { data, error } = await api.POST(entry.path, { body: body() });
    if (error) throw new Error("scanner request failed");
    // The facet may have moved on while this page was out; a late answer is not this view's.
    if (view !== asked) return;
    tokens = data?.tokens ?? [];
    cursor = data?.cursor ?? null;
    cache.set(asked, tokens);
    loading = false;
    openSubscription();
  } catch {
    if (view !== asked) return;
    loading = false;
    setTimeout(() => {
      if (view === asked && tokens.length === 0) void seed();
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
