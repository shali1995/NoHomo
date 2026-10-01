import { api } from "./client.js";
import { tokenImage } from "./config.js";
import { ageFromSeconds } from "./token.svelte.js";

/**
 * The Transfers history panel behind the profile header's transfers button.
 *
 * `GET /v2/traders/{chain}/{wallet}/transfers` lists what moved in and out of the wallet,
 * newest first, each classified by what the surrounding transaction was doing. The API
 * keeps a rolling window — `retentionDays` on the response — so this is what it retained,
 * not the wallet's whole history.
 *
 * The capture never opened this panel, so its chrome is the app's own dialog, the one the
 * deposit sheet uses, and its words are fomo's own: Transfers history, Received, Sent,
 * No transfers yet, Failed to load transfers.
 */

const CHAIN = "SOL";
/** The wrapped-SOL mint, for the native asset's icon. */
const SOL_MINT = "So11111111111111111111111111111111111111112";
const RETENTION_NOTE = "The last {days} days";

let open = $state(false);
let rows = $state.raw([]);
let loading = $state(false);
let error = $state("");
let retentionDays = $state(0);
/** The wallet the panel is showing, so a late page cannot land on another one. */
let wanted = "";
let cursor = null;
/** The page that failed. It is never asked for again: a cursor the server rejects stays rejected. */
let failedCursor = null;
let pages = 1;

/** `10.195037` -> `10.195037 USDC`; long tails are trimmed to six decimals. */
function formatAmount(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (value === undefined || value === null || value === "" || isNaN(num)) return "0";
  if (num === 0) return "0";
  if (Math.abs(num) >= 1) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }
  return num.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function assetLabel(asset) {
  if (!asset) return "";
  if (asset.symbol) return asset.symbol;
  if (asset.assetKind === "sol") return "SOL";
  const mint = asset.mint ?? "";
  return mint.length > 10 ? `${mint.slice(0, 4)}\u2026${mint.slice(-4)}` : mint;
}

/** `Dw3LY8…PNb1` — the same shortening the header uses. */
function shortWallet(address) {
  if (!address || address.length < 12) return address ?? "";
  return `${address.slice(0, 6)}\u2026${address.slice(-4)}`;
}

let timeFormatter = null;
function fullDateTime(timestamp) {
  if (!timestamp) return "";
  timeFormatter ??= new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
  return timeFormatter.format(new Date(timestamp));
}

/** fomo's own words for the three directions the API reports. */
const DIRECTION_TEXT = {
  incoming: "Received",
  outgoing: "Sent",
  selfTransfer: "Transferred"
};

function transferRow(t) {
  const incoming = t.direction === "incoming";
  const counterparty = incoming ? t.sourceAddress : t.destinationAddress;
  return {
    key: t.id,
    direction: DIRECTION_TEXT[t.direction] ?? "Transferred",
    incoming,
    counterparty: shortWallet(counterparty),
    counterpartyFull: counterparty ?? "",
    img: tokenImage(CHAIN, t.asset?.mint ?? SOL_MINT),
    amount: `${formatAmount(t.amount)} ${assetLabel(t.asset)}`,
    /** What the surrounding transaction was doing, in the API's own words. */
    activity: t.transactionActivity ?? "",
    time: ageFromSeconds(t.blockTime?.ageSeconds),
    timeTitle: fullDateTime(t.blockTime?.timestamp)
  };
}

export function isTransfersOpen() {
  return open;
}

export function transfersRows() {
  return rows;
}

export function isTransfersLoading() {
  return loading;
}

export function transfersError() {
  return error;
}

export function transfersRetention() {
  return retentionDays ? RETENTION_NOTE.replace("{days}", String(retentionDays)) : "";
}

export function hasMoreTransfers() {
  return !!cursor && pages < 5;
}

async function fetchPage(wallet, nextCursor) {
  const { data, error: responseError } = await api.GET("/v2/traders/{chain}/{walletAddress}/transfers", {
    params: {
      path: { chain: CHAIN, walletAddress: wallet },
      query: nextCursor ? { cursor: nextCursor } : {}
    }
  });
  if (responseError) throw new Error("transfers failed");
  return data ?? null;
}

export async function openTransfers(wallet) {
  if (!wallet) return;
  wanted = wallet;
  open = true;
  rows = [];
  error = "";
  cursor = null;
  failedCursor = null;
  pages = 1;
  loading = true;
  try {
    const data = await fetchPage(wallet, null);
    if (wanted !== wallet) return;
    rows = (data?.items ?? []).map(transferRow);
    cursor = data?.nextCursor ?? null;
    retentionDays = data?.retentionDays ?? 0;
  } catch {
    if (wanted === wallet) {
      error = "Failed to load transfers";
      cursor = null;
    }
  } finally {
    if (wanted === wallet) loading = false;
  }
}

export async function loadMoreTransfers() {
  if (!cursor || cursor === failedCursor || pages >= 5 || !wanted) return;
  const mine = wanted;
  const next = cursor;
  try {
    const data = await fetchPage(mine, next);
    if (wanted !== mine) return;
    const seen = new Set(rows.map((row) => row.key));
    const more = (data?.items ?? []).map(transferRow).filter((row) => !seen.has(row.key));
    rows = [...rows, ...more];
    cursor = data?.nextCursor ?? null;
    pages += 1;
  } catch {
    // the list keeps what it has, and this page is not asked for a second time
    failedCursor = next;
  }
}

export function closeTransfers() {
  wanted = "";
  open = false;
  rows = [];
  error = "";
  cursor = null;
  pages = 1;
}
