<script>
  // The withdraw sheet: the site's own dialog for taking cash out. All of its
  // captured states are here:
  //   the amount, empty: "$ / Enter amount", the 10/25/50/Max buttons,
  //                      "Available balance $7.72", Continue disabled
  //   an amount over the balance: the same row turns red ("Insufficient balance"),
  //                      and Continue stays disabled
  //   an amount within it: Continue is enabled
  //   the address step, its Recents box still "Loading…"
  //   the address step with one recent address
  //   the chain list open (the same seven chains the deposit sheet lists)
  //   the step after switching to Robinhood Chain
  //   "No recent addresses" and the USDG warning line
  //   a rejected address: "Invalid address"
  // Step, chain, the typed amount, the typed address and which dropdowns are open are
  // state; everything else is the capture's.
  import Close from "../../icons/close.svelte";
  import ArrowLeft from "../../icons/arrow-left.svelte";
  import Usdc from "../../icons/usdc.svelte";
  import Usdg from "../../icons/usdg.svelte";
  import Warning from "../../icons/warning.svelte";
  import ChainSelect from "../wallet/ChainSelect.svelte";
  // inlined from chains.json — no data file, the strings live with the code
  const chainList =   {
    "source": "The seven chains the deposit and withdraw sheets list, in this order.",
    "chains": [
      {
        "key": "solana",
        "label": "Solana",
        "icon": "solana"
      },
      {
        "key": "base",
        "label": "Base",
        "icon": "base"
      },
      {
        "key": "bnb",
        "label": "BNB Chain",
        "icon": "bnb"
      },
      {
        "key": "monad",
        "label": "Monad",
        "icon": "monad"
      },
      {
        "key": "robinhood",
        "label": "Robinhood Chain",
        "icon": "robinhood"
      },
      {
        "key": "arc",
        "label": "Arc",
        "icon": "arc"
      },
      {
        "key": "ethereum",
        "label": "Ethereum",
        "icon": "ethereum-filled"
      }
    ]
  };
  import { accountCashText, accountFiatAsset, accountLoaded, accountWallets, reloadAccount } from "../../lib/api/account.svelte.js";
  import { apiUrl } from "../../lib/api/config.js";
  import {
    getAuthToken,
    signPreparedTransaction,
    walletDiagnostics
  } from "../../lib/auth.svelte.js";
  import { apiChain } from "../../lib/routes.js";
  import { api } from "../../lib/api/client.js";
  import { ageFromSeconds, shortAddress } from "../../lib/api/token.svelte.js";

  /** @type {{ title: string, stepTitle: string, addressTitle: string, availableBalance: string, percents: string[], enterAmountLabel: string, balanceLabel: string, insufficientLabel: string, continueLabel: string, reviewLabel: string, recentsLabel: string, recentsLoading: string, recentsEmpty: string, receive: Record<string, { symbol: string, icon: string, addressPlaceholder: string, recents: { short: string, ago: string, title: string }[], note: string | null }>, invalid: { title: string, text: string } }} */
  // inlined from withdrawSheet.json — no data file, the strings live with the code
  const withdraw =   {
    "source": "The withdraw sheet's nine recorded states: the amount empty, over the balance and within it; the address step with its Recents box loading, with one recent address, with the chain list open, on Robinhood Chain, with no recent addresses, and with an address rejected.",
    "title": "Withdraw",
    "stepTitle": "Withdraw to crypto wallet",
    "addressTitle": "Enter address",
    "availableBalance": "$7.72",
    "percents": [
      "10%",
      "25%",
      "50%",
      "Max"
    ],
    "enterAmountLabel": "Enter amount",
    "balanceLabel": "Available balance",
    "insufficientLabel": "Insufficient balance",
    "continueLabel": "Continue",
    "reviewLabel": "Review",
    "recentsLabel": "Recents",
    "recentsLoading": "Loading…",
    "recentsEmpty": "No recent addresses",
    "receive": {
      "solana": {
        "symbol": "USDC",
        "icon": "usdc",
        "addressPlaceholder": "Solana wallet address",
        "recents": [
          {
            "short": "CanpCc...PvSNo7",
            "ago": "1mo ago",
            "title": "Aug 21, 2026, 2:57 AM"
          }
        ],
        "note": null
      },
      "robinhood": {
        "symbol": "USDG",
        "icon": "usdg",
        "addressPlaceholder": "Robinhood Chain wallet address",
        "recents": [],
        "note": "USDG is different from USDC and isn’t supported everywhere. Confirm your destination address can receive USDG."
      }
    },
    "invalid": {
      "title": "Invalid address",
      "text": "Enter a valid Robinhood Chain address"
    }
  };

  let step = $state("amount");
  let chain = $state("solana");
  let chainOpen = $state(false);

  /** @type {{ onclose: () => void }} */
  let { onclose } = $props();

  // A dismissal closes the topmost layer only, the way the capture's dialog does: the
  // chain list while it is open (it is portalled to <body>, so a click beside it lands
  // on the backdrop, not on the list), the sheet itself otherwise.
  function dismiss() {
    if (chainOpen) {
      chainOpen = false;
      return;
    }
    onclose();
  }

  $effect(() => {
    const onKeydown = (event) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });
  let amount = $state("");
  let address = $state("");
  let addressFocused = $state(false);
  /** the Recents box is still fetching — the capture holds both moments */
  let recentsPending = $state(true);
  let addressInput = $state(null);
  let pendingTimer = 0;

  // The captured "$7.72" is one account's cash; the sheet spends the reader's. The account
  // store answers with the USD stablecoin the session actually holds (`isFiat`), which is
  // the same pot a FIAT buy and a withdrawal both draw on.
  // USDC is a dollar, so the balance the sheet quotes is the asset's own USD value and the
  // amount typed is dollar for dollar what leaves. The symbol rides along so there is no
  // doubt about which pot this is.
  const available = $derived(
    asset ? `${asset.valueUsdStr} ${asset.symbol}` : accountLoaded() ? "$0.00 USDC" : withdraw.availableBalance
  );
  const balance = $derived(Number(String(asset?.valueUsdStr ?? "").replace(/[$,]/g, "")) || 0);
  const active = $derived(withdraw.receive[chain]);
  const chainLabel = $derived(chainList.chains.find((entry) => entry.key === chain)?.label);
  const entered = $derived(amount.trim() ? `$${Number(amount).toFixed(2)}` : "$0.00");
  const typed = $derived(amount.trim() !== "");
  const insufficient = $derived(typed && Number(amount) > balance);
  const amountOk = $derived(typed && Number(amount) > 0 && Number(amount) <= balance);

  // The capture shows the Recents box open while the address input holds focus: it is
  // open right after Continue (so the input takes focus on entry), shut right after
  // the chain list is used, and open again once the input is focused. So the input is
  // focused on entry, and the box follows it.
  const recentsOpen = $derived(step === "address" && addressFocused);

  // Validity: the capture holds one rejected address — "12" on Robinhood Chain — and
  // no accepted one on either chain, so the two rules below are
  // the shapes of the addresses the capture itself carries (a 0x address on Robinhood
  // Chain, base58 on Solana). The capture's own verdict text exists for Robinhood
  // Chain only, so only that chain can show a warning.
  const addressOk = $derived(
    chain === "robinhood"
      ? /^0x[0-9a-fA-F]{40}$/.test(address.trim())
      : /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim())
  );
  const addressRejected = $derived(address.trim() !== "" && !addressOk && chain === "robinhood");

  /**
   * The pot this withdrawal spends: the USD stablecoin of the app wallet on the chosen
   * chain. Everything else in the sheet — the balance it shows, the ceiling it checks, what
   * is sent — is that one asset.
   */
  /**
   * What a withdrawal spends: the USD stablecoin (USDC) of the app wallet on this chain —
   * `isFiat`, the same flag the top bar's `cash` and the deposit note mean by cash, and the
   * asset a FIAT buy spends. Everything is USDC, so the sheet is too: no native fallback, no
   * amount in two units to misread. The address is sent as a token withdrawal, so the
   * backend moves USDC rather than SOL.
   */
  const asset = $derived(accountFiatAsset(apiChain(chain)));
  const walletOnChain = $derived(accountWallets().find((held) => held.chain === apiChain(chain)) ?? null);

  /**
   * Recents: the addresses this wallet has actually paid, newest first, off the same
   * transfers read the profile's history uses (`items[].destinationAddress` on the
   * `outgoing` ones). The capture's single entry is somebody else's address and only a
   * shortened string — clicking it could never fill a valid destination, which is exactly
   * what it did. With nothing sent yet, the capture's own empty line stands.
   */
  let recents = $state.raw([]);
  let recentsLoading = $state(false);

  $effect(() => {
    const from = asset?.walletAddress ?? null;
    const chainKey = asset?.chain ?? null;
    // Only while the address box is on screen: the read is a nicety (the trader index is
    // not always up, and it answers 503 often enough to fill a console), so it is asked for
    // when it is about to be shown and never before.
    if (!from || !chainKey || step !== "address") {
      if (!from || !chainKey) recents = [];
      return;
    }
    let live = true;
    recentsLoading = true;
    api
      .GET("/v2/traders/{chain}/{walletAddress}/transfers", {
        params: { path: { chain: chainKey, walletAddress: from } }
      })
      .then(({ data }) => {
        if (!live) return;
        const seen = new Set();
        const out = [];
        for (const item of data?.items ?? []) {
          if (item.direction !== "outgoing" || !item.destinationAddress) continue;
          if (seen.has(item.destinationAddress)) continue;
          seen.add(item.destinationAddress);
          out.push({
            full: item.destinationAddress,
            short: shortAddress(item.destinationAddress),
            ago: ageFromSeconds(item.blockTime?.ageSeconds)
          });
          if (out.length >= 5) break;
        }
        recents = out;
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

  /**
   * Why the last button can be dark. The backend implements Solana withdrawals only, and a
   * withdrawal spends the chain's USD stablecoin — so a chain the app holds no cash on has
   * nothing to send, and saying so beats a button that never lights up.
   */
  const blocked = $derived(
    !walletOnChain
      ? `Your account has no app wallet on ${chainLabel ?? "this chain"}, so there is nothing to withdraw.`
      : !asset
        ? `No USDC in your ${chainLabel ?? "app"} wallet yet — deposit first, then withdraw.`
        : apiChain(chain) !== "SOL"
          ? "Withdrawals are supported on Solana only."
          : ""
  );

  /** @param {string} value */
  function pickPercent(value) {
    // "Max" is the asset's own decimal text, untouched: the backend takes the amount as
    // exact decimal text, and rounding it here is how a "withdraw everything" leaves dust.
    if (value === "Max" && asset) {
      amount = asset.tokensBalanceStr === asset.valueUsdStr ? asset.tokensBalanceStr : asset.valueUsdStr;
      return;
    }
    const share = (balance * Number(value.replace("%", ""))) / 100;
    amount = share.toFixed(2);
  }

  /**
   * The withdrawal itself, ported from Ombra's `WalletWithdrawModal`: ask the backend to
   * prepare it, sign the opaque `transactionToSign` string in the wallet that is connected,
   * then hand the signature back to be submitted. The amount goes out as a bare decimal
   * literal inside a hand-built JSON body for the same reason "Max" does — exact text, never
   * a JavaScript number.
   */
  let submitting = $state(false);
  let submitError = $state("");
  /** Whether this attempt asked a wallet to sign — the wallet's own wording only fits then. */
  let signedByWallet = $state(false);
  let result = $state(null);
  /** Which of the three calls is in flight, so a failure can name it. */
  let phase = $state("");

  async function submitWithdrawal() {
    const exact = amount.trim();
    if (!asset || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(exact) || !/[1-9]/.test(exact)) {
      submitError = "Enter a valid amount";
      return;
    }
    const token = getAuthToken();
    if (!token) {
      submitError = "Sign in before withdrawing";
      return;
    }

    submitting = true;
    submitError = "";
    signedByWallet = false;
    result = null;
    try {
      phase = "Preparing the withdrawal…";
      const destination = JSON.stringify(address.trim());
      // USDC is an SPL token: the mint goes with the amount so the backend moves the
      // stablecoin and not the chain's native coin.
      const body = `{"chain":${JSON.stringify(asset.chain)},"tokenAddress":${JSON.stringify(asset.tokenAddress)},"amount":${exact},"destinationAddress":${destination}}`;
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
      // The balance the sheet was quoting has just moved; read it again.
      void reloadAccount();
    } catch (e) {
      // The step is named because the three calls fail for different reasons: preparing is
      // the backend refusing, signing is the wallet, confirming is the signature or the
      // transaction. "It did nothing" is not a diagnosis.
      //
      // Phantom's wording only when a wallet was actually asked: a `server` withdrawal never
      // touches one, so its failures are the backend's own words.
      const raw = e instanceof Error ? e.message : String(e);
      const said = signedByWallet ? walletMessage(raw) : raw;
      submitError = `${phase.replace(/…$/, "")} — ${said}`;
      // One line, with the wallet's own state and the raw text: the two failures above are
      // invisible from the sheet alone, and this is what makes the next report actionable.
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

  /**
   * What the wallet said, in words that suggest something. "Could not establish connection.
   * Receiving end does not exist." is the extension's own content script answering for a
   * wallet that is not listening (locked, reloaded, or not injected into this tab) — the
   * withdrawal never reached the chain, so the honest thing is to say so and say what to do.
   */
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

  /** The same hand-built POST Ombra's modal uses: raw JSON text, bearer, nothing wrapped. */
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

  function enterAddressStep() {
    step = "address";
    // the wait the capture caught mid-flight: it is over
    // within half a second there; 400ms stands in for it.
    recentsPending = true;
    clearTimeout(pendingTimer);
    pendingTimer = setTimeout(() => (recentsPending = false), 400);
    requestAnimationFrame(() => addressInput?.focus());
  }
</script>

<!-- the panel the original portals, with its backdrop -->
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
  id="radix-_r_6n_"
  aria-labelledby="radix-_r_6o_"
  data-state="open"
  data-slot="dialog-content"
  class="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] outline-none z-modal"
  tabindex="-1"
  style="pointer-events: {chainOpen ? 'none' : 'auto'};"
  data-aria-hidden={chainOpen ? "true" : undefined}
  aria-hidden={chainOpen ? "true" : undefined}
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
    class="bg-bg-primary/40 backdrop-blur-sm border border-bg-tertiary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 flex flex-col justify-between h-120 w-110 p-3 rounded-3xl"
  >
    <h2 id="radix-_r_6o_" data-slot="dialog-title" class="text-lg leading-none font-semibold sr-only">
      {withdraw.title}
    </h2>

    {#if step === "amount"}
      <!-- step one: how much -->
      <div class="flex flex-col justify-between flex-1">
        <div class="flex flex-col gap-3">
          <div class="text-center py-0.5">{withdraw.stepTitle}</div>
          <div class="p-4 rounded-2xl flex items-center text-[28px] gap-px cursor-text bg-bg-secondary">
            <div class="flex flex-1 min-w-0 items-center gap-px">
              <div class={typed ? "text-text-primary" : "text-text-tertiary"}>$</div>
              <input
                placeholder="0"
                class={typed
                  ? "flex-1 min-w-0 bg-transparent outline-none placeholder:text-text-tertiary text-text-primary"
                  : "flex-1 min-w-0 bg-transparent outline-none placeholder:text-text-tertiary "}
                bind:value={amount}
              />
            </div>
            <div class="shrink-0 text-right">
              <div class="text-sm text-text-tertiary">{withdraw.enterAmountLabel}</div>
            </div>
          </div>
          <div class="flex gap-2">
            {#each withdraw.percents as percent (percent)}
              <button
                class="bg-bg-secondary font-bold rounded-xl py-2 flex-1 min-w-0 hover:bg-bg-tertiary"
                onclick={() => pickPercent(percent)}
              >
                {percent}
              </button>
            {/each}
          </div>
          <div class="flex items-center justify-between px-1">
            {#if insufficient}
              <div class="text-sm text-red">{withdraw.insufficientLabel}</div>
              <div class="text-sm text-red" translate="no">{available}</div>
            {:else}
              <div class="text-sm text-text-secondary">{withdraw.balanceLabel}</div>
              <div class="text-sm" translate="no">{available}</div>
            {/if}
          </div>
        </div>
        {#if blocked}
          <div class="text-xs text-text-tertiary">{blocked}</div>
        {/if}
        <button
          disabled={!amountOk && !blocked}
          class="rounded-xl py-3 bg-accent-primary font-bold disabled:bg-bg-secondary disabled:text-text-secondary"
          onclick={() => (blocked ? (submitError = blocked) : enterAddressStep())}
        >
          {withdraw.continueLabel}
        </button>
        {#if submitError}
          <div class="text-xs text-red">{submitError}</div>
        {/if}
      </div>
    {:else}
      <!-- step two: where it goes -->
      <div class="flex flex-col gap-4 flex-1">
        <div class="flex items-center justify-between self-stretch">
          <button class="p-1 py-1 min-w-0" onclick={() => (step = "amount")}>
            <ArrowLeft class="w-5 h-5 text-text-tertiary" />
          </button>
          <div class="flex flex-col items-center">
            <div>{withdraw.addressTitle}</div>
            <div class="text-sm text-text-secondary" translate="no">Withdrawing {entered}</div>
          </div>
          <div class="w-5 h-5"></div>
        </div>

        <div class="flex-1 justify-between flex flex-col">
          <div class="flex flex-col gap-3">
            <!-- The capture's own Radix-generated ids for this select:
                 the listbox and each option's label span. -->
            <ChainSelect
              chains={chainList.chains}
              bind:value={chain}
              bind:open={chainOpen}
              contentId="radix-_r_6q_"
              optionIds={[
                "radix-_r_72_",
                "radix-_r_73_",
                "radix-_r_74_",
                "radix-_r_75_",
                "radix-_r_76_",
                "radix-_r_77_",
                "radix-_r_78_"
              ]}
            />

            <div class="relative">
              <div class="py-4 px-3 flex items-center gap-px cursor-text border border-transparent focus-within:border-bg-tertiary bg-bg-secondary rounded-xl">
                <div class="flex flex-1 min-w-0 items-center gap-px">
                  <input
                    placeholder={active.addressPlaceholder}
                    class="flex-1 min-w-0 bg-transparent outline-none placeholder:text-text-tertiary text-text-primary text-sm"
                    bind:this={addressInput}
                    bind:value={address}
                    onfocus={() => (addressFocused = true)}
                    onblur={() => (addressFocused = false)}
                  />
                </div>
              </div>

              {#if recentsOpen}
                <div class="absolute left-0 right-0 top-full mt-1 z-10 p-1 rounded-xl bg-bg-secondary flex flex-col border border-bg-tertiary">
                  <div class="text-xs text-text-tertiary py-1.5 px-2 shrink-0">{withdraw.recentsLabel}</div>
                  <div class="flex flex-col min-h-0 max-h-36 overflow-y-auto">
                    {#if recentsPending || recentsLoading}
                      <div class="text-xs text-text-tertiary py-2 px-2">{withdraw.recentsLoading}</div>
                    {:else if recents.length === 0}
                      <div class="text-xs text-text-tertiary py-2 px-2">{withdraw.recentsEmpty}</div>
                    {:else}
                      {#each recents as recent (recent.full)}
                        <button
                          type="button"
                          class="flex group justify-between items-center py-2 px-2 rounded-lg hover:bg-bg-tertiary shrink-0"
                          onclick={() => (address = recent.full)}
                        >
                          <div class="text-xs group-hover:opacity-80">{recent.short}</div>
                          <div class="text-xs text-text-tertiary group-hover:opacity-80">
                            <span translate="no" title={recent.full}>{recent.ago}</span>
                          </div>
                        </button>
                      {/each}
                    {/if}
                  </div>
                </div>
              {/if}
            </div>

            <div class="flex flex-col items-center gap-2 text-center text-sm text-text-tertiary">
              <div class="flex items-center gap-1">
                You’ll receive {active.symbol}{#if active.icon === "usdg"}<Usdg width="16" height="16" />{:else}<Usdc
                    width="16"
                    height="16"
                  />{/if}on {chainLabel}
              </div>
              {#if active.note}
                <p class="max-w-xs text-balance text-xs">{active.note}</p>
              {/if}
            </div>
          </div>

          <div class="flex flex-col gap-4">
            {#if addressRejected}
              <div class="text-sm bg-red-transparent rounded-xl p-3 flex items-start gap-2 justify-center">
                <Warning />
                <div class="flex flex-col flex-1">
                  <div class="text-sm text-red font-bold">{withdraw.invalid.title}</div>
                  <div class="text-text-secondary text-xs">{withdraw.invalid.text}</div>
                </div>
              </div>
            {/if}
            {#if result}
              <div class="text-xs {result.status === "confirmed" ? "text-green" : "text-yellow"}">
                {result.status === "confirmed"
                  ? "Withdrawal confirmed"
                  : `Withdrawal submitted; status: ${result.status || "unknown"}`}: {result.signature}
              </div>
            {/if}
            {#if blocked}
              <div class="text-xs text-text-tertiary">{blocked}</div>
            {/if}
            {#if submitError}
              <div class="text-xs text-red">{submitError}</div>
            {/if}

            <!-- The capture never caught this button enabled — every address state it holds
                 is empty or rejected — but it is the door, so it is wired: it prepares the
                 withdrawal, asks the wallet to sign, and submits it. -->
            <button
              disabled={!addressOk || submitting}
              class="rounded-xl h-11 bg-accent-primary flex items-center justify-center font-bold disabled:bg-bg-secondary disabled:text-text-secondary"
              onclick={() => (blocked ? (submitError = blocked) : submitWithdrawal())}
            >
              {submitting ? phase || "Working…" : "Withdraw"}
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
