import { getAuthToken, getAuthWallet, onAuthTokenChange } from "../auth.svelte.js";
import { avatarUrl, tokenImage } from "./config.js";
import { createCoalescer } from "../utils/coalesce.js";
import { subscribe, unsubscribe } from "../ws/client.js";
import { api } from "./client.js";
import { ageFromSeconds, formatCompact, formatPrice, formatUsd } from "./token.svelte.js";
import { formatPnlValue, shortAddress } from "./leaderboard.svelte.js";

/**
 * One wallet's profile page — the trades and holdings behind `/profile/{wallet}`.
 *
 * Everything on the page comes from the trader analytics endpoints, read the way Ombra's
 * trader drawer reads them, plus the thesis feed for the pinned card:
 *   - identity, balance, stats and the 90-day PnL series — `GET /v2/traders/{chain}/{wallet}`
 *   - positions (the table and the top-trade strip) — `GET …/tokens`
 *   - swaps — `GET …/swaps`
 *   - the pinned thesis — `GET /v2/wallets/thesis?labels={label}`, the author's label,
 *     which is the only author filter that endpoint offers
 *   - cash and the follow rail — the authenticated user's own page only
 *
 * Each trader read is seeded over REST and then kept live on its own topic
 * (`traders:{chain}:{wallet}:overview|tokens|swaps`), the same seed-then-socket shape the
 * discovery lists use. A frame carries the newest window, so it replaces the first page
 * and leaves any pages loaded underneath in place, deduped on the field that identifies a
 * row.
 *
 * The wallet is the identity here. A labeled wallet — FOMO, Pump.fun or KOL — also gets
 * its name, @handle and photo, and its label is what fetches the thesis.
 */

const CHAIN = "SOL";
/** The window every trader read uses: the widest the API offers. */
const TRADER_RANGE = "NINETY_DAY";
/** Positions the strip ranks; the capture's strip is five cards. */
const STRIP_TRADES = 5;
/** Rail rows the capture's follow rail shows. */
const RAIL_TRADERS = 10;

/**
 * The follow rail's list, kept across refreshes. It is a public ranking, not account data, so a
 * stored copy can paint the rail the instant the page opens while the fresh one is on its way.
 */
const RAIL_CACHE_KEY = "ombra_follow_rail";
const RAIL_CACHE_VERSION = 1;

function readRailCache() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RAIL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed?.version === RAIL_CACHE_VERSION && Array.isArray(parsed.rows) ? parsed.rows : [];
  } catch {
    return [];
  }
}

function writeRailCache(rows) {
  if (typeof localStorage === "undefined" || rows.length === 0) return;
  try {
    localStorage.setItem(RAIL_CACHE_KEY, JSON.stringify({ version: RAIL_CACHE_VERSION, rows }));
  } catch {
    // a full or private store is no reason to fail a fetch
  }
}


/** Pages of positions and swaps kept, so a long page cannot grow without bound. */
const MAX_PAGES = 5;
const RETRY_MS = 3_000;

const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";

let wallet = $state("");
let overview = $state.raw(null);
let positions = $state.raw([]);
let swaps = $state.raw([]);
let thesis = $state.raw(null);
let cash = $state.raw(null);
let viewerCash = $state.raw(null);
let railTraders = $state.raw(readRailCache());
let loading = $state(false);
let error = $state("");
/** Per-topic read failures, so a panel can say it could not load rather than show empty. */
let failed = $state.raw({ overview: false, tokens: false, swaps: false });
/** Every wallet address the signed-in user owns, managed or connected. */
let ownWallets = $state.raw([]);

/** Non-reactive plumbing: one entry per trader topic. */
const plumbing = {
  overview: { wsKey: null, frames: null, retryTimer: null },
  tokens: { wsKey: null, frames: null, retryTimer: null },
  swaps: { wsKey: null, frames: null, retryTimer: null }
};

