import { api } from "./client.js";
import { tokenImage } from "./config.js";
import { subscribe, unsubscribe } from "../ws/client.js";
import { ageFromSeconds, formatCompact, shortAddress } from "./token.svelte.js";

/**
 * The Echo pill's live token rankings.
 *
 * The rankings come from the Echo service (`https://echo.flashhub.net`, public, no auth):
 * a seed snapshot then a Server-Sent Events stream whose `snapshot` events each carry the
 * WHOLE table for the selected kind/period/limit. A snapshot therefore REPLACES the rows;
 * it is never merged into them. Exactly one stream is open at a time — the key it was
 * opened for is held here, and a filter change closes it and opens the new one.
 *
 * The rankings payload carries no price data, so the client-side filters (Newest, Age,
 * 24h change) read OpenDEX: `GET /v2/token/multi` resolves up to 20 tokens per request,
 * and the answers are cached per address, so a snapshot landing every couple of seconds
 * never turns into a request per row. The cached entries are kept fresh by the token's own
 * `price`/`stats` socket topics (only for the rows the panel can actually show) and, for
 * anything without a live topic, by a slow re-read of entries older than `MARKET_STALE_MS`.
 */

/** The Echo service. Public and CORS-open (`access-control-allow-origin: *`), so no proxy. */
const ECHO_BASE = String(import.meta.env.VITE_ECHO_API_BASE ?? "https://echo.flashhub.net").replace(/\/+$/, "");

/** The stream re-sends a full snapshot on this cadence; reconnect backoff is capped. */
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000];

/** Echo's own `validRow`: Solana only, and a row without an address or name is not a row. */
const SOLANA_NETWORK_ID = 1399811149;

/** Lookups per `/v2/token/multi` request (the endpoint allows at most 20). */
const MARKET_CHUNK = 20;

/** How long a cached 24h change / token age is trusted before it is re-read. */
const MARKET_STALE_MS = 5 * 60_000;

/** Rows that also get live `price`/`stats` sockets. The panel shows far fewer than `limit`. */
const MARKET_WS_ROWS = 30;

const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";

// --- the filter set ------------------------------------------------------------

export const ECHO_KINDS = [
  { id: "bought", label: "Bought" },
  { id: "sold", label: "Sold" },
  { id: "talked", label: "Talked" }
];

