<script>
  // The trade modal's transactions list: the "Transactions (n)" heading with the
  // invested note and Min size filter, the Buy / Sell rows, and the pagination
  // strip.
  //
  // Markup and every class are the capture's; the rows
  // come from tradePopup.json, which also carries the Radix popover id the filter
  // button points at.
  import ChevronForward from "../../icons/chevron-forward.svelte";
  import Filter from "../../icons/filter.svelte";
  import PagePrev from "../../icons/page-prev.svelte";

  // The list is laid out by the capture's virtualiser, so the 16px gap between
  // rows and the 36px pagination strip are measured values, not classes.
  const ROW_GAP = "16px";
  const PAGINATION_H = "36px";

  /** @type {{ transactions: import("../../lib/types").TradePopupTransactions }} */
  let { transactions } = $props();
</script>

<div class="flex flex-col gap-3 flex-1 min-h-0">
  <div class="flex items-center justify-between">
    <div class="text-sm text-text-tertiary">Transactions ({transactions.count})</div>
    <div class="flex items-center gap-3">
      {#if transactions.investedNote}<div class="text-text-tertiary text-sm"><span translate="no">{transactions.investedNote}</span> invested</div>{/if}
      <button type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls={transactions.popoverControls} data-state="closed" data-slot="popover-trigger" class="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary outline-none"><Filter /><span>Min size</span></button>
    </div>
  </div>
  <div class="flex flex-col flex-1 min-h-0">
    <div class="flex flex-col overflow-hidden" style="gap: {ROW_GAP};">
      <!-- A transaction row has no id; its date and amount together are unique in
           the capture. -->
      {#each transactions.rows as r (r.date + r.amount)}
        <div class="flex justify-between items-center h-6">
          <div class="flex gap-3 items-center min-w-0">
            <div class="rounded-sm px-1 py-0.25 text-xs font-bold {r.action === 'Buy' ? 'text-green bg-green-transparent' : 'text-red bg-red-transparent'}">{r.action}</div>
            <!-- `{" "}` is deliberate: the capture's serializer dropped whitespace-only
                 text nodes, but its layout boxes show the spaces between these spans. -->
            <div class="font-normal truncate"><span translate="no">{r.amount}</span>{" "}<span class="text-text-secondary">at</span>{" "}<span translate="no">{r.mcap}</span>{" "}<span class="text-text-secondary">MC</span></div>
          </div>
          <div class="text-[10px] text-text-tertiary tabular-nums shrink-0">{r.date}</div>
        </div>
      {/each}
    </div>
    {#if transactions.pages.length > 0}
      <nav aria-label="Pagination" class="flex items-center justify-center gap-1 mt-auto pt-3" translate="no" style="height: {PAGINATION_H};">
        <button type="button" aria-label="Previous page" disabled="" class="p-1 rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"><PagePrev aria-hidden="true" /></button>
        {#each transactions.pages as p, i (p)}
          {#if i === 0}
            <button type="button" aria-label="Page {p}" aria-current="page" class="w-6 h-6 rounded-md text-xs tabular-nums transition-colors bg-accent-primary-transparent text-accent-primary font-bold">{p}</button>
          {:else}
            <button type="button" aria-label="Page {p}" class="w-6 h-6 rounded-md text-xs tabular-nums transition-colors text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary">{p}</button>
          {/if}
        {/each}
        <button type="button" aria-label="Next page" class="p-1 rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"><ChevronForward class="w-4 h-4" aria-hidden="true" /></button>
      </nav>
    {/if}
  </div>
</div>
