<script>
  // One row of the search results — the list the site shows once you type.
  // Ported from the capture: the result list for the query "hi", the same row
  // repeated for every match. Every value comes from
  // lib/searchPanel.json; the markup, classes and inline geometry are the
  // capture's.
  import SearchVerifiedBadge from "../../icons/search-verified-badge.svelte";
  import NetworkSolana from "../../icons/network-solana.svelte";
  import NetworkRobinhood from "../../icons/network-robinhood.svelte";
  import NetworkBnb from "../../icons/network-bnb.svelte";
  import NetworkBase from "../../icons/network-base.svelte";
  import NetworkEthereum from "../../icons/network-ethereum.svelte";
  import XLink from "../../icons/x-link.svelte";
  import TokenMenu from "../../icons/token-menu.svelte";

  /**
   * @type {{ row: import("../../lib/types").SearchResultRow, selected?: boolean, onHover?: (index: number) => void, index?: number }}
   */
  let { row, selected = false, onHover, index = 0 } = $props();

  let anchorEl = $state(null);

  // Arrow keys move the highlight, which may be off-screen in a long list.
  $effect(() => {
    if (selected) anchorEl?.scrollIntoView({ block: "nearest" });
  });

  const networks = {
    solana: NetworkSolana,
    robinhood: NetworkRobinhood,
    bnb: NetworkBnb,
    base: NetworkBase,
    ethereum: NetworkEthereum
  };
  const Network = $derived(networks[row.network] ?? NetworkSolana);
</script>

<a
  bind:this={anchorEl}
  class="block rounded-lg tabular-nums focus:outline-none {selected
    ? 'bg-bg-tertiary/60'
    : 'hover:bg-bg-tertiary/60 focus:bg-bg-tertiary/60'}"
  data-search-result="true"
  href={row.href}
  data-discover="true"
  onmouseenter={() => onHover?.(index)}
>
  <div class="flex shrink-0 items-center gap-3 px-2 py-2 tabular-nums">
    <div class="relative shrink-0" style="width: 36px; height: 36px;">
      <img
        class="rounded-full border border-bg-tertiary"
        src={row.logo}
        alt=""
        style="height: 36px; width: 36px;"
      />
      <div class="absolute flex items-center justify-center" style="bottom: -3px; right: -3px;">
        <SearchVerifiedBadge style="width: 16px; height: 16px;" />
      </div>
    </div>

    <div class="flex flex-col items-start gap-0.5 flex-1 min-w-0">
      <div class="flex items-center gap-1 min-w-0 max-w-full">
        <span class="text-sm truncate" translate="no">{row.name}</span>
        <Network width="16" height="16" />
        {#if row.hasX}
          <span
            role="link"
            tabindex="0"
            class="flex shrink-0 items-center justify-center rounded-sm bg-bg-tertiary overflow-hidden p-0.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            data-state="closed"
            data-slot="tooltip-trigger"
          >
            <XLink />
          </span>
        {/if}
        {#if row.hasStar}
          <span role="button" tabindex="0" data-state="closed" data-slot="tooltip-trigger">
            <TokenMenu class="text-text-tertiary size-3.5 shrink-0" />
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-1 text-xs text-text-secondary">
        <span class="truncate max-w-24" translate="no">{row.description}</span>
        <span class="text-text-tertiary text-xs hidden search-wide-block" translate="no">{row.contract}</span>
      </div>
    </div>

    <div class="hidden search-wide-flex items-center gap-1.5 text-xs w-26 shrink-0">
      <div class="text-[10px] font-bold px-1 py-px border border-bg-tertiary rounded-sm text-text-tertiary shrink-0">
        MC
      </div>
      <div>{row.marketCap}</div>
    </div>

    <div class="text-xs w-18 shrink-0">
      <!-- prices with a run of leading zeros carry the count in a <sub>, exactly as
           the capture does: $0.0<sub>4</sub>4151 -->
      <span class="tabular-nums" translate="no">{row.priceLead}{#if row.priceSub}<sub>{row.priceSub}</sub>{row.priceRest}{/if}</span>
    </div>

    <div class="w-14 shrink-0">
      <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: 16px;">
        <div style="color: {row.changeColor}; font-weight: 400; font-size: 6px;">{row.changeArrow}</div>
        <div style="font-size: 12px; font-weight: 500; color: {row.changeColor};">{row.changeValue}</div>
      </div>
    </div>

    <div class="hidden search-wide-flex items-center gap-1.5 text-xs w-26 shrink-0">
      <div class="text-[10px] font-bold px-1 py-px border border-bg-tertiary rounded-sm text-text-tertiary shrink-0">
        VOL
      </div>
      <div>{row.volume}</div>
    </div>
  </div>
</a>
