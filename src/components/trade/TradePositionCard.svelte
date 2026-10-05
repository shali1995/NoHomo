<script>
  // The holding card: on a token page you hold, it sits directly under the trade card and
  // says what the position is worth. The capture grows it the moment there is a position —
  // dust included — and drops it when the position is sold.
  //
  // Its own rows are the capture's: the value over the amount on the left, the P&L over the
  // change on the right, then "Invested" and the market cap ("Avg entry" is the capture's own
  // label for that second row, value and all — its UI prints the market cap there).
  import AnimatedNumber from "./AnimatedNumber.svelte";
  import TokenBadge from "../../icons/token-badge.svelte";
  import { formatCompact, formatPrice, getAddress, getChain } from "../../lib/api/token.svelte.js";
  import { cancelPendingSwap, isCancellingSwap } from "../../lib/api/trade.svelte.js";

  /** @type {{ position: import("../../lib/api/trade.svelte.js").Position }} */
  let { position } = $props();

  /**
   * What was paid, not what it costs now — the trade's own averages (`avgEntryMcap` and
   * `avgEntryPrice`), so a single buy and a DCA'd position read the same: the cap, with the price
   * it implies in parentheses. Both are 0 until a buy confirms, and then there is only a dash.
   */
  const avgEntry = $derived.by(() => {
    const cap = Number(position?.entryMcapUsd ?? 0);
    const price = Number(position?.entryPriceUsd ?? 0);
    if (!(cap > 0) && !(price > 0)) return "\u2014";
    const capText = cap > 0 ? `$${formatCompact(cap)}` : "";
    const priceText = price > 0 ? `(${formatPrice(price)})` : "";
    return [capText, priceText].filter(Boolean).join(" ");
  });
  /**
   * Every pill the card carries, in one list so they share the row: a resting dip first (it is
   * what the trade is waiting to do), then the exit plan. Targets say how much they sell, the
   * dip says what it will spend.
   */
  const asPill = (pill) => ({ ...pill, note: pill.note ?? `sell ${pill.sellPct}%` });
  /** The exit plan keeps its own row: one target or two, they share it equally. */
  const targetPills = $derived((position.liveTargets ?? []).map(asPill));
  /** A resting dip is its own row below them, where on its own it spans the card. */
  const dipPills = $derived(position.dipPill ? [asPill(position.dipPill)] : []);
  const tone = (kind) =>
    kind === "DIP"
      ? { chip: "bg-yellow-transparent", ink: "text-yellow" }
      : kind === "STOP_LOSS"
        ? { chip: "bg-red-transparent", ink: "text-red" }
        : { chip: "bg-green-transparent", ink: "text-green" };
  /** The capture writes the P&L in its idle grey when there is nothing to report. */
  const IDLE = "rgb(152, 153, 163)";
  const up = $derived(position.changePct >= 0);
  const ink = $derived(up ? "rgb(33, 201, 94)" : "rgb(255, 98, 46)");
  const valueText = $derived(`$${position.valueUsd.toFixed(2)}`);
  const pctText = $derived(`${Math.abs(position.changePct).toFixed(2)}%`);
  /** The trade's own P&L, net of fees — what the capture prints here is never a literal. */
  const netUsd = $derived(position.pnlUsd ?? 0);
  const pnlUp = $derived(netUsd >= 0);
  const pnlText = $derived(`${netUsd >= 0 ? "+" : "-"}$${Math.abs(netUsd).toFixed(2)}`);
</script>

