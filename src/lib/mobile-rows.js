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

/** Bonding / Bonded: the second line is volume, and Bonding's right column is progress. */
export function trenchRowToToken(row) {
  return {
    ...row,
    meta: row.volume ? `${row.volume} vol` : null,
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
    // A curated asset has no live cap reader here, so the snapshot's is shown when it has one
    // and the name stands in when it does not — never a zero dressed as a market cap.
    meta: mcap > 0 ? `${formatUsdCompact(mcap)} MC` : row?.name || "",
    change: change.replace(/^\+/, ""),
    dir: up ? "\u25B2" : "\u25BC"
  };
}
