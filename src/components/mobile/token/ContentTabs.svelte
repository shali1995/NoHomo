<!--
  The three cell tab strip over the token's body: Holders, Feed, About.
  Three equal thirds inside the page's 16 dp gutters, each cell carrying its own bottom
  rule — a hairline when it is not the live one, 2 dp of accent when it is.
-->
<script>
  let { tabs, active, onselect } = $props();
</script>

<div class="tabs">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      class="cell"
      class:cell--on={tab.id === active}
      aria-current={tab.id === active ? "page" : undefined}
      onclick={() => onselect?.(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    height: 30.4px;
    margin: 0 16px;
  }

  .cell {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    font-size: 16px;
    font-weight: 700;
    line-height: 18.1px;
    color: var(--m-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cell::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: var(--m-hairline);
  }

  .cell--on {
    color: var(--m-text);
  }

  .cell--on::after {
    height: 2px;
    background: var(--m-blue);
  }
</style>