<div class="border border-bg-tertiary rounded-2xl p-2 flex flex-col gap-2">
  <button type="button" class="flex flex-col gap-1 p-2 pt-1 rounded-lg transition-colors hover:bg-bg-secondary cursor-pointer">
    <div class="flex items-center justify-between w-full gap-2">
      <div class="flex items-center gap-3 min-w-0">
        <div class="relative shrink-0" style="width: 32px; height: 32px;">
          <img class="rounded-full border border-bg-tertiary" src={position.image} alt="" style="height: 32px; width: 32px;" />
          <div class="absolute flex items-center justify-center" style="bottom: -3px; right: -3px;">
            <TokenBadge style="width: 14px; height: 14px;" />
          </div>
        </div>
        <div class="flex flex-col items-start min-w-0">
          <AnimatedNumber class="text-sm" value={valueText} />
          <div class="text-xs text-text-tertiary truncate max-w-full" style="line-height: 1;" translate="no">{position.amountText}</div>
        </div>
      </div>

      <div class="flex flex-col items-end shrink-0">
        <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: 20px;">
          <AnimatedNumber
            style="font-size: 14px; font-weight: 500; color: {pnlUp ? 'rgb(33, 201, 94)' : ink};"
            value="{pnlText}"
          />
        </div>
        <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: 16px;">
          <div style="color: {ink}; font-weight: 400; font-size: 6px;">{up ? "▲" : "▼"}</div>
          <AnimatedNumber style="font-size: 12px; font-weight: 400; color: {IDLE};" value={pctText} />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1 w-full pt-1">
      <div class="flex justify-between items-center" style="line-height: 1;">
        <div class="text-xs text-text-secondary">Invested</div>
        <AnimatedNumber class="text-xs" value={`$${position.investedUsd.toFixed(2)}`} />
      </div>
      <div class="flex justify-between items-center" style="line-height: 1;">
        <div class="text-xs text-text-secondary">Avg entry</div>
        <span class="text-xs m-num">{avgEntry}</span>
      </div>

      <!-- The exit plan the position is running, in ombra's chip shape and our own colours:
           the kind, what price it fires at, and how much it sells. Live targets only. -->
      {#snippet pillBody(pill, cancelling)}
            <div
              role={pill.swapId ? "button" : undefined}
              tabindex={pill.swapId ? 0 : undefined}
              title={pill.swapId ? "Cancel dip buy" : undefined}
              class="pill relative flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-1 {tone(pill.kind).chip} {pill.swapId
                ? 'cursor-pointer'
                : ''}"
              onclick={(event) => {
                if (!pill.swapId) return;
                event.preventDefault();
                event.stopPropagation();
                console.info("[cancel] pill clicked " + JSON.stringify({ swapId: pill.swapId, chain: getChain(), address: getAddress(), cancelling }));
                if (!cancelling) void cancelPendingSwap({ chain: getChain(), address: getAddress(), swapId: pill.swapId });
              }}
              onkeydown={(event) => {
                if (!pill.swapId || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                event.stopPropagation();
                if (!cancelling) void cancelPendingSwap({ chain: getChain(), address: getAddress(), swapId: pill.swapId });
              }}
            >
              <span class="text-xs font-bold {tone(pill.kind).ink}">{pill.tag}</span>
              <span class="text-xs font-bold {tone(pill.kind).ink}">{pill.label}</span>
              <span class="text-xs {tone(pill.kind).ink}" style="opacity: .5;">{pill.note}</span>
              {#if pill.swapId}
                <span
                  class="cancel-overlay absolute inset-y-0 right-0 flex items-center justify-center gap-1 rounded-lg px-2 {tone(pill.kind).chip} text-xs font-bold {tone(pill.kind).ink} {cancelling
                    ? 'is-cancelling'
                    : ''}"
                >
                  {#if cancelling}
                    <span
                      class="block animate-spin rounded-full"
                      style="width: 12px; height: 12px; border: 2px solid currentColor; border-top-color: transparent;"
                    ></span>
                  {:else}
                    Cancel
                  {/if}
                </span>
              {/if}
            </div>
      {/snippet}

      {#if targetPills.length}
        <!-- One equal column per target, so they spread across the card instead of bunching at
             the left; each pill's own content sits centred inside its share. -->
        <div class="grid gap-2 pt-1" style="grid-template-columns: repeat({targetPills.length}, minmax(0, 1fr));">
          {#each targetPills as pill (pill.id)}
            {@render pillBody(pill, pill.swapId ? isCancellingSwap(pill.swapId) : false)}
          {/each}
        </div>
      {/if}

      {#if dipPills.length}
        <!-- The dip's own row, below the exit plan and never mixed into it. -->
        <div class="grid gap-2 pt-1" style="grid-template-columns: 1fr;">
          {#each dipPills as pill (pill.id)}
            {@render pillBody(pill, pill.swapId ? isCancellingSwap(pill.swapId) : false)}
          {/each}
        </div>
      {/if}
    </div>
  </button>
</div>

<style>
  /* The reveal lives here on purpose: this stylesheet is a prebuilt Capture output, and the
     named-group hover utilities it would need (`group-hover/pill:opacity-*`) are not in it —
     which is why the Cancel overlay never appeared. Component CSS cannot go missing. */
  .pill .cancel-overlay {
    opacity: 0;
    transition: opacity 0.15s ease-out;
  }
  .pill:hover .cancel-overlay,
  .pill .cancel-overlay.is-cancelling {
    opacity: 1;
  }
</style>
