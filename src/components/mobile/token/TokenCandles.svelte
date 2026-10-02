<!--
  The token's chart, drawn by `liveline-svelte`.

  The capture paints its chart with Skia — a canvas library of its own — and we are not going
  to hand-roll a second one: the last attempt at that was a canvas with axes bolted on, and it
  showed. `Liveline` is the same idea done properly: canvas, Svelte 5, candles, a price scale,
  a crosshair that reads out under the finger, and — the part the hand-rolled one got wrong —
  its own touch handling (`touch-action: pan-y pinch-zoom`, so a sideways drag scrubs the chart
  while an up or down drag still scrolls the page).

  The data is ours. `chart.svelte.js` holds the frame's candles (unix seconds, the shape
  `CandlePoint` wants) and the frame strip drives both the API's timeframe and the candle width
  here, so one candle is one candle on both sides.

  One thing this gives up, and it is worth knowing: liveline keeps its price -> y scale to
  itself and draws at most one `referenceLine` of its own, so the account's dip, take profit
  and stop are not drawn over this chart. The exit plan is still set from the position card
  below it; putting the levels back on the candles needs the library to hand out its scale.
-->
<script>
  import { Liveline } from "liveline-svelte";
  import { getFrame } from "../../../lib/api/chart.svelte.js";
  import { formatCompact, formatPrice } from "../../../lib/api/token.svelte.js";

  let { candles = [], type = "candles", mode = "price" } = $props();

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

  const frameSeconds = $derived(FRAME_SECONDS[getFrame()] ?? 60);

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
   * The newest candle is the one still forming, and the library wants it apart: it is what the
   * price pill and the live dot track. Committed candles end one earlier.
   */
  const committed = $derived(series.length > 1 ? series.slice(0, -1) : series);
  const live = $derived(series.length > 0 ? series[series.length - 1] : undefined);

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
</script>

<div class="chart">
  <Liveline
    data={closes}
    value={last}
    color="#04c249"
    theme="dark"
    grid
    badge
    momentum={false}
    fill={false}
    pulse={false}
    degen={false}
    scrub
    mode="candle"
    candles={committed}
    {live}
    candleWidth={frameSeconds}
    lineMode={type === "line"}
    lineData={closes}
    lineValue={last}
    window={frameSeconds * VISIBLE_CANDLES}
    referenceLine={{ value: last, label: formatAmount(last) }}
    formatValue={formatAmount}
    formatTime={timeLabel}
    emptyText=""
  />
</div>

<style>
  /*
   * The plot stops where the frame strip starts: the capture's 364 dp would run 21 dp past it,
   * and the library draws its time axis in the plot's own bottom padding — so at 364 the times
   * land on top of the frames. 343 dp is the space that is actually there (the strip's top when
   * the chart's is at 13.5 dp), and it leaves the axis sitting right above the chips.
   */
  .chart {
    position: absolute;
    top: 13.5px;
    left: 0;
    width: 100%;
    height: 343px;
  }
</style>
