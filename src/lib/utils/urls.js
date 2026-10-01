/**
 * The token links that come out of scraped metadata, in one place so every surface that
 * draws them agrees: the header's icon row and the About card both read the same fields.
 */

/** Schemes a scraped link is allowed to use. Ombra allows these three and no others. */
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "tg:"]);

/**
 * Ombra's `safeUrl`: never hand a scraped string straight to an `href`. A value that is
 * not a URL, or one on a scheme we do not allow, comes back empty so the caller draws
 * nothing rather than a link that goes somewhere unexpected.
 *
 * @param {unknown} raw
 */
export function safeUrl(raw) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(url.protocol.toLowerCase()) ? url.href : "";
  } catch {
    return "";
  }
}

/**
 * The X search for a token: its address, and its `$symbol` when it has one. This is the
 * capture's own query (`...?q=<address>%20OR%20%24<symbol>`), and it is built from the
 * token on screen rather than stored, so it cannot point at another token.
 *
 * @param {{ tokenAddress?: string, tokenSymbol?: string } | null} token
 */
export function searchOnXHref(token) {
  const address = token?.tokenAddress?.trim();
  if (!address) return "";
  const symbol = token?.tokenSymbol?.trim();
  const query = symbol
    ? `${encodeURIComponent(address)}%20OR%20%24${encodeURIComponent(symbol)}`
    : encodeURIComponent(address);
  return `https://x.com/search?q=${query}`;
}