export const ECHO_PERIODS = [
  { id: "5m", label: "5m" },
  { id: "1h", label: "1h" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yest." },
  { id: "7d", label: "7d" }
];

export const ECHO_LIMITS = [25, 50, 100];

/** How the client orders what the server ranked: Echo's own order, or a local sort. */
export const ECHO_SORTS = [
  { id: "rank", label: "Rank" },
  { id: "newest", label: "Newest" },
  { id: "change", label: "24h" }
];

/** Token-age ceiling. `0` is off; the age comes from OpenDEX's `createdAtAgeSeconds`. */
export const ECHO_AGES = [
  { id: 0, label: "Any" },
  { id: 300, label: "<5m" },
  { id: 3600, label: "<1h" },
  { id: 21600, label: "<6h" },
  { id: 86400, label: "<24h" }
];

/** 24h change sign, read from the batched OpenDEX price data. */
/** The peak chips: how far a token must have run since Echo first caught it. */
/** The flow chips: which side of the money was heavier in the selected period. */
/** The total-flow chips: how much money moved through the token, both ways, in the period. */
export const ECHO_TOTALS = [
  { id: 0, label: "Any" },
  { id: 1000, label: "$1K+" },
  { id: 2000, label: "$2K+" },
  { id: 5000, label: "$5K+" }
];

export const ECHO_FLOWS = [
  { id: "all", label: "Any" },
  { id: "in", label: "Net in" },
  { id: "out", label: "Net out" }
];

export const ECHO_PEAKS = [
  { id: 0, label: "Any" },
  { id: 2, label: "2\u00d7" },
  { id: 5, label: "5\u00d7" },
  { id: 10, label: "10\u00d7" }
];

export const ECHO_CHANGES = [
  { id: "all", label: "All" },
  { id: "up", label: "Up" },
  { id: "down", label: "Down" }
];

export const echoFilters = $state({
  kind: "bought",
  period: "5m",
  limit: 50,
  // Client-side, applied to the rows the stream sends.
  sort: "rank",
  maxAgeSeconds: 0,
  change: "all",
  /** Net flow over the period: which side put more money in. "all" is no filter. */
  flow: "all",
  /** Money in plus money out in the period, in USD: how much the token is actually traded. */
  minTotalFlow: 0,
  /** Only tokens whose peak since we first saw them reached this multiple (0 = any). */
  minPeak: 0
});

export function setEchoFilter(patch) {
  Object.assign(echoFilters, patch);
}

/** The server-side filter set a stream is keyed on. */
export function echoQueryKey() {
  return `${echoFilters.kind}:${echoFilters.period}:${echoFilters.limit}`;
}

// --- the stream's own state ----------------------------------------------------

export const echo = $state({
  rows: [],
  meta: null,
  loading: false,
  loaded: false,
  error: "",
  /** closed | connecting | open | reconnecting */
  streamState: "closed",
  lastSnapshotAt: 0
});

function toRow(item, index) {
  const firstSeenMs = item.first_seen_at ? Date.parse(item.first_seen_at) : null;
  const latestEventMs = item.latest_event_at ? Date.parse(item.latest_event_at) : null;
  const wallets = (item.wallets ?? [])
    .filter((wallet) => typeof wallet?.address === "string" && wallet.address.length > 0)
    .map((wallet) => ({
      address: wallet.address,
      handle: wallet.handle ?? null,
      imageUrl: wallet.imageUrl ?? null
    }));
  return {
    address: item.address,
    rank: typeof item.rank === "number" ? item.rank : index + 1,
    name: item.name ?? "",
    // Echo's own image when it has one, else the app's token image route, and the app's
    // mark if even that does not load (`public/images/nohomo-eyes.png`).
    imageUrl: item.image_url ?? null,
    logo: item.image_url || tokenImage("SOL", item.address),
    href: `/tokens/solana/${item.address}`,
    eventCount: Number(item.event_count ?? 0),
    totalUsd: Number(item.total_usd ?? 0),
    // Known wins; the Fomo-reported count is the fallback when it is null.
    traders: item.known_unique_traders ?? item.reported_unique_traders ?? null,
    reportedTraders: item.reported_unique_traders ?? null,
    firstSeenAt: item.first_seen_at ?? null,
    firstSeenMs: Number.isFinite(firstSeenMs) ? firstSeenMs : null,
    latestEventAt: item.latest_event_at ?? null,
    latestEventMs: Number.isFinite(latestEventMs) ? latestEventMs : null,
    mcAtFirstSeen: item.mc_at_first_seen ?? null,
    flowInUsd: Number(item.flow_in_usd ?? 0),
    flowOutUsd: Number(item.flow_out_usd ?? 0),
    wallets,
    walletCount: wallets.length
  };
}

/** A row from the rankings envelope; anything that is not Solana with an address is dropped. */
function validRow(item) {
  return (
    item &&
    item.network_id === SOLANA_NETWORK_ID &&
    typeof item.address === "string" &&
    item.address.length > 0 &&
    typeof item.name === "string" &&
    item.name.length > 0
  );
}

let stream = null;
let streamKey = null;
let reconnectTimer = null;
let reconnectAttempt = 0;

/** Open the stream for `key`, replacing whatever stream is open. */
export function ensureEchoStream(key = echoQueryKey()) {
  if (stream && streamKey === key) return;
  closeEchoStream();
  streamKey = key;
  // The previous window's rows are not this window's rows: hold the panel open with the
  // loading state until the new stream's first snapshot lands (it arrives on connect).
  echo.rows = [];
  echo.meta = null;
  echo.loading = true;
  echo.loaded = false;
  echo.error = "";
  connectEchoStream(key);
}

function connectEchoStream(key) {
  const [kind, period, limit] = key.split(":");
  const url = `${ECHO_BASE}/api/rankings/stream?kind=${kind}&period=${period}&limit=${limit}`;
  echo.streamState = "connecting";
  let source;
  try {
    source = new EventSource(url);
  } catch {
    scheduleReconnect(key);
    return;
  }
  stream = source;

  source.onopen = () => {
    if (streamKey === key) echo.streamState = "open";
  };

  source.addEventListener("snapshot", (event) => {
    if (streamKey !== key) return;
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch {
      return;
    }
    if (!payload || !Array.isArray(payload.data)) return;
    echo.rows = payload.data.filter(validRow).map(toRow);
    echo.meta = payload.meta ?? null;
    echo.loaded = true;
    echo.loading = false;
    echo.error = "";
    echo.lastSnapshotAt = Date.now();
    echo.streamState = "open";
    reconnectAttempt = 0;
  });

  // `error` is both EventSource's failure type and the name the backend may use for its own
  // in-stream error event. Only the latter carries data; that one is surfaced and the stream
  // is left open, an actual failure is closed and reconnected with capped backoff.
  source.onerror = (event) => {
    if (typeof event?.data === "string" && event.data.length > 0) {
      try {
        const payload = JSON.parse(event.data);
        echo.error = payload?.message || "Rankings are temporarily unavailable";
      } catch {
        echo.error = "Rankings are temporarily unavailable";
      }
      return;
    }
    try {
      source.close();
    } catch {}
    if (stream === source) stream = null;
    if (streamKey !== key) return;
    if (!echo.loaded) echo.error = "Unable to reach the live rankings stream";
    scheduleReconnect(key);
  };
}

function scheduleReconnect(key) {
  if (streamKey !== key) return;
  echo.streamState = "reconnecting";
  const delay = RECONNECT_DELAYS[Math.min(reconnectAttempt, RECONNECT_DELAYS.length - 1)];
  reconnectAttempt += 1;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => {
    if (streamKey === key) connectEchoStream(key);
  }, delay);
}

