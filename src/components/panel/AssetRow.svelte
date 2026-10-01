<script>
  // One row of a curated list: the asset, what it is worth, and how it moved in 24h. The figures
  // come through the list store's readers, so a row never decides where a number came from.
  import { openTokenCard, closeHoverCard } from "../../lib/hoverCard.svelte.js";
  import { apiChain } from "../../lib/routes.js";
  import { rowChange, rowChangeUp, rowPrice } from "../../lib/api/lists.svelte.js";
  import { tokenImage } from "../../lib/api/config.js";

  /** @type {{ row: any }} */
  let { row } = $props();

  const LOGO_STYLE = "height: 32px; width: 32px;";
  const price = $derived(rowPrice(row));
  const change = $derived(rowChange(row));

  /**
   * The market image is the truth; the list's own logo stands in, and `/images/nohomo-eyes.png` is
   * the app's mark, the last resort when neither loads.
   */
  function useAppMark(event) {
    const image = event.currentTarget;
    if (image.dataset.fallback === "mark") return;
    if (image.dataset.fallback !== "1" && row.imageUrl) {
      image.dataset.fallback = "1";
      image.src = row.imageUrl;
      return;
    }
    image.dataset.fallback = "mark";
    image.src = "/images/nohomo-eyes.png";
  }

  /**
   * The token card behind a hover. Every list's rows carry the token in their own link —
   * `/tokens/<network>/<address>` — so the identity is read from there and falls back to whatever
   * the row calls the address itself. A row with neither opens nothing rather than an empty card.
   */
  function openCard(event) {
    // this row builds its link in the markup, so there is no `row.href` to read: the chain is
    // the Solana the list is built from, and the mint is the address
    const parts = ["", "tokens", "solana", String(row.mint ?? "")];
    const address = row.mint ?? row.address ?? row.tokenAddress ?? parts[3] ?? "";
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
  class="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-bg-secondary focus-visible:bg-bg-secondary min-w-0"
  href="/tokens/solana/{row.mint}"
  title={row.issuer ? `${row.name} · ${row.issuer}` : row.name}
  data-slot="hover-card-trigger"
  data-state="closed"
  onmouseenter={openCard}
  onmouseleave={closeHoverCard}
>
  <div class="relative shrink-0" style={LOGO_STYLE}>
    <img
      class="rounded-full border border-bg-tertiary"
      src={tokenImage("SOL", row.mint, 64)}
      alt=""
      style={LOGO_STYLE}
      onerror={useAppMark}
    />
  </div>

  <div class="flex flex-col flex-1 min-w-0 gap-1">
    <div class="flex items-center gap-1 min-w-0">
      <span class="text-sm font-medium leading-4 truncate">{row.name}</span>
      <span class="text-xs text-text-tertiary shrink-0">{row.symbol}</span>
    </div>
    {#if row.issuer || row.tier}
      <div class="flex items-center gap-1 min-w-0 text-xs text-text-tertiary">
        {#if row.issuer}<span class="truncate">{row.issuer}</span>{/if}
        {#if row.tier}
          <span class="shrink-0 rounded-sm bg-bg-tertiary-solid px-1">{row.tier}</span>
        {/if}
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-0.5 items-end tabular-nums shrink-0">
    {#if price}
      <span class="text-sm leading-4">{price}</span>
    {:else}
      <span class="block h-4 w-12 rounded-sm bg-bg-tertiary"></span>
    {/if}
    {#if change}
      <span class="text-xs {rowChangeUp(row) ? "text-green" : "text-red"}">{change}</span>
    {/if}
  </div>
</a>
