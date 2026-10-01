<script>
  // Trader hover card: the popover the site shows when the pointer rests on a trader.
  //
  // The frame, classes and geometry are the capture's. Its numbers are the trader's own
  // now, from `GET /v2/traders/{chain}/{walletAddress}` (`lib/api/traderCard.svelte.js`) —
  // the same payload Ombra's trader drawer reads — for the window the row underneath is
  // showing, so the two cannot disagree.
  //
  // Three things the capture had are not here, because no endpoint carries them: the bio
  // (kept only where the capture recorded that very trader), and the following / followers
  // pair. The Follow button stays as the capture's chrome.
  import Skeleton from "../Skeleton.svelte";
  import { getTraderCard, isTraderCardLoading } from "../../lib/api/traderCard.svelte.js";
  import { wrapperStyle } from "../../lib/hoverCard.svelte.js";

  /** @type {{ card: import("../../lib/types").UserHoverIdentity, anchor: { x: number, y: number }, side?: string, align?: string }} */
  let { card, anchor, side = "right", align = "center" } = $props();

  /** The card's own height, so a card placed above its row knows how far up to go. */
  let cardHeight = $state(0);
  const style = $derived(wrapperStyle(anchor, cardHeight));

  const data = $derived(getTraderCard());
  const loading = $derived(isTraderCardLoading());

  const href = $derived(data?.href ?? card.href ?? "");
  const name = $derived(data?.name ?? card.name ?? "");
  const handle = $derived(data?.handle ?? card.handle ?? "");
  const avatar = $derived(data?.avatar ?? card.avatar ?? "");
  const bio = $derived(card.bio ?? "");

  // The one line of geometry an SVG needs, kept out of the markup.
  const sparklinePoints = $derived.by(() => {
    const points = data?.sparkline ?? [];
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    return {
      d: points.map((value, i) => `${(i / (points.length - 1)) * 100},${16 - ((value - min) / range) * 16}`).join(" "),
      isUp: points[points.length - 1] >= 0
    };
  });
</script>

<!-- the capture's popper wrapper: no classes of its own, only geometry -->
<div
  data-radix-popper-content-wrapper=""
  style={style}
>
  <div
    data-side={side}
    data-align={align}
    data-state="open"
    data-slot="hover-card-content"
    class="hover-card-content z-popover origin-(--radix-hover-card-content-transform-origin) rounded-2xl border p-3 text-text-primary outline-hidden w-70 bg-bg-secondary border-bg-tertiary shadow-xl" bind:clientHeight={cardHeight}
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-start justify-between">
        <a class="hover:opacity-80" href={href} data-discover="true">
          {#if avatar}
            <img
              class="rounded-full flex items-center justify-center shrink-0 object-cover"
              src={avatar}
              alt=""
              style="width: 40px; height: 40px; min-width: 40px; min-height: 40px;"
            />
          {:else}
            <Skeleton class="rounded-full" style="width: 40px; height: 40px; min-width: 40px; min-height: 40px;" />
          {/if}
        </a>
        <button
          type="button"
          class="min-w-20 overflow-hidden rounded-lg px-2 py-1 text-xs font-bold bg-accent-primary text-text-primary cursor-pointer hover:opacity-80"
        >
          <span class="inline-block animate-flip-up">Follow</span>
        </button>
      </div>

      <div class="flex flex-col gap-0.5 px-0.5">
        <div class="flex items-center gap-1">
          <a class="min-w-0 hover:opacity-80" href={href} data-discover="true">
            <div translate="no" class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary">
              <div class="min-w-0 truncate">{name}</div>
            </div>
          </a>
        </div>
        <span class="text-xs text-text-secondary" translate="no">{handle}</span>
      </div>

      {#if bio}
        <p class="m-0 line-clamp-2 px-0.5 text-sm leading-tight text-text-primary">{bio}</p>
      {/if}

      <!-- The capture's two-up box: what the wallet holds, and its PnL for the window
           the row is showing. -->
      <div class="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2 ring ring-bg-tertiary">
        <div class="flex flex-col">
          <span class="text-xs text-text-secondary">Portfolio</span>
          {#if data}
            <span class="text-sm tabular-nums text-text-primary" translate="no">{data.portfolio}</span>
          {:else}
            <div class="mt-0.5 h-4 w-16 animate-pulse rounded-sm bg-bg-secondary"></div>
          {/if}
        </div>
        <div class="flex flex-col items-end">
          <span class="text-xs text-text-secondary">{data ? `${data.windowLabel} PnL` : "PnL"}</span>
          <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: 20px;">
            {#if data}
              <div style="font-size: 14px; font-weight: 500; color: {data.pnl.color};">{data.pnl.sign}</div>
              <div style="font-size: 14px; font-weight: 500; color: {data.pnl.color};">{data.pnl.value}</div>
            {:else}
              <div style="font-size: 14px; font-weight: 500; color: rgb(152, 153, 163);">--</div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Three lines, in the dashed idiom the token card uses: what a hover is for. -->
      <div class="flex flex-col">
        <div class="flex items-center gap-2 py-1">
          <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">Win rate</span>
          <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
          <span class="text-xs text-text-primary whitespace-nowrap shrink-0" translate="no">
            {#if data}{data.winRate}<span class="text-text-secondary"> · {data.trades.toLocaleString("en-US")} trades</span>{:else}<Skeleton class="h-3 w-16" />{/if}
          </span>
        </div>

        <div class="flex items-center gap-2 py-1">
          <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">Buys / Sells</span>
          <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
          <span class="text-xs whitespace-nowrap shrink-0 tabular-nums" translate="no">
            {#if data}<span class="text-green">{data.buys.toLocaleString("en-US")}</span> <span class="text-text-tertiary">/</span> <span class="text-red">{data.sells.toLocaleString("en-US")}</span>{:else}<Skeleton class="h-3 w-14" />{/if}
          </span>
        </div>

        <div class="flex items-center gap-2 py-1">
          <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">Tokens traded</span>
          <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
          <span class="text-xs text-text-primary whitespace-nowrap shrink-0 tabular-nums" translate="no">
            {#if data}{data.tokens.toLocaleString("en-US")}{:else}<Skeleton class="h-3 w-10" />{/if}
          </span>
        </div>

        <div class="flex items-center gap-2 py-1">
          <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">Volume traded</span>
          <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
          <span class="text-xs text-text-primary whitespace-nowrap shrink-0 tabular-nums" translate="no">
            {#if data}{data.volume}{:else}<Skeleton class="h-3 w-16" />{/if}
          </span>
        </div>

        <div class="flex items-center gap-2 py-1">
          <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">Fees</span>
          <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
          <span class="text-xs text-text-primary whitespace-nowrap shrink-0 tabular-nums" translate="no">
            {#if data}{data.fees}{:else}<Skeleton class="h-3 w-12" />{/if}
          </span>
        </div>

        <div class="flex items-center gap-2 py-1">
          <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">Last active</span>
          <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
          <span class="text-xs text-text-primary whitespace-nowrap shrink-0" translate="no">
            {#if data}{data.lastActive}{:else if loading}<Skeleton class="h-3 w-10" />{:else}—{/if}
          </span>
        </div>
      </div>

      {#if sparklinePoints}
        <!-- 90 daily points, the one thing here a number cannot say. -->
        <svg viewBox="0 0 100 16" class="h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
          <polyline
            points={sparklinePoints.d}
            fill="none"
            stroke={sparklinePoints.isUp ? "var(--color-green)" : "var(--color-red)"}
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
      {/if}
    </div>
  </div>
</div>
