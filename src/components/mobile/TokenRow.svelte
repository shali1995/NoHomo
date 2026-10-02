<!--
  One token in a phone list.
  The capture's row: a 48 dp disc with a verified rosette on its corner, the symbol over
  the market cap on the left, the price over the 24h change on the right, 66.7 dp of
  height with 16 dp gutters.
-->
<script>
  import VerifiedBadge from "../../icons/verified-badge.svelte";

  let { row, onclick } = $props();

  const up = $derived(row.dir === "\u25B2");
</script>

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
    <span class="mcap m-num">{row.mcap} MC</span>
  </span>

  <span class="right">
    <span class="price m-num"
      >{row.pricePrefix}{#if row.sub}<sub>{row.sub}</sub>{/if}{row.priceSuffix}</span
    >
    <span class="change m-num" class:up style="color: {up ? 'var(--m-green)' : 'var(--m-red)'}">
      <span class="arrow">{row.dir}</span>{row.change}
    </span>
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

  .price {
    font-size: 18px;
    color: var(--m-text);
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
</style>
