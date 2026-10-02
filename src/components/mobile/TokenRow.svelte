<!--
  One token in a phone list: a 48 dp disc with a verified rosette on its corner, 66.7 dp of
  height with 16 dp gutters.

  The two lines are slots, because the panel's rows do not all carry the same figures. A
  scanner or trench row follows the desktop's own arrangement — the price under the symbol
  on the left, the market cap and the 24h change on the right — while a curated asset
  (Crypto, Stocks) has no market cap to show and puts its price on the right instead. So a
  row says what it has: `meta` fills the left's second line, `primary` the right's first, and
  what is left over falls to the desktop's defaults.
-->
<script>
  import VerifiedBadge from "../../icons/verified-badge.svelte";

  let { row, onclick } = $props();

  const up = $derived(row.dir === "\u25B2");
  const bonding = $derived(typeof row.bondedPct === "number");

  /**
   * The left's second line: whatever the row calls `meta` (a trench row's volume, a curated
   * asset's name), otherwise nothing — in which case the price takes that line, which is
   * where the desktop puts it.
   */
  const leftMeta = $derived(row.meta ?? null);
  /** The right's first line: an explicit `primary`, otherwise the market cap. */
  const rightPrimary = $derived(row.primary ?? (row.mcap ? `${row.mcap} MC` : ""));

  /** The price, drawn in whichever of the two slots ended up carrying it. */
  const priceInLeft = $derived(leftMeta === null);
</script>

{#snippet priceLine()}
  <span class="price m-num"
    >{row.pricePrefix}{#if row.sub}<sub>{row.sub}</sub>{/if}{row.priceSuffix}</span
  >
{/snippet}

<button type="button" class="row" {onclick}>
  <span class="logo">
    {#if row.logo}
      <img src={row.logo} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="initial">{row.initial}</span>
    {/if}
    <VerifiedBadge class="badge" />
  </span>

  <span class="left">
    <span class="symbol m-truncate">{row.symbol}</span>
    {#if priceInLeft}
      {@render priceLine()}
    {:else}
      <span class="mcap m-num">{leftMeta}</span>
    {/if}
  </span>

  <span class="right">
    {#if priceInLeft}
      <span class="primary m-num">{rightPrimary}</span>
    {:else}
      {@render priceLine()}
    {/if}
    {#if bonding}
      <!-- The capture's own row has no bonding column; the desktop's Bonding pill has one, so
           the progress takes the change's slot: a 48x4 track with the green fill the desktop
           draws, and the same bare percentage beside it. -->
      <span class="change bonding" aria-label="{row.bondedPct}% bonded">
        <span class="track" aria-hidden="true">
          <span class="fill" style="width: {row.bondedPct}%"></span>
        </span>
        <span class="m-num">{row.bondedPct}%</span>
      </span>
    {:else}
      <span class="change m-num" class:up style="color: {up ? 'var(--m-green)' : 'var(--m-red)'}">
        <span class="arrow">{row.dir}</span>{row.change}
      </span>
    {/if}
  </span>
</button>

<style>
  .row {
    display: flex;
    align-items: center;
    width: 100%;
    height: 66.7px;
    padding: 8px 16px;
    text-align: left;
    background: var(--m-bg);
  }

  .row:active {
    background: var(--m-card);
  }

  .logo {
    position: relative;
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    margin-right: 12px;
  }

  .logo img,
  .initial {
    display: block;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
    overflow: hidden;
  }

  .initial {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--m-card);
    font-size: 18px;
    color: var(--m-muted);
  }

  /* 18.2 dp on the disc's lower-right corner, over a 1 dp ring of the page colour. */
  .logo :global(.badge) {
    position: absolute;
    right: -4px;
    bottom: -2px;
    width: 18.2px;
    height: 18.2px;
    color: #516af6;
  }

  /* Two lines a side, 8 dp apart. The capture's left column starts 2.7 dp in: its line
     boxes are shorter than the row, and the name sits on the second line's own baseline. */
  .left,
  .right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 50.7px;
    min-width: 0;
  }

  .left {
    padding-top: 2.7px;
  }

  .left {
    flex: 1 1 auto;
    align-items: flex-start;
  }

  .right {
    flex: 0 0 auto;
    align-items: flex-end;
  }

  .symbol {
    font-size: 18px;
    color: var(--m-text);
    line-height: 21.3px;
  }

  .mcap {
    font-size: 14px;
    color: var(--m-muted);
    line-height: 16.5px;
  }

  /*
   * The price wears two sizes because it can sit in two places: on the left it is the quiet
   * second line — the slot the market cap used to hold — and on the right it is the row's
   * headline. The market cap that replaces it on the right takes the headline size.
   */
  .price {
    color: var(--m-muted);
    font-size: 14px;
    line-height: 16.5px;
  }

  .right .price {
    color: var(--m-text);
    font-size: 18px;
    line-height: 26.1px;
  }

  .primary {
    color: var(--m-text);
    font-size: 18px;
    line-height: 26.1px;
  }

  .price sub {
    font-size: 0.62em;
    vertical-align: -0.25em;
  }

  .change {
    display: flex;
    align-items: center;
    gap: 2.7px;
    font-size: 14px;
    line-height: 16.5px;
  }

  /* The arrow is 8 dp: it is set as a glyph, not an icon. */
  .arrow {
    font-size: 8px;
    line-height: 9.1px;
  }

  /* The desktop's own bonding indicator, at the phone's scale: the pill's track is 48x4 with
     the percentage's bare number beside it. */
  .bonding {
    gap: 6px;
    color: var(--m-muted);
  }

  .track {
    position: relative;
    width: 48px;
    height: 4px;
    border-radius: 9999px;
    overflow: hidden;
    background: var(--m-hairline);
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: 9999px;
    background: var(--m-green);
  }
</style>