function closeEchoStream() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  reconnectAttempt = 0;
  if (stream) {
    stream.onopen = null;
    stream.onerror = null;
    try {
      stream.close();
    } catch {}
    stream = null;
  }
  echo.streamState = "closed";
}

/** Close the stream (panel teardown, or the Echo pill being left). */
export function stopEchoStream() {
  closeEchoStream();
  streamKey = null;
}

/** Reconnect now, keeping the current filter set (the error state's Retry). */
export function retryEchoStream() {
  const key = echoQueryKey();
  closeEchoStream();
  streamKey = null;
  ensureEchoStream(key);
}

// --- OpenDEX market data: 24h change, token age, market cap ---------------------

export const echoMarkets = $state({});

const marketWsKeys = new Map(); // address -> [subscription key, subscription key]
const marketInflight = new Set();
let visibleAddresses = [];
let marketStaleTimer = null;
let marketGeneration = 0;

function ensureMarket(address) {
  if (!echoMarkets[address]) {
    echoMarkets[address] = { change24h: null, ageSeconds: null, mcUsd: null, at: 0, loading: false };
  }
  return echoMarkets[address];
}

function applyMarketSnapshot(snapshot) {
  const address = snapshot?.tokenAddress;
  if (typeof address !== "string" || address.length === 0) return;
  const entry = ensureMarket(address);
  const change = Number(snapshot.stats?.timeframes?.["24h"]?.priceChangePct);
  if (Number.isFinite(change)) entry.change24h = change;
  const age = Number(snapshot.createdAtAgeSeconds);
  const created = Number(snapshot.createdAtTimestamp);
  if (Number.isFinite(age) && age >= 0) entry.ageSeconds = age;
  else if (Number.isFinite(created) && created > 0) entry.ageSeconds = Math.max(0, Math.floor((Date.now() - created) / 1000));
  const mc = Number(snapshot.quote?.marketCapUsd);
  if (Number.isFinite(mc)) entry.mcUsd = mc;
  // the all-time-high cap, which is what the "since first seen" multiple is measured against
  const ath = Number(snapshot.athMarketCapUsd);
  if (Number.isFinite(ath) && ath > 0) entry.athMcap = ath;
  entry.at = Date.now();
  entry.loading = false;
}

function setupMarketSockets(address) {
  const touch = () => {
    if (marketWsKeys.has(address)) ensureMarket(address).at = Date.now();
  };
  const onPrice = (event, data) => {
    if (event !== "TOKEN_PRICE" || !data) return;
    const change = Number(data.stats?.timeframes?.["24h"]?.priceChangePct);
    const mc = Number(data.quote?.marketCapUsd);
    const ath = Number(data.athMarketCapUsd);
    const entry = ensureMarket(address);
    if (Number.isFinite(change)) entry.change24h = change;
    if (Number.isFinite(mc)) entry.mcUsd = mc;
    if (Number.isFinite(ath) && ath > 0) entry.athMcap = ath;
    touch();
  };
  const onStats = (event, data) => {
    if (event !== "TOKEN_STATS" || !data) return;
    applyMarketSnapshot({ ...data, tokenAddress: data.tokenAddress ?? address });
  };
  const keys = [
    subscribe(`token:SOL:${address}:price`, onPrice, undefined, { recovery: "resubscribe" }),
    subscribe(`token:SOL:${address}:stats`, onStats, undefined, { recovery: "resubscribe" })
  ];
  marketWsKeys.set(address, keys);
}

