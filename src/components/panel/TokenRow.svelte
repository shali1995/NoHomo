<script>
  // One token row in the discovery panel: the logo (or the symbol's initial), the symbol
  // and price, then market cap and the 1h change. Every class and inline style is the
  // capture's; the values come from src/lib/api/trending.svelte.js.
  /** @type {{ row: import("../../lib/types").DiscoveryRow }} */
  import { openTokenCard, closeHoverCard } from "../../lib/hoverCard.svelte.js";
  import { apiChain } from "../../lib/routes.js";
  let { row } = $props();

  const LOGO_BOX_STYLE = "width: 36px; height: 36px;";
  const LOGO_FALLBACK_STYLE = "height: 36px; width: 36px; font-size: 16px;";

  /**
   * The token card behind a hover. Every list's rows carry the token in their own link —
   * `/tokens/<network>/<address>` — so the identity is read from there and falls back to whatever
   * the row calls the address itself. A row with neither opens nothing rather than an empty card.
   */
  function openCard(event) {
    const parts = String(row.href ?? "").split("/");
    const address = row.address ?? row.tokenAddress ?? row.mint ?? parts[3] ?? "";
    if (!address) return;
    openTokenCard(
      {
        href: row.href,
        chain: apiChain(parts[2] || row.chain),
        network: parts[2] || row.chain,
        address,
        symbol: row.symbol ?? row.name,
        logo: row.logo ?? row.imageUrl
      },
      event,
      { placement: "side" }
    );
  }
</script>

<a
  class="flex items-center gap-3 p-2 py-2 rounded-lg cursor-pointer group min-w-0 {row.active ? 'bg-bg-tertiary' : 'hover:bg-bg-secondary focus-visible:bg-bg-secondary'}"
  href={row.href}
  data-slot="hover-card-trigger"
  data-state="closed"
  onmouseenter={openCard}
  onmouseleave={closeHoverCard}
>
  <div class="relative shrink-0" style={LOGO_BOX_STYLE}>
    {#if row.logo}
      <img class="rounded-full border border-bg-tertiary" src={row.logo} alt="" style={row.logoStyle} />
      {#if row.badgePath}
        <div class="absolute flex items-center justify-center" style={row.badgeStyle}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" style={row.badgeSvgStyle}>
            <path d={row.badgePath} fill={row.badgeFill} />
          </svg>
        </div>
      {/if}
    {:else}
      <div
        class="rounded-full border border-bg-tertiary bg-bg-tertiary-solid text-text-tertiary flex items-center justify-center"
        style={LOGO_FALLBACK_STYLE}
      >{row.initial}</div>
    {/if}
  </div>

  <div class="flex flex-col flex-1 min-w-0 gap-1">
    <div class="flex items-center gap-1.5 min-w-0">
      <span class="text-sm leading-4 truncate">{row.symbol}</span>
    </div>
    <div class="flex gap-1.5 items-center text-xs text-text-secondary min-w-0">
      <span class="truncate">
        <span class="tabular-nums">{row.pricePrefix}{#if row.sub}<sub>{row.sub}</sub>{/if}{row.priceSuffix}</span>
      </span>
    </div>
  </div>

  <div class="flex flex-col gap-0.5 items-end tabular-nums shrink-0">
    <div class="text-sm leading-4">
      <span>
        <span class="relative inline-block">
          <span>{row.mcap}</span>
          <span class="pointer-events-none absolute inset-0 select-none opacity-0" style="color: {row.mcapHiddenColor ?? 'inherit'};">{#if row.hiddenText}<span>{row.hiddenText}</span>{/if}</span>
        </span>
      </span>MC
    </div>
    <div class="flex gap-0.75 items-center tabular-nums" style="line-height: 16px;">
      <div style="color: {row.color}; font-weight: 400; font-size: 6px;">{row.dir}</div>
      <div style="font-size: 12px; font-weight: 500; color: {row.color};">{row.change}</div>
    </div>
  </div>
</a>
