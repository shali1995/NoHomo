<script>
  // "Your positions": the card the capture keeps in the token page's rail.
  //
  // Two tabs over one card. Open holds the positions, and anything under $2 goes behind the
  // dust row rather than into the list — that is the capture's own line, and it is why a $2
  // buy reads as dust while the same position grown past $2 sits in the open list with the
  // header's count beside the title. Closed holds the finished ones: the capture's table,
  // then the swaps behind it.
  //
  // The pill's active dressing is the capture's: the Open side wears the accent tint and a
  // pulsing dot, the Closed side the tertiary surface. The dot only pulses on the selected
  // side, and the count only counts what is open.
  import DustGroup from "./DustGroup.svelte";
  import ClosedPositions from "./ClosedPositions.svelte";
  import PositionRow from "./PositionRow.svelte";
  import { closedPositions, dustPositions, openPositions } from "../../lib/api/trade.svelte.js";

  let tab = $state("open");
  let dustOpen = $state(false);

  const open = $derived(openPositions());
  const dust = $derived(dustPositions());
  const closed = $derived(closedPositions());

  const PILL = "flex items-center justify-center px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors duration-150";
  const ACTIVE = `${PILL} bg-accent-primary-transparent text-accent-primary`;
  const IDLE = `${PILL} text-text-tertiary`;
  const DOT = "relative flex items-center justify-center h-1.5 w-1.5";
</script>

<div class="@container flex flex-col min-h-0 flex-1">
  <div class="flex items-center justify-between gap-2 px-2 shrink-0 mb-2">
    <button type="button" class="flex items-center gap-2 cursor-pointer min-w-0">
      <div class="text-base">Your positions</div>
      <!-- The count, and only on the open side: the capture puts it beside the title while a
           position is open (0144.32) and nowhere else. The "Recent" chip and the count that
           come with the closed table belong to the profile card (0116) — on a token page's
           header they only stretch the row and break the table under it. -->
      {#if tab === "open" && open.length > 0}
        <div class="flex items-center gap-1 text-text-tertiary text-sm font-medium">
          <span>{open.length}</span>
        </div>
      {/if}
    </button>

    <div
      role="button"
      tabindex="0"
      class="flex border border-bg-tertiary rounded-lg p-0.5 cursor-pointer shrink-0 select-none bg-bg-primary"
      onclick={() => (tab = tab === "open" ? "closed" : "open")}
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          tab = tab === "open" ? "closed" : "open";
        }
      }}
    >
      <div class={tab === "open" ? ACTIVE : IDLE}>
        Open{#if tab === "open"}
          <div class={DOT}>
            <div class="absolute h-[18px] w-[18px] animate-pulse-ring rounded-full bg-accent-primary"></div>
            <div class="relative z-10 h-1.5 w-1.5 rounded-full bg-accent-primary"></div>
          </div>
        {/if}
      </div>
      <div class={tab === "closed" ? `${PILL} bg-bg-tertiary text-text-primary` : IDLE}>
        Closed{#if tab === "closed"}
          <div class={DOT}>
            <div class="absolute h-[18px] w-[18px] animate-pulse-ring rounded-full bg-text-tertiary"></div>
            <div class="relative z-10 h-1.5 w-1.5 rounded-full bg-text-tertiary"></div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="flex-1 min-h-0 overflow-y-auto" style="scrollbar-gutter: auto;">
    {#if tab === "open"}
      <div>
        <!-- Only while the dust group is shut: the capture holds the empty line or the open
             group's rows, never both (60px of a difference, measured off its own boxes). -->
        {#if open.length === 0 && !dustOpen}
          <div class="text-center min-h-15 flex items-center justify-center text-sm text-text-tertiary">
            No open positions
          </div>
        {/if}
        {#each open as position (position.id)}
          <PositionRow {position} />
        {/each}
        {#if dust.length > 0}
          <DustGroup positions={dust} bind:open={dustOpen} />
        {/if}
      </div>
    {:else}
      <ClosedPositions rows={closed} />
    {/if}
  </div>
</div>
