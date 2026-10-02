<!--
  The tab strip under the home carousel: Watchlist | Tokens | Perps.
  Three equal thirds, 16/700 labels, inactive in the dim tone, a 2.1 dp accent rule under
  the live one, and a hairline across the whole strip. "Perps" is the app's newest tab and
  is prepared here but not open — the phone build has no perps screen yet.
-->
<script>
  import StarIcon from "../../icons/star.svelte";

  let { tabs, active, onselect } = $props();

  const index = $derived(Math.max(0, tabs.findIndex((tab) => tab.id === active)));
</script>

<div class="strip">
  <div class="rule" style="left: {index * (100 / tabs.length)}%; width: {100 / tabs.length}%"></div>

  {#each tabs as tab (tab.id)}
    <button
      type="button"
      class="tab"
      class:tab--on={tab.id === active}
      disabled={tab.soon}
      aria-current={tab.id === active ? "page" : undefined}
      onclick={() => onselect?.(tab.id)}
    >
      {#if tab.icon === "star"}
        <StarIcon class="tab-icon" />
      {/if}
      <span class="tab-label">{tab.label}</span>
      {#if tab.badge}
        <span class="badge">{tab.badge}</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .strip {
    position: relative;
    display: flex;
    height: 49.1px;
    margin-top: 3.7px;
    background: var(--m-bg);
    border-bottom: 1px solid var(--m-hairline);
  }

  /* Two stops, from the app's accent to its lighter tint, sitting on the strip's hairline. */
  .rule {
    position: absolute;
    bottom: 1px;
    height: 2.1px;
    background: linear-gradient(90deg, #4662fb, #516af9);
  }

  .strip::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: #161521;
  }

  .tab {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 48px;
    padding: 10px;
    color: var(--m-dim);
  }

  .tab--on {
    color: var(--m-text);
  }

  .tab-label {
    font-size: 16px;
    font-weight: 700;
    line-height: 20px;
  }

  .tab :global(.tab-icon) {
    width: 20px;
    height: 20px;
    color: inherit;
  }

  /* The New chip is the app's own: a #5f85ff label on a #181f40 pill. */
  .badge {
    padding: 2px 4px;
    border-radius: 4px;
    background: #181f40;
    font-size: 12px;
    font-weight: 700;
    color: var(--m-blue-soft);
  }
</style>
