import { api } from "./client.js";
import { avatarUrl } from "./config.js";

/**
 * The left panel's Leaderboard view, off Ombra's trader-analytics ranking.
 *
 * Source values, their labels and the order of the buttons come from Ombra's
 * `src/lib/components/trader-analytics/config.ts` (`TRADER_RANKING_SOURCE_OPTIONS`).
 * Ombra offers All / FOMO / Pump.fun / KOL; this panel renders the first three.
 *
 * The time windows are the capture's own (24H/7D/30D/ALL) mapped onto the API's
 * `WalletTimeRange` enum. The API has no all-time value — its longest is `NINETY_DAY`
 * — so ALL maps there, which is the closest the backend offers.
 *
 * The ranking read takes the backend a second or two, so what it returns is also kept in
 * localStorage, one snapshot per window+source. A page load paints the stored snapshot at
 * once and then revalidates it: the numbers here are money, so the cache is a head start
 * and never the last word.
 */

const CAPTURE_POSITIVE = "rgb(33, 201, 94)";
const CAPTURE_NEGATIVE = "rgb(255, 98, 46)";

/** The capture's window labels, in its order. */
export const WINDOW_LABELS = ["24H", "7D", "30D", "ALL"];

/** Capture window label -> the API's `WalletTimeRange`. */
const WINDOW_TO_RANGE = {
  "24H": "ONE_DAY",
  "7D": "SEVEN_DAY",
  "30D": "THIRTY_DAY",
  ALL: "NINETY_DAY"
};

/** The capture's list length; its leaderboard rendered 150 rows. */
export const LEADERBOARD_ROWS = 150;

/** Chain the ranking is requested for. The capture's leaderboard is Solana traders. */
export const LEADERBOARD_CHAIN = "SOL";

/**
 * Ombra's `TRADER_RANKING_SOURCE_OPTIONS`, reduced to the two platforms this panel
 * shows. `label` is the accessible name and tooltip; the button itself renders only the
 * mark, since a control whose whole content is a glyph has no accessible name otherwise.
 * FOMO is the default selection.
 */
export const SOURCE_OPTIONS = [
  { value: "FOMO", label: "FOMO" },
  { value: "PUMPFUN", label: "Pump.fun" }
];

export const DEFAULT_SOURCE = "FOMO";

/** The capture's own selected/unselected button classes, reused for the source group. */
export const SOURCE_BUTTON_CLASSES =
  "inline-flex h-6 min-w-8 items-center justify-center gap-1 rounded-md border border-bg-tertiary-solid px-1.5 text-text-tertiary text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary";
export const SOURCE_BUTTON_ACTIVE_CLASSES =
  "inline-flex h-6 min-w-8 items-center justify-center gap-1 rounded-md border border-bg-tertiary-solid px-1.5 text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary bg-bg-tertiary text-text-primary";

/**
 * The capture writes PnL in full with comma grouping and always two decimals — its rows
 * read `$14,927,385.27` beside a separate `pnlSign` of `+`, not a compact `$14.9M`.
 * The sign is carried by the row's own field, so only the magnitude is formatted here.
 */
