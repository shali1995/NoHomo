import { api } from "./client.js";
import { getMarkerPrefs } from "./markerPrefs.svelte.js";
import { subscribe, unsubscribe } from "../ws/client.js";
import { createCoalescer } from "../utils/coalesce.js";

/**
 * Candle + marker data for the token chart, read the way Ombra reads it
 * (`TokenChart.svelte`):
 *   - candles — `GET /v2/token/{chain}/{address}/candles`, socket
 *     `token:{c}:{a}:candle:{frame}:{mode}`, event `TOKEN_CANDLE`
 *   - markers — `GET /v2/token/{chain}/{address}/chart-markers`, event `CHART_MARKERS`
 *
 * The candle timeframe enum is lowercase (`1m`, `1h`), unlike the scanner's uppercase
 * one, and the backend rejects a wrong casing outright.
 */

/** Frames the toolbar offers, in Ombra's order (`TokenChart.svelte`). */
export const FRAMES = ["1s", "5s", "15s", "30s", "1m", "5m", "15m", "1h", "4h", "6h", "12h", "24h"];

export const DEFAULT_FRAME = "1m";

/** The backend caps a single chart-markers request at one day. */
const MARKER_MAX_WINDOW_SECONDS = 24 * 60 * 60;

/** Candles asked for on a seed. Ombra pages more in as the user scrolls left. */
const CANDLE_COUNT = 300;

let chain = $state("");
let address = $state("");
let frame = $state(DEFAULT_FRAME);
// Market cap is what the chart opens on; the capture's own default was price.
let mode = $state("marketCap"); // 'price' | 'marketCap'

let candles = $state.raw([]);
let markers = $state.raw([]);
let candlesLoading = $state(false);
let markersLoading = $state(false);
let error = $state("");

let candleWsKey = null;
let markerWsKey = null;
let hasMoreHistory = true;
let loadingOlder = false;

const seenCandleTimes = new Set();
const markersById = new Map();

export function getCandles() {
  return candles;
}

export function hasMoreCandles() {
  return hasMoreHistory;
}

export function isLoadingOlder() {
  return loadingOlder;
}

/**
 * Page older candles in when the view is panned left, the way Ombra does: ask for the
 * window ending just before the earliest candle already held (`to: earliest - 1`).
 * Returns how many were added, so the caller can keep the viewport anchored.
 */
export async function loadOlderCandles() {
  if (loadingOlder || !hasMoreHistory || candles.length === 0 || !chain || !address) return 0;
  loadingOlder = true;
  const earliest = candles[0].time;
  try {
    const { data, error: responseError } = await api.GET("/v2/token/{chain}/{address}/candles", {
      params: {
        path: { chain, address },
        query: { timeframe: frame, mode, to: earliest - 1, count: CANDLE_COUNT }
      }
    });
    if (responseError || !data) return 0;
    const older = (data.candles ?? []).map(normalizeCandle).filter((c) => !seenCandleTimes.has(c.time));
    if (older.length === 0) {
      hasMoreHistory = false;
      return 0;
    }
    for (const row of older) seenCandleTimes.add(row.time);
    candles = [...older, ...candles].sort((a, b) => a.time - b.time);
    return older.length;
  } finally {
    loadingOlder = false;
  }
}

export function getMarkers() {
  return markers;
}

export function getFrame() {
  return frame;
}

export function getMode() {
  return mode;
}

export function isCandlesLoading() {
  return candlesLoading;
}

export function getChartError() {
  return error;
}

/** `priceFormat` the backend sends, so the axis matches its own precision. */
let priceFormat = $state.raw(null);
export function getPriceFormat() {
  return priceFormat;
}

/**
 * Coalesced candle drain. Ombra buffers the socket's `TOKEN_CANDLE` frames and applies
 * them once per animation frame (250 ms while the tab is hidden), because a busy token
 * emits them faster than the chart can redraw.
 */
