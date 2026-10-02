<!--
  The phone's search tab: the chip strip, the result sections and the floating pill.
  The capture's screen is a fixed five-chip strip over a pager, with the search field
  floating above the bottom bar. Only three of those chips have a backend that can answer
  here: `All` and `Tokens` read `/v2/scanner/tokens/search` through the desktop's own
  search store, and `Traders` reads `/v2/traders/search`. `Perps` and `Clans` are left out
  rather than drawn dead — no endpoint in this API searches either.
  The field's horizontal inset is the capture's rule: 44 dp of gutter while it is idle and
  empty, 16 dp plus the 48 dp clear disc once it is focused or holds a query.
-->
<script>
  import { api } from "../../../lib/api/client.js";
  import {
    getSearchRows,
    isSearchLoading,
    searchTokens,
    stopSearch
  } from "../../../lib/api/search.svelte.js";
  import {
    LEADERBOARD_CHAIN,
    getTimeRange,
    leaderboardRowFromItem
  } from "../../../lib/api/leaderboard.svelte.js";
  import { formatUsdCompact } from "../../../lib/api/trending.svelte.js";
  import NetworkSolana from "../../../icons/network-solana.svelte";
  import NetworkBase from "../../../icons/network-base.svelte";
  import NetworkEthereum from "../../../icons/network-ethereum.svelte";
  import NetworkBnb from "../../../icons/network-bnb.svelte";
  import NetworkRobinhood from "../../../icons/network-robinhood.svelte";
  import NetworkMonad from "../../../icons/network-monad.svelte";
  import VerifiedBadge from "../../../icons/verified-badge.svelte";

  let { onopen, onopentrader } = $props();

  /** The capture ships five chips; these are the three this API can answer. */
  const CHIPS = [
    { id: "all", label: "All" },
    { id: "tokens", label: "Tokens" },
    { id: "traders", label: "Traders" }
  ];

  /** The token store searches from two characters up; the trader search follows it. */
  const MIN_QUERY = 2;
  /** Long enough to swallow a burst of typing, short enough to feel immediate. */
  const TRADER_DEBOUNCE_MS = 180;

  const NETWORKS = {
    solana: NetworkSolana,
    base: NetworkBase,
    ethereum: NetworkEthereum,
    bnb: NetworkBnb,
    robinhood: NetworkRobinhood,
    monad: NetworkMonad
  };

  let chip = $state("all");
  let query = $state("");
  let focused = $state(false);

  let traders = $state.raw([]);
  let tradersLoading = $state(false);
  let tradersLoaded = $state(false);
  let traderGeneration = 0;
  let traderTimer = null;

  const showClear = $derived(focused || query.length > 0);
  const tokenRows = $derived(getSearchRows().map(tokenResult));
  const tokensLoading = $derived(isSearchLoading());
  const showsTokens = $derived(chip !== "traders");
  const showsTraders = $derived(chip !== "tokens");
  const visibleRows = $derived(
    (showsTokens ? tokenRows.length : 0) + (showsTraders ? traders.length : 0)
  );
  const waiting = $derived(
    query.trim().length >= MIN_QUERY &&
      visibleRows === 0 &&
      ((showsTokens && tokensLoading) || (showsTraders && tradersLoading && !tradersLoaded))
  );

  /**
   * The desktop's own search row, in the phone's names. Every figure is the store's:
   * the price keeps its subscript split and the market cap its compact form.
   */
  function tokenResult(row) {
    return {
      key: row.pairAddress,
      href: row.href,
      symbol: row.name,
      initial: (row.name || "?").slice(0, 1),
      logo: row.logo,
      network: row.network,
      mcap: row.marketCap,
      pricePrefix: row.priceLead,
      sub: row.priceSub,
      priceSuffix: row.priceRest,
      dir: row.changeArrow,
      change: row.changeValue
    };
  }

  /**
   * A ranking row as the capture's trader row. The desktop mapper supplies the identity
   * and the wallet; the handle is the platform handle the ranking carries (the capture
   * prints `@himgajria`, not a wallet), and the PnL is the capture's own compact form
   * (`+$95.5K`), grey when it is exactly zero.
   */
  function traderResult(item, index) {
    const base = leaderboardRowFromItem(item, index);
    const label = (item.labels ?? [])[0];
    const pnl = parseFloat(item.stats?.pnlUsdStr ?? "");
    const flat = !Number.isFinite(pnl) || pnl === 0;
    return {
      ...base,
      key: base.traderKey,
      name: label?.label || base.name,
      handle: label?.handle ? `@${label.handle}` : base.handle,
      pnlText: flat ? "$0" : `${pnl > 0 ? "+" : "-"}${formatUsdCompact(Math.abs(pnl))}`,
      pnlColor: flat ? "var(--m-muted)" : pnl > 0 ? "var(--m-green)" : "var(--m-red)"
    };
  }

  function scheduleTraders(text) {
    if (traderTimer) clearTimeout(traderTimer);
    const mine = ++traderGeneration;
    if (text.length < MIN_QUERY) {
      traders = [];
      tradersLoading = false;
      tradersLoaded = false;
      return;
    }
    tradersLoading = true;
    traderTimer = setTimeout(() => {
      traderTimer = null;
      void runTraderSearch(text, mine);
    }, TRADER_DEBOUNCE_MS);
  }

  async function runTraderSearch(text, mine) {
    try {
      const { data, error } = await api.GET("/v2/traders/search", {
        params: {
          query: { q: text, timeRange: getTimeRange(), chain: LEADERBOARD_CHAIN }
        }
      });
      if (mine !== traderGeneration) return;
      if (error || !data) throw new Error("trader search failed");
      traders = (data.items ?? []).map(traderResult);
      tradersLoaded = true;
    } catch {
      if (mine !== traderGeneration) return;
      traders = [];
      tradersLoaded = true;
    } finally {
      if (mine === traderGeneration) tradersLoading = false;
    }
  }

  // One keystroke drives both stores; each keeps its own debounce and its own guard.
  $effect(() => {
    const text = query.trim();
    searchTokens(text);
    scheduleTraders(text);
  });

  // Leaving the tab drops the live lookup the token store holds, and the rows with it.
  $effect(() => {
    return () => {
      if (traderTimer) clearTimeout(traderTimer);
      traderGeneration += 1;
      stopSearch();
    };
  });

  function clear() {
    query = "";
    traders = [];
    tradersLoaded = false;
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) query = text.trim();
    } catch {
      // No clipboard permission, or nothing readable: the field is left as it is.
    }
  }
