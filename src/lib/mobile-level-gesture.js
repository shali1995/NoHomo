/**
 * The arithmetic behind moving a level on the token chart, kept out of the component.
 *
 * The interaction is two steps — press a level's box to take it, then drag it — and every decision
 * in it is a pure question about numbers: did a press land near a line, where may this level be
 * moved to, what price does this y mean, what does the API have to be told. Those questions are
 * answered here so they can be reasoned about and checked without a browser, a session or a
 * position; `LiveLevels.svelte` keeps only the touch, the paint and the calls.
 *
 * Which levels exist, and what each is measured from, is `mobilePriceLevels` in
 * `mobile-chart-levels.js` — the desktop's rules, ported once. This file is the gesture's own
 * arithmetic.
 */

/** How near a line a press has to land, in dp. The desktop uses 7 px for a mouse cursor. */
export const LEVEL_REACH = 22;

/** How far a finger has to travel before a press counts as a drag rather than a tap, in dp. */
export const LEVEL_SLOP = 6;

/**
 * The level nearest a press, if it is within reach — and only one this API can move. A fired
 * target, a multiple, a fixed price and the all-time high are readings, not handles.
 *
 * @param {any[]} levels the rows `mobilePriceLevels` returned
 * @param {number} y the press, in the plot's own dp
 * @param {(price: number) => number} toY the chart's own price -> y mapping
 * @param {number} [reach] how near counts, in dp
 * @returns {any|null}
 */
export function levelAt(levels, y, toY, reach = LEVEL_REACH) {
  let best = null;
  let bestDistance = reach;
  for (const level of levels ?? []) {
    if (!level?.movable) continue;
    const lineY = Number(toY?.(level.price));
    if (!Number.isFinite(lineY)) continue;
    const distance = Math.abs(lineY - y);
    if (distance <= bestDistance) {
      best = level;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Where a level may be moved to. These are the desktop's own clamps: a resting buy waits below the
 * market, a stop below what the trade paid, a take profit above it. `market` is the chart's live
 * price, which the caller carries on the row.
 *
 * @param {any} level
 * @returns {{ min: number, max: number }}
 */
export function levelBounds(level) {
  if (level?.kind === "dip") return { min: 0, max: Number(level.market ?? 0) };
  if (level?.kind === "stopLoss") return { min: 0, max: Number(level.entry ?? 0) };
  if (level?.kind === "takeProfit") {
    return { min: Number(level.entry ?? 0), max: Number.MAX_SAFE_INTEGER };
  }
  return { min: 0, max: Number.MAX_SAFE_INTEGER };
}

/** A price inside a level's own bounds; a non-positive price is not a level at all. */
export function clampPrice(price, bounds) {
  const wanted = Math.min(Math.max(Number(price), bounds?.min ?? 0), bounds?.max ?? Number.MAX_SAFE_INTEGER);
  return wanted > 0 ? wanted : 0;
}

/**
 * A finger's y as a price: the inverse of the chart's own `toY`. The library's layout is
 * `pad.top + (1 - (v - minVal) / valRange) * chartH`, and this is that line solved for `v` rather
 * than a second copy of the scale written from memory.
 *
 * @param {number} y
 * @param {{ pad: { top: number }, chartH: number, minVal: number, maxVal: number }} layout
 */
export function priceFromY(y, layout) {
  if (!layout) return 0;
  const { pad, chartH, minVal, maxVal } = layout;
  if (!(chartH > 0)) return 0;
  return maxVal - ((Number(y) - pad.top) / chartH) * (maxVal - minVal);
}

/**
 * What letting go means. A press that never travelled is a tap, and a tap off the box is the way
 * out of a level in hand — it is released and goes back to the price it came from. A press on the
 * box itself keeps it.
 *
 * @param {{ moved: boolean, onBox: boolean }} gesture
 * @returns {"hold"|"release"}
 */
export function releaseDecision(gesture) {
  if (gesture?.moved) return "hold";
  return gesture?.onBox ? "hold" : "release";
}

/**
 * What the API has to be told, if anything, to put a level where the finger left it.
 *
 * A resting buy is moved by its swap id as a price. A target is stored as a percent of what the
 * trade paid, so the price is turned back into that percent — the desktop's own sum, `|price /
 * entry - 1| * 100`, to the three places it rounds at. A level with no id, no entry, or a price
 * that never moved cannot be sent, and answers null.
 *
 * @param {any} level
 * @param {number} price
 * @param {number} from the price it started on
 * @returns {{ kind: "dip"|"target", args: any }|null}
 */
export function levelCall(level, price, from) {
  const landed = Number(price);
  if (!(landed > 0) || !level) return null;
  if (Math.abs(landed - Number(from)) < 1e-12) return null;

  if (level.kind === "dip") {
    if (level.swapId == null) return null;
    return { kind: "dip", args: { swapId: level.swapId, priceUsd: landed } };
  }

  const entry = Number(level.entry ?? 0);
  if (level.targetId == null || !(entry > 0)) return null;
  return {
    kind: "target",
    args: {
      id: level.targetId,
      kind: level.kind === "stopLoss" ? "STOP_LOSS" : "TAKE_PROFIT",
      sellPct: Number(level.sellPct ?? 0),
      changePct: Number(Math.abs((landed / entry - 1) * 100).toFixed(3))
    }
  };
}

/**
 * How far a price sits from what the level is measured against, as a signed percent: the entry for
 * a target, the market for a resting buy. This is the figure the readout shows while dragging.
 */
export function levelDistance(level, price) {
  const anchor =
    level?.kind === "dip"
      ? Number(level?.market ?? 0)
      : Number(level?.entry ?? 0) > 0
        ? Number(level.entry)
        : Number(level?.market ?? 0);
  const value = Number(price);
  if (!(anchor > 0) || !(value > 0)) return "";
  const pct = (value / anchor - 1) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}