const pending = new Map();
const drain = createCoalescer(
  () => {
    if (pending.size === 0) return;
    const next = candles.slice();
    const indexByTime = new Map();
    for (let i = 0; i < next.length; i++) indexByTime.set(next[i].time, i);
    for (const candle of pending.values()) {
      const at = indexByTime.get(candle.time);
      if (at === undefined) {
        // A new bucket: append, then re-sort so the series stays chronological.
        next.push(candle);
        indexByTime.set(candle.time, next.length - 1);
      } else {
        next[at] = candle;
      }
    }
    pending.clear();
    next.sort((a, b) => a.time - b.time);
    candles = next;
  },
  { maxBatch: 2000 }
);

function normalizeCandle(raw) {
  return {
    time: raw.time,
    open: raw.open,
    high: raw.high,
    low: raw.low,
    close: raw.close,
    volumeUsd: raw.volumeUsd ?? 0
  };
}

async function loadCandles() {
  candlesLoading = true;
  const { data, error: responseError } = await api.GET("/v2/token/{chain}/{address}/candles", {
    params: { path: { chain, address }, query: { timeframe: frame, count: CANDLE_COUNT, mode } }
  });
  candlesLoading = false;
  if (responseError || !data) throw new Error("Unable to load candles");
  priceFormat = data.priceFormat ?? null;
  const rows = (data.candles ?? []).map(normalizeCandle).sort((a, b) => a.time - b.time);
  seenCandleTimes.clear();
  for (const row of rows) seenCandleTimes.add(row.time);
  pending.clear();
  hasMoreHistory = data.hasMore !== false;
  candles = rows;
}

/**
 * Markers, back-filled in one-day chunks. The backend caps a single request at a day,
 * and a single day's window can be almost entirely migrations on a quiet token — the
 * richer kinds (CALL, DEV, THESIS, TWEET) live further back, so several days are read
 * and merged the way Ombra pages its marker history.
 */
const MARKER_DAYS = 3;

async function loadMarkers() {
  markersLoading = true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const byId = new Map();
  let migration = null;

  const windows = [];
  for (let day = 0; day < MARKER_DAYS; day++) {
    const to = nowSeconds - day * MARKER_MAX_WINDOW_SECONDS;
    windows.push({ from: to - MARKER_MAX_WINDOW_SECONDS, to });
  }

  const reads = await Promise.all(
    windows.map(async ({ from, to }) => {
      const { data, error } = await api.GET("/v2/token/{chain}/{address}/chart-markers", {
        params: {
          path: { chain, address },
          // `curated` ("friends only") is the backend's filter, not ours.
          query: { from, to, minUsd: 0, curated: getMarkerPrefs().curated ? true : undefined }
        }
      });
      if (error || !data) return false;
      // temporary: what the engine actually returned for this window, so "no bubbles" can be
      // told apart from "no markers" instead of guessed at
      {
        const kinds = {};
        for (const m of data?.markers ?? []) kinds[m.kind] = (kinds[m.kind] ?? 0) + 1;
        console.info("[markers]", { from, to, count: (data?.markers ?? []).length, kinds });
      }
      for (const marker of data?.markers ?? []) {
        // MIGRATION is a singleton with its own field names; keep the newest.
        if (marker.kind === "MIGRATION") {
          if (!migration || (marker.migratedAtTimestamp ?? 0) > (migration.migratedAtTimestamp ?? 0)) {
            migration = marker;
          }
          continue;
        }
        if (marker.id) byId.set(marker.id, marker);
      }
      return true;
    })
  );

  if (!reads.some(Boolean)) {
    // Every window failed. `curated` is one way: it needs a session, so signed out it
    // answers 401. Keep the markers already drawn rather than blanking the chart.
    markersLoading = false;
    return;
  }

  markersById.clear();
  for (const [id, marker] of byId) markersById.set(id, marker);
  if (migration) markersById.set("migration", migration);
  markersLoading = false;
  markers = [...markersById.values()];
}

