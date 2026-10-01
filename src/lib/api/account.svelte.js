import { getAuthToken, getAuthWallet, onAuthTokenChange } from "../auth.svelte.js";
import { avatarUrl } from "./config.js";
import { api } from "./client.js";
import { formatCompact, formatUsd } from "./token.svelte.js";
import { shortAddress } from "./leaderboard.svelte.js";
import { subscribe, unsubscribe } from "../ws/client.js";

/**
 * The signed-in account: the wallets the API holds for you, your profile snapshot and your
 * 24h P&L — the three self-scoped reads Ombra's navbar and its profile page make:
 *   - wallets and per-asset balances — `GET /v2/user/wallets`
 *   - username, photo, rank, level, trade and social counts — `GET /v2/user/profile`
 *   - 24h P&L — `GET /v2/user/pnl?range=24h`
 *
 * The numbers then stay live the way Ombra keeps them: the private `user:{userId}` frames
 * the socket delivers once it is authenticated (`USER_BALANCE` carries a whole wallets
 * response, `USER_PROFILE` the profile snapshot). That is what makes a deposit appear the
 * moment it lands rather than at the next read, so the reads below are the fallback — on
 * sign-in, and on a slow clock in case the socket is down.
 *
 * Nothing here is filled in for a signed-out reader: every getter answers null and the
 * chrome falls back to the capture.
 */

const REFRESH_MS = 60_000;

let wallets = $state.raw(null);
let profile = $state.raw(null);
let pnl = $state.raw(null);
let loading = $state(false);
let loaded = $state(false);
let error = $state("");
/** The token a read belongs to, so a signed-out read cannot paint over the next session. */
let wanted = null;
let timer = null;
let started = false;
let userKey = null;

/**
 * The wallets the application holds for the account, keyed the way the response keys them.
 * Only `appWallets` — the wallets the app manages, which is where the cash sits and where
 * trading happens. The response also carries `connectedWallets`, the external wallet the
 * reader signed in with; Ombra's frontend never reads it (its navbar, the wallet popover and
 * the profile's wallet list all run off `appWallets`), and neither does this: the connected
 * wallet is the reader's identity, not their balance.
 */
function normalize(data) {
  return Object.entries(data?.appWallets ?? {}).map(([chain, wallet]) => ({
    address: wallet.address,
    chain,
    assets: wallet.assets ?? [],
    totalValueUsd: wallet.totalValueUsd ?? 0
  }));
}

/** Every wallet the application manages for the account — Ombra's `getManagedWallets`. */
export function accountWallets() {
  return wallets ?? [];
}

/**
 * What the account is worth, in USD: the managed wallets added up, which is the sum Ombra's
 * navbar makes. (The response's own `totalAssetsUsd` also counts the connected wallet, so it
 * is not this number.)
 */
export function accountTotal() {
  if (!wallets) return null;
  return wallets.reduce((sum, wallet) => sum + wallet.totalValueUsd, 0);
}

/** The wallet the app trades from: Solana's, falling back to the first one it manages. */
export function accountWallet() {
  const held = accountWallets();
  return held.find((wallet) => wallet.chain === "SOL") ?? held[0] ?? null;
}

export function accountTotalText() {
  const total = accountTotal();
  return total === null ? null : formatUsd(total);
}

/**
 * Cash: the USD stablecoin the account holds, which is what fomo's widget calls `cash`.
 * The signed-in wallet is looked at first, then the managed one, then anything holding a
 * stablecoin — the same asset `buyWith: "FIAT"` spends. (Ombra's own profile never reads
 * `isFiat`; the top bar's cash figure is the reason it exists in the response.)
 */
export function accountCash() {
  const held = accountWallets();
  if (!held.length) return null;
  const owner =
    held.find((wallet) => wallet.chain === "SOL" && (wallet.assets ?? []).some((a) => a.isFiat)) ??
    held.find((wallet) => (wallet.assets ?? []).some((a) => a.isFiat)) ??
    null;
  if (!owner) return null;
  const fiat = owner.assets.find((asset) => asset.isFiat);
  return fiat
    ? { valueUsd: fiat.valueUsd ?? 0, symbol: fiat.token?.symbol ?? "USD", text: formatUsd(fiat.valueUsdStr) }
    : null;
}

export function accountCashText() {
  return accountCash()?.text ?? null;
}

/**
 * The USD stablecoin of the app wallet on one chain — the asset a withdrawal spends and the
 * one a deposit tops up. Carries the token's own decimal text, because a withdrawal amount
 * has to reach the backend exactly as it was written (a round trip through `Number` is what
 * Ombra's modal avoids).
 */
