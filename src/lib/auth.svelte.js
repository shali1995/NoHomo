import { API_BASE, API_PROXY } from "./api/config.js";

/** What the wallet says when its channel is down rather than when it refused. */
const TRANSIENT_WALLET = /Could not establish connection|Receiving end does not exist|message port closed|-32603|Unexpected error/i;

const TOKEN_KEY = "ombra_token";
const WALLET_KEY = "ombra_wallet";

const listeners = new Set();
let refreshTimer = null;
let refreshInFlight = null;

/** Which backend origin to talk to, the same rule the API client uses. */
function origin() {
  return API_PROXY ? "" : API_BASE;
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage disabled — the session stays in memory only */
  }
}

// Reactive so the top bar can swap the wallet widget for the connect button: the site
// has one session, and the token in `ombra_token` is it.
let token = $state(read(TOKEN_KEY));
let wallet = $state(read(WALLET_KEY));
let connecting = $state(false);
let error = $state(null);
/**
 * How many times the app has asked for the connect sheet. The sheet is the top bar's own
 * (`connectOpen` / `connectView` live there), so a caller that only wants the door opened —
 * a buy or a sell with no session — raises this and the top bar answers it. A count rather
 * than a flag, so a second ask opens the sheet again after the reader closed the first.
 */
let connectRequests = $state(0);

/** A Solana wallet provider injected into the page (Phantom, and anything compatible). */
function phantom() {
  if (typeof window === "undefined") return null;
  return window.phantom?.solana ?? window.solana ?? null;
}

/**
 * Every injected Solana provider, Phantom first. Another wallet extension can take
 * `window.solana` — and then the calls that go out through it answer with Phantom's own
 * `-32603 Unexpected error` while its account still reads back fine, which looks exactly
 * like a broken signature. Both are tried for that reason.
 */
function walletProviders() {
  if (typeof window === "undefined") return [];
  const seen = new Set();
  const out = [];
  for (const candidate of [window.phantom?.solana, window.solana]) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    out.push(candidate);
  }
  return out;
}

/**
 * The account the wallet is on right now, or null. Read straight from the injected provider
 * so the UI can point at a mismatch before asking for a signature: Phantom answers a
 * sign request for another account with `-32603` and never opens a popup, which is
 * indistinguishable from the app being broken.
 */
export function activeWalletAccount() {
  const provider = phantom();
  try {
    return provider?.publicKey ? provider.publicKey.toString() : null;
  } catch {
    return null;
  }
}

/**
 * What the wallet looks like right now, so a failed signature can be reported with the
 * wallet's own state in it: `isPhantom`, the account it is on, and whether it thinks it is
 * connected. A refusal from the wallet's side says nothing on its own.
 */
export function walletDiagnostics() {
  const provider = phantom();
  let publicKey = null;
  let connected = null;
  try {
    publicKey = provider?.publicKey ? provider.publicKey.toString() : null;
    connected = provider?.isConnected ?? null;
  } catch {
    /* a provider that throws on read is itself the diagnosis */
  }
  return { isPhantom: !!provider?.isPhantom, publicKey, connected };
}

/**
 * Open the wallet and let the reader pick an account. Phantom has no "select account" call,
 * but `connect()` brings its window up with the account it is on, which is the only place
 * the account can be changed — and the withdrawal needs a specific one.
 */
export async function promptWalletAccount() {
  const provider = phantom();
  if (typeof provider?.connect !== "function") return activeWalletAccount();
  try {
    const connected = await provider.connect();
    return connected?.publicKey ? connected.publicKey.toString() : activeWalletAccount();
  } catch {
    return activeWalletAccount();
  }
}

export function isPhantomInstalled() {
  return !!phantom()?.isPhantom;
}

export function getAuthToken() {
  return token;
}

export function getAuthWallet() {
  return wallet;
}

export function getIsLoggedIn() {
  return token !== null;
}

export function getIsConnecting() {
  return connecting;
}

export function getAuthError() {
  return error;
}

/** How many times the connect sheet has been asked for. The top bar watches this. */
export function getConnectRequests() {
  return connectRequests;
}

/** Ask for the connect sheet. The top bar owns it — it opens it on the choice view. */
export function requestConnect() {
  connectRequests += 1;
}

export function onAuthTokenChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) {
    try {
      listener(token);
    } catch {
      /* a broken listener must not break auth */
    }
  }
}

export function parseJwtExp(value) {
  try {
    const payload = value.split(".")[1];
    if (!payload) return 0;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    return typeof json.exp === "number" ? json.exp : 0;
  } catch {
    return 0;
  }
}

function scheduleRefresh(value) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  const exp = parseJwtExp(value);
  if (!exp) return;
  const msUntilRefresh = exp * 1000 - Date.now() - 60_000;
  refreshTimer = setTimeout(
    () => {
      refreshToken();
    },
    Math.max(1_000, msUntilRefresh)
  );
}

export function setAuthToken(next) {
  const changed = token !== next;
  token = next;
  write(TOKEN_KEY, next);
  if (next) scheduleRefresh(next);
  else if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  if (changed) emit();
}

export function setAuthWallet(next) {
  wallet = next;
  write(WALLET_KEY, next);
}

