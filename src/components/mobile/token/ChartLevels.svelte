<!--
  The account's own price levels, laid over the phone's candle canvas: the resting dip buy, the
  take profits and the stops of the trade on this token.

  The candles are painted into a canvas, so the lines are HTML above it — one row per level at
  the y the chart's own scale puts its price at, using the same `mobileChartLayout` the candles
  were drawn with. Nothing is drawn when the account holds nothing on this token, and nothing is
  invented when it does: every number here comes from the trade store.

  Each drag is committed through the call that owns that level — `moveDipLevel` for a resting
  buy, `moveTargetLevel` for a take profit or a stop — at the price the line was let go on. A
  release that did not move a level sends nothing. A commit the API refuses drops its pending
  value, so the row falls back to the level the store still holds.

  While a finger is down the rows are frozen outright: `draggingLevel` is raised on the press,
  and because `rows` is what builds them it hands back the rows it last built until the finger
  is up — so a live candle tick cannot rebuild the row under the finger from the level the store
  still has. That is the desktop's guard, doing the same job here.
-->
<script>
  import ChartLevel from "./ChartLevel.svelte";
  import { mobilePriceLevels } from "../../../lib/mobile-chart-levels.js";
  import { getChain } from "../../../lib/api/token.svelte.js";
  import {
    cancelPendingSwap,
    moveDipLevel,
    moveTargetLevel,
    positionsFor
  } from "../../../lib/api/trade.svelte.js";

  /** The address is the token being charted; the chain for a cancel comes from the store. */
  let { address = "", candles = [], layout } = $props();

  /** True while a level is under the finger — the redraw guard, named as the desktop names it. */
  let draggingLevel = $state(false);
  /**
   * A level committed but not yet echoed back by the store, keyed by the level's own key and
   * holding the price it was dropped on together with the level the store held at that moment.
   * The API's answer reaches the store a moment after the POST, so without this the line would
   * jump back to the level it was moved from; once the store's own level leaves the one it had,
   * the read that answered the call has landed and the store's number takes over. Plain, not
   * reactive: it is read inside `rows`, which re-runs when the store catches up.
   */
  const pending = new Map();
  /** The level the finger has, where it picked it up, and where it is holding it. */
  let drag = $state(null);
  /** The rows as last built. Kept so a tick during a drag cannot rebuild them out of the hand. */
  let held = [];

  /** The trade on this token, read the way the position card reads it — one source, not two. */
  const position = $derived(positionsFor(address)[0] ?? null);

  const rows = $derived.by(() => {
    if (draggingLevel) return held;
    const levels = mobilePriceLevels(position, candles);
    const scaleY = layout?.scaleY ?? (() => 0);
    const last = Number(layout?.last ?? 0);
    const lo = Number(layout?.lo ?? 0);
    const hi = Number(layout?.hi ?? 0);
    held = levels
      // A level outside the range the candles put on this axis has no y: the desktop's own
      // library skips a price line it cannot place, and a line pinned to an edge would claim a
      // price it is not at. Nothing is drawn for it until the chart shows that price.
      .filter((level) => lo > 0 && hi > lo && level.price >= lo && level.price <= hi)
      .map((level) => {
        const committed = pending.get(level.key);
        if (committed && level.price !== committed.from) pending.delete(level.key);
        const price = Number(committed && level.price === committed.from ? committed.price : level.price);
        return {
          level,
          price,
          // a resting buy only ever waits below the market; a target only has to stay in range
          max: level.kind === "dip" ? last : hi,
          y: scaleY(price)
        };
      });
    return held;
  });

  /**
   * The price under the finger: where the row was picked up, plus how far the pointer has come,
   * turned back into a price by the chart's own mapping and clipped to that level's own bounds.
   */
  function priceUnderFinger(row, clientY) {
    const delta = clientY - (drag?.clientY ?? clientY);
    const at = Number(layout?.priceAt?.(row.y + delta) ?? 0);
    return Math.min(Math.max(at, 0), row.max);
  }

  /** A press, from the row itself: freeze the rows and remember the level being held. */
  function start(row, clientY) {
    // the row's own y travels with the press: until the first move it is still the level's own,
    // and a press that never moves must not push the row off its place
    drag = { key: row.level.key, clientY, y: row.y };
    draggingLevel = true;
  }

  /** A move: the overlay answers with the price the row should hold, and remembers the y. */
  function move(row, clientY) {
    const price = priceUnderFinger(row, clientY);
    if (!(price > 0)) return row.price;
    drag = { key: row.level.key, clientY, y: layout?.scaleY?.(price) ?? row.y };
    return price;
  }

  /**
   * Commit the level the finger let go on. The store's own answer is what redraws the row, so a
   * refusal needs no repair from here beyond that; a commit the API refuses drops its pending
   * value, and the row goes back to the level the API still holds.
   */
  async function commit(row, price) {
    const { level } = row;
    draggingLevel = false;
    drag = null;
    pending.set(level.key, { price, from: level.price });
    try {
      const moved =
        level.kind === "dip"
          ? await moveDipLevel({ address, swapId: level.cancel?.swapId, priceUsd: price })
          : await moveTargetLevel({
              address,
              id: level.key.replace(/^target:/, ""),
              kind: level.kind === "stopLoss" ? "STOP_LOSS" : "TAKE_PROFIT",
              sellPct: level.sellPct,
              changePct: Math.abs((price / level.entry - 1) * 100)
            });
      if (moved === false) pending.delete(level.key);
    } catch {
      // the calls above already reload the trade and say what went wrong
      pending.delete(level.key);
    }
  }
</script>

{#if rows.length > 0}
  <div class="levels">
    {#each rows as row (row.level.key)}
      <ChartLevel
        level={row.level}
        y={drag?.key === row.level.key ? drag.y : row.y}
        onstart={(clientY) => start(row, clientY)}
        onmove={(clientY) => move(row, clientY)}
        onrelease={(price) => commit(row, price)}
        oncancel={() => {
          // the same call, with the same arguments, the desktop's position card cancels a dip with
          if (row.level.cancel) {
            void cancelPendingSwap({
              chain: getChain(),
              address,
              swapId: row.level.cancel.swapId
            });
          }
        }}
      />
    {/each}
  </div>
{/if}

<style>
  /* Over the canvas and out of the way: each row takes a press only when it has something to
     do with one, which is the row's own business. */
  .levels {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }
</style>
