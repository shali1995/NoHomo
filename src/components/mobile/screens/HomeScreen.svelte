<!--
  The phone home: the account's total, the trader carousel, the tab strip, the ranking
  chips and the token list. Bands and their sizes are the capture's — a 40 dp mark, a
  256 dp header that stays put over a list that scrolls beneath it.
-->
<script>
  import Logo from "../../../icons/logo.svelte";
  import Mark from "../../../icons/nohomo.svelte";
  import TraderRail from "../TraderRail.svelte";
  import HomeTabs from "../HomeTabs.svelte";
  import EchoFilters from "../EchoFilters.svelte";
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
  import {
    BONDING_PHASE,
    GRADUATED_PHASE,
    bondingRows,
    graduatedRows,
    isTrenchesLoading,
    startTrenches,
    stopTrenches
  } from "../../../lib/api/trenches.svelte.js";
  import { isListLoading, listRows, startListLive, stopListLive } from "../../../lib/api/lists.svelte.js";
  import { listRowToToken, trenchRowToToken } from "../../../lib/mobile-rows.js";
  import { openMobileDeposit } from "../../../lib/mobile-sheets.svelte.js";
  import { untrack } from "svelte";

  let { onopen, onopentrader } = $props();

  const TABS = [
    { id: "watchlist", label: "Watchlist", icon: "star" },
    { id: "tokens", label: "Tokens" },
    { id: "perps", label: "Perps", badge: "New", soon: true }
  ];

  let tab = $state("tokens");

  /*
   * The facet row: the four scanner rankings, the two bonding phases, the two curated lists
   * and Echo. Each family has its own module behind it (scanner, trenches, lists, echo), so
   * the facet decides which one is streaming — one at a time, like the desktop panel's pills.
   */
  const TROUGHS = [
    { id: "bonding", label: "Bonding" },
    { id: "bonded", label: "Bonded" },
    { id: "crypto", label: "Crypto" },
    { id: "stocks", label: "Stocks" }
  ];
  // Echo leads: it is the app's own ranking, and the capture's own row of pills kept the
  // thing that is ours first.
  const FACETS = [{ id: "echo", label: "Echo" }, ...SCAN_VIEWS, ...TROUGHS];
  const SCAN_IDS = SCAN_VIEWS.map((entry) => entry.id);
  /** The curated-list sources, keyed by facet: Crypto is the majors list, Stocks the stocks. */
  const LIST_KIND = { crypto: "majors", stocks: "stocks" };

  let facet = $state("echo");
  /** Echo's filters, kept as a panel over the list rather than a rail above it. */
  let filtersOpen = $state(false);

  function pickFacet(id) {
    if (!FACETS.some((entry) => entry.id === id)) return;
    facet = id;
    if (SCAN_IDS.includes(id)) selectScanView(id);
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

  /* One stream at a time: whichever family the facet belongs to is started, and the family
     it replaced is stopped in the same run. The calls are untracked because they are
     lifecycle actions — the facet is the only thing these effects should answer to. */
  $effect(() => {
    if (!SCAN_IDS.includes(facet)) return;
    untrack(startScan);
    return () => stopScan();
  });

  $effect(() => {
    if (facet !== "bonding" && facet !== "bonded") return;
    untrack(() => {
      void startTrenches();
    });
    return () => stopTrenches();
  });

  $effect(() => {
    const kind = LIST_KIND[facet];
    if (!kind) return;
    untrack(() => startListLive(kind));
    return () => stopListLive(kind);
  });

  const phase = $derived(facet === "bonding" ? BONDING_PHASE : GRADUATED_PHASE);
  const listKind = $derived(LIST_KIND[facet] ?? null);

  const rows = $derived.by(() => {
    if (facet === "bonding") return bondingRows().map(trenchRowToToken);
    if (facet === "bonded") return graduatedRows().map(trenchRowToToken);
    if (listKind) return listRows(listKind).map(listRowToToken);
    return scanRows();
  });

  const loading = $derived.by(() => {
    if (facet === "bonding" || facet === "bonded") return isTrenchesLoading(phase);
    if (listKind) return isListLoading(listKind);
    return isScanLoading();
  });
</script>

<div class="home">
  <div class="brand">
    <Mark class="h-10 w-10" />
    <!-- the wordmark beside the mark, as the welcome carries it -->
    <Logo class="wordmark" />
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
      active={facet}
      onselect={pickFacet}
      onclear={() => pickFacet("trending")}
      gear="echo"
      ongear={() => (filtersOpen = true)}
    />

    <!-- Echo's own knobs: a panel, so the list keeps the whole screen when they are closed. -->
    <EchoFilters bind:open={filtersOpen} />

    {#if facet === "echo"}
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
        {#each rows as row, index (row.pairAddress ?? row.key ?? index)}
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
    gap: 10px;
    flex: 0 0 auto;
    height: 64px;
    padding: calc(6px + env(safe-area-inset-top)) 16px 0 16px;
  }

  /* NOHOMO, at the height the mark beside it reads against (the svg is 118x24). */
  .brand :global(.wordmark) {
    width: auto;
    height: 21px;
  }

  .head {
    flex: 0 0 auto;
    /*
     * The head is as tall as what it holds: the balance, the trader rail and the tab strip. A
     * fixed 256 was the capture's own height with the rail open — with it closed the header still
     * reserved the carousel's 90 dp plus its margins, and the list began 98 dp below the tabs with
     * nothing in between. Opened, the header grows by exactly what the rail adds.
     */
    height: auto;
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
