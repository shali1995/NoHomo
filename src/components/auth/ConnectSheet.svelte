<script>
  // The connect flow. The capture holds no logged-out state — its top bar always shows
  // the wallet widget — so this sheet is built from fomo's own vocabulary rather than
  // copied: the dialog chrome of the deposit and withdraw sheets (backdrop, blurred
  // rounded panel, the round X above it) and their row and type classes.
  //
  // Two doors, and they are not interchangeable:
  //   · Wallet — Phantom signs the challenge the backend issues. This is the sign-in.
  //   · Phone — the desktop shows a QR that a phone scans to take over this session, so
  //     the pairing can only be started once there *is* a session (the endpoint wants the
  //     desktop's own token). Ported from Ombra's `MobileConnectModal`.
  import Close from "../../icons/close.svelte";
  import WalletDeposit from "../../icons/wallet-deposit.svelte";
  import Smartphone from "../../icons/smartphone.svelte";
  import RotateCcw from "../../icons/rotate-ccw.svelte";
  import CheckCircle from "../../icons/check-circle.svelte";
  import { api } from "../../lib/api/client.js";
  import {
    connectWallet,
    getAuthToken,
    getAuthError,
    getIsConnecting,
    getIsLoggedIn,
    isPhantomInstalled
  } from "../../lib/auth.svelte.js";

  /** @type {{ onclose: () => void, view?: "choose" | "qr" }} */
  let { onclose, view = "choose" } = $props();

  let localError = $state("");
  // The door the sheet opened on — the caller's choice until the sheet itself moves it
  // (the QR's Back), which is why this is a state of its own rather than a copy.
  let chosen = $state(null);
  const step = $derived(chosen ?? view);
  // The pairing's own lifecycle, the five states Ombra's modal carries.
  let pairing = $state("idle");
  let pairingId = $state("");
  let qr = $state("");
  let countdown = $state(0);
  let pairingError = $state("");
  let pollTimer = null;
  let countdownTimer = null;

  const loggedIn = $derived(getIsLoggedIn());
  const installing = $derived(!isPhantomInstalled());

  function stopTimers() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function close() {
    stopTimers();
    onclose();
  }

  /** Dismiss the topmost layer only: the QR leaves first, the sheet on the second click. */
  function dismiss() {
    if (step === "qr" && view === "choose") {
      stopTimers();
      chosen = "choose";
      pairing = "idle";
      return;
    }
    close();
  }

  $effect(() => {
    const onKeydown = (event) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });

  $effect(() => () => stopTimers());

  async function startPairing() {
    const token = getAuthToken();
    if (!token) return;

    stopTimers();
    pairing = "loading";
    pairingError = "";

    try {
      const { data, error } = await api.POST("/v2/auth/mobile-connect", { body: { token } });
      if (error || !data?.pairingId) {
        throw new Error(error?.message ?? "Failed to create pairing");
      }

      pairingId = data.pairingId;
      const QRCode = await import("qrcode");
      qr = await QRCode.toDataURL(JSON.stringify({ v: 1, id: data.pairingId, s: data.pairingSecret }), {
        width: 280,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" }
      });

      countdown = data.expiresInSecs;
      pairing = "showing";

      countdownTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          stopTimers();
          pairing = "expired";
        }
      }, 1000);

      const deadline = Date.now() + data.expiresInSecs * 1000;
      pollTimer = setInterval(async () => {
        if (Date.now() > deadline) {
          stopTimers();
          pairing = "expired";
          return;
        }
        const status = await api.GET("/v2/auth/mobile-connect/{pairingId}/status", {
          params: { path: { pairingId } }
        });
        const state = status.data?.status;
        if (state === "CLAIMED") {
          stopTimers();
          pairing = "claimed";
        } else if (state === "EXPIRED") {
          stopTimers();
          pairing = "expired";
        }
      }, 2000);
    } catch (e) {
      pairingError = e instanceof Error ? e.message : "Failed to create pairing";
      pairing = "error";
    }
  }

  function openPhone() {
    chosen = "qr";
    if (pairing === "idle" || pairing === "error" || pairing === "expired") startPairing();
  }

  async function signIn() {
    if (installing) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    localError = "";
    try {
      await connectWallet();
      close();
    } catch {
      localError = getAuthError() ?? "Connection failed";
    }
  }
</script>

<!-- the panel the sheets portal, with its backdrop -->
<div
  data-state="open"
  data-slot="dialog-overlay"
  class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/70 z-modal"
  style="pointer-events: auto;"
  data-aria-hidden="true"
  aria-hidden="true"
  role="presentation"
  onclick={dismiss}
