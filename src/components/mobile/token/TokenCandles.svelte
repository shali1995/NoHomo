<!--
  The token's chart, drawn by our fork of `liveline-svelte`.

  The capture paints its chart with Skia — a canvas library of its own — and we are not going to
  hand-roll a second one: the last attempt at that was a canvas with axes bolted on, and it
  showed. `Liveline` is the same idea done properly: canvas, Svelte 5, candles, a price scale, a
  crosshair readout, particles when the price runs, and a smooth live candle.

  What it does not have is a way back through time: it is a live trailing window, and its own
  gesture handling gives a sideways drag to scrubbing and an up/down drag to the page. So the
  library is vendored under `src/lib/vendor/liveline` (MIT, npm 0.0.3) with one prop added —
  `viewOffset`, the seconds the view sits back from the live edge — and the dragging itself lives
  here:

    - a finger dragged sideways walks the window back and forth, and the clock is frozen while it
      is away from the live edge so what you are looking at does not drift under you;
    - a finger dragged up or down widens or narrows the window, which is the zoom the library
      already has through `window` — no patch was needed for that one;
    - a double tap comes home to the live edge and the frame's own scale.

  The data is ours throughout: `chart.svelte.js` holds the frame's candles, the frame strip drives
  both the API's timeframe and the candle width here, and panning far enough back asks that module
  for another page of history.
