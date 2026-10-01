import { api } from "./client.js";
import { tokenImage } from "./config.js";
import { chainSlug } from "../routes.js";
import { createCoalescer } from "../utils/coalesce.js";
import { subscribe, unsubscribe } from "../ws/client.js";

/**
 * Live trending list. A REST page seeds it, then the `scanner:tokens` socket patches
 * it: `SCANNER_TOKENS` carries a replacement snapshot for the subscribed window and
 * `SCANNER_UPDATE` carries changed tokens. Both carry whole `ScannerItem`s, so a row
 * is simply re-mapped from the merged item — the display fields (price, market cap,
 * 1h change) are derived, never patched in place.
 *
 * The merge rules are Ombra's (`src/lib/utils/scanner-ws.ts` `applyScannerWsEvent`):
 * `quote` and `stats` deep-merge, an unchanged row keeps its identity so its DOM does
 * not re-render, and a snapshot with no sparkline keeps the one already held. The
 * affected-row map Ombra returns exists only for its flash animation, which this UI
 * does not have, so it is not reproduced.
 */

const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";
const UP = "\u25B2";
const DOWN = "\u25BC";

/** Row stride the capture's virtualizer used, so absolute offsets stay identical. */
export const ROW_STRIDE = 53;

/** The capture's row cap; the panel rendered 24 rows. */
export const TRENDING_ROWS = 24;

/** Window the panel ranks and displays on — `trending/1H` and its `1h` change. */
export const TRENDING_TIMEFRAME = "1H";

const SCANNER_TOPIC = "scanner:tokens";

const compact = (value, decimals) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });

/** `582062.6357` -> `$582.06K`, `1500000` -> `$1.5M` (capture drops padding zeros). */
export function formatUsdCompact(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "$0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${compact(abs / 1_000_000_000, 2)}B`;
  if (abs >= 1_000_000) return `${sign}$${compact(abs / 1_000_000, 2)}M`;
  if (abs >= 1_000) return `${sign}$${compact(abs / 1_000, 2)}K`;
  return `${sign}$${compact(abs, 2)}`;
}

/** `26951.02` -> `26,951.02%` — the capture shows no leading `+`. */
export function formatChangePct(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "0%";
  return `${compact(num, 2)}%`;
}

/**
 * Splits a price into the capture's three fields. `formatPrice` produces
 * `$0.0<sub>4</sub>2005` for long-tail prices, which is the same split the capture
 * stored, and a plain `$0.00152` for ordinary ones.
 */
export function splitPrice(priceUsdStr) {
  const formatted = formatPriceRaw(priceUsdStr);
  const subscript = formatted.match(/^([^<]*)<sub>(\d+)<\/sub>(.*)$/);
  if (subscript) {
    return { pricePrefix: subscript[1], sub: subscript[2], priceSuffix: subscript[3] };
  }
  return { pricePrefix: "", sub: null, priceSuffix: formatted };
}

/** Ombra's `formatPrice` (src/lib/utils/format.ts), returning the `<sub>` markup. */
function formatPriceRaw(value) {
  if (value === undefined || value === null || value === "") return "$0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  // `toFixed` pads with zeros the capture never showed (`$0.00209`, not `$0.002090`).
  if (num >= 0.0001) return `$${num.toFixed(6).replace(/0+$/, "")}`;
  const s = num.toFixed(20);
  const match = s.match(/^0\.0*(0+)/);
  if (match) {
    const zeroCount = match[0].length - 2;
    if (zeroCount > 3) {
      const sigStart = 2 + zeroCount;
      const sig = s.slice(sigStart, sigStart + 4).replace(/0+$/, "");
      return `$0.0<sub>${zeroCount}</sub>${sig || "0"}`;
    }
  }
  return `$${num.toFixed(10).replace(/0+$/, "")}`;
}

export function absStyleForIndex(index) {
  return `contain: layout style paint; left: 0px; position: absolute; right: 0px; top: ${index * ROW_STRIDE}px;`;
}

export function spacerStyleForCount(count) {
  return `height: ${count * ROW_STRIDE}px; opacity: 1; position: relative;`;
}

/**
 * The panel renders the 1h window's change, which is what `trending/1H` ranks on and
 * what the capture's own numbers show.
 */
