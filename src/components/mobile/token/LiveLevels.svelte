<!--
  The account's own levels over the token chart: the resting buy, the take profits, the stops.

  They are HTML over the canvas rather than drawn by the chart library, which is how the desktop
  does it too — the difference is that the desktop gets its mapping from
  `candleSeries.priceToCoordinate` and here it comes from `onLayout`, the one prop the vendored
  library was given. Everything else is ours: this file reads the mapping, places each line at its
  own price, and drags it.

  The mapping is not reactive state on purpose. It is rebuilt by the library on every animation
  frame, and a line that is placed from a frame-old value shimmers against the candles it belongs
  to — so a rAF loop here reads it and writes the positions straight onto the elements.

  The rules for which levels exist, what they are called, what they may be dragged to and what a
  move has to send back are `mobilePriceLevels` (src/lib/mobile-chart-levels.js) — the same rules
  the desktop keeps, ported once, in one place. This file is the gesture and the paint.
-->
<script>
  import { formatPrice } from "../../../lib/api/token.svelte.js";
  import { moveDipLevel, moveTargetLevel } from "../../../lib/api/trade.svelte.js";

  let { address = "", levels = [], layout = () => null } = $props();

  /** The canvas' own colours, since a CSS variable cannot be read from a canvas or a mixin. */
  const COLOURS = { dip: "#4662fb", takeProfit: "#04c249", stopLoss: "#ff5121" };
  /** How near a line a finger has to land, in dp. A mouse cursor gets 7 on the desktop. */
  const GRAB = 22;
  /** How long a refused level takes to slide home, in ms. */
  const SETTLE_MS = 150;

  /** The line elements, by level key, so the frame loop can write to them without re-rendering. */
  let rows = new Map();
  /** The value under the finger, by key: the frame loop reads this instead of the level's own. */
  let held = $state(null);
  /** What the readout shows while a line is in hand. */
  let readout = $state(null);
  let dragging = null;
  let frame = 0;

  const colourOf = (level) => COLOURS[level.kind] ?? "#9899a3";

  function bindRow(node, level) {
    rows.set(level.key, node);
    return {
      destroy() {
        rows.delete(level.key);
      }
    };
  }

  /** A finger's y as a price, off the library's own scale. */
  function priceAt(y) {
    const box = layout();
    if (!box) return 0;
    const { pad, chartH, minVal, maxVal } = box;
    if (!(chartH > 0)) return 0;
    return maxVal - ((y - pad.top) / chartH) * (maxVal - minVal);
  }

  /** Where a level may be dragged to: the desktop's own clamps. */
  function boundsOf(level, market) {
    if (level.kind === "dip") return { min: 0, max: market };
    if (level.kind === "stopLoss") return { min: 0, max: level.entry };
    if (level.kind === "takeProfit") return { min: level.entry, max: Number.MAX_SAFE_INTEGER };
    return { min: 0, max: Number.MAX_SAFE_INTEGER };
  }

  const valueOf = (level) => (held?.key === level.key ? held.price : level.price);

  /**
   * The frame loop: place every line at its own price, and a line whose level is off the plot is
   * held at the edge it left by, where its pill says so.
   */
  function place() {
    const box = layout();
    if (box) {
      for (const level of levels) {
        const node = rows.get(level.key);
        if (!node) continue;
        const y = box.toY(valueOf(level));
        const inside = Number.isFinite(y) && y >= 0 && y <= box.h;
        const at = Math.min(Math.max(y, 6), box.h - 6);
        node.style.transform = `translateY(${at}px)`;
        node.dataset.off = inside ? "" : "true";
      }
      if (dragging) {
        const node = rows.get(dragging.level.key);
        readout = node
          ? { level: dragging.level, price: valueOf(dragging.level), y: Math.min(Math.max(box.toY(valueOf(dragging.level)), 6), box.h - 6) }
          : null;
      }
    }
    frame = requestAnimationFrame(place);
  }

  $effect(() => {
    frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  });

  /** The level nearest a finger, if it is within reach — and only one this API can move. */
  function levelAt(y) {
    const box = layout();
    if (!box) return null;
    let best = null;
    let bestDistance = GRAB;
    for (const level of levels) {
      if (!level.movable) continue;
      const lineY = box.toY(valueOf(level));
      if (!Number.isFinite(lineY)) continue;
      const distance = Math.abs(lineY - y);
      if (distance <= bestDistance) {
        best = level;
        bestDistance = distance;
      }
    }
    return best;
  }

  function tick(ms) {
    navigator.vibrate?.(ms);
  }

  /** How far the line has been taken from what it is measured against, as a signed percent. */
  function distance(level, price) {
    const anchor = level.kind === "dip" ? level.market : level.entry > 0 ? level.entry : level.market;
    if (!(anchor > 0) || !(price > 0)) return "";
    const pct = (price / anchor - 1) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
  }

  function down(event) {
    const host = event.currentTarget.parentElement;
    if (!host) return;
    const box = host.getBoundingClientRect();
    const y = event.clientY - box.top;
    const level = levelAt(y);
    if (!level) return;
    // The chart's own pan and zoom must not take this drag: the desktop switches its scroll and
    // scale handling off for the length of a drag for the same reason.
    event.stopPropagation();
    event.preventDefault();
    dragging = { level, bounds: boundsOf(level, level.market), start: level.price };
    held = { key: level.key, price: level.price };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    tick(8);
  }

  function move(event) {
    if (!dragging) return;
    event.stopPropagation();
    event.preventDefault();
    const host = event.currentTarget.parentElement;
    if (!host) return;
    const y = event.clientY - host.getBoundingClientRect().top;
    const { level, bounds } = dragging;
    const wanted = Math.min(Math.max(priceAt(y), bounds.min), bounds.max);
    if (!(wanted > 0)) return;
    held = { key: level.key, price: wanted };
    readout = { level, price: wanted, y };
  }

  /** A refused move slides home rather than jumping, so the refusal is visible. */
  function settle(key, from, to) {
    const started = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - started) / SETTLE_MS);
      const eased = 1 - (1 - t) * (1 - t);
      if (held?.key !== key) return;
      if (t < 1) {
        held = { key, price: from + (to - from) * eased };
        requestAnimationFrame(step);
      } else {
        held = null;
      }
    };
    requestAnimationFrame(step);
  }

  async function up(event) {
    if (!dragging) return;
    event.stopPropagation();
    const { level, start } = dragging;
    const landed = held?.key === level.key ? held.price : start;
    dragging = null;
    readout = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (Math.abs(landed - start) < 1e-12) {
      held = null;
      return;
    }
    tick(12);
    let moved = false;
    try {
      if (level.kind === "dip" && level.swapId != null) {
        moved = await moveDipLevel({ address, swapId: level.swapId, priceUsd: landed });
      } else if (level.targetId != null && level.entry > 0) {
        // The percent a target is stored as, measured from the entry — the desktop's own sum.
        const changePct = Number(Math.abs((landed / level.entry - 1) * 100).toFixed(3));
        moved = await moveTargetLevel({
          address,
          id: level.targetId,
          kind: level.kind === "stopLoss" ? "STOP_LOSS" : "TAKE_PROFIT",
          sellPct: level.sellPct,
          changePct
        });
      }
    } catch {
      moved = false;
    }
    if (moved) held = null;
    else settle(level.key, landed, start);
  }
