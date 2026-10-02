/**
 * Two mappings the phone's list needs, because the desktop's rows come in three shapes.
 *
 * A scanner row is already the phone's own shape (`discoveryRowFromToken`). The other two are
 * not, and rather than teach `TokenRow` about three models, each family is mapped to the one
 * row the list already draws:
 *
 *   - a trench row (Bonding / Bonded, from `lib/api/trenches.svelte.js`) is a discovery row
 *     with two extras. The desktop prints 24h volume on the second line and the bonding
 *     progress in the change slot, so they ride through as `meta` and `bondedPct`.
 *   - a curated-list row (Crypto / Stocks, from `lib/api/lists.svelte.js`) is an asset, not a
 *     scanner token: its price and change come from that module's own readers, its market cap
 *     from the payload snapshot (the lists have no live cap reader), and its link is the mint
 *     on Solana, the same link the desktop row builds.
 *
 * Both return the same fields `TokenRow` reads, so nothing downstream branches on family.
 */
import { rowChange, rowChangeUp, rowPrice } from "./api/lists.svelte.js";
import { tokenImage } from "./api/config.js";
import { formatUsdCompact } from "./api/trending.svelte.js";

/**
 * Bonding / Bonded: the same row as everywhere else — the price under the symbol, the market
 * cap and the 24h change on the right — with the bonding progress taking the change's slot.
 * The 24h volume the desktop's own trench row shows on the second line is not drawn; these
 * rows read like the rest of the list.
 */
export function trenchRowToToken(row) {
  return {
    ...row,
    bondedPct: typeof row.bondedPct === "number" ? row.bondedPct : null
  };
}

/** Crypto / Stocks: a curated asset as the list's row. */
export function listRowToToken(row) {
  const mcap = Number(row?.snapshot?.mcap ?? 0);
  const price = rowPrice(row);
  const up = rowChangeUp(row);
  const change = rowChange(row);
  return {
    key: row?.key ?? row?.mint,
    href: row?.mint ? `/tokens/solana/${row.mint}` : undefined,
    initial: (row?.symbol || row?.name || "?").slice(0, 1),
    symbol: row?.symbol || row?.name || "",
    logo: row?.imageUrl || (row?.mint ? tokenImage("SOL", row.mint, 96) : null),
    pricePrefix: "",
    sub: null,
    priceSuffix: price,
    // A curated asset has no market cap to headline with, so its price stays on the right —
    // the desktop's AssetRow does the same — and the name takes the quiet line on the left.
    primary: price,
    meta: row?.name || "",
    change: change.replace(/^\+/, ""),
    dir: up ? "\u25B2" : "\u25BC"
  };
}