export function formatPnlValue(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "$0.00";
  return `$${Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/** Ombra's `shortAddress` (src/lib/utils/format.ts). */
export function shortAddress(address) {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Ombra's `TraderIdentity` shows the primary label, falling back to the shortened
 * wallet; the handle line under it is the wallet either way. Same rule here, mapped
 * onto the capture's `name` / `handle` fields.
 */
function identityFor(item) {
  const primary = (item.labels ?? [])[0];
  return {
    name: primary?.label || shortAddress(item.walletAddress),
    handle: `@${shortAddress(item.walletAddress)}`,
    avatarImg: avatarUrl(primary?.photoId) ?? undefined
  };
}

/**
 * A `TraderRankItem` as the capture's leaderboard row. Fields with no source on this
 * endpoint are deliberately left unset rather than invented:
 *   - `clan`   — the ranking API has no clan concept at all.
 *   - `tokens` / `overflow` — the capture's rows show the trader's token swatches;
 *     the ranking item carries no per-token list (only `uniqueTokensBought`, a count).
 *   - `avatarBg` — the capture's placeholder tints for rows with no photo.
 */
export function leaderboardRowFromItem(item, index) {
  const pnl = parseFloat(item.stats?.pnlUsdStr ?? "");
  const isUp = !isNaN(pnl) && pnl >= 0;
  const identity = identityFor(item);

  return {
    href: `/profile/${item.walletAddress}`,
    // The row key: unique per trader, where the href's address is the wallet itself.
    traderKey: `${item.chain}:${item.walletAddress}`,
    // The hover card fetches by these.
    chain: item.chain,
    walletAddress: item.walletAddress,
    medal: index < 3 ? index + 1 : null,
    rankText: index < 3 ? null : String(index + 1),
    ...identity,
    pnlSign: isUp ? "+" : "-",
    pnlValue: formatPnlValue(pnl),
    pnlColor: isUp ? CAPTURE_POSITIVE : CAPTURE_NEGATIVE,
    // The window's win rate, which is the one quality figure the ranking carries per
    // trader (besides how much they made). `trades` is not drawn -- it rides along as the
    // row's title, where it costs no space.
    winRate: `${Number(item.stats?.winRatePct ?? 0).toFixed(2)}%`,
    trades: Number(item.stats?.tradeCount ?? 0).toLocaleString("en-US")
  };
}

/** One snapshot per window+source, so a page load paints instead of waiting. */
const CACHE_KEY = "ombra_leaderboard";
/** Bumped when the row shape changes: an older blob is ignored rather than rendered. */
const CACHE_VERSION = 1;
/** How long a painted snapshot is trusted before the panel refreshes it on sight. */
const REVALIDATE_MS = 30_000;

function readCache() {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed?.version !== CACHE_VERSION || typeof parsed.entries !== "object") return {};
    return parsed.entries ?? {};
  } catch {
    // A blob this app did not write, or one that was truncated: no cache is fine.
    return {};
  }
}

function writeCache(signature, rows) {
  if (typeof localStorage === "undefined") return;
  try {
    const entries = { ...readCache(), [signature]: { at: Date.now(), rows } };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ version: CACHE_VERSION, entries }));
  } catch {
    /* a disabled or full store is not worth surfacing */
  }
}

/** The rows a previous load of this window+source left behind, or null. */
function cachedRows(signature) {
  const entry = readCache()[signature];
  return Array.isArray(entry?.rows) && entry.rows.length ? entry.rows : null;
}

let rows = $state.raw([]);
/** When the ranking was last read from the API, for the revalidation window. */
let lastFetchAt = 0;
let windowLabel = $state("30D");
let source = $state(DEFAULT_SOURCE);
let loading = $state(false);
let error = $state("");
/** Signature of the request currently in flight, so a superseded one can be ignored. */
let loadingSignature = null;

export function getWindowLabel() {
  return windowLabel;
}

export function getSource() {
  return source;
}

export function getRows() {
  return rows;
}

export function isLoading() {
  return loading;
}

export function getError() {
  return error;
}

export function getTimeRange() {
  return WINDOW_TO_RANGE[windowLabel];
}

/**
 * Identity of a query. Two requests with the same signature are interchangeable, which
 * is what makes a stale response safe to drop — unlike a request counter, which also
 * discards a response that is merely the only one in flight.
 */
function signatureOf(range, src) {
  return `${LEADERBOARD_CHAIN}|${range}|${src}`;
}

/**
 * The ranking is filtered by `sources` **on the server** (Ombra's `fetchRanking` sends
 * `sources: [source]`; the panel's own `itemsMatchingSource` only guards live
 * snapshots). One source is sent at a time, so it goes as the single enum value the API
 * expects — a repeated `sources` param is rejected outright.
 */
async function fetchRanking() {
  const range = getTimeRange();
  const src = source;
  const signature = signatureOf(range, src);
  loadingSignature = signature;
  loading = true;
  error = "";
  try {
    const { data, error: responseError } = await api.GET("/v2/traders/ranking", {
      params: {
        query: {
          chain: LEADERBOARD_CHAIN,
          timeRange: range,
          ...(src ? { sources: src } : {})
        }
      }
    });
    // Only a newer request for a *different* query supersedes this one.
    if (loadingSignature !== signature) return;
    if (responseError || !data) throw new Error("Unable to load trader rankings");
    const mapped = (data.items ?? []).slice(0, LEADERBOARD_ROWS).map(leaderboardRowFromItem);
    rows = mapped;
    lastFetchAt = Date.now();
    writeCache(signature, mapped);
  } catch (cause) {
    if (loadingSignature !== signature) return;
    // A refresh that fails leaves what is on screen: a stored snapshot beats an empty
    // panel, and the message only shows when there is nothing to show.
    if (rows.length === 0) error = cause instanceof Error ? cause.message : "Unable to load trader rankings";
  } finally {
    // Always clear the flag for our own request: leaving it set would block every
    // later fetch and strand the list empty.
    if (loadingSignature === signature) loading = false;
  }
}

/**
 * Changing the query drops the rows on screen rather than leaving the old window's
 * numbers under the new window's chip. The panel shows its placeholders whenever the list
 * is empty and a load is in flight, so this is what makes a switch look like the first
 * load instead of a list that sits there and then jumps.
 */
function resetForNewQuery() {
  error = "";
  // The new query's own snapshot, when there is one: switching window or source should
  // not flash a skeleton over rows we already hold.
  rows = cachedRows(signatureOf(getTimeRange(), source)) ?? [];
}

export function selectWindow(label) {
  if (label === windowLabel) return;
  windowLabel = label;
  resetForNewQuery();
  void fetchRanking();
}

export function selectSource(value) {
  if (value === source) return;
  source = value;
  resetForNewQuery();
  void fetchRanking();
}

export function startLeaderboard() {
  const signature = signatureOf(getTimeRange(), source);
  if (rows.length === 0) rows = cachedRows(signature) ?? [];
  if (loading) return;
  // A snapshot that was just read is left alone; anything older is refreshed behind the
  // rows already painted.
  if (rows.length > 0 && Date.now() - lastFetchAt < REVALIDATE_MS) return;
  void fetchRanking();
}

/**
 * Deliberately does not cancel an in-flight request. The rows are module-level, not
 * owned by the panel, so a response is still valid after the panel unmounts — and
 * cancelling here is what stranded the list empty: the response was discarded while
 * `loading` stayed set, so nothing ever fetched again.
 */
export function stopLeaderboard() {}

/**
 * The sidebar's follow rail: the top traders, for the panel that has ten slots rather than the
 * leaderboard's full list.
 *
 * It does no fetching of its own when there is something stored — the snapshot the leaderboard
 * already wrote is the list, and the leaderboard is what revalidates it. Only an empty store, on a
 * first visit before the ranking has ever run, makes the one request.
 */
export async function railTraders(count = 10) {
  const signature = signatureOf(getTimeRange(), source);
  const stored = cachedRows(signature);
  if (stored && stored.length > 0) return stored.slice(0, count);
  await fetchRanking();
  return (cachedRows(signature) ?? []).slice(0, count);
}