-->
<script>
  import Liveline from "../../../lib/vendor/liveline/Liveline.svelte";
  import { getFrame, hasMoreCandles, loadOlderCandles } from "../../../lib/api/chart.svelte.js";
  import { formatCompact, formatPrice, getToken } from "../../../lib/api/token.svelte.js";
  import { positionsFor } from "../../../lib/api/trade.svelte.js";
  import { mobilePriceLevels } from "../../../lib/mobile-chart-levels.js";
  import LiveLevels from "./LiveLevels.svelte";

  let { candles = [], type = "candles", mode = "price", address = "" } = $props();

  /** The channel's own frame names, in the seconds the library wants. */
  const FRAME_SECONDS = {
    "1s": 1,
    "5s": 5,
    "15s": 15,
    "30s": 30,
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "6h": 21600,
    "12h": 43200,
    "24h": 86400
  };

  /** How many candles the plot shows at once — the capture's window, near enough. */
  const VISIBLE_CANDLES = 60;
  /** How far a finger has to move down the chart to double the window, in dp. */
  const ZOOM_TRAVEL = 160;
  /** The zoom the window may take, as a multiple of the frame's own 60 candles. */
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;
  /** A finger has to move this far before a drag is a pan rather than a tap. */
  const SLOP = 6;
  /**
   * How near the live edge a drag has to end to be taken as "at the live edge". Two bars: a
   * finger that wobbles sideways while zooming must not leave the chart stranded in the past.
   */
  const SNAP_BARS = 2;

  const frameSeconds = $derived(FRAME_SECONDS[getFrame()] ?? 60);
  /** The frame's own window, which is what the zoom is a multiple of. */
  const baseWindow = $derived(frameSeconds * VISIBLE_CANDLES);

  let panSeconds = $state(0);
  let zoom = $state(1);
  /**
   * Where the price scale sits vertically, as a fraction of its own height. The chart's own scale
   * always fits the candles; a reader who zooms out to see a resting buy or a stop needs to be
   * able to push the candles up or down to look at it, without moving the market.
   */
  let valueOffset = $state(0);
  const windowSeconds = $derived(baseWindow * zoom);
  /** Away from the live edge the chart stops following it, so the view holds still. */
  const away = $derived(panSeconds > 0.5);

  /** The series in the shape the library draws: numbers, oldest first. */
  const series = $derived(
    (candles ?? [])
      .map((candle) => ({
        time: Number(candle.time),
        open: Number(candle.open),
        high: Number(candle.high),
        low: Number(candle.low),
        close: Number(candle.close)
      }))
      .filter((candle) => Number.isFinite(candle.time) && Number.isFinite(candle.close))
  );

  /** The same closes as a line, which is what the chart-type button switches to. */
  const closes = $derived(series.map((candle) => ({ time: candle.time, value: candle.close })));
  const last = $derived(series.length > 0 ? series[series.length - 1].close : 0);

  /**
   * The price the market is on right now — the same figure the header prints, fed by the
   * price socket. The candle series only grows when a candle *closes*, so this is what makes
   * the candle still forming move between closes, the way a trading chart does.
   */
  const livePrice = $derived(Number(getToken()?.quote?.priceUsdStr ?? 0) || 0);

  /**
   * The chart's own unit. On the price axis a candle is a price; on the market-cap axis the same
   * candle is that price times the supply — which is the series the API returns in this mode, so
   * everything that has to meet the candles (the live value, and the account's own levels) is
   * carried across with the supply.
   */
  const inCap = $derived(mode === "marketCap");
  const supply = $derived(Number(getToken()?.totalSupply ?? getToken()?.quote?.totalSupply ?? 0) || 0);
  /** A price as the axis draws it. */
  const asChart = (price) => (inCap && supply > 0 ? Number(price) * supply : Number(price));
  /** And back, which is the unit every level-moving call is written in. */
  const asPrice = (value) => (inCap && supply > 0 ? Number(value) / supply : Number(value));
  /** The market's own value on this axis. */
  const liveMark = $derived(
    inCap
      ? Number(getToken()?.quote?.marketCapUsdStr ?? 0) || (livePrice > 0 ? livePrice * supply : 0)
      : livePrice
  );

  /** The bucket the clock is inside, in the frame's own seconds. */
  const bucketStart = (seconds) => Math.floor(seconds / frameSeconds) * frameSeconds;

  /**
   * The candle still forming. When the series' newest candle is the bucket we are inside it is
   * that candle and it grows; when the market has already moved past it, it is a new bucket
   * opening at the live price. `committed` is everything before it — the library wants the
   * forming candle apart, because that is what its live dot and its smooth open/high/low/close
   * interpolation work on.
   */
  const liveCandle = $derived.by(() => {
    if (series.length === 0) return undefined;
    const newest = series[series.length - 1];
    const price = liveMark > 0 ? liveMark : newest.close;
    if (bucketStart(Date.now() / 1000) === bucketStart(newest.time)) {
      return {
        time: newest.time,
        open: newest.open,
        high: Math.max(newest.high, price),
        low: Math.min(newest.low, price),
        close: price
      };
    }
    const start = bucketStart(Date.now() / 1000);
    return { time: start, open: price, high: price, low: price, close: price };
  });

  /** The series' own newest candle is the forming one only while it is still the live bucket. */
  const forming = $derived(
    series.length > 0 && bucketStart(Date.now() / 1000) === bucketStart(series[series.length - 1].time)
  );
  const committed = $derived(forming ? series.slice(0, -1) : series);
  /** Nothing is still forming in the past, so a panned chart passes no live candle. */
  const live = $derived(away ? undefined : liveCandle);
  /** The figures the tip follows: the market's price, not the last candle's close. */
  const newestPrice = $derived(liveMark > 0 ? liveMark : last);

  /** The price, or the market cap: the axis this page keeps the chart on. */
  function formatAmount(amount) {
    return mode === "marketCap" ? `$${formatCompact(amount)}` : formatPrice(amount);
  }

  /** Clock for the short frames, the date once a candle is a day long. */
  function timeLabel(seconds, step) {
    const at = new Date(seconds * 1000);
    if ((step ?? frameSeconds) >= 86400) {
      return at.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return at.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  /* --- The drag ------------------------------------------------------------------------- */

  let box = $state(null);
  let drag = null;
  let lastTap = 0;

  function clampZoom(value) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }

  /** How far the scale may be pushed: three of its own heights, so it can never be lost. */
  function clampShift(value) {
    return Math.min(3, Math.max(-3, value));
  }

  function down(event) {
    if (!box) return;
    // This runs on the way down, before the overlay sees anything. A level in hand, or a press
    // that landed on one, is the overlay's gesture: if the chart took it instead, it would pan
    // and the level could never be picked up.
    if (gesture.blocked || gesture.hit?.(event.clientY - box.getBoundingClientRect().top)) return;

    // Only touch pans: on a pointer device liveline's own hover scrubbing stays the gesture.
    if (event.pointerType !== "touch") return;
    event.stopPropagation();
    /**
     * Where a vertical drag means what. On the price gutter — the labels down the right of the
     * plot — it scales the scale; anywhere on the candles it moves them, so a chart being read can
     * be pushed about without its zoom changing under the reader's hand.
     */
    const layout = layoutRef;
    const onPriceAxis = layout ? event.clientX - box.getBoundingClientRect().left > layout.w - layout.pad.right : false;
    drag = {
      x: event.clientX,
      y: event.clientY,
      pan: panSeconds,
      zoom,
      value: valueOffset,
      onPriceAxis,
      moved: false,
      axis: null
    };
  }

  function move(event) {
    if (!drag) return;
    event.stopPropagation();
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < SLOP) return;
    drag.moved = true;
    /**
     * A gesture is one thing or the other, decided once by which way it first travelled. A
     * finger dragged up or down is zooming, and the sideways wobble that comes with it must not
     * also walk the window into the past — that is what left the chart stranded a minute behind
     * the market, needing a sideways drag to come home.
     */
    if (!drag.axis) {
      // On the gutter the only thing a drag can mean is the scale; on the plot it is either axis.
      drag.axis = drag.onPriceAxis ? "scale" : Math.abs(dx) > Math.abs(dy) ? "pan" : "shift";
    }
    if (drag.axis === "scale") {
      // Down opens the window out, up closes it in — the axis a pinch would use.
      zoom = clampZoom(drag.zoom * Math.exp(dy / ZOOM_TRAVEL));
      return;
    }
    if (drag.axis === "pan") {
      // The content follows the finger: right is further back, and the window keeps its width.
      const secondsPerPx = windowSeconds / (box?.clientWidth || 1);
      panSeconds = Math.max(0, drag.pan + dx * secondsPerPx);
      return;
    }
    /**
     * Vertically the candle follows the finger: pull down and the scale moves up, which is how a
     * resting buy below the market is brought into view. The shift is a share of the scale, so it
     * stays put when the scale is later zoomed.
     */
    const plotHeight = layoutRef?.chartH || box?.clientHeight || 1;
    valueOffset = clampShift(drag.value + dy / plotHeight);
  }

  /** Two bars of the window's width, in seconds: how near the edge counts as being on it. */
  const snapSeconds = $derived((windowSeconds / VISIBLE_CANDLES) * SNAP_BARS);

  function up(event) {
    if (!drag) return;
    event.stopPropagation();
    const wasTap = !drag.moved;
    const axis = drag.axis;
    drag = null;
    if (!wasTap && axis === "pan") {
      // Released within a whisker of the live edge: take it as the live edge, so the chart
      // follows the market again instead of sitting just short of it.
      if (panSeconds < snapSeconds) panSeconds = 0;
      return;
    }
    if (!wasTap) return;
    const now = Date.now();
    if (now - lastTap < 320) {
      lastTap = 0;
      // the way home: live, the frame's own scale, and the scale's own place
      panSeconds = 0;
      zoom = 1;
      valueOffset = 0;
      return;
    }
    lastTap = now;
  }

  /* --- The account's own levels --------------------------------------------------------- */

  /**
   * The chart's own price -> y mapping, handed over by the library on every frame. It is
   * deliberately not reactive state: it changes sixty times a second and nothing renders from it
   * — the level lines read it from their own frame loop.
   */
  let layoutRef = null;

  /**
   * What the level overlay owns, asked before this handler — which runs in the capture phase, so
   * it sees every press first — decides to pan. Without it a press on a level pans the chart and
   * the level is never picked up: `hit` says a press landed on a line, `blocked` says one is
   * already in hand.
   */
  const gesture = { hit: null, blocked: false };

  /**
   * The trade's levels, in the rules the desktop keeps them in: which lines exist, what they are
   * called, what a move must send back, and what each one is measured from.
   */
  const levels = $derived.by(() => {
    const position = positionsFor(address)[0] ?? null;
    // `market` is what a resting buy is clamped under, and the fallback anchor for a percent
    // target on an order that has not filled yet — the desktop's own two uses for it.
    /**
     * The levels are worked out in prices — the unit the store and the move calls speak — and
     * carried onto the axis the candles are drawn on. The clamps come across too, since they are
     * compared against the same scale.
     */
    return mobilePriceLevels(position, candles).map((level) => ({
      ...level,
      price: asChart(level.price),
      entry: asChart(level.entry),
      market: newestPrice
    }));
  });

  /**
   * Panning far enough back asks for another page. The module pages 300 candles at a time and
   * guards itself against asking twice, so this only has to notice the approach.
   */
  $effect(() => {
    if (!away || series.length === 0) return;
    const oldest = series[0].time;
    const edge = Date.now() / 1000 - panSeconds - windowSeconds;
    if (edge <= oldest + frameSeconds && hasMoreCandles()) void loadOlderCandles();
  });
