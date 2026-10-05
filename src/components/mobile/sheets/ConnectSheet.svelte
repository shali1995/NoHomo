<!--
  The phone's door in.

  The desktop sheet's own two questions — which wallet, or Google — asked in the phone's language:
  the deposit sheet's panel (grabber, title over subtitle, rounded top, safe-area foot) with a row
  per door. The list of wallets is Wallet Standard's, so on a phone it is usually empty and Google
  is the door that works; inside a wallet's own browser (Phantom's, Solflare's) that wallet is
  injected like any other and shows up here as a row.
-->
<script>
  import Google from "../../../icons/google.svelte";
  import Smartphone from "../../../icons/smartphone.svelte";
  import WalletDeposit from "../../../icons/wallet-deposit.svelte";
  import { getAuthError, getIsConnecting } from "../../../lib/auth.svelte.js";
  import { startGoogleLogin } from "../../../lib/auth/google.js";
  import { navigate } from "../../../lib/router.js";
  import { connectWithWallet, installedWallets, walletIcon, walletName } from "../../../lib/wallets.svelte.js";

  let { onclose } = $props();

  let localError = $state("");
  const wallets = $derived(installedWallets());

  async function signInWithWallet(wallet) {
    localError = "";
    try {
      await connectWithWallet(wallet);
      onclose?.();
    } catch (error) {
      localError = getAuthError() ?? (error instanceof Error ? error.message : "Connection failed");
    }
  }

  function signInWithGoogle() {
    if (!startGoogleLogin()) localError = "Google sign-in is not configured for this build";
  }
</script>

<div class="overlay">
  <div class="scrim" role="presentation" onclick={() => onclose?.()}></div>
  <div class="sheet" role="dialog" aria-label="Connect">
    <div class="grabber"></div>

    <header class="head">
      <h2 class="head-title">Sign in</h2>
      <p class="head-sub">
        {wallets.length > 0
          ? "Choose a wallet, or use your Google account."
          : "Use your Google account, pair with a desktop, or open this page inside your wallet's own browser."}
      </p>
    </header>

    <div class="list">
      {#each wallets as wallet (wallet.name)}
        <button
          type="button"
          class="door"
          disabled={getIsConnecting()}
          onclick={() => signInWithWallet(wallet)}
        >
          <span class="door-mark">
            {#if walletIcon(wallet)}
              <img src={walletIcon(wallet)} alt="" />
            {:else}
              <WalletDeposit class="w-6 h-6" />
            {/if}
          </span>
          <span class="door-text">
            <span class="door-title">
              {getIsConnecting() ? "Waiting for your wallet…" : walletName(wallet)}
            </span>
            <span class="door-sub">Sign a message to sign in</span>
          </span>
        </button>
      {/each}

      <button type="button" class="door" disabled={getIsConnecting()} onclick={signInWithGoogle}>
        <span class="door-mark"><Google class="w-6 h-6" /></span>
        <span class="door-text">
          <span class="door-title">Google</span>
          <span class="door-sub">Sign in with your Google account</span>
        </span>
      </button>

      <!-- The third door a phone has: take over a session that is already signed in on a desktop. -->
      <button
        type="button"
        class="door"
        disabled={getIsConnecting()}
        onclick={() => {
          onclose?.();
          navigate("/connect");
        }}
      >
        <span class="door-mark"><Smartphone /></span>
        <span class="door-text">
          <span class="door-title">Pair with a desktop</span>
          <span class="door-sub">Scan the QR on a signed-in desktop session</span>
        </span>
      </button>
    </div>

    {#if localError}
      <p class="error">{localError}</p>
    {/if}

    <button type="button" class="cancel" onclick={() => onclose?.()}>Cancel</button>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
    display: flex;
    align-items: flex-end;
  }

  .scrim {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .sheet {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: 100%;
    padding: 12px 17.1px calc(20px + env(safe-area-inset-bottom));
    border-radius: 36px 36px 0 0;
    background: var(--m-bg);
    color: var(--m-text);
  }

  .grabber {
    flex: 0 0 auto;
    width: 36px;
    height: 5px;
    margin: 5px auto 0;
    border-radius: 2.5px;
    background: var(--m-hairline);
  }

  .head {
    flex: 0 0 auto;
    margin-top: 19.2px;
  }

  .head-title {
    font-size: 20px;
    font-weight: 700;
  }

  .head-sub {
    margin-top: 6.9px;
    font-size: 14px;
    line-height: 18px;
    color: var(--m-muted);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 18px;
  }

  /* The deposit sheet's own row: 56 dp, the card's colour, its icon on the left. */
  .door {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 56px;
    padding: 0 16px;
    border-radius: 12px;
    background: var(--m-card);
    text-align: left;
  }

  .door:disabled {
    opacity: 0.6;
  }

  .door-mark {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
  }

  .door-mark :global(img) {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    object-fit: cover;
  }

  .door-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .door-title {
    font-size: 15px;
    font-weight: 700;
  }

  .door-sub {
    font-size: 12px;
    color: var(--m-muted);
  }

  .error {
    margin-top: 12px;
    font-size: 13px;
    color: var(--m-red);
  }

  .cancel {
    flex: 0 0 auto;
    height: 44px;
    margin-top: 10px;
    font-size: 15px;
    font-weight: 700;
    color: var(--m-muted);
  }
</style>
