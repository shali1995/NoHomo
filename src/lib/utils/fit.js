/**
 * Fit the app to the window.
 *
 * The app is a replica of a page captured in a 2416x1484 CSS-pixel window, and its panels
 * are laid out at the sizes measured there: a 340px discovery panel, table columns in rem,
 * a minimum chart height, a table card that is deliberately twice the window tall. On a
 * laptop the window is smaller than that, so the page opens either cramped or spilling and
 * the reader ends up pressing the browser's zoom-out until it fits. This does that for them.
 *
 * Two things about how it does that are load bearing, and both were learned the hard way:
 *
 *   - The scale is a CSS transform on one wrapper, **not** a `zoom` on the document. A
 *     document zoom shrinks the document, but a box measured in viewport units (`100dvw`,
 *     `100svh`) does not shrink with it, so the app's own outer box stopped matching the
 *     window it had been measured from and the leftover showed as a gap. A transform also
 *     leaves the reported window size alone, which keeps this from fighting a zoom the
 *     reader set in the browser: zooming out makes the window read wider, this settles back
 *     to 1, and the two do not compound.
 *   - The wrapper is sized `window / scale` *before* it is scaled, so what lands on screen
 *     is exactly the window. Scaling alone would leave the app in a corner with a strip of
 *     page beside it — the same gap from the other direction.
 *
 * The popups (hover cards, the trade popup, the deposit and withdraw sheets) are
 * deliberately left outside the wrapper: they are placed from measured rectangles, and a
 * scaled ancestor would make those rectangles mean two different things. The one placement
 * that cannot move out of the wrapper is the chart's hover tooltip, which reads viewport
 * coordinates from inside the chart; it divides by `--fit-scale`, which this sets.
 */

/** The layout wants about this much room before its panels start crowding each other. */
const DESIGN_WIDTH = 1700;
/** ...and about this much height before the chart and the columns are squeezed. */
const DESIGN_HEIGHT = 1000;
/** Below this the text stops being readable, so the layout is left cramped instead. */
const MIN_SCALE = 0.6;

/** The scale currently on the app. 1 until the fit has run, and on any window big enough. */
let applied = 1;

/**
 * The scale the app is being drawn at. Anything that places itself from a measured
 * rectangle — a hover card, the chart's tooltip — is handed viewport pixels and lands
 * inside the scaled box, so it divides them by this to get back into the box's own space.
 */
export function currentFitScale() {
  return applied;
}
/** Re-applying for a hair's difference would only churn. */
const HYSTERESIS = 0.01;

/**
 * The scale for a window of this size: the smaller of the two ratios, and never above 1 —
 * a bigger window is given the layout as recorded, not an enlarged one.
 *
 * @param {number} width
 * @param {number} height
 */
export function fitScaleFor(width, height) {
  const byWidth = Number.isFinite(width) && width > 0 ? width / DESIGN_WIDTH : 1;
  const byHeight = Number.isFinite(height) && height > 0 ? height / DESIGN_HEIGHT : 1;
  return Math.min(1, Math.max(MIN_SCALE, Math.min(byWidth, byHeight)));
}

/**
 * Scale `element` — the wrapper the app shell sits in — to fit the window now, and keep it
 * fitted as the window changes. Returns its own teardown.
 *
 * @param {HTMLElement | null | undefined} element
 */
export function startFitScale(element) {
  if (typeof window === "undefined" || !element) return () => {};

  const apply = (force) => {
    const scale = fitScaleFor(window.innerWidth, window.innerHeight);
    if (!force && Math.abs(scale - applied) < HYSTERESIS) return;
    applied = scale;
    // The box the app lays itself out in: as much room as the window has at this scale, so
    // that scaling it back down lands exactly on the window.
    element.style.width = `${window.innerWidth / scale}px`;
    element.style.height = `${window.innerHeight / scale}px`;
    element.style.transformOrigin = "0 0";
    element.style.transform = `scale(${scale})`;
    // Read by the chart's tooltip, the one placement inside the wrapper that is handed
    // viewport coordinates and has to convert them back into this box's own space.
    document.documentElement.style.setProperty("--fit-scale", String(scale));
  };

  apply(true);
  const onResize = () => apply(false);
  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}
