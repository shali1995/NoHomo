<!--
  Echo's filter rail on the phone.
  One horizontal row of the same knobs the desktop panel's Echo view opens, in the same
  order: the stream's own kind / period / rows, then the controls applied to the rows it
  already sent (sort, age, total flow, flow, peak, 24h).
  It is a rail because the phone has no room for the desktop's stacked groups, so each
  group keeps its own label and the chips scroll sideways under the facet row.
  Total flow and Flow are dropped for the Talked kind, exactly as the desktop drops them:
  talk events carry no USD, so every row would be filtered away by a money threshold.
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
</script>

<div class="rail m-rail">
  <div class="group">
    <span class="label">Kind</span>
    {#each ECHO_KINDS as option (option.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.kind === option.id}
        aria-pressed={echoFilters.kind === option.id}
        onclick={() => setEchoFilter({ kind: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class="group">
    <span class="label">Period</span>
    {#each ECHO_PERIODS as option (option.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.period === option.id}
        aria-pressed={echoFilters.period === option.id}
        onclick={() => setEchoFilter({ period: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class="group">
    <span class="label">Rows</span>
    {#each ECHO_LIMITS as option (option)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.limit === option}
        aria-pressed={echoFilters.limit === option}
        onclick={() => setEchoFilter({ limit: option })}
      >{option}</button>
    {/each}
  </div>

  <div class="group">
    <span class="label">Sort</span>
    {#each ECHO_SORTS as option (option.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.sort === option.id}
        aria-pressed={echoFilters.sort === option.id}
        onclick={() => setEchoFilter({ sort: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class="group">
    <span class="label">Age</span>
    {#each ECHO_AGES as option (option.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.maxAgeSeconds === option.id}
        aria-pressed={echoFilters.maxAgeSeconds === option.id}
        onclick={() => setEchoFilter({ maxAgeSeconds: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  {#if echoFilters.kind !== "talked"}
    <div class="group">
      <span class="label">Total flow</span>
      {#each ECHO_TOTALS as option (option.id)}
        <button
          type="button"
          class="chip"
          class:chip--on={echoFilters.minTotalFlow === option.id}
          aria-pressed={echoFilters.minTotalFlow === option.id}
          onclick={() => setEchoFilter({ minTotalFlow: option.id })}
        >{option.label}</button>
      {/each}
    </div>

    <div class="group">
      <span class="label">Flow</span>
      {#each ECHO_FLOWS as option (option.id)}
        <button
          type="button"
          class="chip"
          class:chip--on={echoFilters.flow === option.id}
          aria-pressed={echoFilters.flow === option.id}
          onclick={() => setEchoFilter({ flow: option.id })}
        >{option.label}</button>
      {/each}
    </div>
  {/if}

  <div class="group">
    <span class="label">Peak</span>
    {#each ECHO_PEAKS as option (option.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.minPeak === option.id}
        aria-pressed={echoFilters.minPeak === option.id}
        onclick={() => setEchoFilter({ minPeak: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class="group">
    <span class="label">24h</span>
    {#each ECHO_CHANGES as option (option.id)}
      <button
        type="button"
        class="chip"
        class:chip--on={echoFilters.change === option.id}
        aria-pressed={echoFilters.change === option.id}
        onclick={() => setEchoFilter({ change: option.id })}
      >{option.label}</button>
    {/each}
  </div>
</div>

<style>
  /* The phone's chip row: 34.1 dp of chips in a horizontal rail, 16 dp gutters, and the
     capture's own lead-in from the facet row above it. */
  .rail {
    flex: 0 0 auto;
    align-items: center;
    height: 34.1px;
    margin-top: 11.7px;
    padding: 0 16px;
  }

  .group {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
  }

  /* A hairline between groups, so two neighbouring chips are never read as one set of
     choices — "Any" is the off chip of four different knobs. */
  .group + .group {
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid var(--m-hairline);
  }

  /* The desktop's own group labels (Kind, Period, Rows…), small and uppercase. */
  .label {
    flex: 0 0 auto;
    font-size: 11px;
    line-height: 13.9px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--m-muted);
    white-space: nowrap;
  }

  .chip {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    height: 34.1px;
    padding: 0 8px;
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
