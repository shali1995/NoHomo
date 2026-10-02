<!--
  One of the About tab's pressure bars: the two figures that make it up above, the bar itself
  below. The green part is the buy side's share of the two, which is how the capture's own
  widths divide (248 buys of 658 is the 37.69% it draws).
-->
<script>
  let { left = "", right = "", unit = "", pct = 0 } = $props();

  const share = $derived(Math.max(0, Math.min(100, Number(pct) || 0)));
</script>

<div class="ratio">
  <div class="labels">
    <span class="figure"><span class="count m-num">{left}</span> {unit}</span>
    <span class="figure"><span class="count m-num">{right}</span> {unit}</span>
  </div>
  <div class="bar">
    <span class="green" style="width: {share}%"></span>
    <span class="red"></span>
  </div>
</div>

<style>
  .ratio {
    display: flex;
    flex-direction: column;
  }

  .labels {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .figure {
    font-size: 16px;
    font-weight: 500;
    line-height: 18.7px;
    color: var(--m-text);
  }

  .bar {
    display: flex;
    gap: 3.7px;
    height: 5.9px;
    margin-top: 8px;
  }

  .green {
    flex: 0 0 auto;
    border-radius: 2px;
    background: var(--m-green);
  }

  .red {
    flex: 1 1 auto;
    border-radius: 2px;
    background: var(--m-red);
  }
</style>