export function refreshToken() {
  if (refreshInFlight) return refreshInFlight;
  const current = token;
  if (!current) return Promise.resolve(null);
  refreshInFlight = fetch(`${origin()}/v2/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${current}` }
  })
    .then(async (response) => {
      if (!response.ok) {
        if (response.status === 401) disconnect();
        else scheduleRefresh(current);
        return null;
      }
      const data = await response.json().catch(() => null);
      const next = data?.token ?? data?.accessToken ?? null;
      if (!next) return null;
      setAuthToken(next);
      return next;
    })
    .catch(() => {
      // A transient network failure keeps the session and retries near-term, rather than
      // logging the user out or waiting for the token to expire.
      refreshTimer = setTimeout(() => refreshToken(), 15_000);
      return null;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * The site's sign-in: the wallet signs the challenge the backend issues, and the backend
 * returns the JWT that is the session. Ported from Ombra's `connectWallet`, including the
 * legacy protocol: `solana_legacy` with the signature base58-encoded, and an empty
 * `challengeId` when the challenge response does not carry one.
 */
export async function connectWallet() {
  const provider = phantom();
  if (!provider?.isPhantom) {
    window.open("https://phantom.app/", "_blank");
    return;
  }

  connecting = true;
  error = null;

  try {
    const connected = await provider.connect();
    const address = connected.publicKey.toString();

    const challengeResponse = await fetch(`${origin()}/v2/auth/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "web3",
        web3: { chain: "SOL", address, signatureProtocol: "solana_legacy" }
      })
    });
    if (!challengeResponse.ok) throw new Error("Failed to get sign-in message");
    const challenge = await challengeResponse.json();

    const message = new TextEncoder().encode(challenge.message);
    const signatureBytes = (await provider.signMessage(message, "utf8")).signature;
    const bs58 = (await import("bs58")).default;
    const signature = bs58.encode(signatureBytes);

    const signinResponse = await fetch(`${origin()}/v2/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "web3",
        web3: {
          chain: "SOL",
          address,
          signatureProtocol: "solana_legacy",
          challengeId: challenge.challengeId ?? "",
          message: challenge.message,
          signature,
          domain: challenge.domain,
          chainId: challenge.chainId
        }
      })
    });

    if (!signinResponse.ok) {
      const body = await signinResponse.json().catch(() => null);
      throw new Error(body?.message ?? "Login failed");
    }

    const data = await signinResponse.json();
    if (!data?.token) throw new Error("Login failed");

    setAuthToken(data.token);
    setAuthWallet(address);
  } catch (e) {
    error = e instanceof Error ? e.message : "Connection failed";
    throw e;
  } finally {
    connecting = false;
  }
}

/**
 * Sign an opaque backend string with the wallet that is connected, hex-encoded — the shape
 * the withdrawal flow wants (sign-in uses base58; this does not). Ported from Ombra's
 * `signConnectedWalletMessageHex`, including the check that the wallet in the extension is
 * still the one that signed in.
 */
export async function signConnectedWalletMessageHex(message) {
  // Ombra's function, line for line (stores/auth.svelte.ts `signConnectedWalletMessageHex`):
  // connect first, check it is the wallet that signed in, sign the exact string the backend
  // prepared, hex-encode the 64 bytes. Nothing is swallowed and nothing is retried here — a
  // refusal from the wallet is the answer, and hiding it is what made this look like a dead
  // button.
  const provider = phantom();
  if (!provider?.isPhantom) throw new Error("Phantom is not available");
  const connected = await provider.connect();
  if (wallet && connected.publicKey.toString() !== wallet) {
    throw new Error("Connect the Solana wallet used to sign in");
  }
  const signature = (await provider.signMessage(new TextEncoder().encode(message), "utf8")).signature;
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signPreparedTransaction(transactionToSign) {
  // Ombra's flow, unchanged: the string the backend prepared is signed as a *message* by the
  // wallet that controls the account, hex-encoded. Nothing else signs it — the managed
  // wallet's key is not in the browser, so there is no transaction to sign and no account to
  // compare against: the reader's wallet authorises the activity, and the backend verifies
  // the signature against the sign-in wallet it knows.
  return { signature: await signConnectedWalletMessageHex(transactionToSign), how: "message" };
}

/**
 * Connect if the wallet is not already in a session. A failure here is dropped on purpose:
 * the signature call that follows reports what the wallet said, and this only exists so the
 * request does not go out without a session, which Phantom answers with a bare `-32603`
 * and no prompt.
 */
async function ensureWalletSession(provider) {
  if (typeof provider.connect !== "function") return;
  try {
    await provider.connect();
  } catch {
    /* the sign call reports it */
  }
}

export function disconnect() {
  const provider = phantom();
  if (provider) {
    try {
      provider.disconnect();
    } catch {
      /* the wallet may already be gone */
    }
  }
  error = null;
  setAuthToken(null);
  setAuthWallet(null);
}

export function initAuth() {
  if (!token) return;
  const exp = parseJwtExp(token);
  if (exp && exp * 1000 - Date.now() < 60_000) refreshToken();
  else scheduleRefresh(token);
}
