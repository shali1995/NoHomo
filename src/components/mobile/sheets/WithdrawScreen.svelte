<!--
  The phone withdraw flow. The capture pushes it over the app as a full screen rather than
  a sheet: no scrim, no corner radius, no grabber, its own back chevron at the top left and
  a footer button flush with the bottom of the window. So it is one screen with four steps
  — method, amount, address, review — and every box in it is the capture's measured dp.

  Every figure is the API's. The balance and the token come from the account store (the
  chain's USD stablecoin, which is what a withdrawal spends), the saved destinations from
  the same transfers read the desktop sheet makes, and the withdrawal itself from the two
  withdraw endpoints plus the signature the connected wallet returns. The capture's other
  two method cards are deliberately absent: "Bank account (US only)" and "Finance apps"
  need rails our API does not have, so offering them would be a dead end.

  The chain row is a picker because the capture draws one, but its list holds only the
  networks this API can actually withdraw on — Solana, and nothing else (the token withdraw
  request accepts chain "SOL" only). The capture's table of chains comes from a build whose
  backend served more of them.
-->
<script>
  import { tick } from "svelte";
  import Warning from "../../../icons/warning.svelte";
  import Usdc from "../../../icons/usdc.svelte";
  import {
    accountFiatAsset,
    accountLoaded,
    accountWallets,
    reloadAccount
  } from "../../../lib/api/account.svelte.js";
  import { api } from "../../../lib/api/client.js";
  import { apiUrl } from "../../../lib/api/config.js";
  import {
    getAuthToken,
    signPreparedTransaction,
    walletDiagnostics
  } from "../../../lib/auth.svelte.js";

  let { onback, onclose } = $props();

  /**
   * The networks this API withdraws on. `/v2/user/wallets/withdraw` takes chain "SOL" and
   * answers 501 for anything else, so the picker lists Solana alone rather than a table of
   * chains a tap cannot deliver.
   */
  const WITHDRAW_CHAINS = [{ chain: "SOL", label: "Solana" }];

  const PERCENTS = ["10%", "25%", "50%", "Max"];
  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0"];

  const chain = WITHDRAW_CHAINS[0];

  let step = $state("method");
  let amount = $state("");
  let typedAddress = $state("");
  /** The saved destination that is selected, as its full address. */
  let picked = $state("");
  let chainOpen = $state(false);

  /**
   * The pot this withdrawal spends: the USD stablecoin of the app wallet on Solana, which is
   * the asset `isFiat` marks and the one the backend moves. Without a session (or without
   * cash) there is no asset, and every figure below says so rather than borrowing one.
   */
  const asset = $derived(accountFiatAsset(chain.chain));
  const wallet = $derived(accountWallets().find((held) => held.chain === chain.chain) ?? null);
  const balance = $derived(Number(String(asset?.valueUsdStr ?? "").replace(/[$,]/g, "")) || 0);
  const funded = $derived(balance > 0);

  const entered = $derived(amount !== "" && Number(amount) > 0);
  const insufficient = $derived(entered && funded && Number(amount) > balance);
  const canContinue = $derived(entered && !insufficient);

  /** `4.139662` -> `$4.14`: the same rounding the capture's header and review carry. */
  const fiat = $derived(`$${Number(amount || 0).toFixed(2)}`);

  const available = $derived(
    asset ? `${asset.valueUsdStr} available` : accountLoaded() ? "$0.00 available" : ""
  );

  const destination = $derived(typedAddress.trim() || picked);
  /** A Solana public key: base58, 32 to 44 characters. */
  const destinationOk = $derived(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(destination));

  const title = $derived(
    step === "method"
      ? "Choose withdraw method"
      : step === "amount"
        ? "Withdraw"
        : step === "address"
          ? `Withdraw ${fiat}`
          : "Review"
  );

  /** `CanpCc4cVg...c1LkPvSNo7` — the capture's own head-and-tail of a Solana address. */
  function shorten(address) {
    if (!address || address.length < 24) return address ?? "";
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  }

  /** `30 days` reads as `1 mo. ago` on the phone, which is the format the capture prints. */
  function ago(seconds) {
    if (seconds === undefined || seconds === null) return "";
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)} mo. ago`;
  }

  /**
   * The destinations this wallet has actually paid, newest first: the outgoing rows of the
   * same transfers read the profile history and the desktop sheet use. The capture's own
   * row is a shortened string that could never fill a valid destination, so the list is the
   * reader's own history and it is read only while the address step is on screen.
   */
  let recents = $state.raw([]);
  let recentsLoading = $state(false);

  $effect(() => {
    const from = wallet?.address ?? null;
    const onChain = chain.chain;
    if (!from || step !== "address") return;
    let live = true;
    recentsLoading = true;
    api
      .GET("/v2/traders/{chain}/{walletAddress}/transfers", {
        params: { path: { chain: onChain, walletAddress: from } }
      })
      .then(({ data }) => {
        if (!live) return;
        const seen = new Set();
        const rows = [];
        for (const item of data?.items ?? []) {
          if (item.direction !== "outgoing" || !item.destinationAddress) continue;
          if (seen.has(item.destinationAddress)) continue;
          seen.add(item.destinationAddress);
          rows.push({
            full: item.destinationAddress,
            short: shorten(item.destinationAddress),
            ago: ago(item.blockTime?.ageSeconds)
          });
          if (rows.length >= 5) break;
        }
        recents = rows;
      })
      .catch(() => {
        if (live) recents = [];
      })
      .finally(() => {
        if (live) recentsLoading = false;
      });
    return () => {
      live = false;
    };
  });

  function goBack() {
    if (chainOpen) {
      chainOpen = false;
      return;
    }
    if (step === "method") {
      onback?.();
      return;
    }
    if (step === "review") step = "address";
    else if (step === "address") step = "amount";
    else step = "method";
  }

  $effect(() => {
    const onKeydown = (event) => {
      if (event.key === "Escape") goBack();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });

  /** The keypad edits a decimal string, six places at most — the precision of the token. */
  function pressKey(key) {
    if (key === "back") {
      amount = amount.slice(0, -1);
      return;
    }
    if (key === ".") {
      if (amount.includes(".")) return;
      amount = amount === "" ? "0." : `${amount}.`;
      return;
    }
    const decimals = amount.split(".")[1];
    if (decimals !== undefined && decimals.length >= 6) return;
    amount = amount === "0" ? key : amount + key;
  }

  /** The chips spend a share of what the account holds; with nothing held they say nothing. */
  function pickPercent(label) {
    if (!asset) return;
    if (label === "Max") {
      // The asset's own decimal text, untouched: the backend takes the amount as exact
      // decimal text, and rounding it here is how "withdraw everything" leaves dust.
      amount =
        asset.tokensBalanceStr === asset.valueUsdStr ? asset.tokensBalanceStr : asset.valueUsdStr;
      return;
    }
    amount = ((balance * Number(label.replace("%", ""))) / 100).toFixed(2);
  }

  async function pasteAddress() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        typedAddress = text.trim();
        picked = "";
      }
    } catch {
      // the browser refused the clipboard read; the field still takes a typed address
    }
  }

  /**
   * The camera the scan button opens, decoded with the same `jsqr` the connect page uses.
   * The capture never shows this overlay, so its chrome is the app's own panels rather than
   * a measured screen; the decode target is the address field.
   */
  let scanOpen = $state(false);
  let scanError = $state("");
  let video = $state(null);
  let canvas = $state(null);
  let stream = null;
  let scanTimer = 0;

  async function openScan() {
    scanOpen = true;
    scanError = "";
    // The video element only exists once the overlay is in the DOM.
    await tick();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      scanTimer = setInterval(readScanFrame, 250);
    } catch {
      scanError = "Camera unavailable";
    }
  }

  function closeScan() {
    clearInterval(scanTimer);
    scanTimer = 0;
    for (const track of stream?.getTracks() ?? []) track.stop();
    stream = null;
    scanOpen = false;
  }

  async function readScanFrame() {
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context || !canvas.width) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const decode = (await import("jsqr")).default;
    const code = decode(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
    if (code?.data) {
      typedAddress = code.data.trim();
      picked = "";
      closeScan();
    }
  }

  $effect(() => () => {
    clearInterval(scanTimer);
    for (const track of stream?.getTracks() ?? []) track.stop();
  });

  /**
   * The withdrawal itself, the desktop sheet's path exactly: ask the backend to prepare it,
   * sign the opaque `transactionToSign` string in the connected wallet, then hand the
   * signature back to be submitted. The amount goes out as a bare decimal literal inside a
   * hand-built JSON body so it reaches the backend as the text that was typed.
   */
  let submitting = $state(false);
  let submitError = $state("");
  let result = $state(null);
  /** Whether this attempt asked a wallet to sign — the wallet's own wording only fits then. */
  let signedByWallet = $state(false);
  let phase = $state("");
  let closeTimer = 0;

  async function submitWithdrawal() {
    const exact = amount.trim();
    if (!asset || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(exact) || !/[1-9]/.test(exact)) {
      submitError = "Enter a valid amount";
      return;
    }
    if (!destinationOk) {
      submitError = "Enter a valid address";
      return;
    }
    const token = getAuthToken();
    if (!token) {
      submitError = "Sign in before withdrawing";
      return;
    }

    submitting = true;
    submitError = "";
    result = null;
    signedByWallet = false;
    try {
      phase = "Preparing the withdrawal…";
      // USDC is an SPL token: the mint goes with the amount so the backend moves the
      // stablecoin and not the chain's native coin.
      const body = `{"chain":${JSON.stringify(asset.chain)},"tokenAddress":${JSON.stringify(asset.tokenAddress)},"amount":${exact},"destinationAddress":${JSON.stringify(destination)}}`;
      const prepared = await post("/v2/user/wallets/withdraw", body);
      /*
       * Who signs it is the backend's call, and it says so in the prepare response:
       * `signatureModel` is `"client"` or `"server"`.
       *
       * `"server"` is a Google account's withdrawal — its wallet is held by the backend, which has
       * the key, so the prepared transaction goes back **unsigned** and the service signs it. Asking
       * a browser wallet for that signature asked the wrong party entirely, which is why a Google
       * reader used to get a Phantom prompt for a key Phantom never had.
       *
       * `"client"` is a wallet session's: the linked wallet signs, exactly as before. Only this
       * branch may ask for a wallet, and the API asks for a signature only in this branch —
       * "send `signature` only when the prepare response has `signatureModel=client`".
       */
      let confirmation = { transactionToSign: prepared.transactionToSign };
      if (prepared.signatureModel === "client") {
        signedByWallet = true;
        phase = "Waiting for Phantom to sign…";
        confirmation = {
          transactionToSign: prepared.transactionToSign,
          signature: (await signPreparedTransaction(prepared.transactionToSign)).signature
        };
      }
      phase = "Submitting the withdrawal…";
      result = await post("/v2/user/wallets/withdraw/confirm", confirmation);
      // The balance this screen was quoting has just moved; read it again.
      void reloadAccount();
      // The flow is over: the money is out, and the app behind shows the new balance.
      closeTimer = setTimeout(() => onclose?.(), 1800);
    } catch (e) {
      /*
       * Phantom's wording only when a wallet was actually asked. A `server` withdrawal never
       * touches one, and its failures are the backend's — an error mentioning an unavailable
       * wallet must not be reworded as Phantom being missing from the browser.
       */
      const raw = e instanceof Error ? e.message : String(e);
      const said = signedByWallet ? walletMessage(raw) : raw;
      submitError = `${phase.replace(/…$/, "")} — ${said}`;
      console.warn("[withdraw] sign failed", {
        step: phase,
        raw: e instanceof Error ? e.message : String(e),
        code: e?.code ?? null,
        ...walletDiagnostics()
      });
    } finally {
      phase = "";
      submitting = false;
    }
  }

  $effect(() => () => clearTimeout(closeTimer));

  /** The same hand-built POST the desktop sheet uses: raw JSON text, bearer, nothing wrapped. */
  async function post(path, body) {
    const token = getAuthToken();
    const response = await fetch(apiUrl(path), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: typeof body === "string" ? body : JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.error === "string"
            ? payload.error
            : "Withdrawal failed";
      throw new Error(message);
    }
    return payload;
  }

  /** What the wallet said, in words that suggest something. */
  function walletMessage(message) {
    if (/Could not establish connection|Receiving end does not exist/i.test(message)) {
      return "Phantom did not answer. Open it (unlock it), reload this page, then try again.";
    }
    if (/user rejected|rejected the request|declined/i.test(message)) {
      return "You rejected the request in Phantom.";
    }
    if (/not available|not installed/i.test(message)) {
      return "Phantom is not available in this browser.";
    }
    return message;
  }

  const status = $derived(
    submitting
      ? phase || "Working…"
      : submitError
        ? submitError
        : result
          ? result.status === "confirmed"
            ? "Withdrawal confirmed"
            : `Withdrawal submitted; status: ${result.status || "unknown"}`
          : ""
  );
</script>

{#snippet solanaMark()}
  <!-- The Solana mark, the three skewed bars of the repo's chain icons, without their plate. -->
  <svg viewBox="3.25 4.11 12.74 11.11" fill="none" aria-hidden="true">
    <path
      d="M5.38047 12.5925C5.45709 12.5069 5.56245 12.457 5.67419 12.457H15.8076C15.9928 12.457 16.0854 12.7066 15.9545 12.8527L13.9527 15.0878C13.8761 15.1734 13.7707 15.2233 13.659 15.2233H3.52555C3.34037 15.2233 3.24779 14.9737 3.37869 14.8276L5.38047 12.5925Z"
      fill="currentColor"
    />
    <path
      d="M5.38047 4.24679C5.46029 4.16123 5.56564 4.11133 5.67419 4.11133H15.8076C15.9928 4.11133 16.0854 4.36086 15.9545 4.50701L13.9527 6.7421C13.8761 6.82766 13.7707 6.87756 13.659 6.87756H3.52555C3.34037 6.87756 3.24779 6.62803 3.37869 6.48188L5.38047 4.24679Z"
      fill="currentColor"
    />
    <path
      d="M13.9527 8.3923C13.8761 8.30674 13.7707 8.25684 13.659 8.25684H3.52555C3.34037 8.25684 3.24779 8.50637 3.37869 8.65252L5.38047 10.8876C5.45709 10.9732 5.56245 11.0231 5.67419 11.0231H15.8076C15.9928 11.0231 16.0854 10.7735 15.9545 10.6274L13.9527 8.3923Z"
      fill="currentColor"
    />
  </svg>
{/snippet}

<div class="root">
  <header class="head" class:head--pad={step === "review"}>
    <button type="button" class="back" aria-label="Back" onclick={goBack}>
      <svg class="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 5.5 8.6 12l6.4 6.5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <h1 class="title">{title}</h1>
  </header>

  {#if step === "method"}
    <!-- No footer button here: the cards are the action. -->
    <div class="method">
      <button type="button" class="card" onclick={() => (step = "amount")}>
        <span class="card-text">
          <span class="card-title">Crypto wallet</span>
          <!-- The coin is the account's own fiat asset (`isFiat`, the pot a withdrawal spends);
               before the account read answers, the fallback is the capture's own word for it. -->
          <span class="card-note">
            Withdraw {asset?.symbol ?? "USDC"} to a supported network
          </span>
        </span>
        <!-- the wallet the capture draws on this card: a card, its flap and its pocket -->
        <svg class="card-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7.2 3.4h8.2a1.5 1.5 0 0 1 0 3H7.2a1.5 1.5 0 0 1 0-3Z" fill="currentColor" />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M5.6 6.4h12.8a3.2 3.2 0 0 1 3.2 3.2v8.8a3.2 3.2 0 0 1-3.2 3.2H5.6a3.2 3.2 0 0 1-3.2-3.2V9.6a3.2 3.2 0 0 1 3.2-3.2Zm5.7 3.4a2.6 2.6 0 0 0 0 5.2h5.8a2.6 2.6 0 0 0 0-5.2h-5.8Zm5.2 1.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  {:else if step === "amount"}
    <div class="amount">
      <div class="display">
        <span class="figure" class:figure--empty={!entered}>${amount || "0"}</span>
      </div>

      <div class="chips">
        {#each PERCENTS as label (label)}
          <button
            type="button"
            class="chip"
            disabled={!funded}
            onclick={() => pickPercent(label)}
          >
            {label}
          </button>
        {/each}
      </div>

      <div class="keypad">
        {#each KEYS as key (key)}
          <button type="button" class="key" onclick={() => pressKey(key)}>{key}</button>
        {/each}
        <button type="button" class="key key--back" aria-label="Delete" onclick={() => pressKey("back")}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9.6 4.5h9.1A2.3 2.3 0 0 1 21 6.8v10.4a2.3 2.3 0 0 1-2.3 2.3H9.6a2.3 2.3 0 0 1-1.7-.8l-5-5.8a2 2 0 0 1 0-2.6l5-5.8a2.3 2.3 0 0 1 1.7-.8Z"
              fill="currentColor"
            />
            <path
              d="m13.4 9.6 5 4.8m0-4.8-5 4.8"
              stroke="var(--m-bg)"
              stroke-width="1.7"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div class="available">
        {#if insufficient}
          <span class="warn">Insufficient balance</span>
        {:else if available}
          <span>{available}</span>
        {:else}
          <span class="skeleton"></span>
        {/if}
      </div>

      <!-- The label names the next step as soon as there is an amount; only the empty page
           asks for one. -->
      <button
        type="button"
        class="footer"
        class:footer--on={canContinue}
        disabled={!canContinue}
        onclick={() => (step = "address")}
      >
        {entered ? "Continue" : "Enter an amount"}
      </button>
    </div>
  {:else if step === "address"}
    <div class="addr">
      <div class="chain-wrap">
        <button type="button" class="chain" aria-expanded={chainOpen} onclick={() => (chainOpen = !chainOpen)}>
          <span class="badge">{@render solanaMark()}</span>
          <span class="chain-label">{chain.label}</span>
          <svg class="expander" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="m7 9 5-5 5 5M7 15l5 5 5-5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>

        {#if chainOpen}
          <div class="chain-list">
            {#each WITHDRAW_CHAINS as entry (entry.chain)}
              <button
                type="button"
                class="chain-option"
                class:chain-option--on={entry.chain === chain.chain}
                onclick={() => (chainOpen = false)}
              >
                <span>{entry.label}</span>
                {#if entry.chain === chain.chain}
                  <svg class="check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="m5 12.5 4.5 4.5L19 7"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="input-row">
        <input
          type="text"
          inputmode="text"
          autocomplete="off"
          autocapitalize="none"
          spellcheck="false"
          maxlength="100"
          placeholder="Enter {chain.label} address"
          bind:value={typedAddress}
          oninput={() => (picked = "")}
        />
        <button type="button" class="paste" onclick={pasteAddress}>Paste</button>
        <button type="button" class="scan" aria-label="Scan a QR code" onclick={openScan}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M17 12v4a1 1 0 0 1-1 1h-4M7 21H5a2 2 0 0 1-2-2v-2M17 8V7M7 17h.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="recents">
        {#if recentsLoading}
          <p class="recents-note">Loading…</p>
        {:else if recents.length === 0}
          <p class="recents-note">No recent addresses</p>
        {:else}
          {#each recents as row (row.full)}
            <button
              type="button"
              class="recent"
              class:recent--on={picked === row.full}
              title={row.full}
              onclick={() => {
                picked = row.full;
                typedAddress = "";
              }}
            >
              <span class="recent-addr">{row.short}</span>
              <span class="recent-age">{row.ago}</span>
            </button>
          {/each}
        {/if}
      </div>

      <div class="callout">
        <!-- The icon's own default class paints it the desktop red; the capture's callout is
             amber, so the colour rides on the element rather than on the class. -->
        <Warning style="width:16px;height:16px;margin-top:1px;flex:0 0 auto;color:var(--m-warn)" />
        <div class="bullets">
          <p class="bullet"><span>•</span><span>Only withdraw to an address you control</span></p>
          <p class="bullet">
            <span>•</span><span>Do not withdraw to Robinhood App, PayPal, Venmo, or Wealthsimple</span>
          </p>
          <p class="bullet"><span>•</span><span>You'll lose access to your funds otherwise</span></p>
          <p class="bullet">
            <span>•</span><span
              >You are sending {chain.label} {asset?.symbol ?? "USDC"}. Please make sure the wallet you are
              sending to accepts {chain.label} {asset?.symbol ?? "USDC"}.</span
            >
          </p>
        </div>
      </div>

      <button
        type="button"
        class="footer"
        class:footer--on={destinationOk}
        disabled={!destinationOk}
        onclick={() => (step = "review")}
      >
        Review
      </button>
    </div>
  {:else}
    <div class="review">
      <div class="amount-block">
        <span class="figure">{fiat}</span>
        <span class="token-row">
          <Usdc style="width:24px;height:24px" />
          {amount}{asset ? ` ${asset.symbol}` : ""}
        </span>
      </div>

      <!-- Only the rows this API can answer: where the money goes, and the one network the
           withdraw endpoint accepts. The capture's `Est. time` and `Fee` are not here —
           the prepare response carries no arrival estimate and no fee figure. -->
      <div class="summary">
        <div class="row">
          <span class="label">To</span>
          <span class="value">{shorten(destination)}</span>
        </div>
        <div class="row">
          <span class="label">Network</span>
          <span class="value"><span class="row-mark">{@render solanaMark()}</span>{chain.label}</span>
        </div>
      </div>

      <div class="cta">
        <button type="button" class="primary" disabled={submitting} onclick={submitWithdrawal}>
          <span class="chip">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m6 17 5-5-5-5M13 17l5-5-5-5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="primary-label">{submitting ? "Withdrawing…" : "Withdraw"}</span>
        </button>
        {#if status}
          <p class="status" class:status--bad={!!submitError} class:status--ok={!submitError && !!result}>
            {status}
          </p>
        {/if}
      </div>
    </div>
  {/if}
</div>

{#if scanOpen}
  <div class="scan-sheet">
    <div class="scan-frame">
      <video bind:this={video} autoplay playsinline muted></video>
      <canvas bind:this={canvas} class="scan-canvas"></canvas>
      {#if scanError}
        <p class="scan-error">{scanError}</p>
      {/if}
    </div>
    <button type="button" class="scan-cancel" onclick={closeScan}>Cancel</button>
  </div>
{/if}

<style>
  /* A pushed screen, not a sheet: it is opaque, it starts at the window's top and its footer
     button ends at the window's bottom, over the app's floating nav bar. */
  .root {
    position: relative;
    z-index: 40;
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    padding-top: calc(36px + env(safe-area-inset-top, 0px));
    background: var(--m-bg);
    color: var(--m-text);
  }

  /* The header row is 24.5 dp on every step, its title centred on the whole width and its
     chevron on the left. The review step pads the row by 16 like the rest of its content. */
  .head {
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    height: 24.5px;
    padding-left: 3.9px;
  }

  .head--pad {
    padding-left: 19.9px;
  }

  .back {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
  }

  .chev {
    width: 22px;
    height: 22px;
    color: var(--m-muted);
    opacity: 0.35;
  }

  .title {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    pointer-events: none;
  }

  /* Step one: the three cards of the capture, cut down to the one this API can serve. */
  .method {
    display: flex;
    flex-direction: column;
    gap: 16.5px;
    margin-top: 24px;
  }

  .card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    height: 74.1px;
    margin: 0 16px;
    padding: 16px;
    border-radius: 16px;
    background: var(--m-card);
    text-align: left;
  }

  .card-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .card-title {
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
  }

  .card-note {
    margin-top: 1.6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    color: var(--m-muted);
  }

  .card-icon {
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    color: var(--m-text);
  }

  /* Step two: the number, the chips, the keypad, the balance and the footer. */
  .amount {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 0;
  }

  .display {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 auto;
    min-height: 0;
  }

  .figure {
    font-size: 52px;
    font-weight: 500;
    line-height: 60.8px;
    white-space: nowrap;
  }

  .figure--empty {
    color: var(--m-dim);
  }

  .chips {
    display: flex;
    gap: 12px;
    margin: 0 24px;
  }

  .chip {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1 1 0;
    height: 37.3px;
    border-radius: 12px;
    background: var(--m-card);
    font-size: 18px;
    font-weight: 700;
    color: var(--m-text);
  }

  /* A share of nothing is not a control: with no balance behind them the chips go quiet. */
  .chip:disabled {
    color: var(--m-dim);
    cursor: default;
  }

  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    margin-top: 24px;
  }

  .key {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    overflow: hidden;
    font-size: 28px;
    font-weight: 500;
  }

  .key--back svg {
    width: 37px;
    height: 38px;
    color: var(--m-text);
  }

  .available {
    display: flex;
    align-items: center;
    height: 18.7px;
    margin: 17px 16px 0;
    font-size: 16px;
    color: var(--m-muted);
  }

  .warn {
    color: var(--m-red);
  }

  .skeleton {
    width: 96px;
    height: 15px;
    border-radius: 6px;
    background: var(--m-card);
  }

  /* The capture's footer button: a hairline shell when it is off, the accent fill with a
     one dp `#6f85ff` rim when it is on. Its bottom edge is the window's. */
  .footer {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    height: 48px;
    margin: 7.4px 16px 0;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
    background: var(--m-card);
    font-size: 16px;
    font-weight: 700;
    color: var(--m-muted);
    text-shadow: -0.3px -0.3px 1px rgba(0, 0, 0, 0.302);
  }

  .footer--on {
    border-color: transparent;
    background:
      linear-gradient(var(--m-blue), var(--m-blue)) padding-box,
      linear-gradient(90deg, #6f85ff, #4662fb) border-box;
    color: var(--m-text);
  }

  /* Step three: network, address, saved destinations, the warning block, the button. */
  .addr {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 16px;
    margin-top: 16px;
    min-height: 0;
  }

  .chain-wrap {
    position: relative;
    flex: 0 0 auto;
    margin: 0 16px;
  }

  .chain {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 56px;
    padding: 16px;
    border-radius: 16px;
    background: var(--m-card);
  }

  .badge {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--m-text);
    color: var(--m-bg);
  }

  .badge svg {
    width: 15px;
    height: 15px;
  }

  .chain-label {
    flex: 1 1 auto;
    font-size: 18px;
    font-weight: 500;
    text-align: left;
  }

  .expander {
    flex: 0 0 auto;
    width: 20px;
    height: 20px;
    color: var(--m-muted);
  }

  /* The picker the capture's chevrons open. Its list holds the chains the withdraw endpoint
     accepts, so it can never offer a network the tap cannot deliver. */
  .chain-list {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
    background: var(--m-card);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .chain-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 8px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
  }

  .chain-option--on {
    color: var(--m-text);
  }

  .check {
    width: 18px;
    height: 18px;
    color: var(--m-blue);
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    height: 61.9px;
    margin: 0 16px;
    padding: 0 12px;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
    background: var(--m-card);
  }

  .input-row input {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    padding: 0 0 0 10px;
    border: 0;
    outline: none;
    background: none;
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
    line-height: 20px;
    color: var(--m-text);
    caret-color: var(--m-blue);
  }

  .input-row input::placeholder {
    color: var(--m-muted);
  }

  .paste {
    flex: 0 0 auto;
    height: 32.5px;
    padding: 0 14px;
    border-radius: 8px;
    background: rgba(203, 208, 235, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.078);
    font-size: 14px;
    font-weight: 500;
    color: var(--m-text);
  }

  .scan {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(203, 208, 235, 0.08);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.078);
  }

  .scan svg {
    width: 16px;
    height: 16px;
    color: var(--m-text);
  }

  /* The growth buffer between the input and the warning: the destinations this wallet has
     paid, or the line that says there are none. */
  .recents {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 4px;
    min-height: 0;
    margin: 0 16px;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .recents::-webkit-scrollbar {
    display: none;
  }

  .recents-note {
    margin: 0;
    padding: 4px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  /* The saved row carries a 1 dp border with no colour of its own (black on the capture's
     near-black page). Selecting it is what turns that border blue. */
  .recent {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex: 0 0 auto;
    height: 57.1px;
    padding: 0 16px;
    border: 1px solid #000;
    border-radius: 12px;
    background: transparent;
  }

  .recent--on {
    border-color: var(--m-blue);
  }

  .recent-addr {
    font-size: 16px;
    font-weight: 500;
    color: var(--m-text);
  }

  .recent-age {
    font-size: 12px;
    font-weight: 500;
    color: var(--m-dim);
  }

  .callout {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex: 0 0 auto;
    margin: 0 16px;
    padding: 12px;
    border: 1px solid var(--m-warn);
    border-radius: 12px;
    color: var(--m-warn);
  }

  .bullets {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 4px;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 17px;
  }

  .bullet {
    display: flex;
    gap: 5.9px;
    margin: 0;
  }

  .addr .footer {
    margin: 0 16px;
  }

  /* Step four: the amount, the summary, and the button the flow commits with. */
  .review {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    gap: 16px;
    margin-top: 16px;
    min-height: 0;
  }

  .amount-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12.3px;
    flex: 1 1 auto;
    min-height: 0;
  }

  .token-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    color: var(--m-muted);
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 0 0 auto;
    margin: 0 16px;
    padding: 12px 16px;
    border: 1px solid var(--m-hairline);
    border-radius: 16px;
    background: var(--m-card);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 20.3px;
  }

  .label {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .value {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;
    line-height: 20px;
    color: var(--m-text);
  }

  .row-mark {
    display: flex;
    align-items: center;
    color: var(--m-muted);
  }

  .row-mark svg {
    width: 16px;
    height: 16px;
  }

  .cta {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex: 0 0 auto;
    height: 329.1px;
    margin: 0 16px;
  }

  .primary {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 56px;
    border: 0.5px solid var(--m-hairline);
    border-radius: 12px;
    background: var(--m-card);
    box-shadow: 0 1px 1.41px rgba(0, 0, 0, 0.2);
    font-size: 18px;
    font-weight: 700;
  }

  .primary .chip {
    position: absolute;
    top: 4.3px;
    left: 4.3px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: 2.5px solid transparent;
    border-radius: 8.5px;
    background:
      linear-gradient(var(--m-blue), var(--m-blue)) padding-box,
      linear-gradient(135deg, #6f85ff, #4662fb) border-box;
  }

  .chip svg {
    width: 24px;
    height: 24px;
    color: #ffffff;
  }

  .primary-label {
    max-width: 50%;
    text-align: center;
  }

  .status {
    margin: 0;
    padding: 0 4px;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    color: var(--m-muted);
  }

  .status--bad {
    color: var(--m-red);
  }

  .status--ok {
    color: var(--m-green);
  }

  /* The scanner the address row opens. Nothing in the capture shows this state, so it is
     the app's own chrome: the camera, and a way out. */
  .scan-sheet {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: rgba(0, 0, 0, 0.9);
  }

  .scan-frame {
    position: relative;
    width: 320px;
    height: 320px;
    overflow: hidden;
    border: 1px solid var(--m-hairline);
    border-radius: 20px;
    background: #000;
  }

  .scan-frame video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .scan-canvas {
    display: none;
  }

  .scan-error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    font-size: 14px;
    color: var(--m-muted);
  }

  .scan-cancel {
    height: 44px;
    padding: 0 24px;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
    background: var(--m-card);
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }
</style>
