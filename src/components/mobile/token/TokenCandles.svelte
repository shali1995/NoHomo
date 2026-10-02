<!--
  The token's chart, drawn on a canvas at the capture's own geometry.

  The capture paints this with Skia, so its candles exist only in its screenshot: nothing in
  its node tree carries a price or a scale. What it does fix is the drawing, and those numbers
  are copied here — a 6.93 dp pitch with 5.87 dp filled bodies and a 1.07 dp gap, a 0.53 dp
  wick, a 2 x 2 dp dot lattice at 9.2 x 9.0 dp that drifts a third of a pixel per row, a
  dashed last-price rule, and a price pill 7 dp inside the right edge.

  The series is ours (`chart.svelte.js`): the candles the API returns for the selected frame,
  newest at the right edge of the plot. A young token simply has fewer candles than the
  capture's window, which leaves the left of the plot empty rather than stretching the pitch.

  The price -> y mapping is `mobileChartLayout` (src/lib/mobile-chart-levels.js), which the
  account's own level lines are placed with too: those lines are HTML over this canvas, so a
  second copy of the arithmetic here would let the two drift apart. The lines themselves are
  `ChartLevels.svelte`; this file stays the drawing. Levels are read in price terms, which is the
  axis the phone keeps this chart on (`TokenScreen` pins `setMode("price")`) — `mode` is carried
  for the pill's own formatting.
-->
<script>
  import { formatCompact, formatPrice } from "../../../lib/api/token.svelte.js";
  import { mobileChartLayout, PLOT_RIGHT } from "../../../lib/mobile-chart-levels.js";
  import ChartLevels from "./ChartLevels.svelte";

  let { candles = [], type = "candles", mode = "price", address = "" } = $props();

  /** The capture's metrics, in dp, and the right edge of the candle field. */
  const PITCH = 6.93;
  const BODY = 5.87;
  const WICK = 0.53;
  const DOT = 2;
  const DOT_X = 9.2;
  const DOT_Y = 9.0;
  const GREEN = "#04c249";
  const RED = "#ff5121";

  let canvas = $state(null);
  let width = $state(480);
  let height = $state(364);

  $effect(() => {
    const el = canvas;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      width = el.clientWidth || 480;
      height = el.clientHeight || 364;
    });
    observer.observe(el);
    return () => observer.disconnect();
  });

  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x + w, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrid(ctx, w, h) {
    ctx.fillStyle = "#161521";
    const rows = Math.ceil(h / DOT_Y) + 1;
    for (let row = 0; row < rows; row++) {
      const y = row * DOT_Y;
      // The capture's lattice is a hair off square: each row starts a third of a pixel further right.
      const offset = (row * 0.33) % DOT_X;
      for (let x = offset; x <= w; x += DOT_X) {
        ctx.fillRect(x, y, DOT, DOT);
      }
    }
  }

  function drawCandles(ctx, rows, scaleY, kind) {
    const shown = rows.slice(-Math.floor(PLOT_RIGHT / PITCH));
    const x0 = PLOT_RIGHT - shown.length * PITCH;

    if (kind === "line") {
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      shown.forEach((candle, index) => {
        const x = x0 + index * PITCH + PITCH / 2;
        const y = scaleY(Number(candle.close));
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      return;
    }

    shown.forEach((candle, index) => {
      const open = Number(candle.open);
      const close = Number(candle.close);
      const high = Number(candle.high);
      const low = Number(candle.low);
      const cx = x0 + index * PITCH + PITCH / 2;
      const up = close >= open;
      ctx.fillStyle = up ? GREEN : RED;
      const wickTop = scaleY(high);
      const wickBottom = scaleY(low);
      if (wickBottom > wickTop) ctx.fillRect(cx - WICK / 2, wickTop, WICK, wickBottom - wickTop);
      const top = scaleY(Math.max(open, close));
      const bottom = scaleY(Math.min(open, close));
      ctx.fillRect(cx - BODY / 2, top, BODY, Math.max(1, bottom - top));
    });
  }

  function draw(ctx, series, kind, chartMode, w, h) {
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);

    const rows = (series ?? []).filter(
      (candle) =>
        Number.isFinite(Number(candle.high)) &&
        Number.isFinite(Number(candle.low)) &&
        Number.isFinite(Number(candle.close))
    );
    if (rows.length === 0) return;

    // The scale, from the one helper the level lines read as well.
    const layout = mobileChartLayout(rows, h);
    const scaleY = layout.scaleY;

    drawCandles(ctx, rows, scaleY, kind);

    const last = layout.last;
    const lineY = scaleY(last);

    // The last-price rule: the accent at 40%, dashes 3.7 dp with a 4.3 dp gap, stopping at
    // the candle field's right edge where the pill takes over.
    ctx.strokeStyle = "rgba(4, 194, 73, 0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3.7, 4.3]);
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(PLOT_RIGHT, lineY);
    ctx.stroke();
    ctx.setLineDash([]);

    const label = chartMode === "marketCap" ? `$${formatCompact(last)}` : formatPrice(last);
    ctx.font = '500 14px Aeonik, ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // 61.9 dp is the capture's pill; a longer price grows it, but never past the canvas.
    const pillWidth = Math.min(Math.max(61.9, ctx.measureText(label).width + 27.8), w - 14);
    const pillX = w - 7 - pillWidth;
    const pillY = lineY - 16.5 / 2;
    ctx.fillStyle = GREEN;
    roundRect(ctx, pillX, pillY, pillWidth, 16.5, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, pillX + pillWidth / 2, lineY + 0.5);
  }

  /** The mapping the candles were drawn with, so a level lands on the very same pixel. */
  const layout = $derived(mobileChartLayout(candles, height));

  $effect(() => {
    const el = canvas;
    if (!el) return;
    const series = candles;
    const kind = type;
    const chartMode = mode;
    const w = width;
    const h = height;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = el.clientWidth || 480;
    el.width = Math.round(cssWidth * dpr);
    el.height = Math.round(h * dpr);
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, series, kind, chartMode, cssWidth, h);
  });
</script>

<div class="chart">
  <canvas bind:this={canvas} class="candles" aria-hidden="true"></canvas>
  <ChartLevels {address} {candles} {layout} />
</div>

<style>
  .chart {
    position: absolute;
    top: 13.5px;
    left: 0;
    width: 100%;
    height: 364px;
  }

  .candles {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
</style>
