import { getAuthToken, onAuthTokenChange } from "../auth.svelte.js";
import { api } from "./client.js";
import { ageFromSeconds, formatUsd } from "./token.svelte.js";
import { subscribe, unsubscribe } from "../ws/client.js";

/**
 * The reader's referral rewards — the surface behind the profile header's Rewards pill.
 *
 * Three authenticated reads under `/v2/referral`, the three the sheet draws:
 *   - `GET /v2/referral/code` — the reader's own code. It is their username when they have
 *     one (`isUsername` says which form came back) and a short generated code otherwise.
 *   - `GET /v2/referral/commissions/summary` — the money. `totalRevenueUsdStr` is the exact
 *     decimal text of the commission paid across every chain (`totalRevenueUsd` is the
 *     rounded form of the same number), `byChain` splits it per chain, `feeRates` carries the
 *     system, affiliate and cashback rates the next referred trade earns at, `topReferrals`
 *     ranks the referred users by what they produced, and `withdrawableBalances` is affiliate
 *     commission sitting ready to withdraw.
 *   - `GET /v2/referral/commissions?page&limit` — the individual fee records, newest first,
 *     each naming the referred user (`fromUser`), the chain, the USD earned (`revenueUsd`)
 *     and a Unix-seconds timestamp.
 *
 * The socket keeps it live the way the account module keeps its numbers live: once the
 * connection is authenticated the private `user:{userId}` topic carries `REFERRAL_CODE` and
 * `REFERRAL_COMMISSIONS_SUMMARY` frames, and each frame is a whole snapshot, so it replaces
 * what a read would have written rather than being merged into it. The rewards sheet is only
 * mounted while it is open, so the subscription and the clock live with `start`/`stop` instead
 * of running for the whole session the way the account's do.
 *
 * Two shapes in the summary are deliberately not drawn, because neither can be written with a
 * unit: `withdrawableBalances[].balance` is in the payout token's smallest units and
 * `feeRates[].cashbackAvailable` is in the chain's peg token, and the response names neither
 * token, so there is nothing honest to print beside either number. The write endpoints are not
 * wrapped at all: `POST /v2/referral/withdraw`, `POST /v2/referral/cashback`,
 * `POST /v2/referral/withdrawals` and `PUT /v2/referral/referrer` each answer with a signed
 * coupon (or a 204) for a flow the phone does not have, and a control that starts one and then
 * stops would be a dead end.
 *
 * Signed out is a real state, not a zero. These reads answer 400 `Missing credentials` without
 * a bearer token, so no request is made, every accessor answers null or empty, and the sheet
 * says so rather than drawing zeroes as if they had been earned.
 */

/** The one chain the referral program is configured for — the API's `Chain` enum is `SOL`. */
const CHAIN = "SOL";
/** Commission records per read: the API's own default page size. */
const PAGE_SIZE = 20;
/** Pages kept, so a long history cannot grow without bound. */
const MAX_PAGES = 5;
const REFRESH_MS = 60_000;

/** The chain names the app uses (`DepositSheet`'s own table), for the one enum value. */
const CHAIN_NAMES = { SOL: "Solana" };

let code = $state.raw(null);
let summary = $state.raw(null);
let history = $state.raw([]);
let loading = $state(false);
let loaded = $state(false);
let error = $state("");
let hasMore = $state(false);
/** The token a read belongs to, so a signed-out read cannot paint over the next session. */
let wanted = null;
let page = 0;
/** The page that failed. It is never asked for again: a page the server rejects stays rejected. */
let failedPage = null;
let timer = null;
let started = false;
let userKey = null;
let authOff = null;

/**
 * `1` -> `1%`, `6.25` -> `6.25%`. The API reports these rates as percentages already, so
 * nothing is scaled here; a field that is not a number has no row at all rather than a zero.
 */
