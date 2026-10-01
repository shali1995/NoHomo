<script>
  // The Echo view's filter controls, opened by the panel's own Filter button (the funnel
  // and the word "Filter" stay where the capture put them; only what they open is new).
  //
  // The first three groups are the stream's own filter set — changing any of them reopens
  // the stream, because the server ranks each kind/period/limit separately. The last three
  // are ours: they are applied client-side to the rows the stream already sent.
  //
  // The chips are the discovery pills' class strings, so the panel's own controls and these
  // are the same control.
  import {
    ECHO_AGES,
    ECHO_CHANGES, ECHO_FLOWS, ECHO_TOTALS, ECHO_PEAKS,
    ECHO_KINDS,
    ECHO_LIMITS,
    ECHO_PERIODS,
    ECHO_SORTS,
    echoFilters,
    setEchoFilter
  } from "../../lib/api/echo.svelte.js";

  const PILL = "text-text-secondary hover:bg-bg-tertiary-solid focus:bg-bg-tertiary-solid focus:outline-none inline-flex h-6 items-center justify-center border border-bg-tertiary-solid rounded-md px-1.5 text-xs font-bold leading-none shrink-0 whitespace-nowrap";
  const PILL_ACTIVE = "bg-bg-tertiary-solid hover:bg-bg-tertiary-solid focus:bg-bg-tertiary-solid focus:outline-none inline-flex h-6 items-center justify-center border border-bg-tertiary-solid rounded-md px-1.5 text-xs font-bold leading-none shrink-0 whitespace-nowrap";
  const GROUP = "flex items-center gap-1.5";
  const GROUP_LABEL = "w-11 shrink-0 text-[10px] uppercase tracking-wide text-text-tertiary";
</script>

<div class="flex flex-col gap-1 px-3 pb-2 shrink-0">
  <div class={GROUP}>
    <span class={GROUP_LABEL}>Kind</span>
    {#each ECHO_KINDS as option (option.id)}
      <button
        class={echoFilters.kind === option.id ? PILL_ACTIVE : PILL}
        title="Rank tokens by what the callers did"
        onclick={() => setEchoFilter({ kind: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class={GROUP}>
    <span class={GROUP_LABEL}>Period</span>
    {#each ECHO_PERIODS as option (option.id)}
      <button
        class={echoFilters.period === option.id ? PILL_ACTIVE : PILL}
        title="The window Echo ranks over"
        onclick={() => setEchoFilter({ period: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class={GROUP}>
    <span class={GROUP_LABEL}>Rows</span>
    {#each ECHO_LIMITS as option (option)}
      <button
        class={echoFilters.limit === option ? PILL_ACTIVE : PILL}
        title="How many rows the stream sends"
        onclick={() => setEchoFilter({ limit: option })}
      >{option}</button>
    {/each}
  </div>

  <div class={GROUP}>
    <span class={GROUP_LABEL}>Sort</span>
    {#each ECHO_SORTS as option (option.id)}
      <button
        class={echoFilters.sort === option.id ? PILL_ACTIVE : PILL}
        title={option.id === "rank" ? "Echo's own order" : option.id === "newest" ? "Newest first seen" : "Biggest 24h change"}
        onclick={() => setEchoFilter({ sort: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class={GROUP}>
    <span class={GROUP_LABEL}>Age</span>
    {#each ECHO_AGES as option (option.id)}
      <button
        class={echoFilters.maxAgeSeconds === option.id ? PILL_ACTIVE : PILL}
        title="Only tokens at most this old"
        onclick={() => setEchoFilter({ maxAgeSeconds: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  {#if echoFilters.kind !== "talked"}
    <!-- talked events carry no USD, so there is no flow to filter on -->
    <div class={GROUP}>
      <span class={GROUP_LABEL}>Total flow</span>
      {#each ECHO_TOTALS as option (option.id)}
        <button
          class={echoFilters.minTotalFlow === option.id ? PILL_ACTIVE : PILL}
          title="Only tokens with at least this much money moved, in and out together, in the period"
          onclick={() => setEchoFilter({ minTotalFlow: option.id })}
        >{option.label}</button>
      {/each}
    </div>

    <div class={GROUP}>
      <span class={GROUP_LABEL}>Flow</span>
      {#each ECHO_FLOWS as option (option.id)}
        <button
          class={echoFilters.flow === option.id ? PILL_ACTIVE : PILL}
          title="Only tokens where this side of the money was heavier in the period"
          onclick={() => setEchoFilter({ flow: option.id })}
        >{option.label}</button>
      {/each}
    </div>
  {/if}

  <div class={GROUP}>
    <span class={GROUP_LABEL}>Peak</span>
    {#each ECHO_PEAKS as option (option.id)}
      <button
        class={echoFilters.minPeak === option.id ? PILL_ACTIVE : PILL}
        title="Only tokens that ran at least this far since Echo first caught them"
        onclick={() => setEchoFilter({ minPeak: option.id })}
      >{option.label}</button>
    {/each}
  </div>

  <div class={GROUP}>
    <span class={GROUP_LABEL}>24h</span>
    {#each ECHO_CHANGES as option (option.id)}
      <button
        class={echoFilters.change === option.id ? PILL_ACTIVE : PILL}
        title="Only tokens whose 24h change points this way"
        onclick={() => setEchoFilter({ change: option.id })}
      >{option.label}</button>
    {/each}
  </div>
</div>