export function accountFiatAsset(chain) {
  const held = accountWallets().find((wallet) => wallet.chain === chain);
  const fiat = held ? (held.assets ?? []).find((asset) => asset.isFiat) : null;
  if (!fiat) return null;
  return {
    chain,
    walletAddress: held.address,
    tokenAddress: fiat.token?.address ?? null,
    symbol: fiat.token?.symbol ?? "USD",
    tokensBalanceStr: fiat.tokensBalanceStr ?? "0",
    valueUsdStr: fiat.valueUsdStr ?? "0"
  };
}

export function accountProfile() {
  return profile;
}

/** `Dw3LY8…PNb1` of the wallet that signed in, for when there is no username yet. */
export function accountName() {
  const wallet = getAuthWallet() ?? "";
  if (profile?.hasUsername && profile.username) return profile.username;
  return wallet ? shortAddress(wallet) : "";
}

/** The account's profile photo, if it has one. */
export function accountAvatar() {
  return profile?.photoId ? avatarUrl(profile.photoId) : null;
}

/**
 * The 24h P&L, the figure under the total in the wallet widget. `null` until the read
 * lands, so the widget can keep what it had rather than print a zero it did not measure.
 */
export function accountPnl24h() {
  if (!pnl?.totals) return null;
  const value = Number(pnl.totals.totalPnlUsd) || 0;
  return { value, text: value === 0 ? "$0" : `$${formatCompact(Math.abs(value))}`, up: value >= 0 };
}

export function accountLoading() {
  return loading;
}

/** Whether a read has resolved for this session: until then the chrome keeps the capture. */
export function accountLoaded() {
  return loaded;
}

export function accountError() {
  return error;
}

async function read(token) {
  loading = true;
  error = "";
  try {
    const [walletsResponse, profileResponse, pnlResponse] = await Promise.all([
      api.GET("/v2/user/wallets"),
      api.GET("/v2/user/profile"),
      api.GET("/v2/user/pnl", { params: { query: { range: "24h" } } })
    ]);
    // A read that resolves after the session changed belongs to nobody: drop it.
    if (wanted !== token) return;
    loaded = true;
    if (walletsResponse.data) wallets = normalize(walletsResponse.data);
    if (profileResponse.data) profile = profileResponse.data;
    if (pnlResponse.data) pnl = pnlResponse.data;
    if (walletsResponse.error && profileResponse.error) {
      error = "Could not read your account";
    }
  } catch (e) {
    if (wanted === token) error = e instanceof Error ? e.message : "Could not read your account";
  } finally {
    if (wanted === token) loading = false;
  }
}

function reset() {
  wallets = null;
  profile = null;
  pnl = null;
  error = "";
  loading = false;
  loaded = false;
}

/**
 * A private frame from the socket. The socket hands these to whoever subscribed to the
 * local `user` topic, which is exactly what Ombra's profile page listens on; the payloads
 * are whole snapshots, so they replace what a read would have written.
 */
function onUserEvent(event, data) {
  if (!data) return;
  if (event === "USER_BALANCE" && data.wallets) {
    wallets = normalize(data.wallets);
    loaded = true;
    error = "";
  } else if (event === "USER_PROFILE" && typeof data.id === "string") {
    profile = data;
    loaded = true;
  } else if (event === "USER_PNL" && data.totals) {
    pnl = data;
  }
}

export function reloadAccount() {
  const token = getAuthToken();
  if (!token) return reset();
  wanted = token;
  return read(token);
}

/**
 * Follow the session: read once when there is a token, clear when it goes, and reread on a
 * coarse clock and when the tab comes back — the numbers move on the server, not here.
 */
export function startAccount() {
  if (started) return;
  started = true;

  onAuthTokenChange((token) => {
    if (token) reloadAccount();
    else {
      wanted = null;
      reset();
    }
  });

  // The local `user` topic: the client routes `user:{userId}` frames to it once the socket
  // has authenticated, and the server pushes them on its own.
  if (!userKey) userKey = subscribe("user", onUserEvent);

  const tick = () => {
    if (document.hidden) return;
    reloadAccount();
  };
  timer = setInterval(tick, REFRESH_MS);
  const onVisible = () => {
    if (!document.hidden) reloadAccount();
  };
  document.addEventListener("visibilitychange", onVisible);

  if (getAuthToken()) reloadAccount();
}

export function stopAccount() {
  started = false;
  if (timer) clearInterval(timer);
  timer = null;
  if (userKey) {
    unsubscribe(userKey);
    userKey = null;
  }
  reset();
}

// The account is one per app, not per component: the top bar and the profile header both
// read it, and the app mounts once. So it starts itself on import rather than waiting for a
// component to remember — an effect that forgot left the widget on the capture's numbers.
if (typeof window !== "undefined") startAccount();