export function discoveryRowFromToken(token, index) {
  const timeframes = token.stats?.timeframes ?? {};
  const change = timeframes["1h"]?.priceChangePct ?? timeframes["24h"]?.priceChangePct ?? 0;
  const num = typeof change === "string" ? parseFloat(change) : change;
  const isUp = !isNaN(num) && num >= 0;
  const symbol = token.tokenSymbol ?? "";

  return {
    href: `/tokens/${chainSlug(token.chain)}/${token.tokenAddress}`,
    // The row key. `href` is built from `tokenAddress`, which repeats when a token
    // trades on two venues, so only `pairAddress` is unique enough to key an each block.
    pairAddress: token.pairAddress,
    initial: symbol.slice(0, 1) || "?",
    symbol,
    ...splitPrice(token.quote?.priceUsdStr),
    mcap: formatUsdCompact(token.quote?.marketCapUsdStr),
    mcapHiddenColor: isUp ? "var(--color-green)" : "var(--color-red)",
    dir: isUp ? UP : DOWN,
    change: formatChangePct(num),
    color: isUp ? POSITIVE : NEGATIVE,
    absStyle: absStyleForIndex(index),
    logo: tokenImage(token.chain, token.tokenAddress),
    logoStyle: "height: 36px; width: 36px;"
  };
}

function deepMerge(base, patch) {
  const result = { ...base };
  for (const key of Object.keys(patch)) {
    const val = patch[key];
    if (val !== undefined && val !== null && typeof val === "object" && !Array.isArray(val)) {
      const baseVal = base[key];
      if (baseVal && typeof baseVal === "object" && !Array.isArray(baseVal)) {
        result[key] = deepMerge(baseVal, val);
        continue;
      }
    }
    if (val !== undefined) result[key] = val;
  }
  return result;
}

function rowUnchanged(old, next) {
  return (
    old.quote?.priceUsd === next.quote?.priceUsd &&
    old.quote?.marketCapUsd === next.quote?.marketCapUsd &&
    old.quote?.liquidityUsd === next.quote?.liquidityUsd &&
    old.stats?.total?.transactions === next.stats?.total?.transactions
  );
}

/**
 * `pairAddress` is the scanner's unique id, not `tokenAddress`: one token trading on
 * two venues (Pumpswap + Meteora) comes back as two rows with the same token address.
 * Ombra dedupes on `pairAddress` for exactly this reason, and both of its scanner
 * `{#each}` blocks key on it. Reproduced here so a repeated pair cannot reach the DOM.
 */
export function dedupeByPair(list) {
  const seen = new Set();
  const out = [];
  for (const token of list) {
    if (!token?.pairAddress || seen.has(token.pairAddress)) continue;
    seen.add(token.pairAddress);
    out.push(token);
  }
  return out;
}

/** Ombra's `applyScannerWsEvent`, minus the flash bookkeeping this UI has no use for. */
export function mergeScannerFrame(event, data, current) {
  if (event === "SCANNER_TOKENS") {
    if (!data?.tokens) return current;
    const currentByPair = new Map();
    for (const t of current) currentByPair.set(t.pairAddress, t);

    const seen = new Set();
    const out = [];
    for (const token of data.tokens) {
      if (seen.has(token.pairAddress)) continue;
      seen.add(token.pairAddress);
      const old = currentByPair.get(token.pairAddress);
      const merged = { ...token };
      if (!merged.sparkline?.length && old?.sparkline?.length) merged.sparkline = old.sparkline;
      out.push(old && rowUnchanged(old, merged) ? old : merged);
    }
    // Rows that left the window keep their order positions, so a snapshot that does
    // not cover them leaves the list short rather than restating ranks we don't know.
    return out;
  }

  if (event === "SCANNER_UPDATE") {
    if (!data?.tokens) return current;
    const indexByPair = new Map();
    for (let i = 0; i < current.length; i++) indexByPair.set(current[i].pairAddress, i);

    let out = null;
    for (const upd of data.tokens) {
      if (!upd?.pairAddress) continue;
      const at = indexByPair.get(upd.pairAddress);
      if (at === undefined) continue;
      const t = current[at];
      const merged = { ...t };
      if (upd.quote) merged.quote = deepMerge(t.quote, upd.quote);
      if (upd.stats) merged.stats = deepMerge(t.stats, upd.stats);
      if (upd.holders) merged.holders = { ...t.holders, ...upd.holders };
      if (upd.audit) merged.audit = { ...t.audit, ...upd.audit };
      if (upd.socials) merged.socials = { ...t.socials, ...upd.socials };
      if (upd.launchPad !== undefined) merged.launchPad = upd.launchPad;
      if (upd.sparkline?.length) merged.sparkline = upd.sparkline;
      if (upd.rugged !== undefined) merged.rugged = upd.rugged;
      if (upd.calls !== undefined) merged.calls = upd.calls;
      if (upd.createdAtAgeSeconds !== undefined) merged.createdAtAgeSeconds = upd.createdAtAgeSeconds;
      if (!out) out = current.slice();
      out[at] = merged;
    }
    return out ?? current;
  }

  return current;
}

