import { api } from "./client.js";
import { avatarUrl, tokenImage } from "./config.js";
import { subscribe } from "../ws/client.js";

/**
 * The left panel's Feed view, live from the two OpenDEX feeds whose cards the capture
 * recorded:
 *
 *   - swaps  — `GET /v2/wallets/feed`      (`LabeledWalletSwap`)  -> the Buy/Sell card
 *   - theses — `GET /v2/wallets/thesis`    (`ThesisItem`)         -> the Thesis card
 *
 * Both are read the way Ombra reads them (`SwapFeedPanel.svelte`,
 * `ThesisFeedPanel.svelte`): REST seeds a page, the socket prepends, and the REST
 * params repeat on the subscription.
 *
 * The capture's third card — the pinned fomo `announce` post — has no endpoint in the
 * spec and nothing in Ombra, so it is not produced here.
 *
 * The `class` / `style` strings on each row are the capture's own, lifted from
 * `feed.json` because `FeedRow` reads them off the row object. Only values are live.
 */

/** Both feeds are asked for the same page size; the panel caps its rendered rows. */
const SWAP_LIMIT = 100;
const THESIS_LIMIT = 100;
const HISTORY_MINUTES = 10;

/** Live ceilings, so a long-lived session cannot grow the arrays without bound. */
const MAX_SWAPS = 100;
const MAX_THESES = 100;

/** Rows the panel renders, matching the capture's 12. */
export const FEED_ROWS = 12;

/**
 * Filters the panel currently applies. These are defaults for now — the same values
 * become the UI's controls later, so they live in one place rather than inline.
 */
export const FEED_FILTERS = {
  minSwapUsd: 2000,
  minThesisMarketcapUsd: 500000
};

// --- class strings, as captured ------------------------------------------------

const SWAP_WRAPPER = "border-b border-bg-secondary";
const SWAP_HREF_CLASSES = "flex items-start gap-2 rounded-lg px-2 py-4";
const AVATAR_CLASSES = "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary";
const AVATAR_STYLE = "width: 24px; height: 24px; min-width: 24px; min-height: 24px;";
const THESIS_AVATAR_CLASSES = "rounded-full flex items-center justify-center shrink-0 object-cover";
const THESIS_CLASSES = "py-2.5 px-3 flex items-start gap-2 min-w-0 hover:bg-bg-secondary cursor-pointer";
const NAME_CLASSES = "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary";
const NAME_INNER_CLASSES = "min-w-0 truncate";
const BADGE_CLASSES = "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1";
const TIME_CLASSES = "text-xs text-text-tertiary shrink-0";
const TOKEN_LOGO_WRAPPER = "relative shrink-0";
const TOKEN_LOGO_WRAPPER_STYLE = "width: 20px; height: 20px;";
const TOKEN_LOGO_IMG = "rounded-full border border-bg-tertiary";
const TOKEN_LOGO_IMG_STYLE = "height: 20px; width: 20px;";
const LINE_TICKER = "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer";
const LINE_TEXT = "text-sm text-text-primary";
const LINE_MUTED = "text-sm text-text-tertiary";
const TICKER_CLASSES = "truncate min-w-0 border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer";
const TICKER_CELL = "flex items-center gap-0.5 min-w-0";
const AMOUNT_TEXT = "text-sm text-text-primary";
const AMOUNT_DOT = "shrink-0 rounded-full bg-accent-primary";
const AMOUNT_DOT_STYLE = "height: 6px; width: 6px; animation: 1.5s ease-in-out 0s infinite normal none running dot-glow-pulse;";
const AMOUNT_PCT = "flex items-center gap-0.5 text-xs text-text-tertiary";
const AMOUNT_PCT_INNER = "flex gap-0.75 items-center tabular-nums";
const AMOUNT_PCT_INNER_STYLE = "line-height: 16px;";
const QUOTE_CLASSES = "relative mt-1 text-sm font-normal leading-normal self-start text-left whitespace-pre-line wrap-break-word min-w-0 max-w-full";
const QUOTE_BAR = "absolute pointer-events-none border-l-2 border-b-2 border-bg-tertiary rounded-bl-lg";
const QUOTE_BAR_STYLE = "left: -20px; top: -22px; width: 16px; height: 32px;";
const QUOTE_BODY = "line-clamp-6";
const LIKES_WRAPPER = "flex items-center cursor-pointer h-4 min-w-4 w-auto gap-1";
const LIKES_INNER = "p-2 -m-2 active:scale-75 transition-transform duration-150";
const LIKES_SPAN = "text-xs min-w-2 transition-all text-text-tertiary";
const LOGO_BADGE_CLASSES = "absolute flex items-center justify-center";
const LOGO_BADGE_STYLE = "bottom: -2px; right: -2px;";
const LOGO_BADGE_SVG_STYLE = "width: 10px; height: 10px;";

const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";
const THESIS_BLUE = "rgb(81, 106, 246)";
const EYES_SRC = "/images/nohomo-eyes.png";

// --- value formatting ----------------------------------------------------------