function teardownMarketSockets(address) {
  const keys = marketWsKeys.get(address);
  if (!keys) return;
  for (const key of keys) unsubscribe(key);
  marketWsKeys.delete(address);
}

async function loadMarketChunk(addresses, generation) {
  const query = { lookup: addresses.map((address) => `SOL:${address}`) };
  for (let attempt = 0; attempt < 2; attempt++) {
    let payload = null;
    try {
      const response = await api.GET("/v2/token/multi", { params: { query } });
      payload = response.data ?? null;
    } catch {
      payload = null;
    }
    if (generation !== marketGeneration) return;
    if (payload?.tokens) {
      for (const snapshot of payload.tokens) applyMarketSnapshot(snapshot);
      return;
    }
    // One retry, then leave the entries for the next stale pass — never a request per row.
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (generation !== marketGeneration) return;
  }
  for (const address of addresses) ensureMarket(address).at = Date.now();
}

async function loadMarkets(addresses) {
  const generation = ++marketGeneration;
  for (const address of addresses) {
    marketInflight.add(address);
    ensureMarket(address).loading = true;
  }
  const chunks = [];
  for (let i = 0; i < addresses.length; i += MARKET_CHUNK) chunks.push(addresses.slice(i, i + MARKET_CHUNK));
  await Promise.all(chunks.map((chunk) => loadMarketChunk(chunk, generation)));
  if (generation !== marketGeneration) return;
  for (const address of addresses) {
    marketInflight.delete(address);
    const entry = echoMarkets[address];
    if (entry) entry.loading = false;
  }
}

function needsMarketLoad(address, now) {
  if (marketInflight.has(address)) return false;
  const entry = echoMarkets[address];
  if (!entry) return true;
  return entry.at + MARKET_STALE_MS <= now;
}

/**
 * Keep the OpenDEX market cache in step with the rows on screen: a batched read for
 * anything missing or stale, live sockets for the first `MARKET_WS_ROWS` rows, and the
 * sockets of rows that scrolled out of the list torn down. Called on every snapshot, so it
 * must stay cheap — it only ever issues a request for an address it has not got.
 */
export function syncEchoMarkets(addresses) {
  const unique = [...new Set(addresses.filter((address) => typeof address === "string" && address.length > 0))];
  visibleAddresses = unique;

  for (const address of [...marketWsKeys.keys()]) {
    if (!unique.includes(address)) teardownMarketSockets(address);
  }
  for (const address of unique.slice(0, MARKET_WS_ROWS)) {
    if (!marketWsKeys.has(address)) setupMarketSockets(address);
  }

  const now = Date.now();
  const missing = unique.filter((address) => needsMarketLoad(address, now));
  if (missing.length) void loadMarkets(missing);

  marketStaleTimer ??= setInterval(() => {
    const stale = visibleAddresses.filter((address) => needsMarketLoad(address, Date.now()));
    if (stale.length) void loadMarkets(stale);
  }, 60_000);
}

/** Drop every market socket and cache subscription (the Echo view being left). */
export function stopEchoMarkets() {
  for (const address of [...marketWsKeys.keys()]) teardownMarketSockets(address);
  if (marketStaleTimer) {
    clearInterval(marketStaleTimer);
    marketStaleTimer = null;
  }
  visibleAddresses = [];
  marketInflight.clear();
  marketGeneration += 1;
}

/** The token's age in seconds: OpenDEX's own, else how long ago Echo first saw it. */
export function echoRowAgeSeconds(row) {
  const entry = echoMarkets[row.address];
  if (entry && entry.ageSeconds != null) {
    return entry.ageSeconds + Math.max(0, Math.floor((Date.now() - entry.at) / 1000));
  }
  if (row.firstSeenMs != null) return Math.max(0, Math.floor((Date.now() - row.firstSeenMs) / 1000));
  return null;
}

