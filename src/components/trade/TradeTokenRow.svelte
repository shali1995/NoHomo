<script>
  // The token row of the trade modal: the 48px logo, symbol and copy-address
  // button, the Open/Closed pill with its network and social icons, and the
  // market-cap button on the right.
  //
  // Markup and every class are the capture's; the
  // symbol, address, status and market cap are values in tradePopup.json.
  import ChainBadge from "../../icons/chain-badge.svelte";
  import CheckCircle from "../../icons/check-circle.svelte";
  import ChevronsUpDown from "../../icons/chevrons-up-down.svelte";
  import Copy from "../../icons/copy.svelte";
  import Globe from "../../icons/globe.svelte";
  import NetworkRobinhood from "../../icons/network-robinhood.svelte";
  import NetworkSolana from "../../icons/network-solana.svelte";
  import SocialSearch from "../../icons/social-search.svelte";
  import Telegram from "../../icons/telegram.svelte";
  import TokenMenu from "../../icons/token-menu.svelte";
  import XLogo from "../../icons/x-logo.svelte";

  // The token logo is a 48px box with an 18px chain badge pinned to its corner;
  // the image inside is the same 48px, styled from the JSON.
  const LOGO_BOX = "48px";
  const CHAIN_BADGE = "18px";
  // The market-cap change line is a NumberFlow host: its 20px line box was
  // flattened out of the shadow DOM, so it can only live as an inline style.
  const NUMBER_LINE = "20px";

  /** @type {{ token: import("../../lib/types").TradePopupToken }} */
  let { token } = $props();
</script>

<div class="flex items-center gap-3 pb-2">
  <a class="flex items-center gap-3 hover:opacity-80 transition-opacity" data-state="closed" data-slot="hover-card-trigger" href={token.href} data-discover="true">
    <div class="relative shrink-0" style="width: {LOGO_BOX}; height: {LOGO_BOX};">
      <img class="rounded-full border border-bg-tertiary" src={token.imageSrc} alt="" style={token.imageStyle} />
      {#if token.imageBadge}<div class="absolute flex items-center justify-center" style={token.imageBadge.style}><ChainBadge style="width: {CHAIN_BADGE}; height: {CHAIN_BADGE};" /></div>{/if}
    </div>
    <div class="flex flex-col items-start gap-1">
      <div class="flex items-center gap-2">
        <div class="text-lg">{token.symbol}</div>
        <button type="button" class="flex items-center gap-1 hover:opacity-70 transition-opacity" aria-label="Copy address">
          <div class="text-text-tertiary text-xs">{token.address}</div>
          <div class="w-4 h-4 shrink-0 relative flex items-center justify-center"><Copy aria-hidden="true" /><CheckCircle /></div>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <div class={token.statusClasses}>{token.statusLabel}{#if token.statusDotStyle}<div class="shrink-0 rounded-full bg-accent-primary" style={token.statusDotStyle}></div>{/if}</div>
        {#if token.network === "solana"}<NetworkSolana width="16" height="16" data-state="closed" data-slot="tooltip-trigger" />{:else if token.network === "robinhood"}<NetworkRobinhood width="16" height="16" data-state="closed" data-slot="tooltip-trigger" />{/if}
        <div class="flex gap-1 items-center shrink-0">
          {#each token.links as kind (kind)}
            <span role="link" tabindex="0" class="flex items-center justify-center rounded-sm bg-bg-tertiary overflow-hidden p-0.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer" data-state="closed" data-slot="tooltip-trigger">{#if kind === "globe"}<Globe />{:else if kind === "x"}<XLogo />{:else if kind === "telegram"}<Telegram />{:else if kind === "search"}<SocialSearch />{/if}</span>
          {/each}
        </div>
        <button data-state="closed" data-slot="tooltip-trigger"><TokenMenu class="size-4 text-text-tertiary" /></button>
      </div>
    </div>
  </a>
  <div class="flex-1"></div>
  <button type="button" class="flex flex-col items-end tabular-nums hover:text-text-secondary transition-colors">
    <div class="text-lg flex items-center"><ChevronsUpDown class="w-5 h-5 text-text-secondary" />{token.marketCap}</div>
    <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: {NUMBER_LINE};">
      <div style={token.changeArrowStyle}>{token.changeArrow}</div>
      <div style={token.changeValueStyle}>{token.changeValue}</div>
    </div>
  </button>
</div>
