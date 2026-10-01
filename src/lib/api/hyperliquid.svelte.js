import { formatUsd } from "./token.svelte.js";
// inlined from ticker.json — no data file, the strings live with the code
const ticker =   [
    {
      "href": "/tokens/solana/cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
      "img": "/images/nohomo-eyes.png",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "BTC",
      "price": "$85,960.48",
      "hiddenColor": "var(--color-green)",
      "dir": "▲",
      "change": "6.40%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
    },
    {
      "href": "/tokens/solana/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
      "img": "/images/nohomo-eyes.png",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "ETH",
      "price": "$2,742.37",
      "hiddenColor": "var(--color-red)",
      "dir": "▲",
      "change": "6.00%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
    },
    {
      "href": "/tokens/solana/So11111111111111111111111111111111111111112",
      "img": "/images/nohomo-eyes.png",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "SOL",
      "price": "$118.27",
      "hiddenColor": "var(--color-red)",
      "dir": "▲",
      "change": "8.98%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80",
      "hiddenText": "$118.27"
    },
    {
      "href": "/tokens/solana/98sMhvDwXj1RQi5c5Mndm3vPe9cBqPrbLaufMXFNMh5g",
      "img": "/images/nohomo-eyes.png",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "HYPE",
      "price": "$94.24",
      "hiddenColor": "var(--color-red)",
      "dir": "▲",
      "change": "3.29%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
    }
  ];

/**
 * The bottom strip's prices, all four from Hyperliquid — the same source and the same
 * two calls Ombra's `MarketStatusRail` uses (`src/lib/hl/universe.svelte.ts`):
 *
 *   - `wss://api.hyperliquid.xyz/ws`, `{ method: 'subscribe', subscription: { type: 'allMids' } }`
 *     for the live mid of every coin, and
 *   - `POST https://api.hyperliquid.xyz/info` `{ "type": "metaAndAssetCtxs" }` as the REST
 *     seed, which is also the only place the strip's 24h change can come from:
 *     `allMids` carries a price and nothing else, while each asset's context carries
 *     `prevDayPx`, and the change is `(mid − prevDayPx) / prevDayPx`.
 *
 * SOL is here rather than on the peg feed because the peg feed has no 24h change, and
 * because all four rows are the same kind of number: a Hyperliquid mid.
 *
 * The coins are read off `ticker.json`'s own `alt` text rather than repeated here.
 */
const HL_INFO = "https://api.hyperliquid.xyz/info";
const HL_WS = "wss://api.hyperliquid.xyz/ws";
const PING_MS = 30_000;
const RECONNECT_MS = 3_000;
const CONTEXT_MS = 60_000;

const COINS = ticker.map((item) => item.alt).filter(Boolean);

const UP = "rgb(33, 201, 94)";
const DOWN = "rgb(255, 98, 46)";

/** @type {Record<string, { price: string, dir: string, change: string, color: string }>} */
let prices = $state.raw({});
let loading = $state(true);
let started = false;
let socket = null;
let pingTimer = null;
let contextTimer = null;
let reconnectTimer = null;
/** The mid of the previous day, per coin: the baseline the change is measured against. */
let prevDay = {};

function move(change) {
  if (typeof change !== "number" || !Number.isFinite(change)) return { dir: "", change: "", color: UP };
  return {
    dir: change >= 0 ? "\u25B2" : "\u25BC",
    change: `${Math.abs(change).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
    color: change >= 0 ? UP : DOWN
  };
}

/** One row: the price, plus the change whenever the previous day's mid is known. */
function setMid(coin, mid) {
  const value = Number(mid);
  if (!Number.isFinite(value) || value <= 0) return;
  const base = prevDay[coin];
  const change = base > 0 ? ((value - base) / base) * 100 : undefined;
  prices = { ...prices, [coin]: { price: formatUsd(value), ...move(change) } };
}

function applyMids(mids) {
  if (!mids || typeof mids !== "object") return;
  for (const coin of COINS) {
    // Keys starting `@` are Hyperliquid's own indices, not coins.
    if (coin.startsWith("@")) continue;
    if (mids[coin] !== undefined) setMid(coin, mids[coin]);
  }
}

async function loadContexts() {
  const response = await fetch(HL_INFO, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "metaAndAssetCtxs" })
  });
  if (!response.ok) return;
  const payload = await response.json();
  const universe = payload?.[0]?.universe;
  const contexts = payload?.[1];
  if (!Array.isArray(universe) || !Array.isArray(contexts)) return;
  for (const coin of COINS) {
    const index = universe.findIndex((asset) => asset?.name === coin);
    if (index < 0) continue;
    const context = contexts[index] ?? {};
    const previous = Number(context.prevDayPx);
    if (Number.isFinite(previous) && previous > 0) prevDay = { ...prevDay, [coin]: previous };
    const mid = context.midPx ?? context.markPx;
    if (mid !== undefined) setMid(coin, mid);
  }
}

function send(frame) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(frame));
}

function connect() {
  if (!started || typeof WebSocket === "undefined") return;
  socket = new WebSocket(HL_WS);
  socket.onopen = () => {
    send({ method: "subscribe", subscription: { type: "allMids" } });
    // Hyperliquid drops a socket that has been quiet: keep it breathing.
    pingTimer = setInterval(() => send({ method: "ping" }), PING_MS);
  };
  socket.onmessage = (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    if (message?.channel === "allMids") applyMids(message.data?.mids);
  };
  socket.onclose = () => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
    socket = null;
    if (started) reconnectTimer = setTimeout(connect, RECONNECT_MS);
  };
  socket.onerror = () => socket?.close();
}

export function getHlPrices() {
  return prices;
}

export function isHlLoading() {
  return loading;
}

export function startHlTicker() {
  if (started) return;
  started = true;
  void (async () => {
    try {
      await loadContexts();
    } catch {
      /* the strip keeps its placeholders rather than half-filling */
    } finally {
      loading = false;
    }
  })();
  connect();
  contextTimer = setInterval(() => {
    void loadContexts().catch(() => {});
  }, CONTEXT_MS);
}

export function stopHlTicker() {
  started = false;
  if (pingTimer) clearInterval(pingTimer);
  if (contextTimer) clearInterval(contextTimer);
  if (reconnectTimer) clearTimeout(reconnectTimer);
  pingTimer = null;
  contextTimer = null;
  reconnectTimer = null;
  socket?.close();
  socket = null;
}
