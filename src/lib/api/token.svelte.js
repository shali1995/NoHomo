import { api } from "./client.js";
import { avatarUrl, tokenImage } from "./config.js";
import { subscribe, unsubscribe } from "../ws/client.js";
import { createCoalescer } from "../utils/coalesce.js";

/**
 * The token page's live data, keyed on the token the route names.
 *
 * Sources, all read the way Ombra reads them (`TokenDetail.svelte`):
 *   - token    — `GET /v2/token/{chain}/{address}`
 *   - holders  — `GET /v2/token/{chain}/{address}/holders`, socket `token:{c}:{a}:holders`
 *   - swaps    — `GET /v2/token/{chain}/{address}/swaps`,   socket `token:{c}:{a}:swaps`
 *   - thesis   — `GET /v2/wallets/thesis?chain&tokenAddress`, socket `wallets:thesis`
 *
 * Everything is scoped to one `chain:address`, so switching token tears the previous
 * subscriptions down and re-seeds.
 */

/** Rows asked for / rendered per table. The capture's holders tab listed 43 rows. */
const TABLE_ROWS = 50;

/** Holder rows the capture's table rendered. */
export const HOLDERS_ROWS = TABLE_ROWS;

// --- formatting, mirroring the capture's helpers -------------------------------

const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";

