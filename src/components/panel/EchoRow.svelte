<script>
  // One row of the Echo table.
  //
  // Left: the token itself — a big logo with the rank on its corner, so the rank is always there
  // and never costs a column.
  //
  // Right, three rows, each one idea:
  //   1. the name, then the market cap the token page will show, and the 24h change beside it
  //   2. what Echo counted — events and traders, with the token's age
  //   3. the callers who moved it, the multiple since Echo first caught it, and the flow
  //
  // The values arrive already shaped by `echoRowView` in src/lib/api/echo.svelte.js; nothing here
  // invents a number, and a token whose image Echo has none for falls back to the app's own token
  // image route and then to the app's mark.
  //
  // Sizes are ones the stylesheet actually carries: `text-[10px]` is NOT in app.css, which is why
  // this row used to read as squashed rather than small.
  /** @type {{ row: ReturnType<typeof import("../../lib/api/echo.svelte.js").echoRowView> }} */
  import { openTokenCard, closeHoverCard } from "../../lib/hoverCard.svelte.js";
  import { apiChain } from "../../lib/routes.js";
  let { row } = $props();

  const LOGO_STYLE = "height: 52px; width: 52px;";
  const AVATAR_STYLE = "height: 16px; width: 16px; font-size: 9px;";
  const RANK_STYLE = "left: -4px; bottom: -4px; height: 18px; min-width: 18px; padding: 0 4px; font-size: 10px;";

  /** `/images/nohomo-eyes.png` is the app's mark: the last resort when no image loads. */
  function useAppMark(event) {
    const image = event.currentTarget;
    if (image.dataset.fallback) return;
    image.dataset.fallback = "1";
    image.src = "/images/nohomo-eyes.png";
  }

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
  class="flex items-start gap-2 p-2 rounded-lg cursor-pointer hover:bg-bg-secondary focus-visible:bg-bg-secondary min-w-0"
  href={row.href}
  title={row.title}
  data-slot="hover-card-trigger"
  data-state="closed"
  onmouseenter={openCard}
  onmouseleave={closeHoverCard}
>
  <div class="relative shrink-0" style={LOGO_STYLE}>
    <img class="rounded-full border border-bg-tertiary" src={row.logo} alt="" style={LOGO_STYLE} onerror={useAppMark} />
    <span
      class="absolute flex items-center justify-center rounded-full border border-bg-primary bg-bg-tertiary-solid font-bold text-text-secondary"
      style={RANK_STYLE}
      title="Echo rank">{row.rank}</span
    >
  </div>

  <div class="flex flex-col flex-1 min-w-0 gap-1">
    <div class="flex items-center gap-1 min-w-0">
      <span class="text-sm font-medium leading-4 truncate">{row.name}</span>
      <span class="ml-auto flex items-center gap-1 shrink-0 tabular-nums">
        <span class="text-sm leading-4">{row.primary}</span>
        {#if row.changeLabel}
          <span class="text-xs" style="color: {row.changeColor};">{row.changeLabel}</span>
        {/if}
      </span>
    </div>

    <div class="flex items-center gap-1 text-xs text-text-secondary min-w-0">
      <span class="truncate">{row.detail}</span>
      {#if row.ageLabel}
        <span class="shrink-0 text-text-tertiary" title={row.ageTitle}>· {row.ageLabel}</span>
      {/if}
    </div>

    {#if row.flowLabel || row.multipleLabel || row.wallets.length}
      <!-- no wrap: the numbers change every couple of seconds, and a wrapping line rises and falls
           with them. Everything on it is shrink-0, so it holds its row and the column clips it. -->
      <div class="flex items-center gap-1 min-w-0">
        <span class="flex items-center gap-0.5 shrink-0">
          {#each row.wallets as wallet (wallet.address)}
            <span
              class="rounded-full border border-bg-primary bg-bg-tertiary-solid text-text-tertiary flex items-center justify-center overflow-hidden"
              style={AVATAR_STYLE}
              title={wallet.label}
            >
              {#if wallet.imageUrl}
                <img class="rounded-full" src={wallet.imageUrl} alt="" style={AVATAR_STYLE} onerror={useAppMark} />
              {:else}
                <span>{wallet.letter}</span>
              {/if}
            </span>
          {/each}
          {#if row.extraLabel}
            <span class="shrink-0 text-xs text-text-tertiary" title={row.extraTitle}>{row.extraLabel}</span>
          {/if}
        </span>

        {#if row.multipleLabel}
          <!-- the multiple since Echo first caught the token: a gain, so it reads green -->
          <span class="shrink-0 rounded-sm bg-green-transparent px-1 text-xs font-bold text-green" title={row.multipleTitle}
            >{row.multipleLabel}</span
          >
        {/if}

        {#if row.flowLabel}
          <span class="shrink-0 whitespace-nowrap text-xs text-text-tertiary">{row.flowLabel}</span>
        {/if}
      </div>
    {/if}
  </div>
</a>
