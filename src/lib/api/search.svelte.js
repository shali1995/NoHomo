import { api } from "./client.js";
import { subscribe, unsubscribe } from "../ws/client.js";
import { tokenImage } from "./config.js";
import { chainSlug } from "../routes.js";
import { formatChangePct, formatUsdCompact, splitPrice } from "./trending.svelte.js";

/**
 * The top bar's token search.
 *
 * `GET /v2/scanner/tokens/search?query=` returns `ScannerItem`s — the same shape the
 * scanner and the trending panel already speak — so the cells are built with the same
 * helpers those use. Ombra searches the same way and then keeps the hits live on the
 * `scanner:lookup` topic (`Navbar.svelte`), which is what the socket here is for: the
 * subscription carries the found pairs, and its snapshot/update frames patch the rows
 * in place, so a result's price and market cap move while the list is on screen.
 */
const MIN_QUERY = 2;
/** Long enough to swallow a burst of typing, short enough to feel immediate. */
const DEBOUNCE_MS = 180;
/** The capture's list held 20 rows; the endpoint paginates, and one page is plenty. */
export const SEARCH_ROWS = 20;

const UP = "\u25b2";
const DOWN = "\u25bc";
const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";

let rows = $state.raw([]);
let loading = $state(false);
let error = $state("");
let generation = 0;
let debounceTimer = null;
let wsKey = null;
/** The pairs the live lookup is currently subscribed to, so it is only re-opened on change. */
let subscribedPairs = [];
/** Which chain each pair belongs to: one search spans chains, and the lookup wants both. */
let pairChains = new Map();

/** The capture's contract cell: six characters either side of the ellipsis. */
function shortContract(address) {
  const value = String(address ?? "");
  if (value.length <= 13) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

/** A `ScannerItem` as the capture's search row. */
export function searchRowFromItem(token) {
  const timeframes = token.stats?.timeframes ?? {};
  // Search shows the 24h window, where the trending panel shows the 1h it ranks on.
  const day = timeframes["24h"] ?? {};
  const change = typeof day.priceChangePct === "string" ? parseFloat(day.priceChangePct) : day.priceChangePct;
  const up = !Number.isNaN(change) && (change ?? 0) >= 0;
  const price = splitPrice(token.quote?.priceUsdStr);

  return {
    href: `/tokens/${chainSlug(token.chain)}/${token.tokenAddress}`,
    // A token trading on two venues comes back twice with one token address, so the
    // pair is what identifies a row.
    pairAddress: token.pairAddress,
    name: token.tokenSymbol ?? "",
    description: token.tokenName ?? "",
    contract: shortContract(token.tokenAddress),
    logo: tokenImage(token.chain, token.tokenAddress),
    network: chainSlug(token.chain),
    marketCap: formatUsdCompact(token.quote?.marketCapUsdStr),
    priceLead: price.pricePrefix,
    priceSub: price.sub,
    priceRest: price.priceSuffix,
    changeArrow: up ? UP : DOWN,
    changeValue: formatChangePct(change),
    changeColor: up ? POSITIVE : NEGATIVE,
    volume: formatUsdCompact(day.volumeStr),
    hasX: Boolean(token.socials?.links?.twitter?.url),
    hasStar: Boolean(token.isFavourited)
  };
}

export function getSearchRows() {
  return rows;
}

export function isSearchLoading() {
  return loading;
}

export function getSearchError() {
  return error;
}

/** Patch the live frames onto the rows already drawn, keyed by pair. */
function applyLookup(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const byPair = new Map(items.map((item) => [item.pairAddress, item]));
  let changed = false;
  const next = rows.map((row) => {
    const item = byPair.get(row.pairAddress);
    if (!item) return row;
    const fresh = searchRowFromItem(item);
    changed = true;
    return fresh;
  });
  if (changed) rows = next;
}

function openLookup() {
  const pairs = rows.map((row) => row.pairAddress).filter(Boolean);
  if (pairs.length === 0) {
    closeLookup();
    return;
  }
  // Re-subscribing on every keystroke would drop and rebuild the socket room; the pair
  // set only matters when it actually changed.
  if (wsKey && pairs.length === subscribedPairs.length && pairs.every((p, i) => p === subscribedPairs[i])) {
    return;
  }
  closeLookup();
  subscribedPairs = pairs;
  wsKey = subscribe(
    "scanner:lookup",
    (event, data) => {
      if (event === "SCANNER_TOKENS" || event === "SCANNER_UPDATE") applyLookup(data?.tokens);
    },
    {
      lookup: pairs.map((pairAddress) => ({
        chain: pairChains.get(pairAddress) ?? "SOL",
        tokenOrPairAddress: pairAddress
      }))
    },
    { recovery: "resubscribe" }
  );
}

function closeLookup() {
  if (wsKey) unsubscribe(wsKey);
  wsKey = null;
  subscribedPairs = [];
}

async function runSearch(query) {
  const mine = ++generation;
  loading = true;
  error = "";
  try {
    const { data, error: responseError } = await api.GET("/v2/scanner/tokens/search", {
      params: { query: { query } }
    });
    if (mine !== generation) return;
    if (responseError || !data) throw new Error("Search failed");
    const items = (data.tokens ?? []).slice(0, SEARCH_ROWS);
    pairChains = new Map(items.map((item) => [item.pairAddress, item.chain]));
    rows = items.map(searchRowFromItem);
    openLookup();
  } catch (cause) {
    if (mine !== generation) return;
    rows = [];
    closeLookup();
    error = cause instanceof Error ? cause.message : "Search failed";
  } finally {
    if (mine === generation) loading = false;
  }
}

/** Type-to-search: debounced, and only the newest query may write. */
export function searchTokens(query) {
  const trimmed = String(query ?? "").trim();
  if (debounceTimer) clearTimeout(debounceTimer);
  if (trimmed.length < MIN_QUERY) {
    generation++;
    rows = [];
    loading = false;
    error = "";
    closeLookup();
    return;
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runSearch(trimmed);
  }, DEBOUNCE_MS);
}

/** The box closed: drop the rows and the live room with them. */
export function stopSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;
  generation++;
  rows = [];
  loading = false;
  error = "";
  pairChains = new Map();
  closeLookup();
}
