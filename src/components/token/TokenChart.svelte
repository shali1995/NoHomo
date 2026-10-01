<script>
  // The token's price chart.
  //
  // Ported from Ombra's `src/lib/components/TokenChart.svelte`: the same
  // lightweight-charts setup (candlestick + volume + area gradient), the same
  // `lightweight-charts` dynamic import (it is SSR-incompatible), and the same two
  // custom series primitives that paint the swap "bubbles" and the migration badge
  // (`src/lib/utils/chartPrimitives.js`, ported from `chart-primitives.ts`).
  //
  // What it deliberately does not carry over from Ombra, because it depends on stores
  // that do not exist here: take-profit / stop-loss price lines and the ATH line
  // (they need the trade store and auth), the avatar call-bubbles, the TWEET and
  // THESIS popovers, and the marker visibility preferences (a persisted feSettings
  // blob). Markers are drawn as standard series markers instead.
  import { onMount, untrack } from "svelte";
  import { tc, withHexAlpha } from "../../lib/utils/chartTheme.js";
  import { SwapPrimitive, MigrationPrimitive } from "../../lib/utils/chartPrimitives.js";
  import { CallAvatarPrimitive, MAX_AVATARS, setAvatarLoadHook } from "../../lib/utils/chartAvatars.js";
  import { avatarUrl } from "../../lib/api/config.js";
  import { getMarkerPrefs } from "../../lib/api/markerPrefs.svelte.js";
  import { getIsLoggedIn } from "../../lib/auth.svelte.js";
  import { moveDipLevel, moveTargetLevel, positionsFor } from "../../lib/api/trade.svelte.js";
  import { ageFromSeconds, getToken, formatCompact, formatPrice, formatUsd, shortAddress } from "../../lib/api/token.svelte.js";
  import {
    FRAMES,
    getCandles,
    getFrame,
    getMarkers,
    getPriceFormat,
    isCandlesLoading,
    selectChart,
    getMode,
    hasMoreCandles,
    isLoadingOlder,
    loadOlderCandles,
    setFrame,
    setMode,
    stopChart
  } from "../../lib/api/chart.svelte.js";

  let { chain = "", address = "" } = $props();

  let container = $state(null);
  let chart = null;
  let candleSeries = null;
  let volumeSeries = null;
  let areaSeries = null;
  let markerPlugin = null;
  let swapPrimitive = null;
  let migrationPrimitive = null;
  let callAvatarPrimitive = null;
  let disposed = false;

  // The click box. Ported from Ombra: coordinates are viewport-relative because the
  // box is fixed-positioned (it would otherwise be clipped by the chart's canvas).
  let chartTooltip = $state(null);
  let chartTooltipTimer = null;

  // Ombra's viewport / magnitude bookkeeping. `viewportKey` is token+frame, so a switch
  // re-fits; `priceScaleResetPending` re-enables autoscale so a large-cap token does not
  // inherit the price range of the small-cap one before it.
  let viewportKey = "";
  let magnitudeKey = "";
  let priceScaleResetPending = false;
  let suppressOlderFetchUntil = 0;
  /** Earliest candle time of the last projection, so a prepend can be detected. */
  let projectedFirstTime = null;

  // Per-candle marker buckets, so a click can summarise everything on that candle.
  const kolByCandle = new Map();
  const devByCandle = new Map();
  const thesisByCandle = new Map();
  const tweetByCandle = new Map();

  const candles = $derived(getCandles());
  const markers = $derived(getMarkers());
  const markerPrefs = $derived(getMarkerPrefs());

  /**
   * When a marker happened, in seconds. Every kind carries a top-level `timestamp`
   * except CALL, whose time lives on its `callDetails` as `calledAtTimestamp` -- reading
   * `marker.timestamp` unconditionally left calls at 0, and the `if (!seconds) continue`
   * guard below then dropped all of them, so call bubbles never drew at all.
   */
  function markerSeconds(marker) {
    const ms = marker.kind === "CALL" ? marker.callDetails?.calledAtTimestamp : marker.timestamp;
    return Math.floor((ms ?? 0) / 1000);
  }

  /**
   * A caller's wallet, when the call came from a wallet-backed source (Ombra's
   * `getWalletAddress`): a caller, telegram chat or list has none, a copy-trade wallet is
   * the wallet.
   */
  function callerWallet(caller) {
    if (!caller) return undefined;
    if (caller.type === "WALLET" && typeof caller.walletAddress === "string") return caller.walletAddress;
    if (caller.type === "WALLET" && typeof caller.id === "string") return caller.id;
    return undefined;
  }

  /**
   * Whether the toolbar currently shows this kind. DEV and MIGRATION have no toggle —
   * the dev's own trades and the migration badge are always drawn, as they are in Ombra,
   * whose menu carries the same five switches.
   */
  function shows(kind) {
    if (kind === "DEV" || kind === "MIGRATION") return true;
    if (kind === "KOL") return markerPrefs.kols;
    if (kind === "USER_SWAP") return markerPrefs.user;
    if (kind === "CALL") return markerPrefs.calls;
    if (kind === "THESIS") return markerPrefs.theses;
    if (kind === "TWEET") return markerPrefs.tweets;
    return false;
  }
  const frame = $derived(getFrame());
  const showMarketCap = $derived(getMode() === "marketCap");
  const loading = $derived(isCandlesLoading());

  /** Ombra reads its price scale from the backend's own format. */
  /**
   * Ombra formats every price label with `formatPriceText(price)` (minus the `$`).
   * Deriving the decimals from the backend's `minMove` instead produced longer labels
   * (`0.00058228` where Ombra shows `0.000582`), and lightweight-charts widens the price
   * scale to fit its widest label — which left a visible band of empty space beside the
   * numbers.
   */
  const SUBSCRIPT_DIGITS = "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089";

  /**
   * The price axis is only as wide as its widest label, so the strip's width is a
   * formatting problem, not a layout one. Market cap labels are compact by nature
   * (`15336.8` -> `15.34K`, six characters) which is why MC mode has no gap; price
   * labels were spelled out in full (`0.0\u20841533`, eight characters) which is the gap.
   * So both modes share the same six-character budget, and the axis drops to two
   * significant digits when it must. Axis labels are rounded by definition — the header
   * and the tooltips still print the price in full.
   */
  const AXIS_MAX_CHARS = 6;

  /**
   * `formatCompact` with the same six-character budget: `576770.96` becomes `576.8K`
   * instead of `576.77K`, because that extra character was enough to widen the axis and
   * reopen the gap in Market Cap mode. Decimals are dropped before characters are.
   */
  function compactAxis(abs) {
    for (const [scale, suffix] of [
      [1e9, "B"],
      [1e6, "M"],
      [1e3, "K"]
    ]) {
      if (abs < scale) continue;
      for (const decimals of [2, 1, 0]) {
        const mantissa = (abs / scale).toFixed(decimals);
        if (Number(mantissa) >= 1000) break; // rounded up into the next unit
        const text = mantissa.includes(".") ? mantissa.replace(/\.?0+$/, "") : mantissa;
        const label = `${text}${suffix}`;
        if (label.length <= AXIS_MAX_CHARS) return label;
      }
    }
    return formatCompact(abs);
  }

  function priceFormatter(price) {
    const abs = Math.abs(price);
    if (!isFinite(abs)) return "";
    if (abs === 0) return "0";
    if (abs >= 1000) return compactAxis(abs);
    const plain = formatPrice(abs).replace("$", "").replace(/\.?0+$/, "");
    if (plain.length <= AXIS_MAX_CHARS) return plain;
    const zeros = Math.max(0, Math.ceil(-Math.log10(abs)) - 1);
    const sub = String(zeros)
      .split("")
      .map((d) => SUBSCRIPT_DIGITS[+d])
      .join("");
    for (const significant of [3, 2]) {
      const label = `0.0${sub}${Math.round(abs * 10 ** (zeros + significant))}`;
      if (label.length <= AXIS_MAX_CHARS) return label;
    }
    return `0.0${sub}${Math.round(abs * 10 ** (zeros + 2))}`;
  }

  /**
   * The custom primitives need a series, a chart and the swap/migration points. Ombra
   * derives those from its marker cache; here the markers already arrive in that shape,
   * so the swap points group this endpoint's swap markers per candle.
   */
  /**
   * The candle containing a moment — ombra's own binary search: the last candle at or before
   * it. A swap has to land on a candle, because the time scale is indexed by candle time; a
   * raw marker timestamp has no coordinate and the bubble silently disappears.
   */
  function nearestCandle(seconds) {
    if (!candles.length) return null;
    let lo = 0;
    let hi = candles.length - 1;
    if (seconds >= candles[hi].time) return candles[hi];
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (candles[mid].time <= seconds) lo = mid;
      else hi = mid - 1;
    }
    return candles[lo];
  }

  /** The lines follow the exit plan: setting a target moves them without a reload. */
  $effect(() => {
    const signature = (positionsFor(address)[0]?.liveTargets ?? [])
      .map((target) => `${target.tag}:${target.label}:${target.sellPct}`)
      .join(",");
    void signature;
    redrawPriceLines();
  });

  /**
   * The trade's own target lines, ported from ombra's `redrawPriceLines`: one dashed line per
   * take profit and stop loss, plus a blue one where a pending dip would buy. Every line is
   * measured from the trade's entry, and follows the chart's mode — market cap or price — so a
   * target sits at the height the axis is actually showing.
   */
  let priceLines = [];
  /**
   * What each drawn line *is*, so a pointer can pick one up: its bounds in the chart's own units
   * and the call that commits a new level. Every line carries its own, which keeps the drag
   * itself generic — it never has to know whether it is holding a dip or a target.
   */
  let lineHandles = [];
  /**
   * A level being committed, keyed by what it belongs to. The chart redraws on its own — every
   * candle tick, and again when the trade is re-read — and a redraw rebuilds these lines from the
   * trade data, which still holds the *old* level while the request is in flight. Without this the
   * line snapped back to where it started and jumped to the new place once the answer arrived.
   */
  let pendingLevels = new Map();
  /**
   * True while a level is under the finger. The redraw clears and recreates every price line, and
   * doing that on each live frame is what made a dragged line flicker; the pointer moves the line
   * itself, and one rebuild on release is enough.
   */
  let draggingLevel = false;

  function clearPriceLines() {
    for (const line of priceLines) {
      try {
        candleSeries?.removePriceLine(line);
      } catch {}
    }
    priceLines = [];
    lineHandles = [];
  }

  /** The level to draw: the one being committed, or the trade's own. */
  function drawnLevel(key, fallback) {
    const held = pendingLevels.get(key);
    return held > 0 ? held : fallback;
  }

  /**
   * The trade's own levels, ported from ombra's `redrawPriceLines`, plus the token's high.
   *
   * Two things make this work where a naive version does not. The all-time high belongs to the
   * token, not to a trade, so it is drawn first, for every token, before anything is required to
   * exist. And every target is measured from the trade's entry — which is 0 until a buy confirms
   * — so an unfilled order, the one case where the levels matter most, has no anchor at all. It
   * is anchored instead on what the order will actually pay: a dip's own trigger price, or the
   * last traded price for an order that fills at market.
   */
  function redrawPriceLines() {
    if (!chart || !candleSeries) return;
    if (draggingLevel) return;
    clearPriceLines();
    if (!address) return;
    const showCap = getMode() === "marketCap";
    const snapshot = getToken() ?? {};

    const ath = showCap ? Number(snapshot.athMarketCapUsd ?? 0) : Number(snapshot.athPriceUsd ?? 0);
    if (ath > 0) {
      priceLines.push(
        candleSeries.createPriceLine({
          price: ath,
          color: tc("--t-yel"),
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "ATH"
        })
      );
    }

    if (!getIsLoggedIn()) return;
    const position = positionsFor(address)[0];
    if (!position) return;

    const dipPct = Math.abs(Number(position.dipPill?.trigger?.dipPct ?? 0));
    /**
     * The candles are already in the chart's own units — a cap in market-cap mode, a price in
     * price mode — so a level derived from them must not be converted again. Treating the dip's
     * cap as a price and multiplying it by the price-to-cap ratio put every line at around 10^14,
     * which is why a resting order's levels were never on screen while the ATH, drawn from the
     * snapshot's own cap, was fine.
     */
    const lastInMode = Number(candles.at(-1)?.close ?? 0);
    /**
     * A dip is a fixed condition: the percentage is measured from the price when the order was
     * placed, not from whatever the market is doing now. The anchor is therefore the candle at
     * the swap's own `createdAt` — the same lookup the swap bubbles use — so the line stays put
     * while the chart moves. An order older than the candles in view falls back to the earliest
     * one, which is the closest honest answer until more history is paged in.
     */
    const placedCandle = position.dipPill?.placedAt > 0 ? nearestCandle(position.dipPill.placedAt) : null;
    const anchorInMode = Number(placedCandle?.close ?? lastInMode);
    const dipInMode = dipPct > 0 && anchorInMode > 0 ? anchorInMode * (1 - dipPct / 100) : 0;
    const fillInMode = dipInMode > 0 ? dipInMode : lastInMode;

    /**
     * A dip we placed ourselves is stored as the **fixed price** it buys at, so there is nothing
     * to derive: the engine's own number is the level, and the chart draws it directly. Older
     * orders, placed as a bare percentage, still fall back to the entry or the placement candle.
     */
    const stock = getToken() ?? {};
    const supply = Number(stock.totalSupply ?? stock.quote?.totalSupply ?? 0);
    const lockedUsd = Number(position.dipPill?.triggerPriceUsd ?? 0);
    const lockedInMode = lockedUsd > 0 ? (showCap ? lockedUsd * supply : lockedUsd) : 0;

    // the snapshot keeps the token's live numbers under `quote`
    const quote = snapshot.quote ?? {};
    const nowPrice = Number(quote.priceUsdStr ?? 0);
    const nowCap = Number(quote.marketCapUsdStr ?? 0);
    const capRatio = nowPrice > 0 && nowCap > 0 ? nowCap / nowPrice : 0;
    /** The same level in price terms, which is the axis a trigger's own value is written in. */
    const asPrice = (inMode) => (showCap ? (capRatio > 0 ? inMode / capRatio : 0) : inMode);
    const asCap = (inMode) => (showCap ? inMode : inMode * capRatio);

    const entryPrice =
      position.entryPriceUsd > 0 ? position.entryPriceUsd : lockedUsd > 0 ? lockedUsd : asPrice(fillInMode);
    const entryCap =
      position.entryMcapUsd > 0 ? position.entryMcapUsd : lockedUsd > 0 ? lockedUsd * supply : asCap(fillInMode);
    const entry = showCap ? entryCap : entryPrice;
    if (!(entry > 0)) return;

    let takeProfit = 0;
    let stopLoss = 0;
    // fired targets first — they are older, and ombra numbers the sequence across both sets
    const drawnTargets = [...(position.metTargets ?? []), ...(position.liveTargets ?? [])];
    for (const target of drawnTargets) {
      const trigger = target.trigger ?? {};
      const isStop = target.kind === "STOP_LOSS";
      let value = 0;
      if (trigger.type === "MULTIPLIER") {
        value = entry * Number(trigger.multiplier ?? 0);
      } else if (trigger.type === "PERCENT") {
        const pct = Math.abs(Number(trigger.changePct ?? 0));
        value = isStop ? entry * (1 - pct / 100) : entry * (1 + pct / 100);
      } else if (trigger.type === "MARKET_CAP_USD") {
        // native in cap mode; in price mode it converts through the entry pair, as ombra does
        const cap = Number(trigger.marketCapUsd ?? 0);
        value = showCap ? cap : entryPrice * (cap / (entryCap || NaN));
      } else if (trigger.type === "PRICE") {
        const price = Number(trigger.priceUsd ?? 0);
        value = showCap ? entryCap * (price / (entryPrice || NaN)) : price;
      }
      if (!(value > 0)) continue;
      const targetKey = target.id ? `target:${target.id}` : "";
      const targetLine = candleSeries.createPriceLine({
          price: drawnLevel(targetKey, value),
          color: tc(isStop ? "--t-red" : "--t-grn"),
          lineWidth: 1,
          // 2 is `LineStyle.Dashed`, 1 is solid: a target that has fired stops being a plan
          lineStyle: target.met ? 1 : 2,
          axisLabelVisible: true,
          title: `${isStop ? `SL${++stopLoss}` : `TP${++takeProfit}`}${target.met ? " \u2713" : ""}`
      });
      priceLines.push(targetLine);
      /** Only a live percent trigger has a level we can move; a multiple or a price is left alone. */
      if (!target.met && trigger.type === "PERCENT" && target.id && entry > 0) {
        lineHandles.push({
          line: targetLine,
          key: targetKey,
          min: isStop ? 0 : entry,
          max: isStop ? entry : Number.MAX_SAFE_INTEGER,
          commit: async (dragged) => {
            const pct = Number(Math.abs((dragged / entry - 1) * 100).toFixed(3));
            pendingLevels.set(targetKey, dragged);
            try {
              return await moveTargetLevel({
                address,
                id: target.id,
                kind: isStop ? "STOP_LOSS" : "TAKE_PROFIT",
                sellPct: target.sellPct,
                changePct: pct
              });
            } catch (failure) {
              // a refused level goes back where it was; a committed one stays pending because the
              // store still holds the old level until its own reload
              pendingLevels.delete(targetKey);
              throw failure;
            }
          }
        });
      }
    }

    // a locked level draws even though a limit-backed dip carries no percentage at all
    if (dipPct > 0 || lockedInMode > 0) {
      // below the entry when there is one; when the trade has not filled, the dip price _is_ the
      // level and must not be discounted a second time
      // the dip's own level, already in the chart's units; below the entry when there is one
      const value = lockedInMode > 0
        ? lockedInMode
        : position.entryMcapUsd > 0
          ? showCap
            ? position.entryMcapUsd * (1 - dipPct / 100)
            : position.entryPriceUsd * (1 - dipPct / 100)
          : showCap
            ? dipInMode
            : asPrice(dipInMode);
      if (value > 0) {
        const swapId = position.dipPill?.swapId;
        const dipKey = swapId ? `dip:${swapId}` : "";
        const line = candleSeries.createPriceLine({
          price: drawnLevel(dipKey, value),
          // the same yellow as the dip's own pill, so the two read as one thing
          color: tc("--t-yel"),
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: "DIP"
        });
        priceLines.push(line);
        // it waits below the market, so it can be dragged anywhere beneath today's level
        if (swapId) {
          lineHandles.push({
            line,
            key: dipKey,
            min: 0,
            max: lastInMode,
            commit: async (dragged) => {
              pendingLevels.set(dipKey, dragged);
              try {
                return await moveDipLevel({ address, swapId, priceUsd: asPrice(dragged) });
              } catch (failure) {
                // as above: on success the dragged level stays on screen, because the store's own
                // level only catches up on a reload
                pendingLevels.delete(dipKey);
                throw failure;
              }
            }
          });
        }
      }
    }

  }

  console.info("[drag] lines=" + priceLines.length + " grabbable=" + lineHandles.length);

  /**
   * The swap bubbles, ported from ombra's `buildSwapData`: swaps are grouped per candle and
   * per side, and the bubble sits on the candle's low for a buy and its high for a sell —
   * not at a price of its own. The amount comes from `value.amount.usd`, which is where a
   * `USER_SWAP` marker keeps it.
   */
  function buildSwapPoints() {
    if (!candles.length) return [];
    const byTime = new Map();
    for (const marker of markers) {
      if (marker.kind !== "KOL" && marker.kind !== "DEV" && marker.kind !== "USER_SWAP") continue;
      if (!shows(marker.kind)) continue;
      const seconds = markerSeconds(marker);
      if (!seconds) continue;
      const candle = nearestCandle(seconds);
      if (!candle) continue;
      const isBuy = marker.side ? marker.side === "BUY" : true;
      const key = `${candle.time}:${isBuy}`;
      const entry = byTime.get(key) ?? {
        time: candle.time,
        isBuy,
        isDev: marker.kind === "DEV",
        candle,
        swaps: []
      };
      entry.swaps.push({
        side: marker.side ?? "",
        usd: Number(marker.value?.amount?.usd ?? marker.amountUsd ?? 0)
      });
      byTime.set(key, entry);
    }
    return [...byTime.values()].map(({ candle, ...point }) => ({
      ...point,
      price: point.isBuy
        ? Math.min(candle.low, candle.open, candle.close)
        : Math.max(candle.high, candle.open, candle.close)
    }));
  }

  /**
   * Avatar bubbles: the callers / thesis authors / tweeters that land on each candle,
   * collapsed per identity so the same wallet hitting one candle shows a count.
   * Ombra's `buildCallAvatarData`, reduced to the marker kinds this backend returns.
   */
  function buildAvatarPoints() {
    const candleTimes = candles.map((c) => c.time);
    if (candleTimes.length === 0) return [];
    const highByTime = new Map(candles.map((c) => [c.time, c.high]));

    /** Snap a timestamp to the candle that contains it, as Ombra does. */
    const nearestCandle = (seconds) => {
      let lo = 0;
      let hi = candleTimes.length - 1;
      if (seconds < candleTimes[0]) return null;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (candleTimes[mid] <= seconds) lo = mid;
        else hi = mid - 1;
      }
      return candleTimes[lo];
    };

    kolByCandle.clear();
    devByCandle.clear();
    thesisByCandle.clear();
    tweetByCandle.clear();

    const bucket = (map, time, value) => {
      const arr = map.get(time);
      if (arr) arr.push(value);
      else map.set(time, [value]);
    };

    const grouped = new Map();
    const push = (seconds, key, caller) => {
      const time = nearestCandle(seconds);
      if (time === null) return;
      let byKey = grouped.get(time);
      if (!byKey) {
        byKey = new Map();
        grouped.set(time, byKey);
      }
      const existing = byKey.get(key);
      if (existing) existing.count = (existing.count ?? 1) + 1;
      else byKey.set(key, { ...caller, count: 1 });
    };

    for (const marker of markers) {
      const seconds = markerSeconds(marker);
      if (!seconds) continue;
      // Nothing hidden may reach the hover buckets either, or a hidden marker still
      // answers a hover.
      if (!shows(marker.kind)) continue;
      if (marker.kind === "CALL") {
        const caller = marker.caller ?? {};
        const name = caller.name ?? "?";
        const wallet = callerWallet(caller);
        push(seconds, wallet ?? caller.id ?? `n:${name}`, {
          photoUrl: avatarUrl(caller.photoId),
          walletAddress: wallet,
          name,
          sourceKind: "call"
        });
      } else if (marker.kind === "THESIS") {
        {
          const candleTime = nearestCandle(seconds);
          if (candleTime !== null) bucket(thesisByCandle, candleTime, marker);
        }
        // The marker carries the thesis text but not the author's photo; the label on
        // the author wallet does, when it has one.
        const label = marker.labels?.[0];
        push(seconds, marker.authorWallet ?? `t:${marker.id}`, {
          photoUrl: avatarUrl(label?.photoId),
          walletAddress: marker.authorWallet,
          name: label?.label ?? "Thesis",
          sourceKind: "thesis"
        });
      } else if (marker.kind === "TWEET") {
        const candleTime = nearestCandle(seconds);
        if (candleTime !== null) bucket(tweetByCandle, candleTime, marker);
        push(seconds, `x:${marker.handle}`, {
          photoUrl: photoResolve(marker.photoId),
          name: marker.name ?? marker.handle ?? "X",
          sourceKind: "tweet"
        });
      } else if (marker.kind === "KOL") {
        // A KOL marker keeps its side on the ring: whether a tracked wallet bought or
        // dumped is the point of the marker (Ombra's `markerRingColor`).
        const label = marker.labels?.[0];
        const isBuy = marker.side === "BUY";
        const candleTime = nearestCandle(seconds);
        if (candleTime !== null) bucket(kolByCandle, candleTime, marker);
        push(seconds, `${marker.walletAddress}:${isBuy ? "b" : "s"}`, {
          photoUrl: avatarUrl(label?.photoId),
          walletAddress: marker.walletAddress,
          name: label?.label ?? "?",
          isBuy,
          sourceKind: "kol"
        });
      } else if (marker.kind === "DEV") {
        // Dev buys and sells: same treatment, plus the chef-hat badge the primitive
        // draws for `isDev`.
        const label = marker.labels?.[0];
        const isBuy = marker.side === "BUY";
        const candleTime = nearestCandle(seconds);
        if (candleTime !== null) bucket(devByCandle, candleTime, marker);
        push(seconds, `dev:${marker.walletAddress}:${isBuy ? "b" : "s"}`, {
          photoUrl: avatarUrl(label?.photoId),
          walletAddress: marker.walletAddress,
          name: label?.label ?? "Dev",
          isBuy,
          isDev: true,
          sourceKind: "dev"
        });
      }
    }

    const out = [];
    for (const [time, byKey] of grouped) {
      out.push({ time, high: highByTime.get(time) ?? 0, callers: [...byKey.values()] });
    }
    return out;
  }

  /**
   * Ombra's `photoResolve`: a photo that is already an absolute URL is used as-is,
   * anything else goes through the avatar endpoint. Tweet markers carry absolute
   * `pbs.twimg.com` URLs, so they must not be prefixed.
   */
  function photoResolve(photo) {
    if (!photo) return null;
    return /^https?:\/\//.test(photo) ? photo : avatarUrl(photo);
  }

  /**
   * The swap bubble under the cursor, from Ombra's own test: an 18px square around the
   * marker, below the candle for a buy and above it for a sell. Returns the point's screen
   * position, so the caller can hang the tooltip off it.
   */
  function hitTestSwap(px, py) {
    if (!swapPrimitive || !chart || !candleSeries) return null;
    const size = 18;
    const gap = 4;
    const ts = chart.timeScale();
    for (const point of swapPrimitive._data ?? []) {
      const x = ts.timeToCoordinate(point.time);
      const priceY = candleSeries.priceToCoordinate(point.price);
      if (x === null || priceY === null) continue;
      const cy = point.isBuy ? priceY + size / 2 + gap : priceY - size / 2 - gap;
      if (
        px >= x - size / 2 && px <= x + size / 2 &&
        py >= cy - size / 2 && py <= cy + size / 2
      ) {
        return {
          x,
          cy,
          lines: point.swaps.map(
            (swap) => `${swap.side || "SWAP"} $${swap.usd > 0 ? swap.usd.toFixed(0) : "0"}`
          )
        };
      }
    }
    return null;
  }

  /**
   * Which bubble is under the cursor. Ported from Ombra's `hitTestAvatar`: the same
   * 18px bubble, 4px padding and 0.55 overlap step, walked back-to-front so the
   * topmost bubble wins.
   */
  function hitTestAvatar(px, py) {
    if (!callAvatarPrimitive || !chart || !candleSeries) return null;
    const ts = chart.timeScale();
    const sz = 18;
    const pad = 4;
    const step = sz * 0.55;
    const data = callAvatarPrimitive._data ?? [];
    for (let di = data.length - 1; di >= 0; di--) {
      const d = data[di];
      const x = ts.timeToCoordinate(d.time);
      const priceY = candleSeries.priceToCoordinate(d.high);
      if (x === null || priceY === null) continue;
      const n = d.callers.length;
      const shown = Math.min(n, MAX_AVATARS);
      const extra = n > MAX_AVATARS ? 1 : 0;
      const totalW = sz + step * (shown + extra - 1);
      const startX = x - totalW / 2;
      const cy = priceY - pad - sz / 2;
      for (let i = shown + extra - 1; i >= 0; i--) {
        const cx = startX + i * step + sz / 2;
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy <= (sz / 2) * (sz / 2)) {
          // the count bubble answers as the candle as a whole — `-1` is nobody in particular
          return { time: d.time, idx: extra > 0 && i === MAX_AVATARS ? -1 : i, x, cy };
        }
      }
    }
    return null;
  }

  /** Chart-relative point to viewport, because the box is fixed-positioned. */
  function toViewport(x, y) {
    const r = container?.getBoundingClientRect();
    return { x: (r?.left ?? 0) + x, y: (r?.top ?? 0) + y };
  }

  function showTooltip(x, y, lines) {
    chartTooltip = { ...toViewport(x, y), lines };
    if (chartTooltipTimer) clearTimeout(chartTooltipTimer);
    chartTooltipTimer = setTimeout(() => {
      chartTooltip = null;
    }, 3000);
  }

  /**
   * Who bought and sold on one candle. Ported from Ombra's `buildKolSummary`, including
   * the dev-first ordering, the per-wallet roll-up and the USD-descending sort.
   */
  function buildKolSummary(time) {
    const kolSwaps = kolByCandle.get(time) ?? [];
    const devSwaps = devByCandle.get(time) ?? [];
    if (kolSwaps.length === 0 && devSwaps.length === 0) return null;
    const byWallet = new Map();
    let totalBuyUsd = 0;
    let totalSellUsd = 0;
    let buyCount = 0;
    let sellCount = 0;
    const add = (swap, isDev) => {
      const label = swap.labels?.[0];
      let row = byWallet.get(swap.walletAddress);
      if (!row) {
        row = {
          name: label?.label ?? (isDev ? "Dev" : "?"),
          walletAddress: swap.walletAddress,
          photoUrl: avatarUrl(label?.photoId),
          buys: 0,
          sells: 0,
          buyUsd: 0,
          sellUsd: 0,
          isDev
        };
        byWallet.set(swap.walletAddress, row);
      }
      if (isDev) row.isDev = true;
      const amount = swap.amountUsd ?? 0;
      if (swap.side === "BUY") {
        row.buys++;
        row.buyUsd += amount;
        totalBuyUsd += amount;
        buyCount++;
      } else {
        row.sells++;
        row.sellUsd += amount;
        totalSellUsd += amount;
        sellCount++;
      }
    };
    for (const swap of devSwaps) add(swap, true);
    for (const swap of kolSwaps) add(swap, false);
    const rows = [...byWallet.values()].sort((a, b) => b.buyUsd + b.sellUsd - (a.buyUsd + a.sellUsd));
    return { time, rows, totalBuyUsd, totalSellUsd, buyCount, sellCount };
  }

  /** Posts (theses + tweets) sitting on one candle. Ombra's `buildPostSummary`. */
  function buildPostSummary(time) {
    const theses = thesisByCandle.get(time) ?? [];
    const tweets = tweetByCandle.get(time) ?? [];
    if (theses.length === 0 && tweets.length === 0) return null;
    return { theses, tweets };
  }

  /** Ombra's `handleCrosshairMove`: highlight the bubble under the cursor. */
  function handleCrosshairMove(param) {
    if (!callAvatarPrimitive || !chart || !candleSeries) return;
    const mx = param?.point?.x;
    const my = param?.point?.y;
    if (mx == null || my == null) {
      callAvatarPrimitive.setHover(null);
      callAvatarPrimitive.setFocus(null);
      if (container) container.style.cursor = "";
      return;
    }
    const found = hitTestAvatar(mx, my);
    callAvatarPrimitive.setHover(found ? { time: found.time, idx: found.idx } : null);
    let focusWallet = null;
    if (found) {
      const d = (callAvatarPrimitive._data ?? []).find((x) => x.time === found.time);
      focusWallet = d?.callers[found.idx]?.walletAddress ?? null;
    }
    callAvatarPrimitive.setFocus(focusWallet);
    // The owner wants the amount on hover, not only on click: the same hit-test answers both,
    // so a swap bubble reports itself while the pointer is over it.
    const swapHit = hitTestSwap(mx, my);
    if (swapHit) showTooltip(mx, swapHit.cy - 13, swapHit.lines);
    if (container) container.style.cursor = found || swapHit ? "pointer" : "";
  }

  /** Ombra's `handleChartClick`: open the box for the bubble, or the swap lines. */
  function handleChartClick(param) {
    if (!param || !chart || !candleSeries) {
      chartTooltip = null;
      return;
    }
    const clickX = param.point?.x;
    const clickY = param.point?.y;
    if (clickX == null || clickY == null) {
      chartTooltip = null;
      return;
    }
    const ts = chart.timeScale();
    const sz = 18;
    const pad = 4;

    const avatarHit = hitTestAvatar(clickX, clickY);
    if (avatarHit) {
      const summary = buildKolSummary(avatarHit.time);
      const posts = buildPostSummary(avatarHit.time);
      if (summary || posts) {
        const vp = toViewport(Math.round(avatarHit.x), Math.round(avatarHit.cy - sz / 2 - 4));
        chartTooltip = { ...vp, kol: summary ?? undefined, posts: posts ?? undefined };
        if (chartTooltipTimer) clearTimeout(chartTooltipTimer);
        return;
      }
    }

    if (swapPrimitive) {
      for (const d of swapPrimitive._data ?? []) {
        const x = ts.timeToCoordinate(d.time);
        const priceY = candleSeries.priceToCoordinate(d.price);
        if (x === null || priceY === null) continue;
        const cy = d.isBuy ? priceY + sz / 2 + pad : priceY - sz / 2 - pad;
        if (clickX >= x - sz / 2 && clickX <= x + sz / 2 && clickY >= cy - sz / 2 && clickY <= cy + sz / 2) {
          const lines = d.swaps.map((sw) => `${sw.side} $${sw.usd > 0 ? sw.usd.toFixed(0) : "0"}`);
          showTooltip(clickX, cy - sz / 2 - 4, lines);
          return;
        }
      }
    }
    
    /**
     * The swap bubbles, ombra's own test: an 18px square around the marker, sitting below
     * the candle for a buy and above it for a sell. Its tooltip is the answer to "how much",
     * in the same words ombra uses — `BUY $5`, `SELL $12`.
     */
    const swapHit = hitTestSwap(clickX, clickY);
    if (swapHit) {
      showTooltip(clickX, swapHit.cy - 13, swapHit.lines);
      return;
    }
chartTooltip = null;
  }

  let fetchingOlder = false;

  /**
   * Page older candles in when the view reaches the left edge. Ombra does the same in
   * `onVisibleRangeChange` → `fetchOlderCandles`. The logical range is re-applied after
   * the new data lands, offset by the number of candles prepended, so the view stays
   * where the user left it instead of jumping.
   */
  async function onVisibleRangeChange(logicalRange) {
    if (!logicalRange || fetchingOlder || !chart) return;
    if (logicalRange.from > 8) return;
    if (performance.now() < suppressOlderFetchUntil) return;
    if (!hasMoreCandles() || isLoadingOlder()) return;
    fetchingOlder = true;
    try {
      // Nothing to re-anchor here: `applyData` holds the viewport across the data swap.
      // Compensating from out here raced that swap -- the frame callback could land
      // before the new candles were projected, and the view moved anyway.
      await loadOlderCandles();
    } finally {
      fetchingOlder = false;
    }
  }

  /**
   * Ombra's `updateMigrationMarker`: the migration is pinned to a real candle and its
   * price is that candle's low. A raw sub-candle timestamp returns null from
   * `timeToCoordinate` on larger timeframes, so the marker would never draw.
   */
  function buildMigrationPoint() {
    const migration = markers.find((marker) => marker.kind === "MIGRATION");
    if (!migration) return null;
    const mt = Math.floor((migration.migratedAtTimestamp ?? 0) / 1000);
    if (!mt || candles.length === 0) return null;
    const times = candles.map((c) => c.time);
    let lo = 0;
    let hi = times.length - 1;
    if (mt < times[0]) return null;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (times[mid] <= mt) lo = mid;
      else hi = mid - 1;
    }
    const candle = candles[lo];
    if (!candle) return null;
    const price = Math.min(candle.low, candle.open, candle.close);
    return { time: candle.time, price };
  }

  /** Bar spacing Ombra clamps to when fitting would stretch the bars absurdly wide. */
  const MAX_RESET_BAR_SPACING = 30;
  const DEFAULT_BAR_SPACING = 10;

  /**
   * Ombra's `resetViewport`: fit every loaded candle across the width so the chart
   * opens spread out rather than right-aligned on the newest few. If the token is
   * sparse enough that fitting would give absurdly wide bars, fall back to a normal
   * spacing pinned to the live edge.
   */
  function resetViewport() {
    if (!chart || disposed) return;
    const timeScale = chart.timeScale();
    timeScale.fitContent();
    const count = candles.length;
    const width = container?.clientWidth ?? 0;
    if (count > 0 && width > 0 && width / count > MAX_RESET_BAR_SPACING) {
      timeScale.applyOptions({ barSpacing: DEFAULT_BAR_SPACING });
      timeScale.scrollToRealTime();
    }
  }

  function applyData() {
    if (!candleSeries || !chart || disposed) return;
    const rows = candles;
    const timeScale = chart.timeScale();

    // `setData` re-indexes the series: prepend a page of older candles and every candle
    // the user is looking at moves `prepended` indices to the right, and the viewport,
    // which is index-based, goes with it. So the view is held across the swap by the
    // INDEX range -- an exact number -- rather than by a time range: `getVisibleRange`
    // and `setVisibleRange` cannot extrapolate time and clamp to the data they can see,
    // which is not the window the user is actually on.
    //
    // Only candles EARLIER than the last projection count. Socket frames append, and an
    // append shifts nothing, so it must not be compensated for.
    const firstTime = rows[0]?.time ?? null;
    let prepended = 0;
    if (projectedFirstTime !== null && firstTime !== null && firstTime < projectedFirstTime) {
      let lo = 0;
      let hi = rows.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (rows[mid].time < projectedFirstTime) lo = mid + 1;
        else hi = mid;
      }
      prepended = lo;
    }
    const anchor = prepended > 0 ? timeScale.getVisibleLogicalRange() : null;
    // `scrollPosition()` is `rightOffset` in bars: 0 pinned at the live edge, NEGATIVE
    // once the user has panned back into history, so only the edge counts as live.
    const wasPinnedLive = Math.abs(timeScale.scrollPosition()) <= 1;

    candleSeries.setData(
      rows.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    );
    volumeSeries?.setData(
      rows.map((c) => ({
        time: c.time,
        value: c.volumeUsd ?? 0,
        color: c.close >= c.open ? withHexAlpha(tc("--t-grn"), "4D") : withHexAlpha(tc("--t-red"), "4D")
      }))
    );
    areaSeries?.setData(rows.map((c) => ({ time: c.time, value: c.close })));
    const nextViewportKey = `${chain}:${address}:${frame}`;
    const nextMagnitudeKey = `${chain}:${address}:${showMarketCap ? "marketCap" : "price"}`;
    const switched = nextViewportKey !== viewportKey;
    const magnitudeChanged = nextMagnitudeKey !== magnitudeKey;
    if (switched) viewportKey = nextViewportKey;
    if (magnitudeChanged) {
      magnitudeKey = nextMagnitudeKey;
      priceScaleResetPending = true;
    }

    // A dragged price axis pins the scale, so a low-cap token's range would survive the
    // switch to a high-cap one and the candles would sit off-screen. Ombra re-enables
    // autoscale on every magnitude change.
    if (priceScaleResetPending && rows.length > 0) {
      candleSeries.priceScale().applyOptions({ autoScale: true });
      priceScaleResetPending = false;
    }

    // Markers stay empty on purpose: Ombra clears its marker plugin and draws every
    // visual with the attached primitives below, so nothing gets a text label.
    markerPlugin?.setMarkers([]);
    swapPrimitive?.setData(buildSwapPoints());
    redrawPriceLines();
    callAvatarPrimitive?.setData(buildAvatarPoints());
    migrationPrimitive?.setData(buildMigrationPoint());

    // Fit only on a token / timeframe change — never on a socket tick, which would
    // fight the user's own pan and zoom.
    if (switched) {
      resetViewport();
      // `fitContent` parks the view at the left edge; without this the range listener
      // would treat that as a pan and immediately page in older candles.
      suppressOlderFetchUntil = performance.now() + 800;
    } else if (anchor) {
      timeScale.setVisibleLogicalRange({ from: anchor.from + prepended, to: anchor.to + prepended });
    } else if (wasPinnedLive) {
      timeScale.scrollToRealTime();
    }

    projectedFirstTime = firstTime;
  }

  onMount(() => {
    let cancelled = false;

    (async () => {
      const { createChart, CandlestickSeries, HistogramSeries, AreaSeries, createSeriesMarkers } =
        await import("lightweight-charts");
      if (cancelled || !container) return;

      // The pane's own backdrop is the page tone, not a panel one. This is fomo's own
      // choice, not ours to make: its chart config sets
      // `paneProperties.background: bgPrimary`, and a lighter backdrop reads as a slab of
      // a different colour behind the candles.
      const cBg = tc("--t-s0");
      const cText = tc("--t-g7");
      const cGrid = tc("--t-s8");
      const cBorder = tc("--t-bd2");
      const cGrn = tc("--t-grn");
      const cRed = tc("--t-red");

      chart = createChart(container, {
        // Let the library observe its own container. Manually copying clientWidth /
        // contentRect left the chart narrower than the box by however much the layout
        // moved, and the leftover showed as a strip right of the price scale.
        autoSize: true,
        layout: { background: { color: cBg }, textColor: cText, fontFamily: "monospace", fontSize: 11 },
        grid: { vertLines: { color: cGrid }, horzLines: { color: cGrid } },
        crosshair: { mode: 0 },
        timeScale: {
          borderColor: cBorder,
          timeVisible: true,
          secondsVisible: false,
          allowShiftVisibleRangeOnWhitespaceReplacement: false,
          tickMarkFormatter: (time, tickMarkType) => {
            const d = new Date(time * 1000);
            if (tickMarkType >= 3) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            if (tickMarkType === 2) return d.toLocaleDateString([], { day: "numeric" });
            if (tickMarkType === 1) return d.toLocaleDateString([], { month: "short", day: "numeric" });
            return d.toLocaleDateString([], { year: "numeric", month: "short" });
          }
        },
        rightPriceScale: { borderColor: cBorder, mode: 0 },
        localization: {
          priceFormatter: (price) => priceFormatter(price),
          timeFormatter: (time) =>
            new Date(time * 1000).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
        }
      });

      candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: cGrn,
        downColor: cRed,
        borderUpColor: cGrn,
        borderDownColor: cRed,
        wickUpColor: cGrn,
        wickDownColor: cRed,
        priceFormat: { type: "custom", formatter: (p) => priceFormatter(p), minMove: 1e-20 }
      });

      volumeSeries = chart.addSeries(HistogramSeries, {
        color: withHexAlpha(cGrn, "4D"),
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        lastValueVisible: false,
        baseLineVisible: false
      });
      chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, visible: false });

      areaSeries = chart.addSeries(AreaSeries, {
        lineWidth: 0,
        lineColor: "transparent",
        topColor: withHexAlpha(cGrn, "2E"),
        bottomColor: withHexAlpha(cGrn, "08"),
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: "custom", formatter: (p) => priceFormatter(p), minMove: 1e-20 }
      });

      markerPlugin = createSeriesMarkers(candleSeries, []);
      swapPrimitive = new SwapPrimitive();
      candleSeries.attachPrimitive(swapPrimitive);

      /**
       * Dragging a level. lightweight-charts has no draggable price line, so the pointer is
       * tracked here: pick up the line nearest the cursor, move it with the pointer while the
       * chart's own panning is switched off, then commit the level it lands on.
       */
      let dragging = null;
      const NEAR = 7;
      const nearestHandle = (event) => {
        const y = event.clientY - container.getBoundingClientRect().top;
        let best = null;
        let bestDistance = NEAR;
        for (const handle of lineHandles) {
          const lineY = candleSeries.priceToCoordinate(Number(handle.line.options().price));
          if (lineY === null) continue;
          const distance = Math.abs(lineY - y);
          if (distance <= bestDistance) {
            best = handle;
            bestDistance = distance;
          }
        }
        return best;
      };
      const onPointerDown = (event) => {
        if (event.button !== 0) return;
        const handle = nearestHandle(event);
        if (!handle) return;
        event.preventDefault();
        const startPrice = Number(handle.line.options().price);
        dragging = { handle, startPrice };
        draggingLevel = true;
        // The redraw rebuilds these lines from the committed levels, so between frames the drag has
        // to hold its own value or the line snaps back under the finger.
        if (handle.key) pendingLevels.set(handle.key, startPrice);
        chart.applyOptions({ handleScroll: false, handleScale: false });
        container.setPointerCapture?.(event.pointerId);
        container.style.cursor = "ns-resize";
      };
      const onPointerMove = (event) => {
        if (!dragging) {
          container.style.cursor = nearestHandle(event) ? "ns-resize" : "";
          return;
        }
        const value = candleSeries.coordinateToPrice(event.clientY - container.getBoundingClientRect().top);
        if (value === null || value === undefined) return;
        const { handle } = dragging;
        const landed = Math.min(Math.max(Number(value), handle.min), handle.max);
        // both: the line under the finger now, and the value every redraw must respect
        handle.line.applyOptions({ price: landed });
        if (handle.key) pendingLevels.set(handle.key, landed);
      };
      const onPointerUp = async (event) => {
        if (!dragging) return;
        const { handle, startPrice } = dragging;
        dragging = null;
        draggingLevel = false;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        container.releasePointerCapture?.(event.pointerId);
        container.style.cursor = "";
        const landed = Number(handle.line.options().price);
        console.info(
          "[drag] release " + JSON.stringify({ landed, startPrice, bounds: [handle.min, handle.max] })
        );
        if (landed === startPrice) {
          // nothing moved, so nothing is pending any more
          if (handle.key) pendingLevels.delete(handle.key);
          return;
        }
        // a refused level goes back where it was, rather than staying where the finger left it
        if (!(await handle.commit(landed))) handle.line.applyOptions({ price: startPrice });
      };
      container.addEventListener("pointerdown", onPointerDown);
      container.addEventListener("pointermove", onPointerMove);
      container.addEventListener("pointerup", onPointerUp);
      container.addEventListener("pointercancel", onPointerUp);
      callAvatarPrimitive = new CallAvatarPrimitive();
      candleSeries.attachPrimitive(callAvatarPrimitive);
      setAvatarLoadHook(() => applyData());
      migrationPrimitive = new MigrationPrimitive();
      candleSeries.attachPrimitive(migrationPrimitive);

      // Both dimensions: the wrapper is flex-grown, so the chart must follow height as
      // well or it keeps whatever height the container happened to have at mount.
      chart.subscribeClick(handleChartClick);
      chart.subscribeCrosshairMove(handleCrosshairMove);
      chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleRangeChange);


      // Ombra's cold-load fix: colours were read before the stylesheet had necessarily
      // applied its variables, and the container may not have been laid out yet, so both
      // are re-applied once the browser has settled. Without the size here the chart
      // keeps whatever height the container happened to report at creation.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (disposed || !chart) return;
          chart.applyOptions({
            layout: { background: { color: tc("--t-s0") }, textColor: tc("--t-g7") }
          });
        })
      );

      applyData();
    })();

    return () => {
      cancelled = true;
      disposed = true;
      chart?.remove();
      chart = null;
    };
  });

  // Re-seed and re-subscribe when the route's token changes.
  $effect(() => {
    const c = chain;
    const a = address;
    if (c && a) untrack(() => selectChart(c, a));
    return () => stopChart();
  });

  // Redraw whenever the candles or markers change — the socket pushes both.
  $effect(() => {
    candles;
    markers;
    markerPrefs;
    untrack(() => applyData());
  });
