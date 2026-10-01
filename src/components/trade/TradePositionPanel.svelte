<script>
  // The trade modal's right column (the capture titles the dialog "Position"): the
  // Buy / Sell buttons, the position summary card (value, PnL, amount, avg. entry /
  // invested or exit) and the transactions list.
  //
  // Markup and every class are the capture's, for both the open position and the
  // closed one; the numbers are
  // values in tradePopup.json, which is also what decides the open/closed layout.
  import TradeTransactions from "./TradeTransactions.svelte";

  // The PnL and change lines are NumberFlow hosts: their 20px line box was
  // flattened out of the shadow DOM, so it can only live as an inline style.
  const NUMBER_LINE = "20px";

  /** @type {{ summary: import("../../lib/types").TradePopupSummary, transactions: import("../../lib/types").TradePopupTransactions }} */
  let { summary, transactions } = $props();
</script>

<div class="flex-2 min-h-0 min-w-0 flex flex-col gap-3 pr-4">
  <div class="border border-transparent rounded-2xl px-2 pt-2 flex gap-2">
    <button type="button" class="flex-1 p-2 rounded-lg bg-green-transparent text-green font-bold text-center hover:opacity-80 transition-opacity">Buy</button>
    <button type="button" class="flex-1 p-2 rounded-lg bg-red-transparent text-red font-bold text-center hover:opacity-80 transition-opacity">Sell</button>
  </div>
  <div class="mx-2 flex-1 min-h-0 flex flex-col gap-5">
    <div class="flex flex-col gap-3 rounded-xl border border-bg-tertiary bg-bg-tertiary p-3">
      <div class="border-b border-dashed-spaced pb-3">
        {#if summary.layout === "open"}
          <div class="flex flex-col">
            <div class="flex justify-between">
              <div class="text-lg" translate="no">{summary.value}</div>
              <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: {NUMBER_LINE};">
                <div style={summary.pnlStyle}>{summary.pnlSign}</div>
                <div style={summary.pnlStyle}>{summary.pnlValue}</div>
              </div>
            </div>
            <div class="flex justify-between items-end">
              <div class="text-text-secondary text-sm" translate="no">{summary.amount}</div>
              <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: {NUMBER_LINE};">
                <div style={summary.changeArrowStyle}>{summary.changeArrow}</div>
                <div style={summary.changeValueStyle}>{summary.changeValue}</div>
              </div>
            </div>
          </div>
        {:else}
          <div class="flex items-center justify-between">
            <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: {NUMBER_LINE};">
              <div style={summary.pnlStyle}>{summary.pnlSign}</div>
              <div style={summary.pnlStyle}>{summary.pnlValue}</div>
            </div>
            <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: {NUMBER_LINE};">
              <div style={summary.changeArrowStyle}>{summary.changeArrow}</div>
              <div style={summary.changeValueStyle}>{summary.changeValue}</div>
            </div>
          </div>
        {/if}
      </div>
      <div class="flex justify-between">
        {#each summary.stats as s (s.label)}
          <div class="flex items-center gap-2">
            <div class="text-text-secondary text-xs">{s.label}</div>
            <div class="text-sm" translate="no">{s.value}</div>
          </div>
        {/each}
      </div>
    </div>
    <TradeTransactions {transactions} />
  </div>
</div>
