/**
 * The two things the phone's chart and its level lines must agree on.
 *
 * `TokenCandles.svelte` draws the candles into a canvas at the capture's geometry, and the
 * level lines are HTML over that canvas — so a level needs the very same price -> y answer
 * the candles were drawn with. Rather than keep that arithmetic in two places and let them
 * drift, it lives here and both read it.
 *
 * `mobileChartLayout` is the phone's copy of the desktop's mapping: the plot's right edge is
 * fixed at 402 dp (`PLOT_RIGHT`) and the candles occupy the middle band of the canvas, 24%
 * down to 72% (`TokenChart.svelte`'s `scaleY`, which pads the series into the same band), so
 * the lowest low lands at 72% of the height and the highest high at 24%. A flat series has no
 * range to divide by, so it is opened out by a hundredth of its own value, as the desktop does.
 *
 * `mobilePriceLevels` reads the account's own trade for the token — a resting dip buy, the
 * take profits and the stops — and turns each into the level the chart should draw. The phone
 * chart runs on the price scale only (`TokenScreen` pins `setMode("price")`), so the market-cap
 * arithmetic the desktop needs for its other mode is deliberately absent here; a level that
 * only exists as a market cap has no place on this axis and is not drawn.
 */
/** The plot's right edge in dp: where the candles stop and the price chip's gutter begins. */
export const PLOT_RIGHT = 402;

/**
 * The vertical band the candles are drawn in, as fractions of the canvas height.
 * The desktop pads its scale to the same band, so a level sits where the axis says it does.
 */
const BAND_TOP = 0.24;
const BAND_BOTTOM = 0.72;

/**
 * The series the chart can actually draw: a candle missing a high, low or close has no
 * coordinate, so it is dropped before the range is taken — otherwise one bad frame stretches
 * the scale for the whole window.
 *
 * @param {any[]} candles
 */
function usableCandles(candles) {
  return (candles ?? []).filter(
    (candle) =>
      Number.isFinite(Number(candle?.high)) &&
      Number.isFinite(Number(candle?.low)) &&
      Number.isFinite(Number(candle?.close))
  );
}

/**
 * The chart's price -> y mapping for the candles on screen.
 *
 * @param {any[]} candles the series, oldest first
 * @param {number} height the canvas' own height in dp
 * @returns {{ scaleY: (price: number) => number, priceAt: (y: number) => number,
 *   last: number, lo: number, hi: number, height: number, top: number, bottom: number }}
 *   `scaleY` answers in the canvas' own coordinate space, so a caller drawing over it gets a
 *   y that can be used directly and the inverse `priceAt` turns a pointer's y back into a
 *   price. `last` is the newest close, which is the market's own price.
 */
export function mobileChartLayout(candles, height) {
  const rows = usableCandles(candles);
  const empty = {
    scaleY: () => 0,
    priceAt: () => 0,
    last: 0,
    lo: 0,
    hi: 0,
    height: 0,
    top: 0,
    bottom: 0
  };
  if (rows.length === 0 || !(height > 0)) return empty;

  let lo = Infinity;
  let hi = -Infinity;
  for (const candle of rows) {
    lo = Math.min(lo, Number(candle.low));
    hi = Math.max(hi, Number(candle.high));
  }
  if (!(hi > lo)) {
    const centre = hi || 1;
    hi = centre * 1.01;
    lo = centre * 0.99;
  }

  const top = height * BAND_TOP;
  const bottom = height * BAND_BOTTOM;
  const span = hi - lo;
  return {
    // `bottom - …` because the canvas' y grows downward: the highest price is the smallest y.
    scaleY: (price) => bottom - ((Number(price) - lo) / span) * (bottom - top),
    // and the same line back the other way, for a pointer that has to become a price
    priceAt: (y) => lo + ((bottom - Number(y)) / (bottom - top)) * span,
    last: Number(rows[rows.length - 1].close),
    lo,
    hi,
    height,
    top,
    bottom
  };
}

/**
 * One trade target (a take profit or a stop) as a price.
 *
 * A percent trigger is measured from the entry: `+30%` is `entry * 1.3` and a stop's `-20%`
 * is `entry * 0.8`. A multiplier is the entry times the factor. A price trigger is already the
 * level and is used as it stands. A market-cap trigger is expressed on the axis this chart does
 * not have, so it answers 0 and draws nothing — a line at a made-up price would be worse than
 * no line.
 *
 * @param {any} target a `liveTargets` / `metTargets` chip: `{ kind, trigger }`
 * @param {number} entry the position's entry price
 */
function targetPrice(target, entry) {
  const trigger = target?.trigger ?? {};
  const isStop = target?.kind === "STOP_LOSS";
  if (trigger.type === "PERCENT") {
    const pct = Math.abs(Number(trigger.changePct ?? 0));
    if (!(entry > 0) || !(pct > 0)) return 0;
    return isStop ? entry * (1 - pct / 100) : entry * (1 + pct / 100);
  }
  if (trigger.type === "MULTIPLIER") {
    const multiplier = Number(trigger.multiplier ?? 0);
    if (!(entry > 0) || !(multiplier > 0)) return 0;
    return entry * multiplier;
  }
  if (trigger.type === "PRICE") {
    return Number(trigger.priceUsd ?? 0);
  }
  return 0;
}

