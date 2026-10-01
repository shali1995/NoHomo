<script>
  // Token hover card: the popover the site shows when the pointer rests on a token
  // anywhere in the app.
  //
  // The markup, classes and geometry are the capture's. Its values are the hovered
  // token's own now, fetched by chain + address (`lib/api/tokenCard.svelte.js`) — the
  // card used to render one frozen capture, so every row showed the same token.
  //
  // `card` is what the row already knows (its ticker and logo, so the header paints on
  // the first frame) plus the pair that identifies the token; the numbers arrive a moment
  // later and hold their boxes with the same placeholders the rest of the app uses.
  import TokenMenu from "../../icons/token-menu.svelte";
  import NetworkSolana from "../../icons/network-solana.svelte";
  import NetworkRobinhood from "../../icons/network-robinhood.svelte";
  import NetworkBnb from "../../icons/network-bnb.svelte";
  import NetworkBase from "../../icons/network-base.svelte";
  import NetworkEthereum from "../../icons/network-ethereum.svelte";
  import Copy from "../../icons/copy.svelte";
  import CheckCircle from "../../icons/check-circle.svelte";
  import Skeleton from "../Skeleton.svelte";
  import { getTokenCard, isTokenCardLoading } from "../../lib/api/tokenCard.svelte.js";
  import { wrapperStyle } from "../../lib/hoverCard.svelte.js";

  /** @type {{ card: import("../../lib/types").TokenHoverIdentity, anchor: { x: number, y: number }, side?: string, align?: string }} */
  let { card, anchor, side = "right", align = "center" } = $props();

  /** The card's own height, so a card placed above its row knows how far up to go. */
  let cardHeight = $state(0);
  const style = $derived(wrapperStyle(anchor, cardHeight));

  const data = $derived(getTokenCard());
  const loading = $derived(isTokenCardLoading());

  // The token's own values once they land, and what the row already draws until then.
  const name = $derived(data?.name || card.symbol || "");
  const href = $derived(data?.href ?? card.href ?? "");
  const logo = $derived(data?.logo ?? card.logo ?? "");
  const network = $derived(data?.network ?? card.network ?? "");

  const networks = {
    solana: NetworkSolana,
    robinhood: NetworkRobinhood,
    bnb: NetworkBnb,
    base: NetworkBase,
    ethereum: NetworkEthereum
  };
  const Network = $derived(networks[network] ?? NetworkSolana);

  /** The four rows the capture lists; their labels are fixed, their values are fetched. */
  const STAT_LABELS = ["Volume 24hr", "Holders", "Top 10 holding", "Contract"];

  // The capture stacks both glyphs and swaps them with opacity/scale/rotate.
  const COPY_SHOWN = "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-100 scale-100 rotate-0";
  const COPY_HIDDEN = "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-0 scale-0 rotate-90";
  const CHECK_SHOWN = "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-100 scale-100 rotate-0";
  const CHECK_HIDDEN = "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-0 scale-0 -rotate-90";

  let copied = $state(false);
  let copyTimer = null;

  async function copyAddress() {
    const address = data?.stats.find((stat) => stat.copy)?.address;
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // The Clipboard API needs a secure context; fall back to a temporary selection.
      const el = document.createElement("textarea");
      el.value = address;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      document.body.removeChild(el);
    }
    copied = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied = false;
      copyTimer = null;
    }, 1500);
  }
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
    class="hover-card-content z-popover origin-(--radix-hover-card-content-transform-origin) rounded-2xl border text-text-primary outline-hidden w-70 bg-bg-secondary border-bg-tertiary shadow-xl p-3" bind:clientHeight={cardHeight}
  >
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-start">
        <a class="hover:opacity-80" href={href} data-discover="true" tabindex="-1">
          <div class="relative shrink-0" style="width: 40px; height: 40px;">
            {#if logo}
              <img
                class="rounded-full border border-bg-tertiary"
                src={logo}
                alt=""
                style="height: 40px; width: 40px;"
              />
            {:else}
              <Skeleton class="rounded-full" style="height: 40px; width: 40px;" />
            {/if}
          </div>
        </a>
        <button data-state="closed" data-slot="tooltip-trigger" tabindex="-1">
          <TokenMenu class="text-text-tertiary size-5" />
        </button>
      </div>

      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-center gap-2">
          <div class="flex gap-2 items-center min-w-0">
            <a
              class="text-sm truncate hover:opacity-80"
              translate="no"
              href={href}
              data-discover="true"
              tabindex="-1"
            >
              {name}
            </a>
            <Network width="16" height="16" data-state="closed" data-slot="tooltip-trigger" />
          </div>
          <div class="text-sm shrink-0" translate="no">
            {#if data}{data.marketCap}{:else}<Skeleton class="h-4 w-16" />{/if}
          </div>
        </div>

        <div class="flex justify-between items-center gap-2">
          <div class="text-xs text-text-secondary" translate="no">
            <span class="normal-nums" translate="no">
              {#if data}{data.price}{:else}<Skeleton class="h-3 w-14" />{/if}
            </span>
          </div>
          {#if data}
            <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: 16px;">
              <div style="color: {data.changeColor}; font-weight: 400; font-size: 6px;">{data.changeArrow}</div>
              <div style="font-size: 12px; font-weight: 400; color: {data.changeColor};">{data.change}</div>
            </div>
          {:else if loading}
            <Skeleton class="h-3 w-12" />
          {/if}
        </div>
      </div>

      <div class="flex flex-col">
        {#each STAT_LABELS as label (label)}
          {@const stat = data?.stats.find((entry) => entry.label === label)}
          <div class="flex items-center gap-2 py-1">
            <span class="text-xs text-text-secondary whitespace-nowrap shrink-0">{label}</span>
            <div class="flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px"></div>
            <span
              class="text-xs text-text-primary whitespace-nowrap shrink-0 {stat?.copy
                ? 'cursor-pointer hover:opacity-70 transition-opacity'
                : ''}"
              translate="no"
            >
              {#if stat}{stat.value}{:else}<Skeleton class="h-3 w-14" />{/if}
            </span>
            {#if stat?.copy}
              <button
                type="button"
                class="shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Copy Contract"
                tabindex="-1"
                onclick={copyAddress}
              >
                <div class="w-4 h-4 shrink-0 relative flex items-center justify-center">
                  <Copy aria-hidden="true" class={copied ? COPY_HIDDEN : COPY_SHOWN} />
                  <CheckCircle class={copied ? CHECK_SHOWN : CHECK_HIDDEN} />
                </div>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
