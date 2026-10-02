<!--
  The home list's facet row: a filter button, a clear button, then the rankings.
  The chips are the four rankings the API actually serves (`ScannerView`), so every chip
  here changes what the list shows; the capture's own row names categories this build has
  no ranking for.
-->
<script>
  import CloseIcon from "../../icons/close.svelte";
  import ChainIcon from "../../icons/network-solana.svelte";

  /**
   * The capture's left-hand button is the chain the list is on, not a filter glyph. Here it is
   * a mark rather than a control: this API's `Chain` enum has one value, `SOL`, so there is no
   * second chain for a picker to offer and nothing a press could change.
   */
  let { views, active, onselect, onclear } = $props();
</script>

<div class="row">
  <span class="chain-mark" title="Solana">
    <ChainIcon class="chain" />
  </span>

  <button type="button" class="clear" aria-label="Clear filters" onclick={() => onclear?.()}>
    <CloseIcon class="h-4 w-4 text-text-secondary" />
  </button>

  <div class="chips m-rail">
    {#each views as view (view.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={view.id === active}
        aria-pressed={view.id === active}
        onclick={() => onselect?.(view.id)}
      >
        {view.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    height: 34.1px;
    padding-left: 16px;
  }

  .clear {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border: 1px solid var(--m-hairline);
  }

  /* Sized in CSS: the prebuilt app.css has no fractional spacing steps, and the capture's
     mark is 20 dp across inside a 37.9 x 34.1 dp box. */
  .chain-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 37.9px;
    height: 34.1px;
    border: 1px solid var(--m-hairline);
    border-radius: 10px;
  }

  .chain-mark :global(.chain) {
    width: 20px;
    height: 20px;
    color: var(--m-text);
  }

  /* 4.2 dp after the chain button, 8 dp before the chips: the capture's own gaps. */
  .clear {
    width: 16px;
    height: 16px;
    margin: 0 8px 0 4.2px;
    border: 0;
    color: var(--m-muted);
  }

  .chips {
    min-width: 0;
    padding-right: 16px;
  }

  .chip {
    flex: 0 0 auto;
    padding: 6px 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 10px;
    background: var(--m-bg);
    font-size: 16px;
    line-height: 20.3px;
    color: var(--m-muted);
    white-space: nowrap;
  }

  .chip--on {
    background: var(--m-card);
    font-weight: 700;
    color: var(--m-text);
  }
</style>
