/**
 * The curated lists — crypto majors and tokenised stocks — and the OpenDEX numbers on top of them.
 *
 * The payload arrives from a file today and from an endpoint later, and it is **not** reshaped on
 * the way in: the snapshot is exactly what the future endpoint will return, so swapping the origin
 * touches one constant. Everything the app knows about a list goes through `normalise` below — the
 * components only ever see the shape it returns, so an endpoint that differs changes only that.
 */
import { api } from "./client.js";
import { formatPrice } from "./token.svelte.js";

/**
 * A price the way a person writes one: thousands grouped, two decimals — `$83,370.04`. Below a
 * dollar the app's own `formatPrice` is kept, because grouping is not the problem there; decimals
 * are. This is local to the lists, so nothing else in the app changes shape.
 */
function priceText(value) {
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1) return formatPrice(value);
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Where each list comes from. When the endpoint lands, only these two strings change. */
const SOURCES = {
  majors: "/data/majors.json",
  stocks: "/data/stocks.json"
};

/** `/v2/token/multi` resolves at most 20 tokens per request (it 400s above 25). */
const CHUNK = 20;

/** How long OpenDEX's answer is trusted before its tokens are asked for again. */
const STALE_MS = 60 * 1000;

/** How many of an asset's variants are worth asking about when its first pick is unknown. */
const VARIANT_TRIES = 3;

/** OpenDEX's answers, keyed by mint, shared between the lists. */
const byMint = new Map();

/** Bumped whenever OpenDEX answers, so the readers below re-run for a plain Map. */
let liveVersion = $state(0);

/** One refresh timer per list, alive only while that list is on screen. */
const timers = new Map();

function blank() {
  return { rows: [], loading: false, loaded: false, error: "" };
}

export const lists = $state({ majors: blank(), stocks: blank() });

/**
 * One raw asset into the app's own row.
 *
 * The row is built on the asset's **deepest variant** — the one whose `market.liquidity` is the
 * largest — because that is the market that can actually take an order. The payload's own
 * `primaryVariant` ranks by its own strategy (for the equities, redeemability first), so it is used
 * only when no variant reports any liquidity. The remaining variants follow in liquidity order,
 * because OpenDEX does not carry every wrapped, bridged or native token: when its first mint is
 * unknown the live layer walks these and the first one it knows becomes the row.
 */
function normalise(asset) {
  const variants = Array.isArray(asset?.variants) ? asset.variants : [];
  const liquidity = (variant) => Number(variant?.market?.liquidity ?? 0);
  const deepest = variants.reduce(
    (best, variant) => (liquidity(variant) > liquidity(best) ? variant : best),
    null
  );
  // the deepest market wins; with no liquidity reported anywhere, the payload's own pick stands
  const primary = deepest && liquidity(deepest) > 0 ? deepest : asset?.primaryVariant ?? variants[0] ?? {};
  const market = primary?.market ?? {};
  const fallback = asset?.canonicalMarket ?? {};
  const byLiquidity = [...variants].sort((a, b) => liquidity(b) - liquidity(a));
  const mints = [primary?.mint, ...byLiquidity.map((variant) => variant?.mint)].filter(
    (mint, index, all) => typeof mint === "string" && mint.length > 0 && all.indexOf(mint) === index
  );
  if (mints.length === 0) return null;
  return {
    key: asset.assetId ?? mints[0],
    assetId: asset.assetId ?? "",
    name: asset.name ?? primary.name ?? "",
    symbol: asset.symbol ?? primary.symbol ?? "",
    category: asset.category ?? "",
    imageUrl: asset.imageUrl ?? market.logoURI ?? "",
    issuer: primary.issuer ?? "",
    tier: primary.trustTier ?? primary.liquidityTier ?? "",
    /** How much money moved through this market in 24h, from the payload. It ranks the stocks. */
    volume24h: Number(market.volume24hUSD ?? 0) || 0,
    /** The mint the row is about: the API's pick until OpenDEX says it does not know it. */
    mint: mints[0],
    /** The mints worth asking about, in the payload's own order. */
    candidates: mints,
    tries: 0,
    /** The payload's snapshot, for the first paint — never the last word. */
    snapshot: {
      price: Number(market.price ?? fallback.price ?? 0),
      mcap: Number(market.marketCap ?? fallback.marketCap ?? 0),
      change: Number(market.priceChange24hPercent ?? fallback.priceChange24hPercent ?? 0)
    }
  };
}

/** Everything the app reads a list through. */
export function listRows(kind) {
  return lists[kind]?.rows ?? [];
}

