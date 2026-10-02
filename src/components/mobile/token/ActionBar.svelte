<!--
  The bar at the foot of the token page: one full-width Buy, or Sell beside it once the
  account holds the token — 16 dp gutters, 48 dp tall buttons with a 12 dp radius, and the
  page's colour behind them.

  The buttons open the sheet the shell owns, through the callback it passes in; the gradient
  sheen the capture insets into each button is a flat fill in its own screenshot, so these are
  flat too.
-->
<script>
  let { held = false, onbuy, onsell } = $props();
</script>

<div class="bar">
  {#if held}
    <button type="button" class="btn btn--sell" onclick={() => onsell?.()}>Sell</button>
    <button type="button" class="btn btn--buy" onclick={() => onbuy?.()}>Buy</button>
  {:else}
    <button type="button" class="btn btn--buy" onclick={() => onbuy?.()}>Buy</button>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    flex: 0 0 auto;
    align-items: flex-start;
    gap: 8px;
    height: calc(75.7px + env(safe-area-inset-bottom, 0px));
    padding: 16px 16px 0 16px;
    background: var(--m-bg);
  }

  .btn {
    flex: 1 1 0;
    height: 48px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 700;
    line-height: 18.7px;
    color: var(--m-text);
    text-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
    transform: translateY(0.5px);
  }

  .btn--buy {
    background: var(--m-green);
  }

  .btn--sell {
    background: var(--m-red);
  }

  .btn:active {
    transform: translateY(0.5px) scale(0.99);
  }
</style>