/** POST body the scanner route expects; the same one the REST seed uses. */
function scannerBody() {
  return { view: "trending", rankBy: "trending", orderBy: "desc", timeFrame: TRENDING_TIMEFRAME };
}

/** Subscribe params must repeat the view, timeframe, ranking and ordering. */
function scannerParams(cursor) {
  return {
    view: "trending",
    timeFrame: TRENDING_TIMEFRAME,
    rankBy: "trending",
    orderBy: "desc",
    endCursor: cursor
  };
}

/**
 * Live trending tokens. `$state.raw` because rows are replaced wholesale and a
 * deeply nested `ScannerItem` should never be deep-proxied (Ombra's own note).
 */
let tokens = $state.raw([]);
let cursor = null;
let wsKey = null;
let started = false;
/** True only while the first page is in flight, so the panel can show placeholders. */
let loading = $state(true);

const frameCoalescer = createCoalescer(
  (batch) => {
    let working = tokens;
    for (const { event, data } of batch) {
      working = mergeScannerFrame(event, data, working);
    }
    // A replacement snapshot covers the entire subscribed window (50 tokens), so the
    // capture's row cap has to be re-applied here and not only on the REST seed.
    tokens = applyRowCap(working);
  },
  { maxBatch: 40 }
);

/** Dedupe the way Ombra does first, so the cap counts distinct pairs. */
function applyRowCap(list) {
  const unique = dedupeByPair(list);
  return unique.length > TRENDING_ROWS ? unique.slice(0, TRENDING_ROWS) : unique;
}

export function getTrendingTokens() {
  return tokens;
}

export function trendingRows() {
  return tokens.map(discoveryRowFromToken);
}

export function isTrendingLoading() {
  return loading;
}

export function trendingSpacerStyle() {
  return spacerStyleForCount(tokens.length);
}

async function fetchPage() {
  const { data, error } = await api.POST("/v2/scanner/tokens/trending/{timeframe}", {
    params: { path: { timeframe: TRENDING_TIMEFRAME } },
    body: scannerBody()
  });
  if (error) throw new Error("trending request failed");
  return data;
}

/**
 * Cursor subscriptions must re-seed on reconnect: the backend owns the cursor and it
 * can expire, so a reconnect without a fresh REST page would leave a gap. Ombra
 * requires `recovery: 'refetch'` to come with `onReconnect` for exactly that reason.
 */
function openSubscription() {
  lastOpenAtMs = Date.now();
  if (wsKey) unsubscribe(wsKey);
  frameCoalescer.clear();
  if (!cursor) return;
  wsKey = subscribe(
    SCANNER_TOPIC,
    (event, data) => {
      if (event === "SCANNER_TOKENS" || event === "SCANNER_UPDATE") {
        frameCoalescer.push({ event, data });
      }
    },
    scannerParams(cursor),
    {
      recovery: "refetch",
      onReconnect: () => {
        void reseed();
      },
      onError: (error) => {
        if (
          error?.reason === "CURSOR_EXPIRED" ||
          error?.reason === "CURSOR_KEY_MISMATCH" ||
          error?.reason === "CURSOR_INVALID"
        ) {
          void reseed();
        }
      }
    }
  );
}

/** How long to wait before trying the seed again after it fails. */
const RETRY_MS = 3_000;
let retryTimer = null;
let lastOpenAtMs = 0;

async function reseed() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    const data = await fetchPage();
    tokens = applyRowCap(data.tokens);
    cursor = data.cursor ?? null;
    loading = false;
    openSubscription();
    return;
  } catch {
    // The seed failed -- the API was unreachable, or the socket took the network with
    // it. This used to escape as an unhandled rejection and skip `openSubscription`,
    // which is the ONE thing that puts the panel back on the socket: the chart and the
    // header recover on their own (`resubscribe`), so the trending list was left dead
    // until a page reload.
  }
  // Re-open on the cursor already held, so live frames resume now. An expired cursor
  // comes back through `onError` and lands here again, so this is rate-limited to one
  // attempt per retry: while the backend is unreachable that is one subscribe every
  // three seconds rather than one per round trip.
  if (Date.now() - lastOpenAtMs >= RETRY_MS) openSubscription();
  // With no cursor yet there is nothing to subscribe to, so keep asking for a page.
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void reseed();
  }, RETRY_MS);
}

export async function startTrending() {
  if (started) return;
  started = true;
  try {
    await reseed();
  } finally {
    loading = false;
  }
}

export function stopTrending() {
  if (wsKey) unsubscribe(wsKey);
  wsKey = null;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  frameCoalescer.clear();
  started = false;
}