/**
 * Every level the account's trade on this token actually has, in price terms.
 *
 * The dip is a resting buy below the market. When it was placed as a level the engine stores
 * that price (`triggerPriceUsd`) and there is nothing to derive; an order placed as a bare
 * percentage is measured from the entry once the trade has filled, or from the price when it was
 * placed — the candle at `placedAt`, the same anchor the desktop uses, so the line does not slide
 * with the market.
 *
 * @param {any} position a row from `positionsFor(address)`, or null
 * @param {any[]} candles the chart's series, oldest first
 * @returns {Array<{ key: string, kind: "dip"|"takeProfit"|"stopLoss", price: number,
 *   label: string, tone: string, movable: boolean, sellPct: number,
 *   entry: number, cancel: { swapId: number }|null }>}
 */
export function mobilePriceLevels(position, candles) {
  if (!position) return [];
  const rows = usableCandles(candles);
  const last = rows.length ? Number(rows[rows.length - 1].close) : 0;
  const levels = /** @type {any[]} */ ([]);

  const dip = position.dipPill ?? null;
  const dipPct = Math.abs(Number(dip?.trigger?.dipPct ?? 0));
  const locked = Number(dip?.triggerPriceUsd ?? 0);

  // The chart is on the price axis, so the only snapshot numbers it may use are prices — a cap
  // divided by a price is a ratio this code would have to invent a supply for, so it does not.
  const entryPrice = Number(position.entryPriceUsd ?? 0);

  let dipPrice = locked;
  if (!(dipPrice > 0) && dipPct > 0) {
    /**
     * Nothing was stored as a level, so the percentage has to be turned into one, and what it is
     * measured from is the question. The desktop asks the same three questions in the same order:
     * a trade that has filled measures from what it paid (`entryPriceUsd` here, the entry cap in
     * its other mode), and a trade that has not measures from the price at the moment the order
     * was placed — the candle at `placedAt`, which is the same lookup the desktop anchors on, so
     * the line stays put while the market moves rather than sliding with it. An order older than
     * the candles in view falls back to the oldest candle there is.
     */
    if (entryPrice > 0) {
      dipPrice = entryPrice * (1 - dipPct / 100);
    } else {
      let anchor = last;
      const placedAt = Number(dip?.placedAt ?? 0);
      if (placedAt > 0 && rows.length) {
        for (const candle of rows) {
          if (Number(candle.time) <= placedAt) anchor = Number(candle.close);
          else break;
        }
      }
      dipPrice = anchor > 0 ? anchor * (1 - dipPct / 100) : 0;
    }
  }

  if (dipPrice > 0 && dip) {
    levels.push({
      // the swap id *is* the identity of a resting buy; the cancel call takes exactly this
      key: `dip:${dip.swapId ?? dip.id}`,
      // the id the move call takes; an order the engine gave none cannot be moved at all
      swapId: dip.swapId ?? null,
      kind: "dip",
      price: dipPrice,
      // the trade's own tag and pill label, the words the position card already shows
      label: dip.tag ?? "DIP",
      tone: "var(--m-blue)",
      // A resting buy is moved by swap id, so an order the engine gave no id has no level to
      // move — it draws as a reading, as the desktop leaves it.
      movable: dip.swapId != null,
      // a resting buy is the only level this API has a cancel for
      sellPct: 0,
      entry: 0,
      cancel: dip.swapId != null ? { swapId: dip.swapId } : null
    });
  }

  // Where a target is measured from. A filled position has paid its entry; a resting order has
  // paid nothing yet, so what it will pay is its own dip level — the engine's number, not a
  // guess — and only then the market. Without an anchor of some kind a percent trigger has no
  // level at all, and an unfilled order is the case these lines matter most for.
  const entry =
    entryPrice > 0 ? entryPrice : dipPrice > 0 ? dipPrice : last;

  // fired targets first, then the armed ones: the order the desktop numbers its tags in
  const targets = [...(position.metTargets ?? []), ...(position.liveTargets ?? [])];
  for (const target of targets) {
    const price = targetPrice(target, entry);
    if (!(price > 0)) continue;
    const isStop = target.kind === "STOP_LOSS";
    levels.push({
      // `config:N` ids on an unfilled order are not server ids: stable per plan order, so the
      // row keeps its identity across reads, and the desktop offers those rows no move either.
      key: `target:${target.id}`,
      // what the move call takes, and whether this one has already fired
      targetId: target.id ?? null,
      met: target.met === true,
      kind: isStop ? "stopLoss" : "takeProfit",
      price,
      label: target.tag ?? (isStop ? "SL" : "TP"),
      tone: isStop ? "var(--m-red)" : "var(--m-green)",
      /**
       * Only a live percent trigger has a level this API can be asked to move — the same two
       * conditions the desktop puts on its own handles: a target that already fired is history,
       * and a multiple or a fixed price is not a percent this call can express. Every other
       * target is drawn and nothing more.
       */
      movable: !target.met && target.trigger?.type === "PERCENT" && entry > 0 && target.id != null,
      // what a moved target has to send back: its size, and the entry its percent is measured from
      sellPct: Number(target.sellPct ?? 0),
      entry,
      // There is no cancel for a stop or a take profit anywhere in this API: a tap on one of
      // these is a tap on a reading, so nothing about it is offered.
      cancel: null
    });
  }

  return levels;
}
