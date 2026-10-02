<!--
  One row of the token's feed — a swap or a thesis, drawn the same way.

  The capture's trade row is a 32 dp avatar, the trader's name, a side chip and the age on
  one line, with the trade's own line underneath ("$50 at $221M MC"). A thesis row is the
  same shape with a smaller avatar and the post's text in place of the trade line; the
  capture also gives it a position value, a PnL and a reply block, none of which this
  endpoint carries, so those are not drawn.
-->
<script>
  let { row } = $props();
</script>

<div class="row">
  <span class="avatar" class:avatar--thesis={row.kind === "thesis"}>
    {#if row.avatar}
      <img src={row.avatar} alt="" loading="lazy" decoding="async" />
    {:else}
      <span class="initial">{(row.handle ?? "?").slice(0, 1)}</span>
    {/if}
  </span>

  <div class="content">
    <div class="head">
      <span class="handle m-truncate">{row.handle}</span>
      <span class="chip" style="color: {row.chip.color}; background: {row.chip.background}">{row.chip.label}</span>
      <span class="age m-num">{row.age}</span>
    </div>
    <div class="line" class:line--thesis={row.kind === "thesis"}>{row.line}</div>
  </div>
</div>

<style>
  .row {
    display: flex;
    align-items: flex-start;
    height: 75.2px;
    padding: 16px 12px 0 12.3px;
    border-bottom: 0.5px solid var(--m-card-2);
    overflow: hidden;
  }

  .avatar {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    margin-right: 11.7px;
    border: 1px solid var(--m-hairline);
    border-radius: 16px;
    overflow: hidden;
  }

  .avatar--thesis {
    width: 27.7px;
    height: 27.7px;
    margin-top: 0;
    margin-right: 16px;
    border-radius: 14px;
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

  .content {
    flex: 1 1 auto;
    min-width: 0;
  }

  .head {
    display: flex;
    align-items: center;
    height: 18.1px;
  }

  .handle {
    max-width: 45%;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-text);
  }

  .chip {
    flex: 0 0 auto;
    margin-left: 6.4px;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    line-height: 14.4px;
  }

  .age {
    flex: 0 0 auto;
    margin-left: 6.4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  .line {
    margin-top: 6.9px;
    font-size: 16px;
    font-weight: 400;
    line-height: 18.7px;
    color: var(--m-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .line--thesis {
    font-size: 14px;
    line-height: 16.5px;
  }
</style>