export function echoRowChange24h(row) {
  const entry = echoMarkets[row.address];
  return entry && entry.change24h != null ? entry.change24h : null;
}

/** The multiple since Echo first caught the token — the same number the row's chip shows. */
export function echoRowPeak(row) {
  const entry = echoMarkets[row.address];
  const ath = entry?.athMcap;
  if (!(ath > 0) || !(row.mcAtFirstSeen > 0)) return null;
  return ath / row.mcAtFirstSeen;
}

/**
 * The rows the panel shows: the snapshot with the client-side Newest / Age / 24h-change
 * controls applied. `Newest` orders by `first_seen_at`, `24h` by the batched OpenDEX change
 * (unknown values sort last), the age ceiling and the change sign filter.
 *
 * A row whose 24h change has not been resolved yet is kept rather than hidden, so the table
 * does not flash empty on mount; it drops out as soon as its value arrives and disagrees.
 */
export function echoVisibleRows() {
  const ageCeiling = echoFilters.maxAgeSeconds;
  const peakFloor = echoFilters.minPeak;
  // `talked` events carry no USD, so both sides are zero and the chip would hide every row
  const flowFilter = echoFilters.kind === "talked" ? "all" : echoFilters.flow;
  const totalFloor = echoFilters.kind === "talked" ? 0 : echoFilters.minTotalFlow;
  const changeFilter = echoFilters.change;
  const rows = [];

  for (const row of echo.rows) {
    if (ageCeiling) {
      const age = echoRowAgeSeconds(row);
      if (age != null && age > ageCeiling) continue;
    }
    if (flowFilter !== "all") {
      const net = row.flowInUsd - row.flowOutUsd;
      if (flowFilter === "in" && net <= 0) continue;
      if (flowFilter === "out" && net >= 0) continue;
    }
    if (totalFloor) {
      if (row.flowInUsd + row.flowOutUsd < totalFloor) continue;
    }
    if (peakFloor) {
      const peak = echoRowPeak(row);
      if (peak == null || peak < peakFloor) continue;
    }
    if (changeFilter !== "all") {
      const change = echoRowChange24h(row);
      if (change != null) {
        if (changeFilter === "up" && change <= 0) continue;
        if (changeFilter === "down" && change >= 0) continue;
      }
    }
    rows.push(row);
  }

  if (echoFilters.sort === "newest") {
    rows.sort((a, b) => (b.firstSeenMs ?? -Infinity) - (a.firstSeenMs ?? -Infinity));
  } else if (echoFilters.sort === "change") {
    rows.sort((a, b) => (echoRowChange24h(b) ?? -Infinity) - (echoRowChange24h(a) ?? -Infinity));
  }
  return rows;
}

