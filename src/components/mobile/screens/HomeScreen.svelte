<!--
  The phone home: the account's total, the trader carousel, the tab strip, the ranking
  chips and the token list. Bands and their sizes are the capture's — a 40 dp mark, a
  256 dp header that stays put over a list that scrolls beneath it.
-->
<script>
  import Mark from "../../../icons/nohomo.svelte";
  import TraderRail from "../TraderRail.svelte";
  import HomeTabs from "../HomeTabs.svelte";
  import ScanChips from "../ScanChips.svelte";
  import TokenRow from "../TokenRow.svelte";
  import WatchlistScreen from "./WatchlistScreen.svelte";
  import EchoList from "../EchoList.svelte";
  import { accountLoaded, accountPnl24h, accountTotalText } from "../../../lib/api/account.svelte.js";
  import {
    SCAN_VIEWS,
    isScanLoading,
    scanRows,
    scanView,
    selectScanView,
    startScan,
    stopScan
  } from "../../../lib/api/scan.svelte.js";
  import { getWindowLabel, railTraders } from "../../../lib/api/leaderboard.svelte.js";
  import { openMobileDeposit } from "../../../lib/mobile-sheets.svelte.js";

  let { onopen, onopentrader } = $props();

  const TABS = [
    { id: "watchlist", label: "Watchlist", icon: "star" },
    { id: "tokens", label: "Tokens" },
    { id: "perps", label: "Perps", badge: "New", soon: true }
  ];

  let tab = $state("tokens");
  /**
   * Echo is the fifth facet: it is not a scanner ranking but the live stream of what was
   * bought, sold and talked about, so it brings its own filter rail and its own list rather
   * than a fifth body for the same rows.
   */
  let echo = $state(false);
  const FACETS = [...SCAN_VIEWS, { id: "echo", label: "Echo" }];

  function pickFacet(id) {
    if (id === "echo") {
      echo = true;
      return;
    }
    echo = false;
    selectScanView(id);
  }
  const funded = $derived(accountLoaded());

  /** "$8.28" is set as two tones of one number: the dollars plain, the cents dimmed. */
  const total = $derived.by(() => {
    const text = accountTotalText();
    if (!text) return null;
    const cut = text.lastIndexOf(".");
    return cut < 0 ? { whole: text, cents: null } : { whole: text.slice(0, cut), cents: text.slice(cut) };
  });

  const pnl = $derived(accountPnl24h());

  let traders = $state.raw([]);
  $effect(() => {
    let live = true;
    railTraders(12).then((rows) => {
      if (live) traders = rows ?? [];
    });
    return () => {
      live = false;
    };
  });

  $effect(() => {
    startScan();
    // Leaving the tab closes the stream; coming back re-opens it on the same facet.
    return () => stopScan();
  });

  const rows = $derived(scanRows());
  const loading = $derived(isScanLoading());
</script>

<div class="home">
  <div class="brand">
    <Mark class="h-10 w-10" />
  </div>

  <header class="head">
    <div class="top">
      <div class="account">
        <div class="total m-num">
          {#if total}
            {total.whole}{#if total.cents}<span class="cents">{total.cents}</span>{/if}
          {:else if !funded}
            <span class="skeleton"></span>
          {:else}
            <span class="zero">$0</span>
          {/if}
        </div>
        <div class="delta m-num">
          {#if pnl}
            <span class="signed" class:down={!pnl.up}>{pnl.up ? "+" : "-"}{pnl.text}</span>
            <span class="period">24h</span>
          {:else if !funded}
            <span class="skeleton skeleton--small"></span>
          {/if}
        </div>
      </div>

      <button type="button" class="deposit" onclick={openMobileDeposit}>Deposit</button>
    </div>

    <TraderRail
      title="Top traders"
      subtitle={getWindowLabel().toLowerCase()}
      {traders}
      onopen={(trader) => onopentrader?.(trader)}
    />

    <HomeTabs tabs={TABS} active={tab} onselect={(id) => (tab = id)} />
  </header>

  {#if tab === "watchlist"}
    <!-- The capture pages the three tabs: the header stays, the list is swapped. -->
    <div class="body m-scroll">
      <WatchlistScreen onopen={(row) => onopen?.(row)} />
      <div class="tail"></div>
    </div>
  {:else}
  <div class="body m-scroll">
    <ScanChips
      views={FACETS}
      active={echo ? "echo" : scanView()}
      onselect={pickFacet}
      onclear={() => {
        echo = false;
        selectScanView("trending");
      }}
    />

    {#if echo}
      <EchoList onopen={(row) => onopen?.(row)} onopentrader={(trader) => onopentrader?.(trader)} />
    {:else}
    <div class="list">
      {#if rows.length === 0 && loading}
        {#each Array.from({ length: 8 }) as _, index (index)}
          <div class="ghost">
            <span class="ghost-disc"></span>
            <span class="ghost-line"></span>
          </div>
        {/each}
      {:else}
        {#each rows as row (row.pairAddress)}
          <TokenRow {row} onclick={() => onopen?.(row)} />
        {/each}
      {/if}
    </div>
    {/if}

    <div class="tail"></div>
  </div>
  {/if}
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  .brand {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    height: 64px;
    padding: calc(24px + env(safe-area-inset-top)) 16px 0 16px;
  }

  .head {
    flex: 0 0 auto;
    height: 256px;
    margin-top: 8px;
  }

  .top {
    position: relative;
    height: 85.3px;
  }

  .account {
    display: flex;
    flex-direction: column;
    height: 85.3px;
    padding: 8px 16px 0 16px;
  }

  .total {
    font-size: 28px;
    line-height: 32.5px;
  }

  .cents,
  .zero {
    color: var(--m-dim);
  }

  .delta {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4.3px;
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .signed {
    color: var(--m-green);
  }

  .signed.down {
    color: var(--m-red);
  }

  /* The capture's primary button: a 1 dp `#6F85FF → #4662FB` ring around an accent fill. */
  .deposit {
    position: absolute;
    top: 6.4px;
    right: 16px;
    width: 139.7px;
    height: 48px;
    border: 1px solid transparent;
    border-radius: 12px;
    background:
      linear-gradient(var(--m-blue), var(--m-blue)) padding-box,
      linear-gradient(90deg, #6f85ff, #4662fb) border-box;
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .body {
    flex: 1 1 auto;
    min-height: 0;
    padding-top: 12.3px;
  }

  /* The capture's own lead-in between the facet row and the first row. */
  .list {
    display: flex;
    flex-direction: column;
    margin-top: 11.7px;
  }

  /* Room for the floating bar, so the last row is not trapped under it. */
  .tail {
    height: 84px;
  }

  .skeleton {
    display: inline-block;
    width: 96px;
    height: 30px;
    border-radius: 6px;
    background: var(--m-card);
  }

  .skeleton--small {
    width: 64px;
    height: 15px;
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 66.7px;
    padding: 8px 16px;
  }

  .ghost-disc {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: var(--m-card);
  }

  .ghost-line {
    width: 120px;
    height: 16px;
    border-radius: 6px;
    background: var(--m-card);
  }
</style>
