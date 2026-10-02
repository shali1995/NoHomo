<!--
  The phone's token page: the token's face in a fixed header, its chart and price over the
  tabs, the tab body, and the Buy bar pinned at the foot.

  The bands are the capture's screen, in its own dp: 84.3 dp of header, a scroll viewport down
  to the bar, a 380.3 dp chart stage with the price block over it and the frames under it,
  then the three-cell tab strip and whatever body that tab has. All three tabs read the same
  token store (`selectToken`), which is also what keeps their sockets alive; the chart reads
  `selectChart` beside it. The chart is put on the price scale and the 1H frame, which is the
  state the capture was taken in.
-->
<script>
  import { untrack } from "svelte";
  import TokenHeader from "../token/TokenHeader.svelte";
  import TokenPriceBlock from "../token/TokenPriceBlock.svelte";
  import TokenCandles from "../token/TokenCandles.svelte";
  import TimeframeStrip from "../token/TimeframeStrip.svelte";
  import ContentTabs from "../token/ContentTabs.svelte";
  import PositionCard from "../token/PositionCard.svelte";
  import AddThesisRow from "../token/AddThesisRow.svelte";
  import HoldersTab from "../token/HoldersTab.svelte";
  import FeedTab from "../token/FeedTab.svelte";
  import AboutTab from "../token/AboutTab.svelte";
  import ActionBar from "../token/ActionBar.svelte";
  import { apiChain } from "../../../lib/routes.js";
  import {
    formatCompact,
    getHolderCount,
    getHolders,
    getSwaps,
    getTheses,
    getToken,
    isHoldersLoading,
    isSwapsLoading,
    selectToken,
    stopToken
  } from "../../../lib/api/token.svelte.js";
  import {
    getCandles,
    getFrame,
    getMode,
    selectChart,
    setFrame,
    setMode,
    stopChart
  } from "../../../lib/api/chart.svelte.js";
  import { positionsFor } from "../../../lib/api/trade.svelte.js";

  let { chain = "", address = "", onback, onopenbuy, onopensell } = $props();

  /**
   * The capture's six frames. The candle endpoint only answers three of them — `1d`, `7d`,
   * `1M` and `all` come back 400 — so those three chips are carried but not pressable.
   * `1M` is deliberately left without a frame: `1m` is the API's one-minute frame.
   */
  const FRAMES = [
    { label: "1H", frame: "1h" },
    { label: "4H", frame: "4h" },
    { label: "1D", frame: "24h" },
    { label: "7D", frame: null },
    { label: "1M", frame: null },
    { label: "ALL", frame: null }
  ];

  let tab = $state("feed");
  let chartType = $state("candles");

  const token = $derived(getToken());
  const holders = $derived(getHolders());
  const swaps = $derived(getSwaps());
  const theses = $derived(getTheses());
  const candles = $derived(getCandles());
  const frame = $derived(getFrame());

  const holdersLoading = $derived(isHoldersLoading());
  const swapsLoading = $derived(isSwapsLoading());
  /** The account's own position in this token, if it has one — the position card's source. */
  const position = $derived(positionsFor(address)[0] ?? null);

  const tabs = $derived([
    { id: "holders", label: `Holders (${formatCompact(getHolderCount())})` },
    { id: "feed", label: "Feed" },
    { id: "about", label: "About" }
  ]);

  // The stores key on the token, so a route change re-seeds and re-subscribes both of them.
  // `selectToken` reads its own chain/address as well as writing them, so it runs untracked
  // or the effect would re-enter and its cleanup would close the sockets it just opened.
  $effect(() => {
    const apiCh = apiChain(chain);
    const addr = address;
    if (!apiCh || !addr) return;

    untrack(() => {
      void selectToken(apiCh, addr);
      void (async () => {
        await selectChart(apiCh, addr);
        if (getMode() !== "price") await setMode("price");
        if (getFrame() !== "1h") await setFrame("1h");
      })();
    });

    return () => {
      stopToken();
      stopChart();
    };
  });

  async function selectFrame(next) {
    if (!next || next === frame) return;
    await setFrame(next);
  }
</script>

<div class="token">
  <TokenHeader {token} {chain} {onback} />

  <div class="viewport">
    <div class="content m-scroll">
      <div class="stage">
        <TokenPriceBlock {token} />
        <!-- The address is what the chart's own level lines key the account's trade on. -->
        <TokenCandles {candles} type={chartType} {address} />
        <TimeframeStrip
          frames={FRAMES}
          active={frame}
          onselect={selectFrame}
          type={chartType}
          ontoggletype={() => (chartType = chartType === "candles" ? "line" : "candles")}
        />
      </div>

      {#if position}
        <PositionCard {position} />
        <AddThesisRow />
      {/if}

      <div class="tabs-block">
        <ContentTabs {tabs} active={tab} onselect={(id) => (tab = id)} />
      </div>

      <div class="body">
        {#if tab === "holders"}
          <HoldersTab rows={holders} theses={theses} loading={holdersLoading} />
        {:else if tab === "feed"}
          <FeedTab {swaps} {theses} loading={swapsLoading} />
        {:else}
          <AboutTab {token} />
        {/if}
      </div>

      <div class="tail"></div>
    </div>

    <!-- The capture's 48 dp fade: the page colour under the bar, clearing toward the content. -->
    <div class="fade" aria-hidden="true"></div>
  </div>

  <ActionBar held={Boolean(position)} onbuy={() => onopenbuy?.()} onsell={() => onopensell?.()} />
</div>

<style>
  .token {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    background: var(--m-bg);
  }

  .viewport {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
  }

  .content {
    height: 100%;
  }

  /* 380.3 dp of chart stage: the price block over a full-bleed canvas, frames across its foot. */
  .stage {
    position: relative;
    height: 380.3px;
    margin-top: 12.2px;
  }

  .tabs-block {
    margin-top: 24px;
  }

  .body {
    display: flex;
    flex-direction: column;
  }

  .fade {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 48px;
    background: linear-gradient(to bottom, rgba(6, 5, 16, 0), var(--m-bg));
    pointer-events: none;
    z-index: 2;
  }

  .tail {
    height: 24px;
  }
</style>