let positionCursor = null;
let positionPages = 1;
let swapCursor = null;
let swapPages = 1;
/** The swaps page that failed. A cursor the server rejects is never asked for again. */
let failedSwapCursor = null;
/** The wallet a read belongs to, so a slow one cannot paint over a newer one. */
let wanted = "";
/** Live while a profile is open: the session changing changes what "own" means. */
let authWatcher = null;

/** `Dw3LY8…PNb1`: the capture's own shortening, with its single ellipsis. */
export function shortWallet(address) {
  if (!address || address.length < 12) return address ?? "";
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

/** The wallet's primary label, or null when it carries none. */
function primaryLabel() {
  return (overview?.labels ?? [])[0] ?? null;
}

/**
 * The header's identity. A labeled wallet shows its label as the name and its platform
 * handle on the line under it; a bare wallet shows its shortened address in both places.
 */
export function profileIdentity() {
  const label = primaryLabel();
  const handle = label ? (label.handle ?? label.label) : shortWallet(wallet);
  return {
    wallet,
    name: label?.label ?? shortWallet(wallet),
    /** The @handle line: the platform handle, or the wallet when there is none. */
    handle: `@${handle}`,
    /** What the thesis lookup addresses. */
    labelValue: label?.label ?? null,
    avatar: avatarUrl(label?.photoId),
    /** The wallet itself, drawn beside the handle once there is a label to show. */
    walletShort: shortWallet(wallet),
    hasLabel: !!label
  };
}

export function isOwnProfile() {
  if (!wallet) return false;
  if (getAuthWallet() === wallet) return true;
  // The app's wallets count as yours too: the page is keyed by the wallet the app trades
  // from, while the session is keyed by the one that signed in.
  return ownWallets.some((held) => held.address === wallet);
}

export function isProfileLoading() {
  return loading;
}

/** Whether the wallet's trader read has landed, which is what the chips and strip wait on. */
export function hasOverview() {
  return !!overview;
}

export function getProfileError() {
  return error;
}

/** True when a panel's own read failed, so it can say so instead of showing an empty list. */
export function panelFailed(topic) {
  return !!failed[topic];
}

/** The 90 daily cumulative-PnL points the portfolio chart draws, oldest first. */
export function pnlPoints() {
  const series = overview?.pnlSparkline?.pnlUsd ?? [];
  const start = overview?.pnlSparkline?.startsAtTimestamp ?? 0;
  const step = overview?.pnlSparkline?.intervalSeconds ?? 86_400;
  const points = [];
  for (let i = 0; i < series.length; i++) {
    const value = Number(series[i]);
    if (!Number.isFinite(value)) continue;
    points.push({ time: Math.floor((start + i * step) / 1000), value });
  }
  return points;
}

/** How many daily points each captured tab covers. */
export const RANGE_DAYS = { "24H": 1, "7D": 7, "30D": 30, ALL: 90 };

/** The panel's figures for one tab: what the series ends on, and what the window added. */
export function pnlForRange(label) {
  const points = pnlPoints();
  if (!points.length) return { total: 0, change: 0, points: [] };
  const days = RANGE_DAYS[label] ?? 30;
  const from = Math.max(0, points.length - 1 - days);
  const total = points[points.length - 1].value;
  return { total, change: total - points[from].value, points: points.slice(from) };
}

/** `$8,415,421` and `.38` — the panel draws the cents a size smaller. */
export function splitUsd(value) {
  const num = Number(value) || 0;
  const text = Math.abs(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const [int, frac] = text.split(".");
  return { int: `${num < 0 ? "-" : ""}$${int}`, frac: `.${frac}` };
}

/** `+$1,454,633.16` / `-$480.00`, with the ink that goes with it. */
export function signedUsd(value) {
  const num = Number(value) || 0;
  return { text: `${num < 0 ? "-" : "+"}${formatPnlValue(num)}`, color: pnlInk(num >= 0) };
}

export function pnlInk(up) {
  return up ? POSITIVE : NEGATIVE;
}

/** The wallet's cash: the USD stablecoin it holds, which is what fomo calls cash. */
export function getCash() {
  return cash;
}

/** The cash of whoever is reading, for the send rail on somebody else's profile. */
export function getViewerCash() {
  return viewerCash;
}

/** `6d 21h` — the mean holding time of the positions loaded, or "" when none carry one. */
export function averageHold() {
  const held = positions.filter((p) => Number.isFinite(p.holdingDurationSeconds));
  if (!held.length) return "";
  const mean = held.reduce((sum, p) => sum + p.holdingDurationSeconds, 0) / held.length;
  const minutes = Math.floor(mean / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/** `2.8K trades` / `1 trade` — the capture's own count and plural. */
export function tradesLabel() {
  const count = Number(overview?.stats?.tradeCount ?? 0);
  return `${formatCompact(count)} trade${count === 1 ? "" : "s"}`;
}

function usdCompact(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "$0";
  return `$${formatCompact(num)}`;
}

/** `$0.0<sub>3</sub>5876` — the price cell's own split, as the capture stores it. */
function splitPrice(value) {
  const formatted = formatPrice(value);
  const subscript = formatted.match(/^([^<]*)<sub>(\d+)<\/sub>(.*)$/);
  if (subscript) return { prefix: subscript[1], sub: subscript[2], suffix: subscript[3] };
  return { prefix: "", sub: null, suffix: formatted };
}

/** The capture writes a percentage unsigned and lets the arrow carry the direction. */
function pct(value) {
  const num = Math.abs(Number(value ?? 0));
  return `${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

/** A price cell, left empty where the API reports no price rather than a zero. */
function priceOrEmpty(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num) || num === 0) return "";
  return formatPrice(value);
}

/**
 * One position as the table's row. An open position answers with its unrealized PnL —
 * nothing is realized until it is sold — and a closed one with the realized figure.
 */
function positionRow(p) {
  const open = p.status === "ACTIVE";
  const pnl = Number(open ? (p.unrealizedProfitUsd ?? 0) : (p.profitUsd ?? 0));
  const profitPct = Number(open ? (p.unrealizedProfitPct ?? 0) : (p.profitPct ?? 0));
  const up = pnl >= 0;
  const symbol = p.tokenSymbol ?? "";
  return {
    key: p.tokenAddress,
    href: `/tokens/solana/${p.tokenAddress}`,
    img: tokenImage(CHAIN, p.tokenAddress),
    verified: true,
    ticker: symbol,
    sub: `${formatCompact(p.remainingTokensStr)}${symbol}`,
    mcapTag: usdCompact(p.currentMarketCapUsdStr),
    mcap: usdCompact(p.currentMarketCapUsdStr),
    price: splitPrice(p.currentPriceUsdStr),
    value: formatUsd(p.balanceUsdStr),
    amount: `${formatCompact(p.totalTokensStr)}${symbol}`,
    up,
    sign: up ? "+" : "-",
    pnl: formatPnlValue(pnl),
    pct: pct(profitPct),
    mobPct: pct(profitPct),
    invested: formatUsd(p.boughtUsdStr),
    entry: priceOrEmpty(p.avgCostBoughtStr),
    exit: priceOrEmpty(p.avgCostSoldStr),
    time: ageFromSeconds(p.holdingDurationSeconds),
    timeTitle: ""
  };
}

function positionRows(status) {
  return positions.filter((p) => p.status === status).map(positionRow);
}

export function openPositions() {
  return positionRows("ACTIVE");
}

export function closedPositions() {
  return positionRows("PAUSED");
}

/** How many positions the read returned, for the panel's title. */
export function positionCount() {
  return positions.length;
}

export function hasMorePositions() {
  return !!positionCursor && positionPages < MAX_PAGES;
}

/** The strip's five cards: the positions the wallet made the most on. */
export function topTrades() {
  return [...positions]
    .sort((a, b) => Number(b.profitUsd ?? 0) - Number(a.profitUsd ?? 0))
    .slice(0, STRIP_TRADES)
    .map((p, i) => {
      const pnl = Number(p.profitUsd ?? 0);
      const up = pnl >= 0;
      return {
        key: p.tokenAddress,
        rank: i + 1,
        href: `/tokens/solana/${p.tokenAddress}`,
        img: tokenImage(CHAIN, p.tokenAddress),
        ticker: p.tokenSymbol ?? "",
        sign: up ? "+" : "-",
        value: formatPnlValue(pnl),
        up,
        pct: pct(p.profitPct),
        color: pnlInk(up)
      };
    });
}

let timeFormatter = null;
function fullDateTime(timestamp) {
  if (!timestamp) return "";
  timeFormatter ??= new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  return timeFormatter.format(new Date(timestamp));
}

function swapRow(s, index, total) {
  const up = s.side !== "SELL";
  return {
    pos: index + 1,
    setsize: total,
    index,
    y: `${index * 40}px`,
    // A transaction can carry more than one swap, so txHash + side + time is not unique —
    // the row's slot in this virtual list is what makes the key one.
    key: `${s.txHash}-${s.side}-${s.timestamp}-${index}`,
    href: `/tokens/solana/${s.token?.address}`,
    img: tokenImage(CHAIN, s.token?.address),
    verified: true,
    ticker: s.token?.symbol ?? "",
    action: up ? "Buy" : "Sell",
    up,
    amount: formatUsd(s.amountUsdStr),
    mcap: `${usdCompact(s.marketCapUsdStr)} MC`,
    time: ageFromSeconds(s.ageSeconds),
    timeTitle: fullDateTime(s.timestamp)
  };
}

/** The swaps card's rows; the capture's Buys / Sells tabs filter the same list. */
export function swapRows(tab = "all") {
  const list = swaps.filter((s) =>
    tab === "buys" ? s.side !== "SELL" : tab === "sells" ? s.side === "SELL" : true
  );
  return list.map((s, index) => swapRow(s, index, list.length));
}

export function hasMoreSwaps() {
  return !!swapCursor && swapPages < MAX_PAGES;
}

/** The pinned thesis card: the author's newest post, with its text and likes. */
export function getThesis() {
  return thesis;
}

export function getRailTraders() {
  return railTraders;
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

async function fetchOverview() {
  const { data, error: responseError, response } = await api.GET("/v2/traders/{chain}/{walletAddress}", {
    params: { path: { chain: CHAIN, walletAddress: wallet }, query: { timeRange: TRADER_RANGE } }
  });
  if (responseError) throw new ReadError("trader overview failed", response?.status);
  return data ?? null;
}

/** A failed read, carrying the status so "no data" can be told from "not answered". */
class ReadError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function fetchPositions(cursor) {
  const { data, error: responseError, response } = await api.GET("/v2/traders/{chain}/{walletAddress}/tokens", {
    params: {
      path: { chain: CHAIN, walletAddress: wallet },
      query: { timeRange: TRADER_RANGE, ...(cursor ? { cursor } : {}) }
    }
  });
  if (responseError) throw new ReadError("trader positions failed", response?.status);
  return data ?? null;
}

async function fetchSwaps(cursor) {
  const { data, error: responseError, response } = await api.GET("/v2/traders/{chain}/{walletAddress}/swaps", {
    params: { path: { chain: CHAIN, walletAddress: wallet }, query: cursor ? { cursor } : {} }
  });
  if (responseError) throw new ReadError("trader swaps failed", response?.status);
  return data ?? null;
}

/** The author's theses, by label — the only author filter the thesis feed offers. */
async function fetchThesisForLabel(label) {
  const { data, error: responseError } = await api.GET("/v2/wallets/thesis", {
    params: { query: { chain: CHAIN, labels: [label] } }
  });
  if (responseError) return null;
  const post = (data?.theses ?? [])[0];
  if (!post) return null;
  return {
    tokenAddress: post.token?.address ?? null,
    href: post.token?.address ? `/tokens/solana/${post.token.address}` : "",
    ticker: post.token?.symbol ?? "",
    img: post.token?.address ? tokenImage(CHAIN, post.token.address) : "",
    text: post.text ?? "",
    likes: String(post.likes ?? 0),
    verified: !!post.token?.address
  };
}

/**
 * The signed-in user's wallets, which is also how we know a page is their own. `appWallets`
 * are the wallets the app manages (where the cash and the trading are); `connectedWallets`
 * are external ones the reader signed in with, which Ombra never reads and which only count
 * here as "this page is yours" — never as a balance.
 */
async function loadOwnWallets() {
  if (!getAuthToken()) return [];
  const { data, error: responseError } = await api.GET("/v2/user/wallets");
  if (responseError || !data) return [];
  const managed = Object.values(data.appWallets ?? {}).map((wallet) => ({ ...wallet, kind: "managed" }));
  const connected = (data.connectedWallets ?? []).map((wallet) => ({ ...wallet, kind: "connected" }));
  return [...managed, ...connected];
}

/**
 * The wallet's cash. Only the signed-in user's own wallets carry a per-asset breakdown,
 * so this answers on your own profile and stays empty on somebody else's.
 */
function fiatOf(held) {
  const fiat = held ? (held.assets ?? []).find((asset) => asset.isFiat) : null;
  return fiat ? { value: formatUsd(fiat.valueUsdStr) } : null;
}

function cashFromWallets(wallets) {
  const managed = wallets.filter((w) => w.kind === "managed");
  return fiatOf(managed.find((w) => w.address === wallet) ?? managed[0]);
}

/** The reader's own cash: the app wallet they trade from, which is what they can spend. */
function viewerCashFromWallets(wallets) {
  return fiatOf(wallets.find((w) => w.kind === "managed") ?? wallets[0]);
}

/** The follow rail, on your own profile: the top labeled traders on this chain. */
async function fetchRailTraders() {
  const { data, error: responseError } = await api.GET("/v2/traders/ranking", {
    params: { query: { chain: CHAIN, timeRange: "THIRTY_DAY", sources: "FOMO" } }
  });
  if (responseError || !data) return [];
  return (data.items ?? []).slice(0, RAIL_TRADERS).map((item) => {
    const label = (item.labels ?? [])[0] ?? null;
    return {
      href: `/profile/${item.walletAddress}`,
      img: avatarUrl(label?.photoId) ?? "",
      color: null,
      name: label?.label ?? shortAddress(item.walletAddress),
      handle: `@${label?.handle ?? label?.label ?? shortAddress(item.walletAddress)}`
    };
  });
}

/* ------------------------------------------------------------------ *
 * Live windows
 * ------------------------------------------------------------------ */

/** The live window's rows first, then whatever the older pages added. */
function prependUnique(current, incoming, keyOf) {
  const seen = new Set();
  const out = [];
  for (const item of incoming) {
    const key = keyOf(item);
    if (!item || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  for (const item of current) {
    const key = keyOf(item);
    if (!item || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** A further page appends to what is already listed. */
function appendUnique(current, incoming, keyOf) {
  const seen = new Set();
  const out = [];
  for (const item of [...current, ...incoming]) {
    const key = keyOf(item);
    if (!item || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

const tokenKey = (item) => item?.tokenAddress;
const swapKey = (item) => (item ? `${item.txHash}-${item.side}-${item.timestamp}` : "");

function makeFrames(topic) {
  return createCoalescer(
    (batch) => {
      for (const { event, data } of batch) {
        if (topic === "overview" && event === "TRADER_OVERVIEW" && data) {
          overview = data;
        } else if (topic === "tokens" && event === "TRADER_TOKEN_PNL" && data?.items) {
          positions = prependUnique(positions, data.items, tokenKey);
        } else if (topic === "swaps" && event === "TRADER_SWAPS" && data?.swaps) {
          swaps = prependUnique(swaps, data.swaps, swapKey);
        }
      }
    },
    { maxBatch: 40 }
  );
}

const TOPIC_PARAMS = {
  overview: () => ({ timeRange: TRADER_RANGE }),
  tokens: () => ({ timeRange: TRADER_RANGE }),
  swaps: () => ({})
};

function openSubscription(topic) {
  const state = plumbing[topic];
  if (state.wsKey) unsubscribe(state.wsKey);
  state.frames.clear();
  state.wsKey = subscribe(
    `traders:${CHAIN}:${wallet}:${topic}`,
    (event, data) => {
      state.frames.push({ event, data });
    },
    TOPIC_PARAMS[topic](),
    { recovery: "resubscribe" }
  );
}

/**
 * Seed one topic and put it on its socket. A failure leaves the retry timer to ask again:
 * the socket alone cannot seed a window, so without a page there is nothing to keep live.
 */
async function seedTopic(topic) {
  const state = plumbing[topic];
  if (state.retryTimer) {
    clearTimeout(state.retryTimer);
    state.retryTimer = null;
  }
  const mine = wanted;

  // The rail is not awaited and not part of the profile's critical path: the stored list has already
  // painted, and this replaces it when it lands. Any profile, not only your own — it is a public
  // ranking, the same one everywhere.
  void fetchRailTraders().then((rows) => {
    if (rows.length === 0) return;
    railTraders = rows;
    writeRailCache(rows);
  });

  try {
    failed = { ...failed, [topic]: false };
    if (topic === "overview") {
      const next = await fetchOverview();
      if (wanted !== mine) return;
      if (next) overview = next;
    } else if (topic === "tokens") {
      const next = await fetchPositions(null);
      if (wanted !== mine) return;
      positions = next?.items ?? [];
      positionCursor = next?.nextCursor ?? null;
      positionPages = 1;
    } else {
      const next = await fetchSwaps(null);
      if (wanted !== mine) return;
      swaps = next?.swaps ?? [];
      swapCursor = next?.nextCursor ?? null;
      swapPages = 1;
      failedSwapCursor = null;
  failedSwapCursor = null;
    }
    openSubscription(topic);
  } catch (cause) {
    if (wanted !== mine) return;
    failed = { ...failed, [topic]: true };
    // A not-found is an answer — the wallet has no trading in this window — and a
    // rejected address never becomes valid, so neither is worth asking again for.
    if (cause?.status === 404 || cause?.status === 400) return;
    state.retryTimer = setTimeout(() => {
      state.retryTimer = null;
      if (wanted === mine) void seedTopic(topic);
    }, RETRY_MS);
  }
}

/** The next page of positions, appended to what is already listed. */
export async function loadMorePositions() {
  if (!positionCursor || positionPages >= MAX_PAGES) return;
  const mine = wanted;
  const cursor = positionCursor;
  try {
    const next = await fetchPositions(cursor);
    if (wanted !== mine) return;
    positions = appendUnique(positions, next?.items ?? [], tokenKey);
    positionCursor = next?.nextCursor ?? null;
    positionPages += 1;
  } catch {
    /* the list keeps what it has; the next scroll tries again */
  }
}

/** The next page of swaps, appended the same way. */
export async function loadMoreSwaps() {
  if (!swapCursor || swapCursor === failedSwapCursor || swapPages >= MAX_PAGES) return;
  const mine = wanted;
  const cursor = swapCursor;
  try {
    const next = await fetchSwaps(cursor);
    if (wanted !== mine) return;
    swaps = appendUnique(swaps, next?.swaps ?? [], swapKey);
    swapCursor = next?.nextCursor ?? null;
    swapPages += 1;
  } catch {
    // the rail keeps what it has, and the page the server refused is not asked for again
    failedSwapCursor = cursor;
  }
}

/**
 * Re-read what the session decides while a profile is open: which wallets are yours (the
 * variant the header draws), the cash in the app wallet, and the follow rail that only your
 * own profile carries. Landing on a profile before signing in is the case this exists for —
 * the first read finds no session and would otherwise answer "somebody else's" for good.
 */
async function refreshOwnWallets() {
  const mine = wanted;
  if (!mine) return;
  ownWallets = await loadOwnWallets();
  if (wanted !== mine) return;
  cash = cashFromWallets(ownWallets);
  viewerCash = viewerCashFromWallets(ownWallets);
  if (isOwnProfile()) {
    // Fired without awaiting, and always: the stored list has already painted, and this refresh
    // replaces it when it lands. Holding the profile behind this request is what made a refresh
    // feel like it took forever.
    void fetchRailTraders().then((rows) => {
      if (rows.length === 0) return;
      railTraders = rows;
      writeRailCache(rows);
    });
  }
}

export async function startProfile(nextWallet) {
  if (!nextWallet || wanted === nextWallet) return;
  stopProfile();
  wanted = nextWallet;
  wallet = nextWallet;
  loading = true;
  error = "";

  if (!authWatcher) authWatcher = onAuthTokenChange(() => { void refreshOwnWallets(); });

  const mine = wanted;
  try {
    ownWallets = await loadOwnWallets();
    if (wanted !== mine) return;
    cash = cashFromWallets(ownWallets);
    viewerCash = viewerCashFromWallets(ownWallets);
    // The overview comes first: it carries the label the thesis lookup needs.
    await seedTopic("overview");
    if (wanted !== mine) return;
    const identity = profileIdentity();
    const label = identity.labelValue;
    // The identity is everything the page needs to draw, so it stops loading here and the topics
    // below fill their own cards in as they arrive. Waiting for them is what kept the whole profile
    // on skeletons even when the header was ready.
    loading = false;
    void Promise.all([
      seedTopic("tokens"),
      seedTopic("swaps"),
      label
        ? fetchThesisForLabel(label).then((found) => {
            if (wanted === mine) thesis = found;
          })
        : Promise.resolve()
      // The rail is deliberately not here either: it is fired above without being awaited.
    ]);
    if (wanted !== mine) return;
    // A wallet with no trading in the window answers not-found: the page still stands,
    // with the identity it does have. A read that was never answered says so instead.
    if (!overview) {
      error = panelFailed("overview") ? "Couldn't load this profile" : "No trading data for this wallet";
    }
  } catch {
    if (wanted === mine) error = "Could not load this profile";
  } finally {
    if (wanted === mine) loading = false;
  }
}

export function stopProfile() {
  if (authWatcher) {
    authWatcher();
    authWatcher = null;
  }
  for (const topic of Object.keys(plumbing)) {
    const state = plumbing[topic];
    if (state.wsKey) unsubscribe(state.wsKey);
    state.wsKey = null;
    if (state.retryTimer) clearTimeout(state.retryTimer);
    state.retryTimer = null;
    state.frames.clear();
  }
  wanted = "";
  wallet = "";
  failed = { overview: false, tokens: false, swaps: false };
  overview = null;
  positions = [];
  swaps = [];
  thesis = null;
  cash = null;
  viewerCash = null;
  // The rail is a public ranking, not account data: it is re-seeded from storage rather than
  // emptied, so opening a profile paints it at once instead of waiting on the ranking request.
  railTraders = readRailCache();
  ownWallets = [];
  positionCursor = null;
  positionPages = 1;
  swapCursor = null;
  swapPages = 1;
  loading = false;
}

for (const topic of Object.keys(plumbing)) {
  plumbing[topic].frames = makeFrames(topic);
}
