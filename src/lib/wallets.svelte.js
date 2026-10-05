/**
 * The wallets that are actually in this browser, and signing in with any of them.
 *
 * Reading `window.phantom` / `window.solana` only ever finds the names someone thought to write
 * down: a wallet that injects under its own key, or arrives after the page has drawn, is invisible
 * to it. Solana's Wallet Standard fixes that from the other end — a wallet announces itself to a
 * registry, with its name, its icon and the features it supports — so the list below is whatever is
 * installed, and a wallet released tomorrow shows up without this file changing.
 *
 * What the registry gives us per wallet: `features['standard:connect']` to open it, and, on the
 * account it hands back, `features['solana:signMessage']` to sign the challenge. Both are what
 * `signInWith` in the auth store needs, which is why signing in does not care which wallet it was.
 */
import { getWallets } from "@wallet-standard/app";
import { signInWith } from "./auth.svelte.js";

/** A wallet that can sign a message: what the list shows and what connecting needs. */
function usable(wallet) {
  return Boolean(wallet?.features?.["standard:connect"]?.connect);
}

/** The wallets registered right now, in the order they announced themselves. */
function read() {
  try {
    return getWallets()
      .get()
      .filter(usable);
  } catch {
    return [];
  }
}

/**
 * The list the UI draws. A `$state` array rather than a live registry read, because wallets are
 * allowed to arrive late — an extension injects on its own schedule — and the registry's `on`
 * is what tells us when that happens.
 */
let installed = $state(read());

if (typeof window !== "undefined") {
  try {
    const registry = getWallets();
    const sync = () => {
      installed = read();
    };
    registry.on("register", sync);
    registry.on("unregister", sync);
  } catch {
    /* a browser without the registry keeps the empty list, which is also the truth there */
  }
}

/** What is installed, for a chooser to draw. */
export function installedWallets() {
  return installed;
}

/** The wallet's own icon: the registry hands it over as a data URI. */
export function walletIcon(wallet) {
  return typeof wallet?.icon === "string" ? wallet.icon : null;
}

/** The name the wallet gives itself, for a row's title. */
export function walletName(wallet) {
  return wallet?.name ?? "Wallet";
}

/**
 * Sign in with one of them: open it, take the account it gives, sign the backend's challenge.
 *
 * The account carries its own signing feature, so a wallet that supports several accounts signs
 * with the one it just returned rather than whatever it happens to be on.
 */
export async function connectWithWallet(wallet) {
  const connect = wallet?.features?.["standard:connect"];
  if (!connect?.connect) throw new Error("This wallet cannot connect");

  const { accounts } = await connect.connect();
  const account = accounts?.[0];
  if (!account?.address) throw new Error("This wallet returned no account");

  const signer = account.features?.["solana:signMessage"] ?? wallet.features?.["solana:signMessage"];
  if (!signer?.signMessage) throw new Error("This wallet cannot sign messages");

  await signInWith({
    address: account.address,
    signMessage: async (message) => {
      const [signed] = await signer.signMessage({ account, message });
      if (!signed?.signature) throw new Error("The wallet returned no signature");
      return signed.signature;
    }
  });
}
