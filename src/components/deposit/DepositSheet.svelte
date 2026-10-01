<script>
  // The deposit sheet: the site's own dialog for adding cash. The capture holds four
  // states of it, and all four are here:
  //   the method picker: Crypto, or Credit or debit
  //   the Solana address, its QR and the copy button
  //   the chain list open: seven chains, Solana checked
  //   the Robinhood Chain address, after switching
  // Step, chain and whether the chain list is open are state here; the values are the
  // capture's.
  import Close from "../../icons/close.svelte";
  import Copy from "../../icons/copy.svelte";
  import CheckCircle from "../../icons/check-circle.svelte";
  import QrScanner from "../../icons/deposit-crypto.svelte";
  import CreditCard from "../../icons/credit-card.svelte";
  import Usdc from "../../icons/usdc.svelte";
  import ChainSelect from "../wallet/ChainSelect.svelte";
  import ArrowLeft from "../../icons/arrow-left.svelte";
  import Usdg from "../../icons/usdg.svelte";

  /** @type {{ title: string, withLabel: string, cryptoLabel: string, methods: { label: string, note: string, enabled: boolean }[], screens: Record<string, { address: string, qr: string, lines: any[][] }> }} */
  // inlined from depositSheet.json — no data file, the strings live with the code
  const deposit =   {
    "source": "The deposit sheet's four recorded states: the method picker, the Solana address, the chain list open (with the copy button in its done state), and the Robinhood Chain address.",
    "title": "Deposit",
    "withLabel": "Deposit with",
    "cryptoLabel": "Deposit with crypto",
    "methods": [
      {
        "label": "Crypto",
        "note": "Transfer USDC from a crypto wallet",
        "enabled": true
      },
      {
        "label": "Credit or debit",
        "note": "Coming soon!",
        "enabled": false
      }
    ],
    "screens": {
      "solana": {
        "address": "7Y2Q8vpkHB9UbMBykxaywTKKeAvEdVCS8yqd45cceZq5",
        "qr": "solana",
        "lines": [
          [
            {
              "kind": "text",
              "text": "Send any token on the Solana network to this address."
            }
          ],
          [
            {
              "kind": "text",
              "text": "Send "
            },
            {
              "kind": "icon",
              "icon": "usdc"
            },
            {
              "kind": "text",
              "text": " USDC to add to your cash balance."
            }
          ]
        ]
      },
      "robinhood": {
        "address": "0x3f4e127a4BcAa26bd5466Cec19D316804B9d4b81",
        "qr": "robinhood",
        "lines": [
          [
            {
              "kind": "text",
              "text": "Send any token on the Robinhood Chain network to this address."
            }
          ],
          [
            {
              "kind": "text",
              "text": "Deposit at least "
            },
            {
              "kind": "amount",
              "text": "$0.50"
            },
            {
              "kind": "icon",
              "icon": "usdg"
            },
            {
              "kind": "text",
              "text": " USDG to add to your cash balance."
            }
          ]
        ]
      }
    }
  };
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
  import { accountLoaded, accountWallets } from "../../lib/api/account.svelte.js";
  import { apiChain } from "../../lib/routes.js";

  /** @type {{ onclose: () => void }} */
  let { onclose } = $props();

  let step = $state("method");

  /**
   * The deposit lands and the sheet gets out of the way. The wallet's own total is the
   * thing to watch — it counts every asset, so USDC or anything else arriving shows up —
   * and the baseline is taken from the first read that lands, never from the empty state
   * before it: a page that opens with no data yet would otherwise look like a deposit.
   * Ombra keeps the same watch and says "Deposit Detected!" instead of closing; the sheet
   * has nothing left to show once the money is in, so it closes.
   */
  const watchedTotal = $derived(wallet ? wallet.totalValueUsd : null);
  let baseline = null;

  $effect(() => {
    if (!accountLoaded() || watchedTotal === null) return;
    if (step !== "address") return;
    if (baseline === null) {
      baseline = watchedTotal;
      return;
    }
    if (watchedTotal > baseline) {
      baseline = watchedTotal;
      onclose();
    }
  });
  let chain = $state("solana");
  let chainOpen = $state(false);

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
  // The capture's own Radix-generated ids for this select: the listbox
  // and each option's label span.
  const chainOptionIds = [
    "radix-_r_66_",
    "radix-_r_67_",
    "radix-_r_68_",
    "radix-_r_69_",
    "radix-_r_6a_",
    "radix-_r_6b_",
    "radix-_r_6c_"
  ];

  const screen = $derived(deposit.screens[chain] ?? null);

  /**
   * The address on screen is the wallet the app holds for this chain, not the one the
   * capture recorded: `7Y2Q8vpk…` is somebody else's wallet, and a deposit sent there is
   * gone. `apiChain` maps the sheet's chain slugs onto the keys `/v2/user/wallets` uses
   * (`solana` -> `SOL`, `robinhood` -> `RH`). With no wallet on the chain there is no
   * address to show, so the screen falls back to the capture's own empty state.
   */
  const wallet = $derived(accountWallets().find((held) => held.chain === apiChain(chain)) ?? null);
  const address = $derived(wallet?.address ?? null);

  // The QR is drawn from that address, so it always encodes what the line above it says.
  // Its dots are the capture's own near-white (the sheet's QR sits on the panel, not on a
  // white card) and the background stays transparent; a QR reader needs those two colours
  // to be literal, which is the one place a hex belongs in this app.
  let qr = $state("");
  $effect(() => {
    const target = address;
    if (!target) {
      qr = "";
      return;
    }
    let live = true;
    import("qrcode")
      .then((module) =>
        module.toDataURL(target, { width: 200, margin: 1, color: { dark: "#F7F7F7", light: "#00000000" } })
      )
      .then((url) => {
        if (live) qr = url;
      })
      .catch(() => {
        if (live) qr = "";
      });
    return () => {
      live = false;
    };
  });

  // The copy button holds two captured states: the idle copy icon, and the check with
  // the copy turned away right after a click. The capture bounds the wait between
  // ~1.2s and ~2.4s; 2s is what stands in for it.
  let copied = $state(false);
  let copyTimer = 0;

  function copyAddress() {
    navigator.clipboard?.writeText(address ?? "").catch(() => {});
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 2000);
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
  id="radix-_r_5r_"
  aria-labelledby="radix-_r_5s_"
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
    class="bg-bg-primary/40 backdrop-blur-sm rounded-3xl border border-bg-tertiary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 flex flex-col h-120 w-100 p-4 gap-4"
  >
    <h2 id="radix-_r_5s_" data-slot="dialog-title" class="text-lg leading-none font-semibold sr-only">
      Deposit
    </h2>

    {#if step === "method"}
      <!-- step one: how the money comes in -->
      <div class="flex flex-col gap-3 flex-1">
        <div class="text-center py-0.5">Deposit with</div>
        <div class="flex flex-col gap-3">
          <button
            class="rounded-xl p-3 bg-bg-secondary flex justify-between items-center focus:outline-none focus:opacity-80 hover:bg-bg-tertiary"
            onclick={() => (step = "address")}
          >
            <div class="flex flex-col gap-0.5 items-start">
              <div>Crypto</div>
              <div class="text-xs text-text-secondary">Transfer USDC from a crypto wallet</div>
            </div>
            <QrScanner class="w-6 h-6 text-text-primary" />
          </button>
          <button disabled class="disabled:opacity-50 rounded-xl p-3 bg-bg-secondary flex justify-between items-center">
            <div class="flex flex-col gap-0.5 items-start">
              <div class="text-left">Credit or debit</div>
              <div class="text-xs text-text-secondary">Coming soon!</div>
            </div>
            <CreditCard class="w-6 h-6 text-text-primary" />
          </button>
        </div>
      </div>
    {:else}
      <!-- step two: the address to send to, for the selected chain -->
      <div class="flex flex-col gap-3 items-center flex-1">
        <div class="flex items-center justify-between self-stretch">
          <button class="p-1 py-1 min-w-0" onclick={() => (step = "method")}>
            <ArrowLeft />
          </button>
          <div>Deposit with crypto</div>
          <div class="w-5 h-5"></div>
        </div>

        <div class="w-50 shrink-0">
          <ChainSelect
            chains={chainList.chains}
            bind:value={chain}
            bind:open={chainOpen}
            contentId="radix-_r_5u_"
            optionIds={chainOptionIds}
          />
        </div>

        {#if screen || address}
          <!-- The address screen, in the capture's nesting. Each line is segments
               because the second one carries the coin inline, and that coin is not the
               same on both chains: USDC on Solana, USDG on Robinhood Chain (where the
               amount sits in a translate="no" span). The note is the capture's and only
               exists for the chains it recorded; the address and its QR are the app
               wallet's, so they are drawn whenever there is one to draw. -->
          <div class="flex flex-col items-center gap-4">
            {#if screen}
              <div class="flex flex-col gap-1">
                {#each screen.lines as line, lineIndex (lineIndex)}
                  <div class="text-xs text-text-secondary text-center">
                    {#each line as segment, segmentIndex (segmentIndex)}
                      {#if segment.kind === "text"}{segment.text}
                      {:else if segment.kind === "amount"}<span translate="no">{segment.text}</span>
                      {:else if segment.icon === "usdc"}<Usdc class="w-4 h-4 inline-block mb-0.5" />
                      {:else if segment.icon === "usdg"}<Usdg class="w-4 h-4 inline-block mb-0.5" />
                      {/if}
                    {/each}
                  </div>
                {/each}
              </div>
            {/if}

            {#if qr}
              <div class="rounded-2xl p-1 bg-bg-secondary border border-bg-tertiary">
                <div class="w-50 h-50">
                  <img src={qr} alt="Deposit address QR" style="width: 200px; height: 200px;" />
                </div>
              </div>
            {/if}

            {#if address}
            <button
              class="flex gap-2 items-center rounded-xl px-3 py-3 border border-bg-tertiary bg-bg-secondary text-xs max-w-67 hover:bg-bg-tertiary"
              onclick={copyAddress}
            >
              <div class="wrap-anywhere text-left">{address}</div>
              <div class="w-4 h-4 shrink-0 relative flex items-center justify-center">
                <Copy
                  class={copied
                    ? "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-0 scale-0 rotate-90"
                    : "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-100 scale-100 rotate-0"}
                />
                <CheckCircle
                  class={copied
                    ? "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-100 scale-100 rotate-0"
                    : "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-0 scale-0 -rotate-90"}
                />
              </div>
            </button>
            {/if}
          </div>
        {:else}
          <!-- The chain has neither a wallet of yours nor a captured screen: nothing is
               rendered rather than somebody else's address. The dropdown above still
               lists it, as the capture does. -->
        {/if}
      </div>
    {/if}
  </div>
</div>
