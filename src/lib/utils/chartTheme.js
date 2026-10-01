/**
 * Bridge for chart colours.
 *
 * Ombra reads its chart colours through `tc('--t-…')` on its own theme variables.
 * This app's stylesheet is the captured one, whose variables are named differently, so
 * each token Ombra asks for is mapped onto the captured equivalent. Values are read
 * live from the document, so if the variable ever changes the chart follows.
 */

const TOKEN_MAP = {
  "--t-s0": "--color-bg-primary",
  "--t-s1": "--color-bg-secondary",
  "--t-s2": "--color-bg-secondary",
  "--t-s4": "--color-bg-secondary",
  "--t-s5": "--color-bg-secondary",
  "--t-s8": "--color-bg-tertiary",
  "--t-bd": "--color-bg-tertiary-solid",
  "--t-bd2": "--color-bg-tertiary-solid",
  "--t-g4": "--color-text-tertiary",
  "--t-g5": "--color-text-tertiary",
  "--t-g7": "--color-text-secondary",
  "--t-g8": "--color-text-secondary",
  "--t-g9": "--color-text-secondary",
  "--t-tx": "--color-text-primary",
  "--t-wh": "--color-text-primary",
  "--t-grn": "--color-green",
  "--t-red": "--color-red",
  "--t-blu": "--color-accent-primary",
  "--t-yel": "--color-yellow",
  "--t-org": "--color-red",
  "--t-pnk": "--color-accent-primary"
};

/** Literal fallbacks, so the chart still draws if a variable cannot be resolved. */
const FALLBACKS = {
  "--color-bg-primary": "#060510",
  "--color-bg-secondary": "#12111a",
  "--color-bg-tertiary": "#cbd0eb1a",
  "--color-bg-tertiary-solid": "#161522",
  "--color-text-primary": "#f7f7f7",
  "--color-text-secondary": "#9899a3",
  "--color-text-tertiary": "#474b52",
  "--color-green": "#21c95e",
  "--color-red": "#ff622e",
  "--color-accent-primary": "#516af6",
  "--color-yellow": "#f9e45b"
};

function readVar(name) {
  if (typeof document === "undefined") return null;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || null;
}

/** Ombra's `tc(token)`: resolve a theme token to a usable colour string. */
export function tc(token) {
  const mapped = TOKEN_MAP[token] ?? token;
  return readVar(mapped) ?? FALLBACKS[mapped] ?? "#888888";
}

/**
 * Ombra's `withHexAlpha`: append a 2-char alpha to a colour for lightweight-charts.
 * A value that is not a hex colour (an `rgb()`, or a var that failed to resolve) is
 * returned unchanged rather than mangled.
 */
export function withHexAlpha(color, alpha) {
  if (typeof color !== "string") return color;
  const value = color.trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return `${value}${alpha}`;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [r, g, b] = value.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}${alpha}`;
  }
  return value;
}