</script>

<div class="screen">
  <div class="chips" role="tablist" aria-label="Search results">
    {#each CHIPS as item (item.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={chip === item.id}
        role="tab"
        aria-selected={chip === item.id}
        onclick={() => (chip = item.id)}
      >
        {item.label}
      </button>
    {/each}
  </div>

  <div class="list m-scroll">
    {#if showsTokens && tokenRows.length}
      <div class="head">Tokens</div>
      {#each tokenRows as row (row.key)}
        {@const Chain = NETWORKS[row.network]}
        <button type="button" class="trow" onclick={() => onopen?.(row)}>
          <span class="logo">
            {#if row.logo}
              <img src={row.logo} alt="" loading="lazy" decoding="async" />
            {:else}
              <span class="initial">{row.initial}</span>
            {/if}
            <VerifiedBadge class="badge" />
          </span>

          <span class="left">
            <span class="symbol-line">
              <span class="symbol m-truncate">{row.symbol}</span>
              {#if Chain}
                <span class="chain"><Chain class="chain-logo" /></span>
              {/if}
            </span>
            <span class="mcap m-num">{row.mcap} MC</span>
          </span>

          <span class="right">
            <span class="price m-num"
              >{row.pricePrefix}{#if row.sub}<sub>{row.sub}</sub>{/if}{row.priceSuffix}</span
            >
            <span
              class="change m-num"
              style="color: {row.dir === '▲' ? 'var(--m-green)' : 'var(--m-red)'}"
            >
              <span class="arrow">{row.dir}</span>{row.change}
            </span>
          </span>
        </button>
      {/each}
    {/if}

    {#if showsTraders && traders.length}
      <div class="head">Traders</div>
      {#each traders as row (row.key)}
        <button type="button" class="prow" onclick={() => onopentrader?.(row)}>
          <span class="pavatar">
            {#if row.avatarImg}
              <img src={row.avatarImg} alt="" loading="lazy" decoding="async" />
            {:else}
              <span class="pfall">
                <img class="pmark" src="/avatar.png" alt="" aria-hidden="true" />
              </span>
            {/if}
          </span>
          <span class="pleft">
            <span class="pname m-truncate">{row.name}</span>
            <span class="phandle m-truncate">{row.handle}</span>
          </span>
          <span class="pfigs">
            <span class="ppnl m-num" style="color: {row.pnlColor}">{row.pnlText}</span>
          </span>
        </button>
      {/each}
    {/if}

    {#if waiting}
      {#each Array.from({ length: 8 }) as _, index (index)}
        <div class="ghost">
          <span class="ghost-disc"></span>
          <span class="ghost-line"></span>
        </div>
      {/each}
    {/if}
  </div>

  <div class="field" class:field--clear={showClear}>
    <div class="pill">
      <div class="inner">
        <input
          class="input"
          type="text"
          bind:value={query}
          onfocus={() => (focused = true)}
          onblur={() => (focused = false)}
          placeholder="Search for anything..."
          autocomplete="off"
          autocorrect="off"
          autocapitalize="none"
          spellcheck="false"
          aria-label="Search"
        />
        <button type="button" class="paste" onclick={paste}>Paste</button>
      </div>
    </div>

    {#if showClear}
      <button
        type="button"
        class="clear"
        aria-label="Clear search"
        onmousedown={(event) => event.preventDefault()}
        onclick={clear}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .screen {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding-top: calc(6px + env(safe-area-inset-top));
  }

  /* The capture's strip: 12 dp above the chips, 4 below, chips 25.1 tall on a 6 radius. */
  .chips {
    display: flex;
    flex: 0 0 auto;
    gap: 8px;
    padding: 12.3px 16px 4px 16px;
  }

  .chip {
    padding: 3px 5px;
    border: 1px solid var(--m-hairline);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    line-height: 17px;
    color: var(--m-muted);
    overflow: hidden;
  }

  .chip--on {
    background: var(--m-hairline);
    font-weight: 700;
    color: var(--m-text);
  }

  /* The list clears the floating pill and the bottom bar, as the capture's 132 dp does. */
  .list {
    flex: 1 1 auto;
    min-height: 0;
    padding: 0 16px 132px 16px;
  }

  /* A section header: 8 above, 10 of its own, 8 below the 18.7 dp label. */
  .head {
    margin: 8px 0;
    padding-top: 10px;
    font-size: 16px;
    line-height: 18.7px;
    color: var(--m-muted);
  }

  .trow {
    display: flex;
    align-items: center;
    width: 100%;
    height: 66.7px;
    padding: 8px 0;
    text-align: left;
    background: var(--m-bg);
  }

  .trow:active,
  .prow:active {
    background: var(--m-card);
  }

  .logo {
    position: relative;
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    margin-right: 12px;
  }

  .logo img,
  .initial {
    display: block;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
    overflow: hidden;
  }

  .initial {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--m-card);
    font-size: 18px;
    color: var(--m-muted);
  }

  /* The launchpad / verified disc on the avatar's lower-right corner. */
  .logo :global(.badge) {
    position: absolute;
    right: -4px;
    bottom: -2px;
    width: 18.2px;
    height: 18.2px;
    color: #516af6;
  }

  /* Two lines 8 dp apart, both columns centred in the 50.7 dp row (the capture's own
     reading of its flattened layout). */
  .left,
  .right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    height: 50.7px;
    min-width: 0;
  }

  .left {
    flex: 1 1 auto;
    align-items: flex-start;
  }

  .right {
    flex: 0 0 auto;
    align-items: flex-end;
  }

  .symbol-line {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    max-width: 100%;
  }

  .symbol {
    font-size: 18px;
    line-height: 21.3px;
    color: var(--m-text);
  }

  /* The chain mark sits in a 20 dp tinted square after the symbol. */
  .chain {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
  }

  .chain :global(.chain-logo) {
    width: 20px;
    height: 20px;
    color: var(--m-muted);
  }

  .mcap {
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .price {
    font-size: 18px;
    line-height: 26.1px;
    color: var(--m-text);
  }

  .price sub {
    font-size: 0.62em;
    vertical-align: -0.25em;
  }

  .change {
    display: flex;
    align-items: center;
    gap: 2.7px;
    font-size: 14px;
    line-height: 16.5px;
  }

  /* The arrow is an 8 dp glyph, not an icon. */
  .arrow {
    font-size: 8px;
    line-height: 9.1px;
  }

  /* The capture's trader row: a 40 dp disc, the name over the handle, the PnL at the right. */
  .prow {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 0;
    text-align: left;
    background: var(--m-bg);
  }

  .pavatar {
    position: relative;
    display: block;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }

  .pavatar img {
    display: block;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    object-fit: cover;
  }

  /* A trader with no picture: the app's mark on the raised surface. */
  .pfall {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: var(--m-card);
  }

  .pmark {
    width: 30px;
    height: 30px;
  }

  .pleft {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .pname {
    font-size: 16px;
    line-height: 20px;
    color: var(--m-text);
  }

  .phandle {
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .pfigs {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 12px;
  }

  .ppnl {
    font-size: 15px;
    line-height: 18.1px;
  }

  /* The floating field. Idle it keeps the capture's 44 dp gutters; with the clear disc
     beside it, 16. */
  .field {
    position: absolute;
    right: 44px;
    bottom: 76px;
    left: 44px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field--clear {
    right: 16px;
    left: 16px;
  }

  .pill {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    height: 52.3px;
    border-radius: 100px;
    background: rgba(6, 5, 16, 0.965);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    overflow: hidden;
  }

  .inner {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    min-width: 0;
    margin: 1px;
    border-radius: 99px;
    overflow: hidden;
  }

  .input {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    padding: 16px 0 16px 19.8px;
    border: 0;
    background: none;
    font: inherit;
    font-size: 16px;
    font-weight: 500;
    line-height: 18px;
    color: var(--m-text);
    caret-color: var(--m-blue);
    outline: none;
  }

  .input::placeholder {
    color: var(--m-muted);
  }

  /* The capture's Paste affordance: a hairline pill inside the field. */
  .paste {
    flex: 0 0 auto;
    padding: 8px 14px;
    border-radius: 100px;
    background: var(--m-hairline);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    font-size: 12px;
    font-weight: 700;
    line-height: 13.9px;
    color: var(--m-text);
  }

  .clear {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    background: rgba(6, 5, 16, 0.965);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    color: var(--m-text);
  }

  .clear svg {
    width: 24px;
    height: 24px;
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 66.7px;
    padding: 8px 0;
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