></div>

<div
  role="dialog"
  data-state="open"
  data-slot="dialog-content"
  class="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] outline-none z-modal"
  tabindex="-1"
>
  <button
    type="button"
    data-slot="dialog-close"
    class="glass-round absolute -top-11 right-0 flex size-10 items-center justify-center text-white transition-opacity hover:opacity-80 focus:outline-none"
    onclick={dismiss}
  >
    <Close />
    <span class="sr-only">Close</span>
  </button>

  <div
    class="bg-bg-primary/40 backdrop-blur-sm rounded-3xl border border-bg-tertiary flex flex-col gap-4 p-4 h-120 w-100"
  >
    <div class="flex items-center gap-2">
      <div class="text-lg leading-none font-semibold">
        {step === "qr" ? "Connect a phone" : "Connect"}
      </div>
    </div>

    {#if step === "choose"}
      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="flex items-center gap-3 w-full rounded-xl border border-bg-tertiary bg-bg-secondary px-3 py-3 text-left hover:bg-bg-tertiary disabled:opacity-60"
          onclick={signIn}
          disabled={getIsConnecting()}
        >
          <WalletDeposit />
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <div class="text-sm font-medium">
              {#if getIsConnecting()}
                Waiting for Phantom…
              {:else if installing}
                Install Phantom
              {:else}
                Connect Wallet
              {/if}
            </div>
            <div class="text-xs text-text-tertiary">
              {#if installing}
                Phantom isn't installed in this browser
              {:else}
                Sign a message with Phantom to sign in
              {/if}
            </div>
          </div>
          {#if installing}
            <div class="text-accent-primary text-xs font-bold">Get it</div>
          {/if}
        </button>

        <button
          type="button"
          class="flex items-center gap-3 w-full rounded-xl border border-bg-tertiary bg-bg-secondary px-3 py-3 text-left hover:bg-bg-tertiary disabled:opacity-60"
          onclick={openPhone}
          disabled={!loggedIn}
        >
          <Smartphone />
          <div class="flex flex-col gap-0.5 min-w-0 flex-1">
            <div class="text-sm font-medium">Connect a phone</div>
            <div class="text-xs text-text-tertiary">
              {#if loggedIn}
                Show a QR for your phone to scan
              {:else}
                Sign in first — the QR hands this session to your phone
              {/if}
            </div>
          </div>
        </button>
      </div>

      {#if localError}
        <div class="text-xs text-red">{localError}</div>
      {/if}
    {:else}
      <div class="flex flex-1 flex-col items-center justify-center gap-4">
        {#if pairing === "loading"}
          <div class="size-6 animate-spin rounded-full border-2 border-bg-tertiary" style="border-top-color: var(--color-text-primary)"></div>
          <div class="text-xs text-text-secondary">Generating QR code…</div>
        {:else if pairing === "showing"}
          <div class="rounded-xl border border-bg-tertiary bg-white p-3">
            <img src={qr} alt="Mobile connect QR" style="width: 280px; height: 280px;" />
          </div>
          <div class="text-xs text-text-secondary">
            Expires in <span class="tabular-nums {countdown <= 30 ? 'text-yellow' : 'text-text-primary'}">
              {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
            </span>
          </div>
          <div class="text-center text-xs text-text-tertiary">
            Scan this with your phone's camera to connect it to this session
          </div>
        {:else if pairing === "claimed"}
          <CheckCircle class="w-8 h-8 text-green" />
          <div class="text-sm font-semibold">Connected</div>
          <div class="text-xs text-text-secondary">Your phone is now linked to this session</div>
          <button type="button" class="text-accent-primary text-xs font-bold hover:opacity-80" onclick={close}>Done</button>
        {:else if pairing === "expired"}
          <div class="text-sm font-semibold">QR code expired</div>
          <div class="text-xs text-text-secondary">The pairing window has closed</div>
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-secondary px-3 py-2 text-xs font-medium hover:bg-bg-tertiary"
            onclick={startPairing}
          >
            <RotateCcw class="w-4 h-4" />
            Generate a new code
          </button>
        {:else}
          <div class="text-xs text-red">{pairingError}</div>
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-secondary px-3 py-2 text-xs font-medium hover:bg-bg-tertiary"
            onclick={startPairing}
          >
            <RotateCcw class="w-4 h-4" />
            Retry
          </button>
        {/if}
      </div>

      {#if view === "choose"}
        <button type="button" class="text-xs text-text-tertiary hover:text-text-primary self-start" onclick={dismiss}>
          Back
        </button>
      {/if}
    {/if}
  </div>
</div>
