<script>
  // One open position: the token, what is held, what it is worth, and — on hover — the ⚡
  // button that opens the quick block underneath.
  //
  // The row is the capture's, element for element: the avatar with the badge cut into its
  // corner, the name over the amount, the value over the change, and the values column
  // sliding left by 3.25rem on hover so the ⚡ has somewhere to sit (the capture's own
  // `group-hover/position:-translate-x-13`). Local state decides whether the block is open;
  // the row fires the same token hover card the token page's tables do.
  import TokenBadge from "../../icons/token-badge.svelte";
  import Zap from "../../icons/zap.svelte";
  import { openTokenCard } from "../../lib/hoverCard.svelte.js";
  import { followLink, followLinkKey } from "../../lib/router.js";
  import PositionActions from "./PositionActions.svelte";

  /** @type {{ position: import("../../lib/api/trade.svelte.js").Position }} */
  let { position } = $props();

  let actionsOpen = $state(false);

  /** Net P&L, after fees — what ombra's row prints, and what decides the colour. */
  const netUsd = $derived(position.pnlUsd ?? 0);
  const up = $derived(netUsd >= 0);
  /** Net P&L over what was paid; ombra falls back to the gross percent below a zero basis. */
  const netPct = $derived(
    position.investedUsd > 0 ? (netUsd / position.investedUsd) * 100 : (position.changePct ?? 0)
  );
  const ink = $derived(up ? "rgb(33, 201, 94)" : "rgb(255, 98, 46)");
  const valueText = $derived(`${netUsd < 0 ? "-" : ""}$${Math.abs(netUsd).toFixed(2)}`);
  const pctText = $derived(`${Math.abs(netPct).toFixed(1)}%`);
  const href = $derived(`/tokens/${position.chain}/${position.address}`);
</script>

<div class="group/position relative">
  <a
    class="flex items-center gap-3 py-2 px-2 hover:bg-bg-secondary focus-visible:bg-bg-secondary rounded-lg"
    {href}
    data-state="closed"
    data-slot="hover-card-trigger"
    onmouseenter={(event) => openTokenCard({ chain: position.chain, address: position.address }, event)}
    onclick={(event) => followLink(event, href)}
    onkeydown={(event) => followLinkKey(event, href)}
  >
    <div class="relative shrink-0" style="width: 36px; height: 36px;">
      <img class="rounded-full border border-bg-tertiary" src={position.image} alt="" style="height: 36px; width: 36px;" />
      <div class="absolute flex items-center justify-center" style="bottom: -3px; right: -3px;">
        <TokenBadge />
      </div>
    </div>

    <div class="flex flex-col gap-px items-start flex-1 min-w-0" translate="no">
      <div class="text-sm truncate max-w-full">{position.name}</div>
      <div class="flex items-center gap-1 text-xs text-text-secondary max-w-full overflow-hidden">
        <div class="truncate">{position.amountText}</div>
      </div>
    </div>

    <div class="flex flex-col items-end gap-px w-24 shrink-0 transition-transform duration-150 group-hover/position:-translate-x-13">
      <div class="text-sm" translate="no">{valueText}</div>
      <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: 16px;">
        <div style="color: {ink}; font-weight: 400; font-size: 6px;">{up ? "▲" : "▼"}</div>
        <div style="font-size: 12px; font-weight: 400; color: {ink};">{pctText}</div>
      </div>
    </div>
  </a>

  <button
    type="button"
    aria-label="Open instant actions"
    aria-expanded={actionsOpen}
    class="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border transition-all border-transparent bg-accent-primary text-text-primary {actionsOpen
      ? 'opacity-100 hover:bg-accent-primary/80'
      : 'pointer-events-none opacity-0 group-hover/position:pointer-events-auto group-hover/position:opacity-100 group-hover/position:hover:bg-accent-primary/80'}"
    onclick={() => (actionsOpen = !actionsOpen)}
  >
    <Zap class="lucide lucide-zap w-4 h-4 fill-current" />
  </button>
</div>

<div
  class="grid transition-all duration-200 ease-out {actionsOpen
    ? 'grid-rows-[1fr] translate-y-0 opacity-100'
    : 'grid-rows-[0fr] -translate-y-1 opacity-0'}"
>
  <div class="min-h-0 overflow-hidden">
    <PositionActions token={position} />
  </div>
</div>