/** Ombra's `shortAddress`. */
function shortAddress(address) {
  if (!address || address.length < 10) return address ?? "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** `2998.1718` -> `$2,998.17` — the capture writes these in full, two decimals. */
function formatUsd(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "$0.00";
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Ombra's `formatCompactNumber`, for the thesis market cap and change. */
function formatCompact(value) {
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

/** `4198` -> `1h`, matching Ombra's `ageFromSeconds`. */
function ageFromSeconds(seconds) {
  if (seconds === undefined || seconds === null) return "";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** The capture's `<span title="Sep 21, 2026, 9:49 PM">` tooltip. */
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

function avatarFor(labels) {
  const photo = avatarUrl(labels?.[0]?.photoId);
  if (photo) return { eyes: false, imgSrc: photo, imgClasses: "" };
  // No photo on the wallet: the capture's own placeholder, eyes on a tinted circle.
  return { eyes: true, imgSrc: EYES_SRC, imgClasses: "w-[70%] h-[70%]" };
}

// --- row mappers ---------------------------------------------------------------

/** A `LabeledWalletSwap` as the capture's swap card. */
export function swapRowFromItem(swap) {
  const isBuy = swap.side === "BUY";
  const avatar = avatarFor(swap.labels);
  const time = ageFromSeconds(swap.ageSeconds);

  return {
    type: "swap",
    id: swap.id,
    timestamp: swap.timestamp,
    // The hover card fetches by chain + address, and a live row is no different from a
    // seeded one once it carries them.
    chain: swap.chain,
    address: swap.token.address,
    walletAddress: swap.walletAddress,
    wrapperClasses: SWAP_WRAPPER,
    href: `/tokens/${swap.chain === "SOL" ? "solana" : swap.chain.toLowerCase()}/${swap.token.address}`,
    hrefClasses: SWAP_HREF_CLASSES,
    avatar: {
      eyes: avatar.eyes,
      classes: AVATAR_CLASSES,
      style: AVATAR_STYLE,
      imgClasses: avatar.imgClasses,
      imgSrc: avatar.imgSrc
    },
    name: { classes: NAME_CLASSES, innerClasses: NAME_INNER_CLASSES, text: swap.labels?.[0]?.label ?? shortAddress(swap.walletAddress) },
    badge: {
      classes: BADGE_CLASSES,
      style: `color: ${isBuy ? POSITIVE : NEGATIVE}; background-color: ${isBuy ? "rgba(33, 201, 94, 0.2)" : "rgba(255, 98, 46, 0.2)"};`,
      text: isBuy ? "Buy" : "Sell"
    },
    time: { classes: TIME_CLASSES, text: time, title: fullDateTime(swap.timestamp) },
    tokenLogo: {
      wrapperClasses: TOKEN_LOGO_WRAPPER,
      wrapperStyle: TOKEN_LOGO_WRAPPER_STYLE,
      img: {
        src: tokenImage(swap.chain, swap.token.address),
        classes: TOKEN_LOGO_IMG,
        style: TOKEN_LOGO_IMG_STYLE
      },
      badge: null
    },
    // Amount only. The capture also showed `at $… MC`, but this endpoint's token
    // object carries no market cap or price, so those cells are not emitted.
    line: [
      { classes: LINE_TICKER, style: "", text: swap.token.symbol ?? shortAddress(swap.token.address) },
      { classes: LINE_TEXT, style: "", text: formatUsd(swap.amountUsdStr ?? swap.amountUsd) }
    ]
  };
}

/** A `ThesisItem` as the capture's thesis card. */
export function thesisRowFromItem(thesis) {
  const avatar = avatarFor(thesis.labels);
  const marketcap = parseFloat(thesis.marketcapUsd ?? "");
  const hasMarketcap = !isNaN(marketcap) && marketcap > 0;
  const symbol = thesis.token?.symbol ?? shortAddress(thesis.token?.address);

  return {
    type: "thesis",
    id: thesis.id,
    timestamp: thesis.createdAtTimestamp,
    chain: thesis.chain,
    address: thesis.token.address,
    walletAddress: thesis.walletAddress,
    wrapperClasses: SWAP_WRAPPER,
    classes: THESIS_CLASSES,
    href: `/tokens/${thesis.chain === "SOL" ? "solana" : thesis.chain.toLowerCase()}/${thesis.token.address}`,
    avatar: {
      eyes: avatar.eyes,
      classes: THESIS_AVATAR_CLASSES,
      style: AVATAR_STYLE,
      imgClasses: avatar.imgClasses,
      imgSrc: avatar.imgSrc
    },
    name: { classes: NAME_CLASSES, innerClasses: NAME_INNER_CLASSES, text: thesis.labels?.[0]?.label ?? thesis.username ?? shortAddress(thesis.walletAddress) },
    badge: {
      classes: BADGE_CLASSES,
      style: `color: ${THESIS_BLUE}; background-color: rgba(81, 106, 246, 0.2);`,
      text: "Thesis"
    },
    time: { classes: TIME_CLASSES, text: ageFromSeconds(thesis.createdAtAgeSeconds), title: fullDateTime(thesis.createdAtTimestamp) },
    tokenLogo: {
      wrapperClasses: TOKEN_LOGO_WRAPPER,
      wrapperStyle: TOKEN_LOGO_WRAPPER_STYLE,
      img: {
        src: tokenImage(thesis.chain, thesis.token.address),
        classes: TOKEN_LOGO_IMG,
        style: TOKEN_LOGO_IMG_STYLE
      },
      badge: null
    },
    ticker: { classes: TICKER_CLASSES, text: symbol, attrs: { role: "link", tabindex: "0" } },
    tickerCell: { classes: TICKER_CELL, badge: null },
    // The capture pairs the market cap with a pulsing dot and a parenthesised change.
    // This endpoint gives the market cap only, so those two cells are not emitted.
    amount: hasMarketcap
      ? [{ kind: "text", tag: "span", classes: AMOUNT_TEXT, style: "", text: `$${formatCompact(marketcap)}` }]
      : [],
    quoteText: thesis.text ?? "",
    quote: {
      classes: QUOTE_CLASSES,
      bar: { classes: QUOTE_BAR, style: QUOTE_BAR_STYLE },
      bodyClasses: QUOTE_BODY
    },
    likes: { wrapperClasses: LIKES_WRAPPER, innerClasses: LIKES_INNER, spanClasses: LIKES_SPAN, count: String(thesis.likes ?? 0) }
  };
}

// --- store ---------------------------------------------------------------------

let swaps = $state.raw([]);
let theses = $state.raw([]);
let loading = $state(true);
let error = $state("");
let started = false;

const seen = new Set();

export function getFeedRows() {
  return [...swaps, ...theses]
    .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
    .slice(0, FEED_ROWS);
}

export function isLoading() {
  return loading;
}

export function getError() {
  return error;
}

async function loadSwaps() {
  const { data, error: responseError } = await api.GET("/v2/wallets/feed", {
    params: {
      query: {
        minutes: HISTORY_MINUTES,
        limit: SWAP_LIMIT,
        minUsd: FEED_FILTERS.minSwapUsd
      }
    }
  });
  if (responseError) throw new Error("Unable to load swaps");
  // Bare array today, `{ swaps }` planned — accept both, as Ombra does.
  const rows = Array.isArray(data) ? data : (data?.swaps ?? []);
  return rows.map(swapRowFromItem);
}

async function loadTheses() {
  const { data, error: responseError } = await api.GET("/v2/wallets/thesis", {
    params: {
      query: {
        chain: "SOL",
        minMarketcapUsd: FEED_FILTERS.minThesisMarketcapUsd
      }
    }
  });
  if (responseError) throw new Error("Unable to load theses");
  const rows = (data?.theses ?? []).slice(0, THESIS_LIMIT);
  return rows.map(thesisRowFromItem);
}

async function seed() {
  loading = true;
  error = "";
  try {
    const [swapRows, thesisRows] = await Promise.all([loadSwaps(), loadTheses()]);
    seen.clear();
    for (const row of swapRows) seen.add(row.id);
    for (const row of thesisRows) seen.add(row.id);
    swaps = swapRows.slice(0, MAX_SWAPS);
    theses = thesisRows.slice(0, MAX_THESES);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load the feed";
    swaps = [];
    theses = [];
  } finally {
    loading = false;
  }
}

function connectLive() {
  subscribe(
    "wallets:feed",
    (event, data) => {
      if (event !== "LABELED_WALLET_SWAP" || !data) return;
      // One swap or an array, either side of the backend's rollout.
      const batch = Array.isArray(data) ? data : [data];
      const fresh = [];
      for (const swap of batch) {
        if (!swap?.id || seen.has(swap.id)) continue;
        if ((swap.amountUsd ?? 0) < FEED_FILTERS.minSwapUsd) continue;
        seen.add(swap.id);
        fresh.push(swapRowFromItem(swap));
      }
      if (fresh.length) swaps = [...fresh, ...swaps].slice(0, MAX_SWAPS);
    },
    { minUsd: FEED_FILTERS.minSwapUsd },
    { onSubscribed: () => void seed(), onReconnect: () => void seed() }
  );

  subscribe(
    "wallets:thesis",
    (event, data) => {
      if (event !== "THESIS" || !data) return;
      const batch = Array.isArray(data) ? data : [data];
      const fresh = [];
      for (const thesis of batch) {
        if (!thesis?.id || seen.has(thesis.id)) continue;
        // Frames arrive on the bare topic even for a filtered subscription, so the
        // filter is re-applied here or the live rows contradict the seed.
        if ((parseFloat(thesis.marketcapUsd ?? "") || 0) < FEED_FILTERS.minThesisMarketcapUsd) continue;
        seen.add(thesis.id);
        fresh.push(thesisRowFromItem(thesis));
      }
      if (fresh.length) theses = [...fresh, ...theses].slice(0, MAX_THESES);
    },
    { chains: ["SOL"], minMarketcapUsd: FEED_FILTERS.minThesisMarketcapUsd },
    { onSubscribed: () => void seed(), onReconnect: () => void seed() }
  );
}

export function startFeed() {
  if (started) return;
  started = true;
  connectLive();
}

/** Deliberately keeps the subscription: the rows are module-level, not panel-owned. */
export function stopFeed() {}
