<!--
  One holder of the token.

  The row is the capture's: a 32 dp avatar, the wallet's name, then what it holds on the right.
  Our holders endpoint reports the wallet, its balance and its share of supply — it carries no
  average entry and no per-holder PnL, so the second line is the share of supply (the figure
  that belongs where the capture printed an entry price) and the right column is the position's
  value over the amount of tokens. When the wallet has also posted a thesis about this token,
  that text is the row's own line, which is what the capture shows there.
-->
<script>
  let { row, thesis = null } = $props();

  const value = $derived(row.cells?.[1]?.texts?.[0] ?? "");
  const amount = $derived(row.cells?.[1]?.texts?.[1] ?? "");
  const supply = $derived(row.cells?.[2]?.texts?.[0] ?? "");
</script>

<div class="holder">
  <span class="avatar">
    {#if row.avatar}
      <img src={row.avatar} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="initial">{(row.name ?? "?").slice(0, 1)}</span>
    {/if}
  </span>

  <div class="main">
    <div class="name m-truncate">{row.name}</div>
    <div class="sub">{supply} of supply</div>
    {#if thesis}
      <div class="body m-truncate">{thesis}</div>
    {/if}
  </div>

  <div class="money">
    <div class="value m-num">{value}</div>
    <div class="amount m-num">{amount}</div>
  </div>
</div>

<style>
  .holder {
    display: flex;
    align-items: flex-start;
    padding: 14.4px 16px;
  }

  .avatar {
    position: relative;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    margin-right: 14.9px;
    border: 1px solid var(--m-hairline);
    border-radius: 16px;
    overflow: hidden;
  }

  .avatar img,
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
    font-size: 14px;
    color: var(--m-muted);
  }

  .main {
    flex: 1 1 auto;
    min-width: 0;
  }

  .name {
    font-size: 18px;
    font-weight: 500;
    line-height: 22.4px;
    color: var(--m-text);
  }

  .sub {
    font-size: 16px;
    font-weight: 500;
    line-height: 24.6px;
    color: var(--m-dim);
  }

  .body {
    font-size: 16px;
    font-weight: 500;
    line-height: 24.6px;
    color: var(--m-text);
  }

  .money {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: flex-end;
    margin-left: 8px;
    text-align: right;
  }

  .value {
    font-size: 18px;
    font-weight: 500;
    line-height: 22.4px;
    color: var(--m-text);
  }

  /* No PnL on this endpoint, so the line under the value is what the wallet holds in tokens. */
  .amount {
    margin-top: 3.8px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--m-muted);
  }
</style>
