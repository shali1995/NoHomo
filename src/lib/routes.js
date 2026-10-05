import { defineRoute } from "./router.js";

export const CHAINS = ["solana", "ethereum", "base", "bnb", "robinhood"];

// The capture writes BSC as `bnb` in its token hrefs, so both spellings are accepted
// and `bnb` is what we emit — rows must keep the URLs the capture recorded.
export const API_CHAIN = {
  solana: "SOL",
  ethereum: "ETH",
  base: "BASE",
  bsc: "BSC",
  bnb: "BSC",
  robinhood: "RH"
};

export const CHAIN_SLUG = {
  SOL: "solana",
  ETH: "ethereum",
  BASE: "base",
  BSC: "bnb",
  RH: "robinhood"
};

export function apiChain(slug) {
  if (!slug) return null;
  const normalized = String(slug).toLowerCase();
  if (API_CHAIN[normalized]) return API_CHAIN[normalized];
  const upper = String(slug).toUpperCase();
  return CHAIN_SLUG[upper] ? upper : null;
}

export function chainSlug(chain) {
  if (!chain) return null;
  return CHAIN_SLUG[String(chain).toUpperCase()] ?? String(chain).toLowerCase();
}

defineRoute("/", () => ({ name: "token", params: {} }));
defineRoute("/tokens/:chain/:address", ({ chain, address }) => ({
  name: "token",
  params: { chain, address }
}));
// A profile is a wallet here: our links — the leaderboard rows, the hover cards — carry
// the trader's wallet address, which is what the page reads.
defineRoute("/profile/:wallet", ({ wallet }) => ({ name: "profile", params: { wallet } }));
// The phone end of the mobile connect pairing. Registered before the wallet route, which
// would otherwise read `connect` as a wallet address.
defineRoute("/connect", () => ({ name: "connect", params: {} }));
/** Where the auth backend sends the browser back to with the session in the query. */
defineRoute("/auth/google/callback", () => ({ name: "google", params: {} }));
defineRoute("/:wallet", ({ wallet }) => ({ name: "profile", params: { wallet } }));