</script>

<div class="levels">
  {#each levels as level (level.key)}
    <div
      class="line"
      class:line--grabbed={held?.key === level.key}
      class:line--met={level.met}
      use:bindRow={level}
      style="--tone: {colourOf(level)}"
      data-kind={level.kind}
      role={level.movable ? "slider" : "presentation"}
      aria-label={level.label}
      aria-valuenow={level.movable ? Math.round(level.price * 1e9) / 1e9 : undefined}
      tabindex={level.movable ? 0 : -1}
      onpointerdown={level.movable ? down : undefined}
      onpointermove={level.movable ? move : undefined}
      onpointerup={level.movable ? up : undefined}
      onpointercancel={level.movable ? up : undefined}
    >
      <span class="rule"></span>
      <span class="tag" style="background: {colourOf(level)}">{level.label}</span>
      <span class="price m-num">
        {level.kind === "dip" ? `$${formatPrice(level.price)}` : `${level.sellPct}% @ $${formatPrice(level.price)}`}
      </span>
    </div>
  {/each}

  {#if readout}
    <div class="readout" style="top: {readout.y}px; --tone: {colourOf(readout.level)}">
      <span class="readout-name">{readout.level.label}</span>
      <span class="readout-price m-num">${formatPrice(readout.price)}</span>
      <span class="readout-delta m-num">{distance(readout.level, readout.price)}</span>
    </div>
  {/if}
</div>

<style>
  .levels {
    position: absolute;
    inset: 0;
    /* Only the lines themselves take a pointer: the chart underneath keeps its own gestures. */
    pointer-events: none;
    overflow: hidden;
  }

  /*
   * One level. The visible rule is a hairline, but the element is a finger's width tall so it can
   * actually be grabbed — 22 dp above and below, which is what a touch target needs.
   */
  .line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 44px;
    margin-top: -22px;
    padding: 0 8px;
    pointer-events: none;
  }

  .line[role="slider"] {
    pointer-events: auto;
    touch-action: none;
    cursor: ns-resize;
  }

  .rule {
    flex: 1 1 auto;
    height: 1px;
    background: repeating-linear-gradient(
      to right,
      var(--tone) 0 4px,
      transparent 4px 8px
    );
    opacity: 0.75;
  }

  /* A target that has already fired is history, not a plan: the desktop draws it solid. */
  .line--met .rule {
    background: var(--tone);
    opacity: 0.5;
  }

  .line--grabbed .rule {
    height: 2px;
    opacity: 1;
    background: var(--tone);
  }

  .tag {
    flex: 0 0 auto;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    line-height: 12px;
    color: #060510;
  }

  .price {
    flex: 0 0 auto;
    font-size: 11px;
    color: var(--m-muted);
  }

  .line--grabbed .price {
    color: var(--m-text);
  }

  /* A level outside the plot is held at the edge it left by, dimmed, rather than drawn nowhere. */
  .line[data-off="true"] .rule,
  .line[data-off="true"] .price {
    opacity: 0.4;
  }

  .readout {
    position: absolute;
    left: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 8px;
    background: var(--m-card-2);
    transform: translateY(-50%);
    white-space: nowrap;
  }

  .readout-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--tone);
  }

  .readout-price {
    font-size: 12px;
    font-weight: 600;
    color: var(--m-text);
  }

  .readout-delta {
    font-size: 11px;
    color: var(--m-muted);
  }
</style>