</script>

<div
  class="chart"
  bind:this={box}
  onpointerdowncapture={down}
  onpointermovecapture={move}
  onpointerupcapture={up}
  onpointercancelcapture={up}
>
  <Liveline
    data={closes}
    value={newestPrice}
    color="#04c249"
    theme="dark"
    grid
    badge
    momentum
    fill
    pulse
    degen
    exaggerate
    showValue
    valueMomentumColor
    scrub
    mode="candle"
    candles={committed}
    liveCandle={live}
    candleWidth={frameSeconds}
    lineMode={type === "line"}
    lineData={closes}
    lineValue={newestPrice}
    window={windowSeconds}
    viewOffset={panSeconds}
    valueOffset={valueOffset}
    paused={away}
    referenceLine={{ value: newestPrice, label: formatAmount(newestPrice) }}
    formatValue={formatAmount}
    formatTime={timeLabel}
    emptyText=""
    onLayout={(next) => (layoutRef = next)}
  />

  <LiveLevels {address} {levels} {gesture} toprice={asPrice} layout={() => layoutRef} />
</div>

<style>
  /*
   * The plot stops short of the frame strip: the capture's 364 dp would run past it, and the
   * library draws its time axis in the plot's own bottom padding — so at 364 the times landed on
   * top of the frames. 343 dp is the space that is actually there; 335 leaves the axis a small
   * breath above the chips rather than crowding them.
   */
  .chart {
    position: absolute;
    top: 13.5px;
    left: 0;
    width: 100%;
    height: 335px;
    /* A sideways drag is the chart's own, so the page must not take it first. */
    touch-action: none;
  }
</style>
