<!--
  The account's own levels over the token chart: the resting buy, the take profits, the stops.

  HTML over the canvas rather than drawn by the chart library, which is how the desktop does it
  too — the difference is that the desktop reads its mapping from `candleSeries.priceToCoordinate`
  and here it comes from `onLayout`, the one prop the vendored library was given.

  The mapping is deliberately not reactive state: the library rebuilds it on every animation frame,
  and a line positioned from a frame-old value shimmers against the candles it belongs to. So a
  frame loop here reads it and writes positions straight onto the elements.

  The gesture has two steps, because a chart and a line on it cannot both be grabbed by one press:

    1. press the level's box and it is taken: the box grows, its rule goes solid, it grows a pair
       of up/down marks and a halo, and it ticks;
    2. then drag anywhere on the plot and that level follows your finger, inside its own bounds.

  It stays in hand after a drag. Letting go of it — a tap anywhere off the box — releases it, and a
  level that was never moved goes back to the price it came from. While a level is in hand the
  chart's own panning stands down (the chart asks this file first), so a press can never mean both.

  Which levels exist, what each is measured from and what a move sends back are `mobilePriceLevels`
  in `mobile-chart-levels.js`; how a press, a drag and a release are decided is
  `mobile-level-gesture.js`, kept out of here so it can be checked without a browser. This file is
  the touch, the paint and the two API calls.
