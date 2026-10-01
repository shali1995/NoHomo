// The captured-value helpers the profile components share: where an image loads
// from and which ink a figure is painted in. Each is pure and returns exactly
// what the capture rendered, so no component re-derives a URL or a colour. The
// paths and inks all come from src/lib/profileBody.json and profileHeader.json.

// Takes a row's captured `img` path; returns the URL to load it from.
/**
 * An avatar that came from the capture as a bare filename. That folder is gone — it held FOMO's
 * recorded content — so anything without a path of its own falls back to the app's mark.
 */
export const src = (img) => (img && img.startsWith("/") ? img : "/images/nohomo-eyes.png");

// The up / down inks the capture paints a rising or falling figure with, and the
// grey it uses instead while a position row is dim (the dust holding).
export const GREEN = "rgb(33, 201, 94)";
export const RED = "rgb(255, 98, 46)";
export const GREY = "rgb(152, 153, 163)";

// Takes a captured `up` flag; returns the ink for its arrow, sign and pct.
export const ink = (up) => (up ? GREEN : RED);

// Takes a position row; returns its PnL ink — grey when the capture dimmed the row.
export const pnlInk = (row) => (row.dim ? GREY : ink(row.up));
