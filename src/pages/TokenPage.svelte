<script>
  import TokenHeader from "../components/TokenHeader.svelte";
  import ChartPanel from "../components/ChartPanel.svelte";
  import TradesTable from "../components/TradesTable.svelte";
  import TradeCard from "../components/trade/TradeCard.svelte";
  import AboutCard from "../components/AboutCard.svelte";
  import PositionsCard from "../components/trade/PositionsCard.svelte";
  import ClosedTradesAccordion from "../components/trade/ClosedTradesAccordion.svelte";
  import TradePositionCard from "../components/trade/TradePositionCard.svelte";
  import { closedPositions, positionsFor } from "../lib/api/trade.svelte.js";
  import { untrack } from "svelte";
  import { selectToken, stopToken } from "../lib/api/token.svelte.js";
  import { apiChain } from "../lib/routes.js";

  /** The route's token, from /tokens/{chain}/{address}. */
  let { chain = "", address = "" } = $props();

  /**
   * The chart's height, which the capture keeps on the wrapper below. The handle under
   * it drags this.
   *
   * 668px is the capture's own measurement. The bounds keep the chart readable at one
   * end (the toolbar, the timeframe row and a few candles) and stop a runaway drag at
   * the other; the page scrolls, so a tall chart costs nothing but height.
   */
  const CHART_HEIGHT_DEFAULT = 668;
  const CHART_HEIGHT_MIN = 260;
  const CHART_HEIGHT_MAX = 1200;

  let chartHeight = $state(CHART_HEIGHT_DEFAULT);

  /** Pointer capture keeps the drag alive past the handle's own 16px, and off the page. */
  function startChartResize(event) {
    if (event.button !== 0) return;
    const handle = event.currentTarget;
    const startY = event.clientY;
    const startHeight = chartHeight;
    handle.setPointerCapture(event.pointerId);

    const previousCursor = document.body.style.cursor;
    const previousSelect = document.body.style.userSelect;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    const onMove = (moveEvent) => {
      const next = startHeight + (moveEvent.clientY - startY);
      chartHeight = Math.min(CHART_HEIGHT_MAX, Math.max(CHART_HEIGHT_MIN, next));
    };
    const onEnd = () => {
      handle.releasePointerCapture?.(event.pointerId);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousSelect;
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
    event.preventDefault();
  }

  // The store is keyed on the token, so a route change re-seeds and re-subscribes.
  //
  // `selectToken` both READS the store's own chain/address (its "same token" check) and
  // WRITES them. Called bare from an effect, the write is tracked, so the effect re-runs
  // — its cleanup closes the sockets it just opened, and the re-entry takes the
  // "same token" branch and skips the token load. That is why the header stayed empty
  // after navigating from the trending list while everything else loaded, and why a
  // refresh fixed it. TokenChart already wraps its call in `untrack`; this now matches.
  $effect(() => {
    const apiCh = apiChain(chain);
    const addr = address;
    if (apiCh && addr) untrack(() => selectToken(apiCh, addr));
    return () => stopToken();
  });

  /**
   * The token's own closed trades. The capture grows a "Closed trades" section on a token
   * page the moment a trade on that token is closed — right above the About card — and only
   * when there is one.
   */
  const closed = $derived(closedPositions().filter((row) => row.address === address));

  /**
   * The holding card under the trade card. It is there whenever the token is held, order in
   * flight or not — the capture holds the card and the order row at once (0025.34: card at
   * y 23 with its 94px, order row expanded beside it).
   */
  const held = $derived(positionsFor(address)[0] ?? null);
</script>

<!--
  Token page: the centre column and its rail, exactly as captured. The rail is a
  child of the centre column, which is how the original nests it.
-->
<div class="flex gap-3 items-start flex-1 min-w-0 min-h-0 overflow-y-auto pb-3">
  <div class="flex flex-col flex-1 min-w-0">
    <div class="flex flex-col gap-2">
      <TokenHeader />
    </div>

    <!-- the app stores the chart height here, on the wrapper -->
    <div class="flex flex-col" style="height: {chartHeight}px;">
      <ChartPanel />
    </div>

    <div
      class="group flex h-4 w-full cursor-ns-resize items-center justify-center touch-none"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize chart"
      onpointerdown={startChartResize}
    >
      <div class="h-1 w-7 rounded-full transition-colors bg-bg-tertiary group-hover:bg-text-tertiary"></div>
    </div>

    <TradesTable />
  </div>

  <div class="flex flex-col gap-4 w-82 2xl:w-95 3xl:w-110 shrink-0 pr-4">
    <div class="flex flex-col">
      <TradeCard />
    </div>
    {#if held}
      <TradePositionCard position={held} />
    {/if}
    {#if closed.length > 0}
      <ClosedTradesAccordion rows={closed} />
    {/if}
    <AboutCard />
    <PositionsCard />
  </div>
</div>
