<script>
  // The dust group: positions under $2, tucked behind the capture's own row — content
  // first, the trigger under it, so expanding pushes "Hide dust" down rather than the rows
  // up. Radix animates this in the capture off a measured content height; the grid-rows
  // technique is the capture's own too (the ⚡ block and the order row both use it), and it
  // needs no measurement.
  import PositionRow from "./PositionRow.svelte";

  /**
   * `open` is the card's, not this component's: opening the group is what makes the panel's
   * "No open positions" line go away (the capture holds one or the other, never both), so the
   * card has to know.
   *
   * @type {{ positions: import("../../lib/api/trade.svelte.js").Position[], open?: boolean }}
   */
  let { positions, open = $bindable(false) } = $props();
</script>

<div data-slot="accordion" data-orientation="vertical">
  <div
    data-state={open ? "open" : "closed"}
    data-orientation="vertical"
    data-slot="accordion-item"
    class="border-b last:border-b-0"
  >
    <div
      class="grid transition-all duration-200 ease-out {open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}"
      role="region"
      data-state={open ? "open" : "closed"}
      data-orientation="vertical"
      data-slot="accordion-content"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="pt-0 pb-0">
          <div class="flex flex-col gap-1">
            {#each positions as position (position.id)}
              <div data-state="closed" data-slot="context-menu-trigger">
                <div>
                  <PositionRow {position} />
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <h3 class="flex" data-orientation="vertical" data-state={open ? "open" : "closed"}>
      <button
        type="button"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        data-orientation="vertical"
        data-slot="accordion-trigger"
        class="flex flex-1 items-start justify-between gap-4 rounded-md text-left text-sm font-medium transition-all outline-none hover:underline text-text-tertiary pt-3 px-2 pb-4"
        onclick={() => (open = !open)}
      >{open ? "Hide dust" : `Show dust (${positions.length})`}</button>
    </h3>
  </div>
</div>