export function shortAddress(address) {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const SUBSCRIPT_DIGITS = ["\u2080","\u2081","\u2082","\u2083","\u2084","\u2085","\u2086","\u2087","\u2088","\u2089"];

/**
 * `0.000587627405` -> `$0.0<sub>3</sub>5876`. Ombra's `formatPrice`
 * (`src/lib/utils/format.ts`), which is what the capture's price cells show.
 */
export function formatPrice(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "$0";
  if (num >= 1) return `$${num.toFixed(2)}`;
  if (num >= 0.01) return `$${num.toFixed(4)}`;
  if (num >= 0.0001) return `$${num.toFixed(6).replace(/0+$/, "")}`;
  const s = num.toFixed(20);
  const match = s.match(/^0\.0*(0+)/);
  if (match) {
    const zeroCount = match[0].length - 2;
    if (zeroCount > 3) {
      const sig = s.slice(2 + zeroCount, 2 + zeroCount + 4).replace(/0+$/, "");
      const sub = String(zeroCount).split("").map((d) => SUBSCRIPT_DIGITS[parseInt(d, 10)]).join("");
      return `$0.0${sub}${sig || "0"}`;
    }
  }
  return `$${num.toFixed(10).replace(/0+$/, "")}`;
}

/** `51175.7644` -> `$51,175.76`; the capture writes balances in full. */
export function formatUsd(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "$0.00";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatCompact(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "0";
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  const trim = (text) => (text.includes(".") ? text.replace(/\.?0+$/, "") : text);
  if (abs >= 1_000_000_000) return `${sign}${trim((abs / 1_000_000_000).toFixed(2))}B`;
  if (abs >= 1_000_000) return `${sign}${trim((abs / 1_000_000).toFixed(2))}M`;
  if (abs >= 1_000) return `${sign}${trim((abs / 1_000).toFixed(2))}K`;
  return `${sign}${trim(abs.toFixed(2))}`;
}

export function ageFromSeconds(seconds) {
  if (seconds === undefined || seconds === null) return "";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

let titleFormatter = null;
function fullDateTime(timestamp) {
  titleFormatter ??= new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
  if (!timestamp) return "";
  return titleFormatter.format(timestamp);
}

function avatarFor(labels, walletAddress) {
  const photo = avatarUrl(labels?.[0]?.photoId);
  if (photo) return { eyes: false, src: photo };
  return { eyes: true, src: "/images/nohomo-eyes.png" };
}

/** Display name for a wallet: its label when it has one, else the short address. */
function nameFor(labels, walletAddress, fallback) {
  return labels?.[0]?.label ?? fallback ?? shortAddress(walletAddress);
}

// --- token identity + market ---------------------------------------------------

let chain = $state("");
let address = $state("");
let token = $state.raw(null);
let loading = $state(false);
let error = $state("");

export function getToken() {
  return token;
}

export function getTokenError() {
  return error;
}

export function isTokenLoading() {
  return loading;
}

export function getChain() {
  return chain;
}

export function getAddress() {
  return address;
}

/** The stats the header strip renders, off the token's own quote and distribution. */
export function getTokenStats() {
  if (!token) return null;
  const quote = token.quote ?? {};
  const timeframes = token.stats?.timeframes ?? {};
  const holders = token.holders ?? {};
  return {
    marketCap: `$${formatCompact(quote.marketCapUsdStr)}`,
    price: formatPrice(quote.priceUsdStr),
    changePct: timeframes["24h"]?.priceChangePct ?? 0,
    volume: `$${formatCompact(timeframes["24h"]?.volumeStr ?? "0")}`,
    liquidity: `$${formatCompact(quote.liquidityUsdStr)}`,
    holders: formatCompact(holders.holderCount ?? holderCount ?? 0),
    top10Pct: holders.top10Pct ?? 0
  };
}

// --- holders -------------------------------------------------------------------

let holders = $state.raw([]);
let holderCount = $state(0);
let holdersLoading = $state(false);

export function getHolders() {
  return holders;
}

export function getHolderCount() {
  return holderCount;
}

export function isHoldersLoading() {
  return holdersLoading;
}

/**
 * A holder row as the capture's Holders table needs it.
 *
 * The endpoint gives the wallet, what it holds and its share of supply — it carries no
 * per-holder PnL or average entry, so those cells are left without a value.
 */
export function holderRowFromItem(item, index) {
  const wallet = item.walletAddress ?? "";
  const avatar = avatarFor(null, wallet);
  return {
    key: wallet || `holder-${index}`,
    // What the trader hover card reads. This endpoint carries no wallet labels, so the
    // name is the short address and the avatar the capture's own placeholder.
    walletAddress: wallet,
    chain,
    name: shortAddress(wallet),
    handle: null,
    avatar: avatar.src,
    cells: [
      {
        texts: [shortAddress(wallet), "holder"],
        avatar: avatar.src,
        avatarEyes: avatar.eyes,
        classes:
          "flex gap-3 items-center sticky @[900px]:static left-0 z-1 pl-3 pr-4 py-2 -my-2 border-r @[900px]:border-r-0 overflow-hidden transition-[border-color] bg-bg-primary group-hover:bg-bg-secondary border-transparent"
      },
      // Holding: what the wallet holds right now — USD value over token amount.
      {
        texts: [formatUsd(item.balanceUsdStr), formatCompact(item.balanceTokenStr)],
        classes: "flex-col items-center gap-0.5 hidden @[400px]:flex tabular-nums min-w-0"
      },
      // Supply: the wallet's share of the token's supply. This is the column the
      // capture labelled "Avg. entry" — a holder row has no entry price, so the share
      // is what belongs there.
      {
        texts: [`${(item.pct ?? 0).toFixed(2)}%`, "of supply"],
        classes: "flex-col items-center gap-0.5 hidden @[400px]:flex tabular-nums"
      }
    ]
  };
}

// --- swaps ---------------------------------------------------------------------

let swaps = $state.raw([]);
let swapsLoading = $state(false);

export function getSwaps() {
  return swaps;
}

export function isSwapsLoading() {
  return swapsLoading;
}

/** A `TokenSwap` as the capture's Swaps table row (`Trader/Action/Amount/Market Cap/Time`). */
export function swapRowFromItem(swap) {
  const isBuy = swap.side === "BUY";
  const avatar = avatarFor(swap.labels, swap.walletAddress);
  return {
    id: swap.id,
    timestamp: swap.timestamp,
    walletAddress: swap.walletAddress ?? "",
    chain: swap.chain ?? chain,
    avatar: avatar.src,
    avatarEyes: avatar.eyes,
    handle: swap.labels?.[0]?.handle ?? null,
    // This endpoint carries no wallet labels (unlike the wallet feed), so the
    // trader cell is the short address.
    name: nameFor(swap.labels, swap.walletAddress),
    action: isBuy ? "Buy" : "Sell",
    actionStyle: `color: ${isBuy ? POSITIVE : NEGATIVE}; background-color: ${isBuy ? "rgba(33, 201, 94, 0.2)" : "rgba(255, 98, 46, 0.2)"};`,
    amount: formatUsd(swap.amountUsdStr),
    // The token swaps endpoint carries the market cap directly, unlike the wallet feed.
    mcap: swap.marketCapUsdStr ? `$${formatCompact(swap.marketCapUsdStr)}` : "",
    time: ageFromSeconds(swap.ageSeconds),
    timeTitle: swap.timestampStr ?? fullDateTime(swap.timestamp)
  };
}

// --- thesis --------------------------------------------------------------------

let theses = $state.raw([]);
let thesisCount = $state(0);
let thesesLoading = $state(false);

export function getTheses() {
  return theses;
}

export function getThesisCount() {
  return thesisCount;
}

export function isThesesLoading() {
  return thesesLoading;
}

// --- top traders ---------------------------------------------------------------

let topTraders = $state.raw([]);
let topTradersLoading = $state(false);

export function getTopTraders() {
  return topTraders;
}

export function isTopTradersLoading() {
  return topTradersLoading;
}

const TRADER_CELL =
  "flex gap-3 items-center sticky @[900px]:static left-0 z-1 pl-3 pr-4 py-2 -my-2 " +
  "border-r @[900px]:border-r-0 overflow-hidden transition-[border-color] " +
  "bg-bg-primary group-hover:bg-bg-secondary border-transparent";
const TRADER_CELL_TEXT = "flex-col items-center gap-0.5 hidden @[400px]:flex tabular-nums min-w-0";

/**
 * A `TokenTopTrader` as a table row, in the shape the Holders rows use: the trader cell
 * carries the avatar and the address (this endpoint sends no wallet labels, so the
 * address is the name), then the money — what the wallet put in, what it took out, its
 * realised PnL and what it still holds. `rank` is the response's own ordering and rides
 * along as the trader cell's caption.
 */
export function topTraderRowFromItem(item, index) {
  const wallet = item.walletAddress ?? "";
  const avatar = avatarFor(item.labels, wallet);
  const pnl = Number(item.pnlUsd ?? 0);
  return {
    key: wallet || `trader-${index}`,
    walletAddress: wallet,
    chain,
    name: nameFor(item.labels, wallet),
    handle: item.labels?.[0]?.handle ?? null,
    avatar: avatar.src,
    cells: [
      {
        texts: [nameFor(item.labels, wallet), `#${item.rank ?? index + 1}`],
        avatar: avatar.src,
        avatarEyes: avatar.eyes,
        classes: TRADER_CELL
      },
      { texts: [formatUsd(item.boughtUsdStr), "invested"], classes: TRADER_CELL_TEXT },
      { texts: [formatUsd(item.soldUsdStr), "sold"], classes: TRADER_CELL_TEXT },
      {
        texts: [formatUsd(item.pnlUsdStr), "pnl"],
        classes: TRADER_CELL_TEXT,
        style: `color: ${pnl >= 0 ? POSITIVE : NEGATIVE};`
      },
      { texts: [formatUsd(item.remainingUsdStr), "remaining"], classes: TRADER_CELL_TEXT }
    ]
  };
}

// --- loaders -------------------------------------------------------------------

async function loadToken() {
  const { data, error: responseError } = await api.GET("/v2/token/{chain}/{address}", {
    params: { path: { chain, address } }
  });
  if (responseError || !data) throw new Error("Unable to load this token");
  token = data;
  // A header frame may have arrived while this request was in flight.
  flushPendingHeader();
}

async function loadHolders() {
  const { data, error: responseError } = await api.GET("/v2/token/{chain}/{address}/holders", {
    params: { path: { chain, address } }
  });
  if (responseError || !data) throw new Error("Unable to load holders");
  holderCount = data.holderCount ?? data.holders?.length ?? 0;
  holders = (data.holders ?? []).slice(0, HOLDERS_ROWS).map(holderRowFromItem);
}

async function loadSwaps() {
  const { data, error: responseError } = await api.GET("/v2/token/{chain}/{address}/swaps", {
    params: { path: { chain, address }, query: { limit: TABLE_ROWS } }
  });
  if (responseError || !data) throw new Error("Unable to load swaps");
  swaps = (data.swaps ?? []).slice(0, TABLE_ROWS).map(swapRowFromItem);
}

async function loadTopTraders() {
  const { data, error: responseError } = await api.GET("/v2/token/{chain}/{address}/top-traders", {
    params: { path: { chain, address } }
  });
  if (responseError || !data) throw new Error("Unable to load top traders");
  topTraders = (data.traders ?? []).slice(0, TABLE_ROWS).map(topTraderRowFromItem);
}

async function loadTheses() {
  const { data, error: responseError } = await api.GET("/v2/wallets/thesis", {
    params: { query: { chain, tokenAddress: address } }
  });
  if (responseError || !data) throw new Error("Unable to load theses");
  thesisCount = data.totalCount ?? data.theses?.length ?? 0;
  theses = (data.theses ?? []).slice(0, TABLE_ROWS);
}

// --- websockets ----------------------------------------------------------------

let wsKeys = [];

function topic(suffix) {
  return `token:${chain}:${address}:${suffix}`;
}

const swapSeen = new Set();
const thesisSeen = new Set();

/**
 * The header's own live feed. These are not the chart's topics: `:price` carries a
 * `TokenMarketLiveSnapshot` and `:stats` a `TokenSnapshot`, and both are merged into
 * the token the header renders. Ombra coalesces each, since they arrive per tick.
 */
/**
 * The timeframes both live topics carry. Ombra merges these ONE BY ONE
 * (`applyPriceUpdate` / `applyStatsUpdate`), because a frame may carry only some of
 * them; replacing the whole `timeframes` object with a partial frame deletes the
 * others, and the header reads exactly those (24H change, 24H Vol.).
 */
const LIVETIMEFRAMES = ["5m", "1h", "6h", "24h"];

function mergeTimeframes(base, incoming) {
  const next = { ...(base ?? {}) };
  for (const tf of LIVETIMEFRAMES) {
    if (incoming?.[tf]) next[tf] = { ...next[tf], ...incoming[tf] };
  }
  return next;
}

/** Ombra's `applyPriceUpdate` — the `:price` topic's snapshot. */
function applyPriceUpdate(data) {
  if (!token) return;
  let next = { ...token };
  if (data.quote) next.quote = { ...next.quote, ...data.quote };
  if (data.stats) {
    let stats = { ...next.stats };
    if (data.stats.timeframes) {
      stats = { ...stats, timeframes: mergeTimeframes(next.stats?.timeframes, data.stats.timeframes) };
    }
    if (data.stats.total) stats = { ...stats, total: { ...stats.total, ...data.stats.total } };
    next = { ...next, stats };
  }
  token = next;
}

/** Ombra's `applyStatsUpdate` — the `:stats` topic's snapshot. */
function applyStatsUpdate(data) {
  if (!token) return;
  let next = { ...token };
  /**
   * The suggested slippage rides the `:stats` snapshot and moves with the market, so Auto's own
   * number has to be taken from every frame. Without this line it is whatever the page loaded
   * with, for as long as the page is open — the one field the reference merges here that we did
   * not (`TokenDetail.svelte`, its own `applyStatsUpdate`).
   */
  if (data.autoSlippage !== undefined) next.autoSlippage = data.autoSlippage;
  if (data.quote) next.quote = { ...next.quote, ...data.quote };
  if (data.stats?.timeframes) {
    next = { ...next, stats: { ...next.stats, timeframes: mergeTimeframes(next.stats?.timeframes, data.stats.timeframes) } };
  }
  if (data.stats?.total) {
    next = { ...next, stats: { ...next.stats, total: { ...next.stats?.total, ...data.stats.total } } };
  }
  if (data.holders) next.holders = { ...next.holders, ...data.holders };
  if (data.audit) next.audit = { ...next.audit, ...data.audit };
  if (data.socials) next.socials = { ...next.socials, ...data.socials };
  if (data.launchPad !== undefined) next.launchPad = data.launchPad;
  token = next;
}

/**
 * Both header topics are low-frequency, so a frame that lands before the REST seed
 * must be HELD, not dropped — there may be no next frame for seconds.
 */
let pendingPrice = null;
let pendingStats = null;

// Latest-wins per animation frame, as Ombra coalesces both topics.
const priceCoalescer = createCoalescer(
  (batch) => {
    const latest = batch[batch.length - 1];
    if (!latest) return;
    if (!token) {
      pendingPrice = latest;
      return;
    }
    applyPriceUpdate(latest);
  },
  { maxBatch: 60 }
);

const statsCoalescer = createCoalescer(
  (batch) => {
    const latest = batch[batch.length - 1];
    if (!latest) return;
    if (!token) {
      pendingStats = latest;
      return;
    }
    applyStatsUpdate(latest);
  },
  { maxBatch: 60 }
);

/** Apply anything the sockets captured while the REST seed was in flight. */
function flushPendingHeader() {
  if (pendingPrice) {
    const buffered = pendingPrice;
    pendingPrice = null;
    applyPriceUpdate(buffered);
  }
  if (pendingStats) {
    const buffered = pendingStats;
    pendingStats = null;
    applyStatsUpdate(buffered);
  }
}

function openHeaderSockets() {
  wsKeys.push(
    subscribe(
      topic("price"),
      (event, data) => {
        if (event === "TOKEN_PRICE" && data) priceCoalescer.push(data);
      },
      undefined,
      { recovery: "resubscribe" }
    )
  );

  wsKeys.push(
    subscribe(
      topic("stats"),
      (event, data) => {
        if (event === "TOKEN_STATS" && data) statsCoalescer.push(data);
      },
      undefined,
      { recovery: "resubscribe" }
    )
  );
}

function openSockets() {
  closeSockets();
  openHeaderSockets();

  // Holders: `TOKEN_HOLDERS` replaces the snapshot, `TOKEN_HOLDER_COUNT` adjusts the
  // count alone. The capture's table is a fixed first page, so a snapshot replaces it.
  wsKeys.push(
    subscribe(
      topic("holders"),
      (event, data) => {
        if (event === "TOKEN_HOLDERS" && data?.holders) {
          holderCount = data.holderCount ?? holderCount;
          holders = data.holders.slice(0, HOLDERS_ROWS).map(holderRowFromItem);
          syncHeaderHolders(holderCount);
        } else if (event === "TOKEN_HOLDER_COUNT" && typeof data?.holderCount === "number") {
          holderCount = data.holderCount;
          syncHeaderHolders(holderCount);
        }
      },
      undefined,
      { onSubscribed: () => void seedTables() }
    )
  );

  // Swaps: prepend-only, as Ombra treats it.
  wsKeys.push(
    subscribe(
      topic("swaps"),
      (event, data) => {
        if (event !== "TOKEN_SWAPS" || !data) return;
        const batch = Array.isArray(data) ? data : (data.swaps ?? [data]);
        const fresh = [];
        for (const swap of batch) {
          if (!swap?.id || swapSeen.has(swap.id)) continue;
          swapSeen.add(swap.id);
          fresh.push(swapRowFromItem(swap));
        }
        if (fresh.length) swaps = [...fresh.reverse(), ...swaps].slice(0, TABLE_ROWS);
      },
      undefined,
      { onSubscribed: () => void seedTables() }
    )
  );

  // Top traders: the snapshot replaces the rows, the way holders does. Ombra's
  // `applyTopTradersSnapshot` carries `fundingSource` and `pnlSparkline` across because
  // the snapshot omits them; this table renders neither, so a plain replace is the whole
  // of it.
  wsKeys.push(
    subscribe(
      topic("top_traders"),
      (event, data) => {
        if (event !== "TOKEN_TOP_TRADERS" || !data?.traders) return;
        topTraders = data.traders.slice(0, TABLE_ROWS).map(topTraderRowFromItem);
      },
      undefined,
      { recovery: "resubscribe" }
    )
  );

  // Thesis: frames arrive on the bare topic even for a token-scoped subscription, so
  // the token filter is re-applied here or unrelated theses would land in the table.
  wsKeys.push(
    subscribe(
      "wallets:thesis",
      (event, data) => {
        if (event !== "THESIS" || !data) return;
        const batch = Array.isArray(data) ? data : [data];
        const fresh = [];
        for (const thesis of batch) {
          if (!thesis?.id || thesisSeen.has(thesis.id)) continue;
          if (thesis.token?.address !== address) continue;
          thesisSeen.add(thesis.id);
          fresh.push(thesis);
        }
        if (fresh.length) theses = [...fresh, ...theses].slice(0, TABLE_ROWS);
      },
      { chains: [chain], tokenAddress: address }
    )
  );
}

function closeSockets() {
  for (const key of wsKeys) unsubscribe(key);
  wsKeys = [];
}

async function seedTables() {
  const results = await Promise.allSettled([
    loadHolders(),
    loadSwaps(),
    loadTheses(),
    loadTopTraders()
  ]);
  const [h, s, t] = results;
  holdersLoading = false;
  swapsLoading = false;
  thesesLoading = false;
  topTradersLoading = false;
  if (s.status === "fulfilled") {
    swapSeen.clear();
    for (const row of swaps) swapSeen.add(row.id);
  }
  if (t.status === "fulfilled") {
    thesisSeen.clear();
    for (const row of theses) thesisSeen.add(row.id);
  }
  const failed = results.find((r) => r.status === "rejected");
  if (failed && failed.status === "rejected") {
    error = failed.reason instanceof Error ? failed.reason.message : "Unable to load token data";
  }
}

/** Point the store at a token. Re-seeds and re-subscribes whenever it changes. */
export async function selectToken(nextChain, nextAddress) {
  if (!nextChain || !nextAddress) return;
  const sameToken = nextChain === chain && nextAddress === address;
  chain = nextChain;
  address = nextAddress;

  if (sameToken) {
    // Already seeded for this token. A component cleanup may have closed the sockets
    // since, so bring them back rather than returning early and leaving the page dead.
    ensureSockets();
    // Self-heal: if the route names a token but the snapshot never landed (a superseded
    // or failed load), fetch it now instead of leaving the header blank until a refresh.
    if (!token && !loading) {
      loading = true;
      try {
        await loadToken();
      } catch (cause) {
        error = cause instanceof Error ? cause.message : "Unable to load this token";
      } finally {
        loading = false;
      }
      await seedTables();
    }
    return;
  }

  token = null;
  holders = [];
  swaps = [];
  theses = [];
  topTraders = [];
  error = "";
  loading = true;
  holdersLoading = true;
  swapsLoading = true;
  thesesLoading = true;
  topTradersLoading = true;

  // Sockets first, the way Ombra does it. Opening them after the REST awaits meant a
  // slow (or failed) request left the sockets closed, so the page came up dead — and
  // because the chart and the header seed independently, whichever lost that race
  // stayed dead while the other worked.
  openSockets();

  try {
    await loadToken();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load this token";
  } finally {
    loading = false;
  }

  await seedTables();
}

/**
 * The header reads `token.holders.holderCount`, so the dedicated holders topic has to
 * write there too — otherwise the Holders figure only ever moves on a TOKEN_STATS
 * frame and looks frozen between them.
 */
function syncHeaderHolders(count) {
  if (!token || typeof count !== "number") return;
  if (token.holders?.holderCount === count) return;
  token = { ...token, holders: { ...token.holders, holderCount: count } };
}

/** Re-open the sockets only if a previous cleanup closed them. */
function ensureSockets() {
  if (wsKeys.length === 0) openSockets();
}

export function stopToken() {
  closeSockets();
}