-->
<script>
  import { formatPrice } from "../../../lib/api/token.svelte.js";
  import { moveDipLevel, moveTargetLevel } from "../../../lib/api/trade.svelte.js";
  import {
    clampPrice,
    levelAt,
    levelBounds,
    levelCall,
    levelDistance,
    priceFromY,
    releaseDecision
  } from "../../../lib/mobile-level-gesture.js";

  let {
    address = "",
    levels = [],
    layout = () => null,
    gesture = { hit: null, blocked: false },
    /** A value on the chart's own axis back as a price, which is what a move call is written in. */
    toprice = (value) => value
  } = $props();

  /** The canvas has no CSS variables, so a level's tone is a colour of its own here. */
  const COLOURS = { dip: "#4662fb", takeProfit: "#04c249", stopLoss: "#ff5121" };
  /** How long a refused level takes to slide home, in ms. */
  const SETTLE_MS = 150;

  /** The line elements by key, so the frame loop can write to them without re-rendering. */
  let rows = new Map();
  /** The level in hand. `null` when nothing is taken. */
  let armed = $state(null);
  /** The value under the finger — a proposal until the API has been told. */
  let held = $state(null);
  /** What the readout reads while a level is in hand. */
  let readout = $state(null);
  /** The press in progress: what is being moved, and how far it has travelled. */
  let press = null;
  let frame = 0;

  const colourOf = (level) => COLOURS[level.kind] ?? "#9899a3";
  const valueOf = (level) => (held?.key === level.key ? held.price : level.price);
  const armedLevel = () => (armed ? levels.find((level) => level.key === armed) ?? null : null);

  function bindRow(node, level) {
    rows.set(level.key, node);
    return {
      destroy() {
        rows.delete(level.key);
      }
    };
  }

  /** The plot this overlay sits on: what a y is measured from, and how tall it is. */
  function hostOf(node) {
    return node?.closest(".chart") ?? node?.parentElement ?? null;
  }

  function tick(ms) {
    navigator.vibrate?.(ms);
  }

  /** Capture is taken by whichever element took the press, so it is given back by the same one. */
  function release(element, pointerId) {
    try {
      element?.releasePointerCapture?.(pointerId);
    } catch {
      // it never held the pointer: nothing to give back
    }
  }

  function take(level) {
    armed = level.key;
    held = { key: level.key, price: level.price };
    gesture.blocked = true;
    tick(8);
  }

  function letGo() {
    armed = null;
    held = null;
    press = null;
    readout = null;
    gesture.blocked = false;
  }

  /** A press on a level's own box: take it, and be ready to drag it in the same motion. */
  function boxDown(event) {
    const host = hostOf(event.currentTarget);
    const box = layout();
    if (!host || !box) return;
    const y = event.clientY - host.getBoundingClientRect().top;
    const level = levelAt(levels, y, box.toY);
    if (!level) return;
    // The chart listens first, on the way down: it must not take this press for its own panning.
    event.stopPropagation();
    event.preventDefault();
    take(level);
    press = { level, from: level.price, moved: false, y: event.clientY, onBox: true, holder: event.currentTarget };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  /** A press anywhere else while a level is in hand: the release path, and the drag itself. */
  function plotDown(event) {
    const level = armedLevel();
    if (!level) return;
    // Was the press on the box itself, or off it? Off it and never moved means let go.
    const onBox = !!(event.target instanceof Element && event.target.closest(".line"));
    event.stopPropagation();
    press = { level, from: level.price, moved: false, y: event.clientY, onBox, holder: event.currentTarget };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!press) return;
    event.stopPropagation();
    event.preventDefault();
    if (!press.moved && Math.abs(event.clientY - press.y) < 6) return;
    press.moved = true;
    const host = hostOf(event.currentTarget);
    const box = layout();
    if (!host || !box) return;
    const y = event.clientY - host.getBoundingClientRect().top;
    const { level } = press;
    const wanted = clampPrice(priceFromY(y, box), levelBounds(level));
    if (!(wanted > 0)) return;
    held = { key: level.key, price: wanted };
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
    if (!press) return;
    event.stopPropagation();
    const { level, from, moved, onBox, holder } = press;
    press = null;
    release(holder, event.pointerId);

    // A tap: off the box it lets the level go, and a level that was never moved goes home.
    if (releaseDecision({ moved, onBox }) === "release") {
      letGo();
      return;
    }
    // A tap on the box keeps it in hand, and sends nothing.
    if (!moved) return;

    const landed = held?.key === level.key ? held.price : from;
    /**
     * The chart may be on the market-cap axis while the level's call is in prices. A target's
     * percent is a ratio, so it is the same number either way; the dip's level is not, and goes
     * back through the supply before it is sent.
     */
    const call = levelCall(level, level.kind === "dip" ? toprice(landed) : landed, level.kind === "dip" ? toprice(from) : from);
    if (!call) return;
    tick(12);
    let done = false;
    try {
      done = call.kind === "dip"
        ? await moveDipLevel({ address, ...call.args })
        : await moveTargetLevel({ address, ...call.args });
    } catch {
      done = false;
    }
    // Committed or refused, the level stays in hand — the finger's business is done, the selection
    // is not. A refusal is shown by sliding back.
    if (!done) settle(level.key, landed, from);
  }

  /**
   * The frame loop: place every line at its own price. A level outside the plot waits at the edge
   * it left by, dimmed, rather than being drawn nowhere.
   *
   * Where that edge is, is the **plot's** edge and not the box's: the layout hands over its own
   * padding, and a line is a 44 dp band centred on its price (`margin-top: -22`) — so clamping to
   * the box put half the band above the plot, over the header. Pinning it to `pad.top + 22` keeps a
   * target that is nowhere near the visible range on the chart's own top edge instead of above it.
   */
  const BAND = 22;

  function place() {
    const box = layout();
    if (box) {
      const padTop = Number(box.pad?.top) || 0;
      const padBottom = Number(box.pad?.bottom) || 0;
      const top = padTop + BAND;
      const bottom = Math.max(top, box.h - padBottom - BAND);
      for (const level of levels) {
        const node = rows.get(level.key);
        if (!node) continue;
        const y = box.toY(valueOf(level));
        const inside = Number.isFinite(y) && y >= top && y <= bottom;
        node.style.transform = `translateY(${Math.min(Math.max(y, top), bottom)}px)`;
        node.dataset.off = inside ? "" : "true";
      }
      const level = armedLevel();
      if (level) {
        const y = box.toY(valueOf(level));
        readout = Number.isFinite(y)
          ? {
              level,
              colour: colourOf(level),
              price: valueOf(level),
              delta: levelDistance(level, valueOf(level)),
              y: Math.min(Math.max(y, top), bottom)
            }
          : null;
      }
    }
    frame = requestAnimationFrame(place);
  }

  $effect(() => {
    // The chart asks these before it takes a press for its own panning: `hit` for whether the press
    // landed on a line, `blocked` for whether a level is already in hand.
    gesture.hit = (y) => levelAt(levels, y, layout()?.toY, 30);
    gesture.blocked = armed !== null;
    frame = requestAnimationFrame(place);
    return () => cancelAnimationFrame(frame);
  });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="levels"
  class:levels--armed={armed !== null}
  onpointerdown={plotDown}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