/** Everything one row renders, derived from the API's own numbers and the market cache. */
export function echoRowView(row) {
  const kind = echoFilters.kind;
  const traders = row.traders;
  const change = echoRowChange24h(row);
  const ageSeconds = echoRowAgeSeconds(row);
  const entry = echoMarkets[row.address];
  const tradersLabel = traders == null ? "— traders" : `${formatCompact(traders)} traders`;

  // The metric the selected kind ranks on: the money for bought/sold, the call count for
  // talked (whose events carry no USD at all — `total_usd` comes back 0).
  /**
   * The headline is the count Echo ranked on — the same number fomo.copy puts first, titled
   * "Feed events" — with the money and the traders beneath it. Showing the USD as the headline
   * made the row disagree with every other surface in the app.
   */
  /**
   * The headline is the token's market cap, from the same OpenDEX snapshot the token page reads —
   * so the row and the page can never show different numbers. Until that snapshot lands (and for
   * `talked`, whose events carry no USD) the count Echo ranked on stands in, never a blank.
   */
  const primary = entry && entry.mcUsd > 0 ? `$${formatCompact(entry.mcUsd)}` : formatCompact(row.eventCount);
  const detail = `$${formatCompact(row.totalUsd)} · ${formatCompact(row.eventCount)} ev · ${tradersLabel}`;

  const hasFlow = row.flowInUsd > 0 || row.flowOutUsd > 0;
  const shown = row.wallets.slice(0, 3);
  const extra = traders == null ? 0 : Math.max(0, traders - shown.length);

  // The row's own timestamps, on hover: when Echo first saw the token and when it last
  // moved. The visible age is the token's own age, so the two are not the same number.
  const firstSeenAge = row.firstSeenMs == null ? "" : ageFromSeconds(Math.max(0, Math.floor((Date.now() - row.firstSeenMs) / 1000)));
  const latestEventAge = row.latestEventMs == null ? "" : ageFromSeconds(Math.max(0, Math.floor((Date.now() - row.latestEventMs) / 1000)));
  const title = [
    row.name,
    firstSeenAge ? `first seen ${firstSeenAge} ago` : "",
    latestEventAge ? `last event ${latestEventAge} ago` : ""
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    address: row.address,
    chain: row.chain ?? "solana",
    key: row.address,
    href: row.href,
    rank: `#${row.rank}`,
    name: row.name,
    title,
    logo: row.logo,
    src: row.imageUrl,
    primary,
    detail,
    /**
     * The market cap the token page will show, from the same OpenDEX snapshot, so clicking a row
     * cannot land on a different number — and the multiple since Echo first caught the token,
     * measured against the all-time-high cap the way fomo.copy does it (`ath / mcAtFirstSeen`).
     */
    mcLabel: entry && entry.mcUsd > 0 ? `$${formatCompact(entry.mcUsd)}` : "",
    mcTitle:
      entry && (entry.mcUsd > 0 || row.mcAtFirstSeen > 0)
        ? [
            entry.mcUsd > 0 ? `MC $${formatCompact(entry.mcUsd)}` : "",
            row.mcAtFirstSeen > 0 ? `first seen $${formatCompact(row.mcAtFirstSeen)}` : ""
          ]
            .filter(Boolean)
            .join(" · ")
        : "",
    multipleLabel:
      entry && entry.athMcap > 0 && row.mcAtFirstSeen > 0
        ? `${(entry.athMcap / row.mcAtFirstSeen).toFixed(1)}\u00d7`
        : "",
    multipleTitle:
      entry && entry.athMcap > 0 ? `peak $${formatCompact(entry.athMcap)} since first seen` : "",
    changeLabel: change == null ? "" : `${change > 0 ? "+" : ""}${change.toFixed(2)}%`,
    changeColor: change == null ? "" : change < 0 ? NEGATIVE : POSITIVE,
    flowLabel: hasFlow ? `in $${formatCompact(row.flowInUsd)} · out $${formatCompact(row.flowOutUsd)}` : "",
    ageLabel: ageSeconds == null ? "" : ageFromSeconds(ageSeconds),
    ageTitle:
      entry && entry.ageSeconds != null
        ? "Token age, from OpenDEX"
        : row.firstSeenMs != null
          ? "Seen by Echo at this time"
          : "",
    wallets: shown.map((wallet) => ({
      address: wallet.address,
      label: wallet.handle || shortAddress(wallet.address),
      letter: (wallet.handle || wallet.address || "?").replace(/^@/, "").charAt(0).toUpperCase() || "?",
      imageUrl: wallet.imageUrl
    })),
    extraLabel: extra > 0 ? `+${formatCompact(extra)}` : "",
    extraTitle: extra > 0 ? `${formatCompact(traders)} traders moved this window` : ""
  };
}

/** A short line for the status strip above the rows. `now` is the caller's clock reading. */
export function echoStatusLabel(now = Date.now()) {
  if (echo.streamState === "connecting") return "Connecting…";
  if (echo.streamState === "reconnecting") return "Reconnecting…";
  if (echo.streamState === "closed") return "Paused";
  const seconds = echo.lastSnapshotAt ? Math.max(0, Math.round((now - echo.lastSnapshotAt) / 1000)) : null;
  if (seconds == null) return "Live";
  return `Live · ${seconds}s ago`;
}

/** The ranked-by the envelope's meta reports, for the status strip's title. */
export function echoMetaTitle() {
  const meta = echo.meta;
  if (!meta) return "";
  const from = meta.from ? new Date(meta.from).toLocaleTimeString() : "";
  const to = meta.to ? new Date(meta.to).toLocaleTimeString() : "";
  return `${meta.kind ?? ""} · ${meta.period ?? ""} · ranked by ${meta.ranked_by ?? "events"} · ${from}–${to}`;
}
