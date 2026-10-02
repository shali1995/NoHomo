<!--
  The token page's top band, the same on every tab: back chevron, the token's face and
  its names, and the three actions on the right. It is 60.3 dp of content under the 24 dp
  status-bar inset, and it is opaque, so the page scrolls beneath it rather than through it.

  The star writes the token's favourite state through the API's own endpoint; the history
  button has no screen to open on the phone build, so it is drawn where the capture draws
  it and left inert.
-->
<script>
  import HistoryIcon from "../../../icons/history.svelte";
  import StarIcon from "../../../icons/star.svelte";
  import ShareIcon from "../../../icons/share.svelte";
  import NetworkSolana from "../../../icons/network-solana.svelte";
  import { api } from "../../../lib/api/client.js";
  import { tokenImage } from "../../../lib/api/config.js";

  let { token, chain = "", onback } = $props();

  const symbol = $derived(token?.tokenSymbol ?? "");
  const name = $derived(token?.tokenName ?? "");
  const address = $derived(token?.tokenAddress ?? "");
  const logo = $derived(token ? tokenImage(token.chain, token.tokenAddress, 96) : "");

  /** The API answers the token's own favourite state, so the star starts where the account left it. */
  let favourited = $state(false);
  let favouritedFor = "";
  $effect(() => {
    const key = `${token?.chain ?? ""}:${address}`;
    if (key === favouritedFor) return;
    favouritedFor = key;
    favourited = Boolean(token?.isFavourited);
  });

  async function toggleFavourite() {
    if (!token) return;
    const next = !favourited;
    favourited = next;
    try {
      if (next) {
        await api.POST("/v2/user/favourites", {
          body: { chain: token.chain, tokenAddress: token.tokenAddress }
        });
      } else {
        await api.DELETE("/v2/user/favourites/{chain}/{tokenAddress}", {
          params: { path: { chain: token.chain, tokenAddress: token.tokenAddress } }
        });
      }
    } catch {
      // Signed out, or the write failed: put the star back where it was.
      favourited = !next;
    }
  }

  let copied = $state(false);
  let copyTimer = null;

  async function copyAddress() {
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

  async function share() {
    const url = `${window.location.origin}/tokens/${chain}/${address}`;
    try {
      if (navigator.share) await navigator.share({ url, title: symbol || name });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* the share sheet was dismissed */
    }
  }
</script>

<header class="header">
  <button type="button" class="back" aria-label="Back" onclick={() => onback?.()}>
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </button>

  <span class="logo">
    {#if logo}
      <img src={logo} alt="" decoding="async" />
    {:else}
      <span class="initial">{(symbol || "?").slice(0, 1)}</span>
    {/if}
  </span>

  <div class="identity">
    <div class="symbol-row">
      <span class="symbol m-truncate">{symbol}</span>
      <!-- The kind mark is the capture's three slanted bars; it ships as a bitmap there. -->
      <span class="kind" aria-hidden="true">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M1.6 5.9 14.4 3.4v1.9L1.6 7.8z" fill="currentColor" />
          <path d="M1.6 9.1 14.4 6.6v1.9L1.6 11z" fill="currentColor" opacity="0.8" />
          <path d="M1.6 12.3 14.4 9.8v1.9L1.6 14.2z" fill="currentColor" opacity="0.6" />
        </svg>
      </span>
      {#if chain === "solana" || token?.chain === "SOL"}
        <span class="chain-badge" aria-hidden="true"><NetworkSolana /></span>
      {/if}
    </div>

    <div class="name-row">
      <span class="name m-truncate">{name}</span>
      <button type="button" class="copy" aria-label="Copy contract address" onclick={copyAddress}>
        {#if copied}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m5 13 4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <rect x="8" y="8" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  <div class="actions">
    <!-- No closed-trades screen on the phone build, so this one only holds its place. -->
    <button type="button" class="action" aria-label="History" disabled>
      <HistoryIcon />
    </button>
    <button
      type="button"
      class="action"
      class:action--on={favourited}
      aria-label={favourited ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={favourited}
      onclick={toggleFavourite}
    >
      <StarIcon />
    </button>
    <button type="button" class="action" aria-label="Share" onclick={share}>
      <ShareIcon />
    </button>
  </div>
</header>

<style>
  .header {
    --safe: env(safe-area-inset-top, 0px);
    position: relative;
    flex: 0 0 auto;
    height: calc(84.3px + var(--safe));
    background: var(--m-bg);
  }

  .back {
    position: absolute;
    top: calc(40px + var(--safe));
    left: 16px;
    display: flex;
    align-items: center;
    width: 32px;
    height: 24.5px;
    color: var(--m-muted);
    opacity: 0.35;
  }

  .back svg {
    width: 24px;
    height: 24.5px;
  }

  .logo {
    position: absolute;
    top: calc(28.3px + var(--safe));
    left: 48px;
    width: 48px;
    height: 48px;
    border: 1px solid var(--m-hairline);
    border-radius: 24px;
    overflow: hidden;
  }

  .logo img,
  .initial {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .initial {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--m-card);
    font-size: 18px;
    color: var(--m-muted);
  }

  .identity {
    position: absolute;
    top: calc(30.4px + var(--safe));
    left: 108.3px;
    right: 104px;
  }

  .symbol-row {
    display: flex;
    align-items: center;
    gap: 3.8px;
    height: 21.3px;
  }

  .symbol {
    max-width: 160px;
    font-size: 18px;
    font-weight: 500;
    line-height: 21.3px;
    color: var(--m-text);
  }

  /* 20.3 dp boxes: the kind mark on a faint square, the chain mark on the page colour. */
  .kind {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 20.3px;
    height: 20.3px;
    padding: 2px;
    border-radius: 4px;
    background: var(--m-hairline);
    color: var(--m-text);
  }

  .kind svg {
    width: 16px;
    height: 16px;
  }

  .chain-badge {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 20.3px;
    height: 20.3px;
    border-radius: 10px;
    background: var(--m-bg);
    overflow: hidden;
  }

  .chain-badge :global(svg) {
    width: 16px;
    height: 16px;
    color: var(--m-text);
  }

  .chain-badge :global(svg rect) {
    fill: var(--m-bg);
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 6.4px;
    height: 18.1px;
    margin-top: 4.3px;
  }

  .name {
    max-width: 180px;
    font-size: 14px;
    font-weight: 500;
    line-height: 18.1px;
    color: var(--m-muted);
  }

  .copy {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    width: 12.3px;
    height: 12.3px;
    color: var(--m-muted);
  }

  .copy svg {
    width: 12.3px;
    height: 12.3px;
  }

  .actions {
    position: absolute;
    top: calc(40.5px + var(--safe));
    right: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .action {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--m-muted);
  }

  .action:disabled {
    cursor: default;
  }

  .action :global(svg) {
    width: 24px;
    height: 24px;
    /* The captured glyphs carry their own text-colour class; the row decides the tone. */
    color: inherit;
  }

  /* A favourited token's star is filled, the way the app's own selected icons read. */
  .action--on {
    color: var(--m-warn);
  }

  .action--on :global(svg) {
    fill: currentColor;
  }
</style>