export function isListLoading(kind) {
  return Boolean(lists[kind]?.loading);
}

export function listError(kind) {
  return lists[kind]?.error ?? "";
}

/** The price to show: OpenDEX once it has answered, the payload's snapshot until then. */
export function rowPrice(row) {
  void liveVersion;
  const live = Number(byMint.get(row?.mint)?.price ?? 0);
  if (live > 0) return priceText(live);
  const snapshot = Number(row?.snapshot?.price ?? 0);
  return priceText(snapshot);
}

/** The 24h change to show, on the same rule. */
export function rowChange(row) {
  void liveVersion;
  const live = byMint.get(row?.mint)?.change;
  const value = Number.isFinite(live) ? Number(live) : Number(row?.snapshot?.change ?? 0);
  if (!Number.isFinite(value) || value === 0) return "";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function rowChangeUp(row) {
  void liveVersion;
  const live = byMint.get(row?.mint)?.change;
  const value = Number.isFinite(live) ? Number(live) : Number(row?.snapshot?.change ?? 0);
  return value >= 0;
}

/** Read the list once, then keep it. A second call while it is held does nothing. */
export async function loadList(kind) {
  const held = lists[kind];
  if (!held || held.loading || held.loaded) return;
  held.loading = true;
  held.error = "";
  try {
    const response = await fetch(SOURCES[kind]);
    if (!response.ok) throw new Error(`List unavailable (${response.status})`);
    const payload = await response.json();
    const rows = (payload?.assets ?? [])
      .map(normalise)
      .filter(Boolean)
      // Solana itself has no market on OpenDEX — the native mint 404s and there is no wrapped
      // entry — so the majors list leaves it out rather than linking to a page with nothing behind
      // it. The payload is untouched; the client decides what it can show.
      .filter((row) => !(kind === "majors" && row.assetId === "solana"));
    // The stocks read as a 24h-volume ranking — the money that actually moved, not the size of the
    // company behind the token. The majors keep the payload's own order.
    held.rows = kind === "stocks" ? rows.slice().sort((a, b) => b.volume24h - a.volume24h) : rows;
    held.loaded = true;
  } catch (failure) {
    held.error = failure instanceof Error ? failure.message : String(failure);
  } finally {
    held.loading = false;
  }
}


/** Ask OpenDEX about one batch of mints and keep whatever it answers. */
async function askMints(mints) {
  try {
    const response = await api.GET("/v2/token/multi", {
      params: { query: { lookup: mints.map((mint) => `SOL:${mint}`) } }
    });
    for (const token of response.data?.tokens ?? []) {
      const address = token?.tokenAddress;
      if (typeof address !== "string") continue;
      byMint.set(address, {
        mcap: Number(token?.quote?.marketCapUsd ?? 0),
        change: Number(token?.stats?.timeframes?.["24h"]?.priceChangePct ?? 0),
        at: Date.now()
      });
    }
  } catch {
    // a failed batch is retried on the next refresh; the snapshot keeps the row readable
  }
}

/**
 * The live layer: market cap and 24h change per mint, from OpenDEX, in batches of twenty.
 *
 * It only knows about mints, so it does not care whether they came from a file or an endpoint —
 * which is what keeps the source swap a one-line change. Rows whose mint OpenDEX does not know
 * walk their remaining candidates, so a wrapped major can still find a tradable variant.
 */
export async function refreshListLive(kind) {
  const held = lists[kind];
  if (!held) return;
  const now = Date.now();
  const wanted = [];
  const unresolved = [];
  const seen = new Set();
  for (const row of held.rows) {
    if (!row.mint || seen.has(row.mint)) continue;
    seen.add(row.mint);
    const answered = byMint.get(row.mint);
    if (!answered) {
      wanted.push(row.mint);
      unresolved.push(row);
    } else if (now - answered.at > STALE_MS) {
      wanted.push(row.mint);
    }
  }

  for (let i = 0; i < wanted.length; i += CHUNK) {
    await askMints(wanted.slice(i, i + CHUNK));
  }

  liveVersion += 1;
}

/** Keep the list answering while its pill is on screen. */
export function startListLive(kind) {
  stopListLive(kind);
  void loadList(kind).then(() => refreshListLive(kind));
  timers.set(kind, setInterval(() => void refreshListLive(kind), STALE_MS));
}

export function stopListLive(kind) {
  const timer = timers.get(kind);
  if (timer) clearInterval(timer);
  timers.delete(kind);
}