>
  {#each levels as level (level.key)}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="line"
      class:line--in-hand={armed === level.key}
      class:line--fired={level.met}
      use:bindRow={level}
      style="--tone: {colourOf(level)}"
      role={level.movable ? "slider" : "presentation"}
      aria-label={level.label}
      tabindex={level.movable ? 0 : -1}
      onpointerdown={level.movable ? boxDown : undefined}
    >
      <span class="rule"></span>
      <span class="box">
        {#if armed === level.key}
          <span class="grip" aria-hidden="true">
            <svg viewBox="0 0 10 6" fill="none"
              ><path
                d="M1 5L5 1L9 5"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            >
            <svg viewBox="0 0 10 6" fill="none"
              ><path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            >
          </span>
        {/if}
        <span class="tag">{level.label}</span>
        <span class="price m-num">{formatPrice(valueOf(level))}</span>
      </span>
    </div>
  {/each}

  {#if readout}
    <div class="readout" style="top: {readout.y}px; --tone: {readout.colour}">
      <span class="readout-name">{readout.level.label}</span>
      <span class="readout-price m-num">{formatPrice(readout.price)}</span>
      <span class="readout-delta m-num">{readout.delta}</span>
    </div>
  {/if}
</div>

<style>
  .levels {
    position: absolute;
    inset: 0;
    /* Only the boxes take a press until a level is in hand; then the whole plot is the surface. */
    pointer-events: none;
    overflow: hidden;
  }

  .levels--armed {
    pointer-events: auto;
    touch-action: none;
  }

  /*
   * One level. The rule is a hairline, but the element is a finger's width tall so the line itself
   * can be pressed — 22 dp either side, which is what a touch target needs.
   */
  .line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    height: 44px;
    margin-top: -22px;
    padding: 0 8px;
    pointer-events: none;
    touch-action: none;
  }

  .line[role="slider"] {
    pointer-events: auto;
    cursor: ns-resize;
  }

  .rule {
    flex: 1 1 auto;
    height: 1px;
    margin-right: 6px;
    background: repeating-linear-gradient(to right, var(--tone) 0 4px, transparent 4px 8px);
    opacity: 0.75;
  }

  /* A target that already fired is history rather than a plan: the desktop draws it solid. */
  .line--fired .rule {
    background: var(--tone);
    opacity: 0.5;
  }

  /* In hand: the rule goes solid and thickens, and the box lifts off the chart. */
  .line--in-hand .rule {
    height: 2px;
    background: var(--tone);
    opacity: 1;
  }

  .box {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 6px;
    border: 1px solid var(--m-hairline);
    border-radius: 6px;
    background: var(--m-bg);
  }

  .line--in-hand .box {
    gap: 8px;
    padding: 5px 9px;
    border-color: var(--tone);
    border-radius: 9px;
    background: var(--m-card-2);
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--tone) 22%, transparent),
      0 8px 20px rgba(0, 0, 0, 0.5);
  }

  /* The up/down marks: only a level in hand has them, and they are what says "drag me". */
  .grip {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 10px;
    color: var(--tone);
  }

  .grip svg {
    display: block;
    width: 10px;
    height: 6px;
  }

  .tag {
    padding: 1px 5px;
    border-radius: 4px;
    background: var(--tone);
    font-size: 10px;
    font-weight: 700;
    line-height: 12px;
    color: #060510;
  }

  .line--in-hand .tag {
    padding: 2px 6px;
    font-size: 11px;
    line-height: 13px;
  }

  .price {
    font-size: 11px;
    color: var(--m-muted);
  }

  .line--in-hand .price {
    font-size: 13px;
    font-weight: 600;
    color: var(--m-text);
  }

  /* A level outside the plot waits at the edge it left by, dimmed, rather than nowhere. */
  .line[data-off="true"] .rule,
  .line[data-off="true"] .box {
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
