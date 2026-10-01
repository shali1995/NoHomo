<script>
  // The line the portfolio panel draws: the wallet's cumulative realized PnL, one point
  // per UTC day, as `GET /v2/traders/{chain}/{wallet}` reports it.
  //
  // The capture's own host was a lightweight-charts canvas — its markup is the library's,
  // two canvases inside a `tv-lightweight-charts` box — so the chart is drawn with the same
  // library the token chart uses, in the capture's own box geometry.
  import { formatCompact } from "../../lib/api/token.svelte.js";
  import { tc, withHexAlpha } from "../../lib/utils/chartTheme.js";

  /** @type {{ points?: { time: number, value: number }[], style?: string }} */
  let { points = [], style = "" } = $props();

  let container = null;
  let chart = null;
  let series = null;

  const ink = $derived(
    points.length > 1 && points[points.length - 1].value < points[0].value ? tc("--t-red") : tc("--t-grn")
  );

  const data = $derived(points.map((point) => ({ time: point.time, value: point.value })));

  function apply() {
    if (!series) return;
    series.applyOptions({
      lineColor: ink,
      topColor: withHexAlpha(ink, "2E"),
      bottomColor: withHexAlpha(ink, "08")
    });
    series.setData(data);
    chart?.timeScale().fitContent();
  }

  $effect(() => {
    // Read the data so a late-arriving series redraws the chart.
    void data;
    void ink;
    apply();
  });

  $effect(() => {
    if (!container) return;
    let cancelled = false;
    let localChart = null;

    (async () => {
      const { createChart, AreaSeries } = await import("lightweight-charts");
      if (cancelled || !container) return;
      localChart = createChart(container, {
        autoSize: true,
        layout: {
          background: { color: "transparent" },
          textColor: tc("--t-g5"),
          fontFamily: "monospace",
          fontSize: 11,
          attributionLogo: false
        },
        grid: { vertLines: { visible: false }, horzLines: { color: tc("--t-s8") } },
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false, timeVisible: false, fixLeftEdge: true, fixRightEdge: true },
        crosshair: { mode: 0, vertLine: { visible: false } },
        handleScale: false,
        handleScroll: false,
        localization: { priceFormatter: (value) => `$${formatCompact(value)}` }
      });
      series = localChart.addSeries(AreaSeries, {
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: "custom", formatter: (value) => `$${formatCompact(value)}`, minMove: 1e-8 }
      });
      chart = localChart;
      apply();
    })();

    return () => {
      cancelled = true;
      chart = null;
      series = null;
      localChart?.remove();
    };
  });
</script>

<div class="w-full relative" style={style}>
  <div class="w-full h-full" bind:this={container}></div>
</div>