function openCandleSocket() {
  if (candleWsKey) unsubscribe(candleWsKey);
  candleWsKey = subscribe(
    `token:${chain}:${address}:candle:${frame}:${mode}`,
    (event, payload) => {
      if (event !== "TOKEN_CANDLE" || !payload?.candles) return;
      for (const raw of payload.candles) {
        const candle = normalizeCandle(raw);
        pending.set(candle.time, candle);
      }
      drain.push(1);
    },
    undefined,
    { recovery: "resubscribe" }
  );
}

function openMarkerSocket() {
  if (markerWsKey) unsubscribe(markerWsKey);
  markerWsKey = subscribe(
    `token:${chain}:${address}:chart_markers`,
    (event, payload) => {
      if (event !== "CHART_MARKERS" || !payload?.markers) return;
      let changed = false;
      for (const marker of payload.markers) {
        if (!marker?.id) continue;
        markersById.set(marker.id, marker);
        changed = true;
      }
      if (changed) markers = [...markersById.values()];
    },
    undefined,
    { recovery: "resubscribe" }
  );
}

async function refresh() {
  error = "";
  const results = await Promise.allSettled([loadCandles(), loadMarkers()]);
  const failed = results.find((r) => r.status === "rejected");
  if (failed && failed.status === "rejected") {
    error = failed.reason instanceof Error ? failed.reason.message : "Unable to load the chart";
  }
}

/** Point the chart at a token. Re-seeds and re-subscribes when it changes. */
export async function selectChart(nextChain, nextAddress) {
  if (!nextChain || !nextAddress) return;
  const sameToken = nextChain === chain && nextAddress === address;
  chain = nextChain;
  address = nextAddress;

  if (sameToken) {
    // Same token: only make sure the sockets are live, in case a cleanup closed them.
    ensureCandleSockets();
    return;
  }

  candles = [];
  markers = [];
  markersById.clear();
  hasMoreHistory = true;

  // Sockets first, exactly as Ombra does — the candle stream must not wait on REST.
  openCandleSocket();
  openMarkerSocket();

  await refresh();
}

/** Re-open only what a previous cleanup closed. */
function ensureCandleSockets() {
  if (!candleWsKey) openCandleSocket();
  if (!markerWsKey) openMarkerSocket();
}

export async function setFrame(nextFrame) {
  if (nextFrame === frame || !FRAMES.includes(nextFrame)) return;
  frame = nextFrame;
  if (!chain || !address) return;
  pending.clear();
  try {
    await loadCandles();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load candles";
  }
  openCandleSocket();
}

/**
 * Switch between price and market cap. Both the REST query and the socket topic carry
 * the mode, so the candles are re-seeded and the subscription re-opened — the same
 * shape as a timeframe change.
 */
export async function setMode(nextMode) {
  const normalized = nextMode === "marketCap" ? "marketCap" : "price";
  if (normalized === mode) return;
  mode = normalized;
  if (!chain || !address) return;
  pending.clear();
  try {
    await loadCandles();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unable to load candles";
  }
  openCandleSocket();
}

/**
 * Re-read the marker window. `curated` is a subscription/filter param the backend
 * applies, so everything already fetched was fetched under the old setting — the same
 * reason Ombra drops its marker cache and re-hydrates when the size filter changes.
 */
export async function reloadMarkers() {
  if (!chain || !address) return;
  await loadMarkers();
}

export function stopChart() {
  if (candleWsKey) unsubscribe(candleWsKey);
  if (markerWsKey) unsubscribe(markerWsKey);
  candleWsKey = null;
  markerWsKey = null;
  drain.clear();
  pending.clear();
}

/**
 * Coalescer handle for a caller that wants to flush immediately (used by tests).
 */
export function flushCandles() {
  drain.flushNow();
}
