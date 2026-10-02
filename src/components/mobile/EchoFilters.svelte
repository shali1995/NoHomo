<!--
  Echo's filter panel on the phone.

  The same knobs the desktop panel's Echo view opens, in the same order: the stream's own kind /
  period / rows, then the controls applied to the rows it already sent (sort, age, total flow,
  flow, peak, 24h).

  It is a panel rather than a rail because nine groups of chips is a screenful a reader looks at
  once: as a rail above the list it took the top of every Echo screen and had to be scrolled
  sideways to be read at all. Here it costs the list nothing, and the gear on the Echo chip is the
  way in.

  Total flow and Flow are dropped for the Talked kind, exactly as the desktop drops them: talk
  events carry no USD, so every row would be filtered away by a money threshold.
-->
<script>
  import {
    ECHO_AGES,
    ECHO_CHANGES,
    ECHO_FLOWS,
    ECHO_KINDS,
    ECHO_LIMITS,
    ECHO_PEAKS,
    ECHO_PERIODS,
    ECHO_SORTS,
    ECHO_TOTALS,
    echoFilters,
    setEchoFilter
  } from "../../lib/api/echo.svelte.js";

  /** The caller owns whether it is open, because the chip that opens it lives in the caller. */
  let { open = $bindable(false) } = $props();

  /** Every knob back to the defaults the stream opens with. */
  function reset() {
    setEchoFilter({
      kind: "bought",
      period: "5m",
      limit: 50,
      sort: "rank",
      maxAgeSeconds: 0,
      minTotalFlow: 0,
      flow: "all",
      minPeak: 0,
      change: "all"
    });
  }

  /** The knobs that are off their default, which is what the title reports. */
  const changed = $derived(
    [
      echoFilters.kind !== "bought",
      echoFilters.period !== "5m",
      echoFilters.limit !== 50,
      echoFilters.sort !== "rank",
      echoFilters.maxAgeSeconds !== 0,
      echoFilters.minTotalFlow !== 0,
      echoFilters.flow !== "all",
      echoFilters.minPeak !== 0,
      echoFilters.change !== "all"
    ].filter(Boolean).length
  );
</script>

{#if open}
  <div class="scrim" role="presentation" onclick={() => (open = false)}></div>
  <div class="popup" role="dialog" aria-modal="true" aria-label="Echo filters">
    <div class="popup-head">
      <span class="popup-title">
        Filters{#if changed}<span class="popup-count">{changed} on</span>{/if}
      </span>
      <span class="popup-right">
        <button type="button" class="reset" disabled={changed === 0} onclick={reset}>Reset</button>
        <button type="button" class="done" onclick={() => (open = false)}>Done</button>
      </span>
    </div>

    <div class="body">
      {#snippet group(label, options, value, pick)}
        <div class="row">
          <span class="row-label">{label}</span>
          <span class="row-chips">
            {#each options as option (option.id ?? option)}
              <button
                type="button"
                class="small-chip"
                class:small-chip--on={value === (option.id ?? option)}
                aria-pressed={value === (option.id ?? option)}
                onclick={() => pick(option.id ?? option)}
              >
                {option.label ?? option}
              </button>
            {/each}
          </span>
        </div>
      {/snippet}

      {@render group("Kind", ECHO_KINDS, echoFilters.kind, (value) => setEchoFilter({ kind: value }))}
      {@render group("Period", ECHO_PERIODS, echoFilters.period, (value) => setEchoFilter({ period: value }))}
      {@render group("Rows", ECHO_LIMITS, echoFilters.limit, (value) => setEchoFilter({ limit: value }))}
      {@render group("Sort", ECHO_SORTS, echoFilters.sort, (value) => setEchoFilter({ sort: value }))}
      {@render group("Age", ECHO_AGES, echoFilters.maxAgeSeconds, (value) => setEchoFilter({ maxAgeSeconds: value }))}
      {#if echoFilters.kind !== "talked"}
        {@render group("Total flow", ECHO_TOTALS, echoFilters.minTotalFlow, (value) => setEchoFilter({ minTotalFlow: value }))}
        {@render group("Flow", ECHO_FLOWS, echoFilters.flow, (value) => setEchoFilter({ flow: value }))}
      {/if}
      {@render group("Peak", ECHO_PEAKS, echoFilters.minPeak, (value) => setEchoFilter({ minPeak: value }))}
      {@render group("24h", ECHO_CHANGES, echoFilters.change, (value) => setEchoFilter({ change: value }))}
    </div>
  </div>
{/if}

<style>
  /*
   * The order-details panel's own anatomy: a scrim, a card pinned to the bottom above the safe
   * area, a title with the count and Done, and rows of chips inside. Nine knobs make it tall, so
   * the body scrolls inside a capped panel rather than the panel running off the screen.
   */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(6, 6, 12, 0.55);
  }

  .popup {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 82%;
    padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
    border-radius: 18px 18px 0 0;
    background: var(--m-card);
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.45);
  }

  .popup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .popup-title {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .popup-count {
    font-size: 13px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .popup-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .reset {
    padding: 0;
    background: none;
    border: 0;
    font-size: 16px;
    font-weight: 500;
    color: var(--m-muted);
    cursor: pointer;
  }

  .reset:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .done {
    padding: 0;
    background: none;
    border: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
    cursor: pointer;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  /*
   * The order-details panel's rows, to the letter: a stacked row is a column with the chips under
   * their label, and the chosen chip takes the card's own colour and the label's weight.
   */
  .row {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .row-label {
    flex: 0 0 auto;
    font-size: 15px;
    color: var(--m-muted);
  }

  .row-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }

  .small-chip {
    padding: 5px 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 8px;
    background: none;
    font-size: 14px;
    color: var(--m-muted);
    white-space: nowrap;
  }

  .small-chip--on {
    background: var(--m-card);
    color: var(--m-text);
    font-weight: 700;
  }
</style>
