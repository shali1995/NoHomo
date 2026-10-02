<!--
  The price band over the chart: the token's price and its 1 h move on the left, market cap
  on the right. The capture prints the 1 h move as an absolute change and a percentage in
  brackets, with the window label that follows it, and the market cap as a value with its
  unit underneath.

  The absolute move is not a field on the API — the timeframe only carries the percentage —
  so it is derived from the current price and that percentage, which is how the capture's
  own numbers agree ($0.263 with 2.68% is $0.00685).
-->
<script>
  import ChevronsUpDown from "../../../icons/chevrons-up-down.svelte";
  import { formatCompact, formatPrice } from "../../../lib/api/token.svelte.js";

  let { token } = $props();

  const quote = $derived(token?.quote ?? null);
  const hour = $derived(token?.stats?.timeframes?.["1h"] ?? null);

  const price = $derived(quote ? formatPrice(quote.priceUsdStr) : "");
  const marketCap = $derived(quote ? `$${formatCompact(quote.marketCapUsdStr)}` : "");

  const changePct = $derived(Number(hour?.priceChangePct ?? 0));
  const up = $derived(changePct >= 0);

  /** `-5` on a $1 token is −$0.0526: the previous price was `price / (1 + pct/100)`. */
  const changeAbs = $derived.by(() => {
    const current = Number(quote?.priceUsdStr ?? 0);
    if (!current || !Number.isFinite(changePct) || changePct <= -100) return 0;
    return current - current / (1 + changePct / 100);
  });

  const changeText = $derived(`${formatPrice(Math.abs(changeAbs))} (${Math.abs(changePct).toFixed(2)}%)`);
</script>

<div class="price-block">
  <div class="left">
    <div class="value m-num">{price}</div>
    <div class="change" style="color: {up ? 'var(--m-green)' : 'var(--m-red)'}">
      <span class="arrow">{up ? "\u25B2" : "\u25BC"}</span>
      <span class="delta m-num">{changeText}</span>
      <span class="window">1h</span>
    </div>
  </div>

  <div class="right">
    <div class="mc-row">
      <span class="mc-icon"><ChevronsUpDown /></span>
      <span class="mc m-num">{marketCap}</span>
    </div>
    <div class="mc-label">Market cap</div>
  </div>
</div>

<style>
  .price-block {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 16px;
  }

  .left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .value {
    font-size: 28px;
    font-weight: 400;
    line-height: 34.1px;
    color: var(--m-text);
  }

  .change {
    display: flex;
    align-items: center;
    margin-top: 0.1px;
  }

  /* The arrow is an 8 dp glyph, sitting 1.5 dp down its own line. */
  .arrow {
    font-size: 8px;
    font-weight: 500;
    line-height: 11.7px;
    transform: translateY(1.5px);
  }

  .delta {
    margin-left: 3.8px;
    font-size: 14px;
    font-weight: 500;
    line-height: 18.1px;
  }

  .window {
    margin-left: 4.3px;
    font-size: 14px;
    font-weight: 500;
    line-height: 18.1px;
    color: var(--m-dim);
  }

  .right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-top: 10.2px;
  }

  .mc-row {
    display: flex;
    align-items: center;
    gap: 3.8px;
  }

  .mc-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    /* The glyph sits 3.2 dp below the value's line, centred in the capture's own row. */
    margin-top: 3.2px;
    color: var(--m-dim);
  }

  .mc-icon :global(svg) {
    width: 16px;
    height: 16px;
  }

  .mc {
    font-size: 18px;
    font-weight: 500;
    line-height: 21.3px;
    color: var(--m-text);
  }

  .mc-label {
    margin-top: 5.9px;
    font-size: 14px;
    font-weight: 500;
    line-height: 14.4px;
    color: var(--m-muted);
  }
</style>