function percent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${num % 1 === 0 ? String(num) : num.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}%`;
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
  return timeFormatter.format(new Date(timestamp * 1000));
}

/** Whether there is a session at all: the three reads are self-scoped and take a bearer token. */
export function referralSignedIn() {
  return !!getAuthToken();
}

export function referralLoading() {
  return loading;
}

/** Whether a read has resolved for this session: until then the sheet keeps its skeleton. */
export function referralLoaded() {
  return loaded;
}

export function referralError() {
  return error;
}

/** The reader's own referral code, or null when nothing has been read. */
export function referralCode() {
  return code?.code ?? null;
}

/** Whether that code is the reader's username rather than a generated code. */
export function referralCodeIsUsername() {
  return !!code?.isUsername;
}

/**
 * Commission paid across every chain, from the response's exact decimal text. `null` until a
 * read lands, so the sheet can hold its skeleton instead of printing a zero it did not measure.
 */
export function referralTotalText() {
  if (!summary) return null;
  return formatUsd(summary.totalRevenueUsdStr ?? summary.totalRevenueUsd);
}

/** The commission split by chain, in the API's own order. */
export function referralChainRows() {
  return (summary?.byChain ?? []).map((entry) => ({
    key: entry.chain,
    label: CHAIN_NAMES[entry.chain] ?? entry.chain,
    value: formatUsd(entry.affiliateRevenueUsd)
  }));
}

/**
 * The fee rates on the chain the program runs on, as the API writes them: the system's fee on
 * a referred trade, the commission the reader earns from it, and the cashback rate.
 */
export function referralRateRows() {
  const rates =
    (summary?.feeRates ?? []).find((entry) => entry.chain === CHAIN) ?? summary?.feeRates?.[0] ?? null;
  if (!rates) return [];
  const rows = [
    { key: "system", label: "System fee", value: percent(rates.systemFeeRate) },
    { key: "affiliate", label: "Commission rate", value: percent(rates.affiliateRate) },
    { key: "cashback", label: "Cashback rate", value: percent(rates.cashbackRate) }
  ];
  return rows.filter((row) => row.value !== null);
}

/**
 * The referred users, highest commission first, as the API returns them: a name, what the
 * user has earned the reader, and the trading volume behind it.
 */
export function referralTopRows() {
  return (summary?.topReferrals ?? []).map((entry) => ({
    key: `${entry.chain}:${entry.username}`,
    name: entry.username,
    value: formatUsd(entry.revenueUsd),
    sub: `${formatUsd(entry.volumeUsd)} volume`
  }));
}

/** The newest commission records, each one a fee a referred trade paid the reader. */
export function referralCommissionRows() {
  const now = Math.floor(Date.now() / 1000);
  return history.map((item, index) => ({
    key: `${item.chain}-${item.timestamp}-${item.fromUser}-${index}`,
    name: item.fromUser,
    value: `+${formatUsd(item.revenueUsd)}`,
    time: ageFromSeconds(Math.max(0, now - (item.timestamp ?? now))),
    timeTitle: fullDateTime(item.timestamp)
  }));
}

export function referralHasMore() {
  return hasMore;
}

async function read(token) {
  loading = true;
  error = "";
  page = 0;
  failedPage = null;
  try {
    const [codeResponse, summaryResponse, historyResponse] = await Promise.all([
      api.GET("/v2/referral/code"),
      api.GET("/v2/referral/commissions/summary"),
      api.GET("/v2/referral/commissions", { params: { query: { page: 0, limit: PAGE_SIZE } } })
    ]);
    // A read that resolves after the session changed belongs to nobody: drop it.
    if (wanted !== token) return;
    loaded = true;
    if (codeResponse.data) code = codeResponse.data;
    if (summaryResponse.data) summary = summaryResponse.data;
    if (historyResponse.data) {
      history = historyResponse.data.data ?? [];
      hasMore = !!historyResponse.data.hasMore;
    }
    // The summary is where the sheet's figures live: without it there is nothing to draw,
    // whatever the other two reads answered.
    if (!summary) error = "Couldn't load your rewards";
  } catch {
    if (wanted === token) error = "Couldn't load your rewards";
  } finally {
    if (wanted === token) loading = false;
  }
}

/**
 * The next page of commission records. The list keeps what it has if the page fails, and that
 * page is not asked for a second time.
 */
export async function loadMoreReferral() {
  const token = wanted;
  const next = page + 1;
  if (!hasMore || !token || next > MAX_PAGES || next === failedPage) return;
  try {
    const { data } = await api.GET("/v2/referral/commissions", {
      params: { query: { page: next, limit: PAGE_SIZE } }
    });
    if (wanted !== token) return;
    if (!data) return;
    const seen = new Set(history.map((item) => `${item.chain}-${item.timestamp}-${item.fromUser}`));
    const more = (data.data ?? []).filter(
      (item) => !seen.has(`${item.chain}-${item.timestamp}-${item.fromUser}`)
    );
    history = [...history, ...more];
    page = next;
    hasMore = !!data.hasMore;
  } catch {
    failedPage = next;
  }
}

function reset() {
  code = null;
  summary = null;
  history = [];
  hasMore = false;
  page = 0;
  failedPage = null;
  error = "";
  loading = false;
  loaded = false;
}

export function reloadReferral() {
  const token = getAuthToken();
  if (!token) return reset();
  wanted = token;
  return read(token);
}

function onVisible() {
  if (document.hidden) return;
  reloadReferral();
}

/**
 * A private frame from the socket: the same `user:{userId}` topic the account module listens
 * on, whose referral events each carry a whole snapshot.
 */
function onUserFrame(event, data) {
  if (!data) return;
  if (event === "REFERRAL_CODE" && typeof data.code === "string") {
    code = data;
    loaded = true;
    error = "";
  } else if (event === "REFERRAL_COMMISSIONS_SUMMARY" && Array.isArray(data.byChain)) {
    summary = data;
    loaded = true;
    error = "";
  }
}

/**
 * Follow the session while the sheet is on screen: read once when there is a token, clear when
 * it goes, and reread on a coarse clock and when the tab comes back — the commission moves on
 * the server, not here.
 */
export function startReferral() {
  if (started) return;
  started = true;

  authOff = onAuthTokenChange((token) => {
    if (token) reloadReferral();
    else {
      wanted = null;
      reset();
    }
  });

  // The local `user` topic: the client routes `user:{userId}` frames to it once the socket has
  // authenticated, and the server pushes them on its own.
  if (!userKey) userKey = subscribe("user", onUserFrame);

  timer = setInterval(() => {
    if (document.hidden) return;
    reloadReferral();
  }, REFRESH_MS);
  document.addEventListener("visibilitychange", onVisible);

  // Signed out there is nothing to read: the accessors stay empty and the sheet says so.
  if (getAuthToken()) reloadReferral();
}

export function stopReferral() {
  started = false;
  if (authOff) {
    authOff();
    authOff = null;
  }
  if (timer) clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
  if (userKey) {
    unsubscribe(userKey);
    userKey = null;
  }
  wanted = null;
  reset();
}
