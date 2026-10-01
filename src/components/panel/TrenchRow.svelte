<script>
  // One row of the Bonding and Graduated pills. Same box as `TokenRow`, with the two
  // fields those views swap in: the token's age rides beside the symbol on a green flame,
  // the second line is 24h volume instead of the price, and the right column shows the
  // bonding progress on Bonding where Graduated shows the change.
  import Flame from "../../icons/flame.svelte";
  import { openTokenCard, closeHoverCard } from "../../lib/hoverCard.svelte.js";
  import { apiChain } from "../../lib/routes.js";

  /** @type {{ row: import("../../lib/types").TrenchRow }} */
  let { row } = $props();

  const LOGO_BOX_STYLE = "width: 36px; height: 36px;";

  /**
   * The same token card every other row opens. The identity is read from the row's own link —
   * `/tokens/<network>/<address>` — and the chain is handed to the card as the API's ticker, which
   * is what `GET /v2/token/{chain}/{address}` expects. A row with no address opens nothing.
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
  const LOGO_FALLBACK_STYLE = "height: 36px; width: 36px; font-size: 16px;";
  const BADGE_STYLE = "bottom: -1px; right: -1px;";
  const BADGE_BOX_STYLE = "width: 18px; height: 18px;";

  // A launchpad with no bundled mark would otherwise paint a broken-image glyph, the same
  // fallback the About card uses.
  const hideMissingLogo = (event) => {
    event.currentTarget.parentElement.style.display = "none";
  };
</script>

<a
  class="flex items-center gap-3 p-2 py-2 rounded-lg cursor-pointer group min-w-0 hover:bg-bg-secondary focus-visible:bg-bg-secondary"
  href={row.href}
  data-slot="hover-card-trigger"
  data-state="closed"
  onmouseenter={openCard}
  onmouseleave={closeHoverCard}
>
  <div class="relative shrink-0" style={LOGO_BOX_STYLE}>
    {#if row.logo}
      <img class="rounded-full border border-bg-tertiary" src={row.logo} alt="" style={row.logoStyle} />
    {:else}
      <div
        class="rounded-full border border-bg-tertiary bg-bg-tertiary-solid text-text-tertiary flex items-center justify-center"
        style={LOGO_FALLBACK_STYLE}
      >{row.initial}</div>
    {/if}
    {#if row.launchpadLogo}
      <div class="absolute" style={BADGE_STYLE}>
        <div class="rounded-full bg-bg-primary flex items-center justify-center overflow-hidden shrink-0" style={BADGE_BOX_STYLE}>
          <img alt={row.launchpadName} width="14" height="14" class="rounded-full" src={row.launchpadLogo} onerror={hideMissingLogo} />
        </div>
      </div>
    {/if}
  </div>

  <div class="flex flex-col flex-1 min-w-0 gap-1">
    <div class="flex items-center gap-1.5 min-w-0">
      <span class="text-sm leading-4 truncate">{row.symbol}</span>
      <span class="inline-flex items-center gap-1 text-xs font-medium text-green">
        <Flame class="w-3 h-3 text-green" />
        <span title={row.ageTitle}>{row.age}</span>
      </span>
    </div>
    <div class="flex gap-1.5 items-center text-xs text-text-secondary min-w-0">
      <span class="truncate">{row.volume} Vol</span>
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
    {#if row.bondedPct !== null}
      <span class="inline-flex items-center gap-1.5 text-xs text-text-secondary" aria-label="{row.bondedPct}% bonded">
        <span class="relative h-1 w-12 rounded-full overflow-hidden bg-bg-tertiary" aria-hidden="true">
          <span class="absolute inset-y-0 left-0 rounded-full" style="width: {row.bondedPct}%; background-color: var(--color-green);"></span>
        </span>{row.bondedPct}%
      </span>
    {:else}
      <div class="flex gap-0.75 items-center tabular-nums" style="line-height: 16px;">
        <div style="color: {row.color}; font-weight: 400; font-size: 6px;">{row.dir}</div>
        <div style="font-size: 12px; font-weight: 500; color: {row.color};">{row.change}</div>
      </div>
    {/if}
  </div>
</a>
