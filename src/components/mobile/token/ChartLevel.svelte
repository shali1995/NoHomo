<!--
  One of the account's own price levels on the phone's chart: a rule across the plot with the
  level's price in a pill at the right edge, sitting at the height the candles put that price at.

  The capture's chart has one pill — the last price — and the app adds the levels the capture
  could not have: a resting dip buy, a take profit, a stop loss. The pill keeps the capture's
  own geometry (61.9 x 16.5 dp, radius 8), takes the capture's own up/down tones for a target
  and the accent for a dip, and prints the trade store's own number.

  The row is the handle, but only when there is something behind it. A level the API can move
  is draggable: the pill follows the finger, and letting go at a different price commits that
  price through the call that owns the level — `onrelease(price)`, which the overlay answers.
  A level the API can cancel is also a control, so it says so with a role, a label and the
  keyboard, and a tap that moved nothing asks for the cancel. Everything else — a fired target,
  a multiple, a fixed price, a resting buy with no id — is a reading: no pointer, no cursor, no
  focus, nothing about it that could be taken for a press.

  The three rows are written out rather than derived from one: `canCancel` and `movable` have to
  be literal `role` / `tabindex` values for the markup to say what it is, and a caveat-free
  reading of this file is worth three copies of two spans. A cancellable level is always a
  movable one here — the id a cancel needs is the same id a move needs.
-->
<script>
  import { formatPrice } from "../../../lib/api/token.svelte.js";

  let { level, y, onstart, onmove, onrelease, oncancel } = $props();

  const isDip = $derived(level.kind === "dip");
  /** The capture's own tones: the up colour for a take profit, the down one for a stop. */
  const tone = $derived(level.tone);
  const rule =
    $derived(level.kind === "stopLoss"
      ? "rgba(255, 81, 33, 0.55)"
      : isDip
        ? "rgba(70, 98, 251, 0.55)"
        : "rgba(4, 194, 73, 0.55)");

  const price = $derived(Number(level.price ?? 0));
  const movable = $derived(Boolean(level.movable));
  const canCancel = $derived(Boolean(level.cancel));
  /**
   * The row is a pill tall and its rule sits on its centre, so the row has to start half a pill
   * above the price: the level's y is where the line goes, not where the box does.
   */
  const HALF = 16.5 / 2;

  /**
   * Where the finger has taken this row, while it is down. The levels are rebuilt from the
   * trade store whenever it changes, and a commit only lands with the API's own answer, so the
   * row has to hold the dragged number itself or it would snap back under the finger — the
   * desktop's `pendingLevels` map exists for exactly this. Held in a box because a plain
   * reassignment is what a rune tracks.
   */
  let dragged = $state({ value: null });
  const shown = $derived(dragged.value ?? price);
  const label = $derived(`${level.label} ${formatPrice(shown)}`);

  /** What a finger has to travel before this counts as a drag rather than a tap. */
  const TAP_SLOP = 4;
  /** The press this row is answering while it is down: where it began, and whether it moved. */
  let start = null;

  function down(event) {
    if (event.button !== undefined && event.button !== 0) return;
    // the row sits inside the page's scroller: this press is the row's, not the page's
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    start = { clientY: event.clientY, moved: false };
    dragged.value = price;
    // a level with nothing to move is still allowed to be a button; it just never drags
    if (movable) onstart?.(event.clientY);
  }

  function move(event) {
    if (!start || !movable) return;
    if (Math.abs(event.clientY - start.clientY) > TAP_SLOP) start.moved = true;
    dragged.value = onmove?.(event.clientY) ?? price;
  }

  function end(event) {
    if (!start) return;
    const moved = start.moved;
    const landed = dragged.value;
    start = null;
    dragged.value = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (!moved) {
      // a tap: only a level the API can cancel does anything with it, and it is the only kind
      // that says it can be pressed in the first place
      if (canCancel) oncancel?.();
      return;
    }
    if (landed === null || landed === price) return;
    onrelease?.(landed);
  }

  function key(event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (canCancel) oncancel?.();
  }
</script>

{#snippet face()}
  <span class="rule" style="background: {rule}"></span>
  <span class="chip m-num" style="background: {tone}">{label}</span>
{/snippet}

{#if canCancel}
  <div
    class="row row--live"
    style="top: {y - HALF}px"
    role="button"
    tabindex="0"
    aria-label="{label}, draggable, activates to cancel"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={end}
    onpointercancel={end}
    onlostpointercapture={end}
    onkeydown={key}
  >
    {@render face()}
  </div>
{:else if movable}
  <div
    class="row row--live"
    style="top: {y - HALF}px"
    role="presentation"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={end}
    onpointercancel={end}
    onlostpointercapture={end}
  >
    {@render face()}
  </div>
{:else}
  <div class="row" style="top: {y - HALF}px" role="presentation">
    {@render face()}
  </div>
{/if}

<style>
  /* The row is only as tall as its pill, so its centre is the level's own y. A row with nothing
     behind it takes no press at all: it is a line on a chart, not a control. */
  .row {
    position: absolute;
    left: 0;
    right: 0;
    height: 16.5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 7px;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
  }

  .row--live {
    pointer-events: auto;
    touch-action: none;
    cursor: ns-resize;
  }

  .row[role="button"]:focus-visible {
    outline: 1.5px solid var(--m-blue);
    outline-offset: 1px;
  }

  .rule {
    position: absolute;
    left: 0;
    right: 0;
    top: 7.75px;
    height: 1px;
  }

  .chip {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 61.9px;
    height: 16.5px;
    padding: 0 6.9px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 700;
    line-height: 16.5px;
    white-space: nowrap;
    /* The capture's own pill label is white whatever the pill is. */
    color: #ffffff;
  }
</style>