</script>

<div class="relative isolate flex flex-col w-full h-full min-h-0">
  <div class="relative flex-1 min-h-0 w-full h-full">
    {#if loading && candles.length === 0}
      <div class="absolute inset-0 flex items-center justify-center text-xs text-text-tertiary">
        Loading chart…
      </div>
    {/if}
    <!-- The library measures the pointer as `clientX - rect.left` (scaled pixels) while its
         own coordinate space is the element's unscaled layout size, so inside the fitted
         box (src/lib/utils/fit.js) a hover read a different candle than the one under the
         cursor. The mount is counter-scaled to cancel the box's transform: the chart then
         measures and draws 1:1 with the screen, and the box scales the result back onto
         the pane. The tooltip below stays outside this wrapper, in the box's own space. -->
    <div class="absolute inset-0 overflow-hidden">
      <div
        bind:this={container}
        style="width: calc(100% * var(--fit-scale, 1)); height: calc(100% * var(--fit-scale, 1)); transform: scale(calc(1 / var(--fit-scale, 1))); transform-origin: 0 0;"
      ></div>
    </div>
  </div>

  <!-- The frame bar draws on the page colour, the same one the pane above it uses: the
       panel behind is the capture's own tone, which here reads as a lighter strip under
       the chart. -->
  <div class="flex items-center gap-1 px-2 py-1 shrink-0 overflow-x-auto no-scrollbar bg-bg-primary">
    {#each FRAMES as option (option)}
      <button
        type="button"
        class={option === frame
          ? "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-xs font-bold leading-none whitespace-nowrap bg-bg-tertiary text-text-primary"
          : "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-text-tertiary text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary"}
        onclick={() => setFrame(option)}
      >{option}</button>
    {/each}

    <!-- Price / market cap, ported from Ombra's TokenChart toggle. Its background stays on
         in both modes, so the control reads as a button at rest; only the text colour says
         which mode is showing. -->
    <button
      type="button"
      class="ml-auto shrink-0 cursor-pointer flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all duration-150 bg-bg-tertiary {showMarketCap
        ? "text-text-primary"
        : "text-text-tertiary hover:text-text-primary"}"
      title={showMarketCap ? "Showing Market Cap" : "Showing Price"}
      onclick={() => setMode(showMarketCap ? "price" : "marketCap")}
    >
      {#if showMarketCap}
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="M18 17V9" />
          <path d="M13 17V5" />
          <path d="M8 17v-3" />
        </svg>
        MC
      {:else}
        <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" x2="12" y1="2" y2="22" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
        Price
      {/if}
    </button>
  </div>
</div>

{#if chartTooltip}
  <!-- `toViewport` hands this viewport coordinates, and the app around it is scaled to fit
       (src/lib/utils/fit.js), so they are divided back into the scaled box's own space:
       the transform then puts the tooltip back where the pointer is. -->
  <div
    class="fixed z-50"
    style="left: calc({chartTooltip.x}px / var(--fit-scale, 1)); top: calc({chartTooltip.y}px / var(--fit-scale, 1)); transform: translate(-50%, -100%);"
  >
    {#if chartTooltip.posts && !chartTooltip.kol}
      {@const p = chartTooltip.posts}
      <div class="overflow-hidden rounded-xl border border-bg-tertiary-solid bg-bg-secondary shadow-lg" style="width: 19rem;">
        <div class="flex items-center gap-2 border-b border-bg-tertiary-solid px-3 py-2">
          <span class="text-[11px] font-bold uppercase tracking-wider text-text-primary">Posts</span>
          <span class="rounded-full bg-bg-tertiary px-1.5 py-px text-[10px] font-bold tabular-nums text-text-secondary">
            {p.theses.length + p.tweets.length}
          </span>
          <button type="button" class="ml-auto text-text-tertiary hover:text-text-primary" onclick={() => (chartTooltip = null)} aria-label="Close">&times;</button>
        </div>
        <div class="flex max-h-72 flex-col gap-1.5 overflow-y-auto p-1.5">
          {#each p.theses as thesis (thesis.id)}
            {@const label = thesis.labels?.[0]}
            <div class="rounded-lg bg-bg-primary p-2">
              <div class="flex items-center gap-2">
                <img src={avatarUrl(label?.photoId) ?? "/images/nohomo-eyes.png"} alt="" class="h-5 w-5 shrink-0 rounded-full object-cover" />
                <span class="min-w-0 flex-1 truncate text-[11px] font-semibold text-text-primary">{label?.label ?? "Anon"}</span>
                <span class="shrink-0 text-[10px] tabular-nums text-text-tertiary">{ageFromSeconds(thesis.ageSeconds)}</span>
              </div>
              <p class="mt-1.5 line-clamp-6 whitespace-pre-wrap break-words leading-relaxed text-text-secondary" style="font-size: 11.5px;">{thesis.text}</p>
              {#if thesis.likes > 0 || thesis.marketCapUsd}
                <div class="mt-1.5 flex items-center gap-1">
                  {#if thesis.marketCapUsd}
                    <span class="rounded bg-bg-tertiary-solid px-1.5 py-0.5 text-[10px] tabular-nums text-text-secondary">{formatUsd(String(thesis.marketCapUsd))}</span>
                  {/if}
                  {#if thesis.likes > 0}
                    <span class="rounded bg-bg-tertiary-solid px-1.5 py-0.5 text-[10px] tabular-nums text-text-secondary">{formatCompact(thesis.likes)} likes</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
          {#each p.tweets as tweet (tweet.id)}
            <a href={tweet.url} target="_blank" rel="noopener" class="block rounded-lg bg-bg-primary p-2">
              <div class="flex items-center gap-2">
                <img src={photoResolve(tweet.photoId) ?? "/images/nohomo-eyes.png"} alt="" class="h-5 w-5 shrink-0 rounded-full object-cover" />
                <span class="min-w-0 flex-1 truncate text-[11px] font-semibold text-text-primary">{tweet.name ?? tweet.handle}</span>
                <span class="shrink-0 text-[10px] tabular-nums text-text-tertiary">{ageFromSeconds(tweet.ageSeconds)}</span>
              </div>
              <p class="mt-1.5 line-clamp-6 whitespace-pre-wrap break-words leading-relaxed text-text-secondary" style="font-size: 11.5px;">{tweet.text}</p>
              <div class="mt-1.5 flex items-center gap-1">
                <span class="truncate rounded bg-bg-tertiary-solid px-1.5 py-0.5 text-[10px] text-text-secondary">@{tweet.handle}</span>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {:else if chartTooltip.kol}
      {@const k = chartTooltip.kol}
      <div class="w-64 rounded-lg border border-bg-tertiary-solid bg-bg-secondary shadow-lg">
        <div class="flex items-center justify-between border-b border-bg-tertiary-solid px-3 py-2">
          <span class="text-[11px] font-bold text-text-primary">{k.rows.length} wallet{k.rows.length !== 1 ? "s" : ""}</span>
          <button type="button" class="text-text-tertiary hover:text-text-primary" onclick={() => (chartTooltip = null)} aria-label="Close"><span class="text-sm leading-none">&times;</span></button>
        </div>
        <div class="flex items-center gap-3 border-b border-bg-tertiary-solid px-3 py-1.5 text-[11px]">
          <span class="text-green">{k.buyCount} buy{k.buyCount !== 1 ? "s" : ""} · {formatUsd(k.totalBuyUsd.toString())}</span>
          <span class="text-red">{k.sellCount} sell{k.sellCount !== 1 ? "s" : ""} · {formatUsd(k.totalSellUsd.toString())}</span>
        </div>
        <div class="flex flex-col overflow-y-auto py-1" style="max-height: 13rem;">
          {#each k.rows as r (r.walletAddress)}
            <div class="flex items-center gap-2 px-3 py-1.5">
              <img src={r.photoUrl ?? "/images/nohomo-eyes.png"} alt="" class="h-5 w-5 shrink-0 rounded-full object-cover" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1 truncate text-[11px] font-medium text-text-primary">
                  {#if r.isDev}
                    <span class="shrink-0 rounded px-1 py-px font-bold text-yellow" style="font-size: 9px; background-color: rgba(249, 228, 91, 0.2);">DEV</span>
                    <span class="truncate font-mono">{shortAddress(r.walletAddress)}</span>
                  {:else}
                    <span class="truncate">{r.name !== "?" ? r.name : shortAddress(r.walletAddress)}</span>
                  {/if}
                </div>
                <div class="flex items-center gap-2 text-[10px]">
                  {#if r.buys > 0}<span class="text-green">{r.buys} buy{r.buys !== 1 ? "s" : ""} · {formatUsd(r.buyUsd)}</span>{/if}
                  {#if r.sells > 0}<span class="text-red">{r.sells} sell{r.sells !== 1 ? "s" : ""} · {formatUsd(r.sellUsd)}</span>{/if}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if chartTooltip.lines}
      <div class="rounded-lg border border-bg-tertiary-solid bg-bg-secondary px-2.5 py-1.5 shadow-lg">
        {#each chartTooltip.lines as line}
          <div class="whitespace-nowrap text-[11px] font-medium text-text-primary">{line}</div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
