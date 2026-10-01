<script>
  // A closed position: what went in, what came out, and the P&L between. The capture's own
  // table — Token · Avg. entry · Avg. exit · PnL — with the two middle columns behind a
  // container query, because a token page's rail is too narrow for them and the profile's
  // card is not.
  import TokenBadge from "../../icons/token-badge.svelte";
  import { openTokenCard } from "../../lib/hoverCard.svelte.js";
  import { followLink, followLinkKey } from "../../lib/router.js";

  /** @type {{ rows: import("../../lib/api/trade.svelte.js").ClosedTrade[] }} */
  let { rows } = $props();
</script>

<div class="flex flex-col">
  <div class="flex items-center gap-3 px-3 py-1 text-xs font-medium text-text-tertiary border-b border-bg-tertiary/60 shrink-0">
    <div class="flex-1">Token</div>
    <div class="w-40 @[600px]:block shrink-0 hidden">Avg. entry</div>
    <div class="w-40 @[600px]:block shrink-0 hidden">Avg. exit</div>
    <div class="w-24 shrink-0 text-right">PnL</div>
  </div>

  <div class="flex flex-col flex-1 min-h-10">
    {#each rows as row (row.id)}
      <button
        type="button"
        class="flex items-center gap-3 py-2 hover:bg-bg-secondary px-3 w-full text-left"
        data-state="closed"
        data-slot="hover-card-trigger"
        onmouseenter={(event) => openTokenCard({ chain: row.chain, address: row.address }, event)}
        onclick={(event) => followLink(event, `/tokens/${row.chain}/${row.address}`)}
        onkeydown={(event) => followLinkKey(event, `/tokens/${row.chain}/${row.address}`)}
      >
        <div class="relative shrink-0" style="width: 36px; height: 36px;">
          <img class="rounded-full border border-bg-tertiary" src={row.image} alt="" style="height: 36px; width: 36px;" />
          <div class="absolute flex items-center justify-center" style="bottom: -3px; right: -3px;">
            <TokenBadge />
          </div>
        </div>

        <div class="flex flex-col gap-px items-start flex-1 min-w-0">
          <div class="text-sm">{row.name}</div>
          <div class="text-xs text-text-secondary">
            <span translate="no">{`$${row.investedUsd.toFixed(2)}`}</span> invested<span class="text-text-tertiary"> • <span
                translate="no"
                title={row.ageTitle}
              >{row.ageText}</span></span>
          </div>
        </div>

        <div class="w-40 shrink-0 hidden @[600px]:block text-sm" translate="no">{row.avgEntry}</div>
        <div class="w-40 shrink-0 hidden @[600px]:block text-sm" translate="no">{row.avgExit}</div>
        <div class="w-24 shrink-0 text-right">
          <div class="flex flex-col items-end gap-px">
            <div class="text-sm" translate="no">{row.pnlText}</div>
            <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: 16px;">
              <div style="color: {row.pnlUp ? 'rgb(33, 201, 94)' : 'rgb(255, 98, 46)'}; font-weight: 400; font-size: 6px;">
                {row.pnlUp ? "▲" : "▼"}
              </div>
              <div style="font-size: 12px; font-weight: 400; color: {row.pnlUp ? 'rgb(33, 201, 94)' : 'rgb(255, 98, 46)'};">
                {row.pnlPct}
              </div>
            </div>
          </div>
        </div>
      </button>
    {/each}
  </div>
</div>
