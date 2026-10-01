/**
 * Which chart markers are drawn.
 *
 * Ombra keeps all of it in one persisted blob (`ombra_chart_markers`) and toggles the
 * kinds client-side; only "my wallets only" is different, because `curated` is a filter
 * the backend applies, so that one has to be re-fetched rather than filtered here.
 *
 * `user` is the one that needs a session: the backend only returns USER_SWAP markers to
 * the wallet that made them, so its toggle simply has nothing to show signed out.
 */
const KEY = "ombra_chart_markers";

/**
 * Defaults match what the capture's toolbar rendered where it had the toggle (Thesis
 * on, My swaps and Friends only off), and Ombra's own defaults for the three this
 * toolbar did not carry.
 */
const DEFAULTS = {
  user: false,
  calls: true,
  kols: true,
  theses: true,
  tweets: true,
  curated: false
};

function load() {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    const next = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS)) {
      if (typeof parsed?.[key] === "boolean") next[key] = parsed[key];
    }
    return next;
  } catch {
    return { ...DEFAULTS };
  }
}

let prefs = $state(load());

export function getMarkerPrefs() {
  return prefs;
}

export function toggleMarker(key) {
  if (!(key in DEFAULTS)) return;
  prefs = { ...prefs, [key]: !prefs[key] };
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* a full or blocked store is not worth failing a toggle over */
  }
}
