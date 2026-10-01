<script>
  // The order row under the trade card: what a buy or a sell is doing right now. The capture
  // holds both halves of it — `Buying $2.00 STONK` with a spinner, then the green tick and
  // `Bought $2.00 STONK` — and the row slides in under the card rather than appearing, which
  // is the `grid-rows-[0fr]` -> `[1fr]` it shares with the quick block.
  import Check from "../../icons/check.svelte";

  /** @type {{ order: import("../../lib/api/trade.svelte.js").Order | null }} */
  let { order } = $props();

  /** What the row says, and whether it has settled, per state — the capture's two halves. */
  const WORDS = {
    buying: "Buying",
    bought: "Bought",
    selling: "Selling",
    sold: "Sold",
    failed: "Failed",
    cancelled: "Cancelled"
  };

  const settled = $derived(order?.state === "bought" || order?.state === "sold");
  const stopped = $derived(order?.state === "failed" || order?.state === "cancelled");
  const verb = $derived(WORDS[order?.state] ?? "");
</script>

<div class="grid transition-[grid-template-rows,margin-top] duration-300 ease-out {order ? 'grid-rows-[1fr] mt-4' : 'grid-rows-[0fr] mt-0'}">
  <div class="overflow-hidden min-h-0">
    <div class="bg-bg-primary rounded-xl outline outline-1 -outline-offset-1 outline-bg-tertiary px-3 pb-3 flex flex-col">
      <div class="grid transition-[grid-template-rows] duration-300 ease-out {order ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}">
        <div class="overflow-hidden min-h-0 pt-3">
          {#if order}
            <div class="flex items-center gap-2 animate-flip-up">
              {#if settled}
                <Check class="lucide lucide-check w-4 h-4 text-green shrink-0" />
              {:else if stopped}
                <span class="w-4 h-4 shrink-0 text-center text-sm leading-4 text-red">!</span>
              {:else}
                <span class="h-4 w-4 rounded-full border-2 border-text-tertiary/20 border-t-text-tertiary animate-spin shrink-0"></span>
              {/if}
              <div class="flex-1 min-w-0 text-sm leading-4 truncate">
                <span class="text-text-secondary">{verb} <span class="text-text-primary" translate="no">{order.text}</span></span>
              </div>
              <span class="text-xs font-normal leading-4 text-text-tertiary shrink-0" translate="no">{order.age}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
