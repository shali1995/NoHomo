<script>
  // The "Closed trades" section a token page grows once a trade on that token is closed.
  //
  // The header is the capture's, exactly: the clock-and-arrow glyph, the label, and a
  // chevron that turns over when it opens. Its body is not in the capture — Radix strips an
  // accordion's body while it is shut, and the recording only ever caught it shut — so it
  // holds the one thing that is captured for a closed trade: its own row.
  import History from "../../icons/history.svelte";
  import ChevronDown from "../../icons/chevron-down.svelte";
  import ClosedPositions from "./ClosedPositions.svelte";

  /** @type {{ rows: import("../../lib/api/trade.svelte.js").ClosedTrade[] }} */
  let { rows } = $props();

  let open = $state(false);
</script>

<div data-slot="accordion" data-orientation="vertical">
  <div data-orientation="vertical" data-slot="accordion-item" data-state={open ? "open" : "closed"}>
    <h3 data-orientation="vertical" data-state={open ? "open" : "closed"} class="flex">
      <button
        type="button"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        data-orientation="vertical"
        data-slot="accordion-trigger"
        class="group flex flex-1 items-start justify-between gap-4 rounded-md text-left text-sm font-medium transition-all outline-none"
        onclick={() => (open = !open)}
      >
        <div class="flex items-center gap-2">
          <History class="text-text-tertiary size-5" />
          <span class="text-text-secondary text-sm">Closed trades</span>
        </div>
        <ChevronDown
          class="self-center size-4 shrink-0 text-text-tertiary transition-transform duration-200 {open ? 'rotate-180' : ''}"
        />
      </button>
    </h3>

    <div
      class="grid transition-all duration-200 ease-out {open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}"
      role="region"
      data-state={open ? "open" : "closed"}
      data-orientation="vertical"
      data-slot="accordion-content"
    >
      <div class="min-h-0 overflow-hidden">
        <ClosedPositions {rows} />
      </div>
    </div>
  </div>
</div>
