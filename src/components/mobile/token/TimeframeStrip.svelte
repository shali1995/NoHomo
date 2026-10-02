<!--
  The band under the chart: the candle frames on the left, a rule, then the chart-type and
  chart-settings buttons on the right.

  The capture's strip carries six frames, but the candle endpoint only serves three of them
  (`1h`, `4h`, `24h` — it rejects `1d`, `7d`, `1M` and `all` outright), so 7D, 1M and ALL keep
  their places and their dim tone and are not pressable. The type button swaps the chart
  between candles and a close line; the settings button has no settings panel in this build.
-->
<script>
  import { FRAMES } from "../../../lib/api/chart.svelte.js";

  let { frames, active, onselect, type = "candles", ontoggletype } = $props();

  const SUPPORTED = new Set(FRAMES);
</script>

<div class="strip">
  {#each frames as frame (frame.label)}
    <button
      type="button"
      class="chip"
      class:chip--on={frame.frame === active}
      disabled={!SUPPORTED.has(frame.frame)}
      aria-pressed={frame.frame === active}
      onclick={() => onselect?.(frame.frame)}
    >
      {frame.label}
    </button>
  {/each}

  <span class="rule" aria-hidden="true"></span>

  <button type="button" class="type" aria-label="Chart type" onclick={() => ontoggletype?.()}>
    {#if type === "candles"}
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M17.5 10.0835H14.5L12.25 16.8335L7.75 3.3335L5.5 10.0835H2.5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    {:else}
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <rect x="2.5" y="5.833" width="2.5" height="8.333" rx="0.833" fill="currentColor" />
        <rect x="6.667" y="9.166" width="2.5" height="9.167" rx="0.833" fill="currentColor" />
        <rect x="10.833" y="3.333" width="2.5" height="11.667" rx="0.833" fill="currentColor" />
        <rect x="15" y="10" width="2.5" height="5.833" rx="0.833" fill="currentColor" />
      </svg>
    {/if}
  </button>

  <button type="button" class="settings" aria-label="Chart settings" disabled>
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 6.5h14M3 13.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
      <circle cx="7.5" cy="6.5" r="2.1" fill="var(--m-bg)" stroke="currentColor" stroke-width="1.6" />
      <circle cx="12.5" cy="13.5" r="2.1" fill="var(--m-bg)" stroke="currentColor" stroke-width="1.6" />
    </svg>
  </button>
</div>

<style>
  .strip {
    position: absolute;
    top: 356.3px;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 24px;
    padding: 0 14.9px;
  }

  .chip {
    display: flex;
    align-self: flex-start;
    align-items: center;
    justify-content: center;
    height: 21.9px;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  .chip--on {
    background: var(--m-hairline);
    color: var(--m-text);
  }

  .chip:disabled {
    cursor: default;
  }

  .rule {
    width: 1.1px;
    height: 24px;
    background: var(--m-hairline);
  }

  .type {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--m-green);
  }

  .type svg {
    width: 24px;
    height: 24px;
  }

  .settings {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20.3px;
    height: 19.7px;
    color: var(--m-muted);
    cursor: default;
  }

  .settings svg {
    width: 20px;
    height: 20px;
  }
</style>
