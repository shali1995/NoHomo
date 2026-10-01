import { api } from "./client.js";
import { tokenImage } from "./config.js";
import { chainSlug } from "../routes.js";
import { formatCompact, formatPrice } from "./token.svelte.js";

/**
 * The token hover card's values.
 *
 * The card used to render one frozen capture (`lib/token.js`), so hovering any row on
 * the feed showed the same token. It is fetched per token now, from the same endpoint the
 * token page reads (`GET /v2/token/{chain}/{address}`), which is what makes it work for a
 * row that just arrived over the socket as well as one that was seeded.
 *
 * Hovering is a gesture that repeats — the pointer crosses many rows — so results are
 * cached for a short while and a second hover paints immediately instead of waiting on
 * the network again.
 */
const TTL_MS = 30_000;

/** @type {Map<string, { at: number, card: object }>} */
const cache = new Map();

let card = $state.raw(null);
let loading = $state(false);
/** The token the current request belongs to, so a slow one cannot paint over a newer. */
let activeKey = null;

/** The capture's contract cell: six characters either side of the ellipsis. */
function shortContract(address) {
  const value = String(address ?? "");
  if (value.length <= 13) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

/** `28730.7` -> `28,730.70%`, the capture's precision, with the arrow carrying the sign. */
function percentText(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "0%";
  return `${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function cardFromToken(token, chain, address) {
  const tokenChain = token.chain ?? chain;
  const tokenAddress = token.tokenAddress ?? address;
  const timeframes = token.stats?.timeframes ?? {};
  // The capture's card prints the 24h window.
  const day = timeframes["24h"] ?? {};
  const change = Number(day.priceChangePct ?? 0);
  const up = !Number.isNaN(change) && change >= 0;

  return {
    href: `/tokens/${chainSlug(tokenChain)}/${tokenAddress}`,
    name: token.tokenName ?? token.tokenSymbol ?? "",
    network: chainSlug(tokenChain),
    logo: tokenImage(tokenChain, tokenAddress),
    marketCap: `$${formatCompact(token.quote?.marketCapUsdStr)} MC`,
    price: formatPrice(token.quote?.priceUsdStr),
    change: percentText(change),
    changeArrow: up ? "\u25b2" : "\u25bc",
    changeColor: up ? "rgb(33, 201, 94)" : "rgb(255, 98, 46)",
    stats: [
      { label: "Volume 24hr", value: `$${formatCompact(day.volumeStr)}` },
      { label: "Holders", value: formatCompact(token.holders?.holderCount ?? 0) },
      { label: "Top 10 holding", value: `${Number(token.holders?.top10Pct ?? 0).toFixed(2)}%` },
      {
        label: "Contract",
        value: shortContract(tokenAddress),
        copy: true,
        address: tokenAddress
      }
    ]
  };
}

export function getTokenCard() {
  return card;
}

export function isTokenCardLoading() {
  return loading;
}

export function clearTokenCard() {
  activeKey = null;
  card = null;
  loading = false;
}

/**
 * Fill the card for one token. A cached value paints at once, a fresh one is fetched;
 * either way only the request that is still current may write.
 */
export async function ensureTokenCard(chain, address) {
  if (!chain || !address) {
    clearTokenCard();
    return;
  }
  const key = `${chain}:${address}`;
  activeKey = key;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    card = hit.card;
    loading = false;
    return;
  }

  loading = true;
  card = null;
  try {
    const { data, error } = await api.GET("/v2/token/{chain}/{address}", {
      params: { path: { chain, address } }
    });
    if (activeKey !== key) return;
    if (error || !data) throw new Error("Unable to load this token");
    const next = cardFromToken(data, chain, address);
    cache.set(key, { at: Date.now(), card: next });
    card = next;
  } catch {
    if (activeKey !== key) return;
    card = null;
  } finally {
    if (activeKey === key) loading = false;
  }
}
