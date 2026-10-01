import { api } from "./client.js";
import { ageFromSeconds, formatUsd, shortAddress } from "./token.svelte.js";
import { formatPnlValue } from "./leaderboard.svelte.js";

/**
 * The trader hover card's values.
 *
 * One endpoint carries all of it — `GET /v2/traders/{chain}/{walletAddress}?timeRange=`,
 * the same one Ombra's trader drawer and portfolio modal read (`Ombra
 * trader-analytics/TraderOverviewDrawer.svelte`). Unlike the token card, this one takes a
 * window: the numbers on the row underneath are that window's, so the card has to answer
 * for the same one or the two would contradict each other.
 *
 * The wallet's name, handle and avatar are not in this payload — they are labels — so they
 * come from the row that opened the card.
 */
const TTL_MS = 30_000;

/** The API's windows, as the card should name them. */
const WINDOW_LABEL = {
  ONE_DAY: "24h",
  SEVEN_DAY: "7d",
  THIRTY_DAY: "30d",
  NINETY_DAY: "90d"
};

const POSITIVE = "rgb(33, 201, 94)";
const NEGATIVE = "rgb(255, 98, 46)";

/** @type {Map<string, { at: number, card: object }>} */
const cache = new Map();

let card = $state.raw(null);
let loading = $state(false);
/** The trader the current request belongs to, so a slow one cannot paint over a newer. */
let activeKey = null;

function cardFromOverview(data, identity, timeRange) {
  const stats = data.stats ?? {};
  const pnl = Number(stats.pnlUsd ?? 0);
  const up = !Number.isNaN(pnl) && pnl >= 0;
  const winRate = Number(stats.winRatePct ?? 0);
  const sparkline = (data.pnlSparkline?.pnlUsd ?? []).filter((point) => Number.isFinite(point));

  return {
    href: identity.href ?? `/profile/${data.walletAddress}`,
    name: identity.name ?? shortAddress(data.walletAddress),
    handle: identity.handle ?? `@${shortAddress(data.walletAddress)}`,
    avatar: identity.avatar ?? null,
    /** The capture's own bio, kept only where the capture recorded that trader. */
    bio: identity.bio ?? null,
    portfolio: formatUsd(data.walletBalanceUsdStr),
    pnl: {
      sign: up ? "+" : "-",
      value: formatPnlValue(pnl),
      color: up ? POSITIVE : NEGATIVE
    },
    windowLabel: WINDOW_LABEL[timeRange] ?? "24h",
    winRate: `${winRate.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
    trades: stats.tradeCount ?? 0,
    buys: stats.buyCount ?? 0,
    sells: stats.sellCount ?? 0,
    tokens: stats.uniqueTokensBought ?? 0,
    volume: formatUsd(stats.totalCostUsdStr),
    fees: formatUsd(stats.totalFeesUsdStr),
    lastActive: ageFromSeconds(data.latestSwapAgeSeconds),
    sparkline
  };
}

export function getTraderCard() {
  return card;
}

export function isTraderCardLoading() {
  return loading;
}

export function clearTraderCard() {
  activeKey = null;
  card = null;
  loading = false;
}

/**
 * Fill the card for one trader. A cached value paints at once, a fresh one is fetched;
 * either way only the request that is still current may write.
 *
 * @param {import("../types").UserHoverIdentity} identity
 */
export async function ensureTraderCard(identity) {
  const chain = identity?.chain;
  const wallet = identity?.walletAddress;
  if (!chain || !wallet) {
    clearTraderCard();
    return;
  }
  const timeRange = identity.timeRange ?? "ONE_DAY";
  const key = `${chain}:${wallet}:${timeRange}`;
  activeKey = key;

  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    card = hit.card;
    loading = false;
    return;
  }

  loading = true;
  card = null;
  try {
    const { data, error } = await api.GET("/v2/traders/{chain}/{walletAddress}", {
      params: { path: { chain, walletAddress: wallet }, query: { timeRange } }
    });
    if (activeKey !== key) return;
    // A wallet with no trading in the window answers not-found; that is not an error to
    // report, it is a trader with nothing to show.
    if (error || !data) throw new Error("No trading data for this window");
    const next = cardFromOverview(data, identity, timeRange);
    cache.set(key, { at: Date.now(), card: next });
    card = next;
  } catch {
    if (activeKey !== key) return;
    card = null;
  } finally {
    if (activeKey === key) loading = false;
  }
}
