<script>
  // Trade settings: the presets that fill the trade form, and the gas, slippage and MEV the next
  // buy carries. Ported from the capture.
  // The dialog holds two four-column grids — buy
  // amounts in dollars, sell amounts in percent — a Reset, the polite live region
  // that reports what changed, and a Save that stays disabled until something is
  // edited. The values are the capture's.
  //
  // The gas / slippage / MEV row used to be local state that reached nothing. It now reads and
  // writes the trade store, which is what a buy carries, and Save persists it through the
  // account's trade preset — the slot the API keeps `TradeSettings` in, the way Ombra's panel
  // does (`trade.svelte.ts:579-593`).
  import RotateCcw from "../../icons/rotate-ccw.svelte";

  /** @type {{ title: string, heading: string, description: string, buyLabel: string, sellLabel: string, resetLabel: string, saveLabel: string, buy: string[], sell: string[] }} */
  // inlined from tradeSettings.json — no data file, the strings live with the code
  const tradeSettings =   {
    "source": "The trade settings dialog and its preset values.",
    "title": "Trade settings",
    "heading": "Quick trade presets",
    "description": "Set custom buy and sell amounts to quickly fill the trade form.",
    "buyLabel": "Buy presets",
    "sellLabel": "Sell presets",
    "resetLabel": "Reset",
    "saveLabel": "Save",
    "buy": [
      "10",
      "100",
      "500",
      "1000"
    ],
    "sell": [
      "10",
      "25",
      "50",
      "100"
    ]
  };
  import {
    saveTradeSettings,
    setTradePresets,
    setTradeSettings,
    tradePresets,
    tradeSettings as tradeSettingsNow
  } from "../../lib/api/trade.svelte.js";
  import { addToast } from "../../lib/toast.svelte.js";

  /** The card owns whether the sheet exists; this is how the sheet asks to be taken down. */
  let { onClose = () => {} } = $props();

  let buy = $state(tradePresets().buy.map(String));
  let sell = $state(tradePresets().sell.map(String));
  let edited = $state(false);

  /** The gas, slippage and anti-MEV the store holds — one pair per side, as the spec has them. */
  const settings = $derived(tradeSettingsNow());
  /** What they were when the dialog opened, so Reset can put the trade back where it started. */
  const opened = { ...tradeSettingsNow() };
  /** Drawn straight from the store, so a preset the server sends is what the buttons show. */
  const gasLevel = $derived(settings.buyGas);
  const antiMev = $derived(settings.antiMev);
  /** The `Custom` reveal's own open state; the values it shows are the store's. */
  let picked = $state(modeOf(opened));
  /** The slippage box is text while it is being typed; the store holds a number or `AUTO`. */
  let slippage = $state(slippageText(opened.buySlippagePct));

  /** Which of the three words describes the settings the store holds. */
  function modeOf(current) {
    if (current.buyGas === "AUTO" && current.buySlippagePct === "AUTO" && !current.antiMev) return "Auto";
    if (current.buyGas === "HIGH" && current.buySlippagePct === "AUTO" && !current.antiMev) return "Fast";
    return "Custom";
  }

  /** `AUTO` prints as an empty box with the placeholder, which is how the capture shows it. */
  function slippageText(value) {
    return value === "AUTO" ? "" : String(value);
  }

  // The box follows the store, so a preset read from the server is what it shows.
  $effect(() => {
    slippage = slippageText(settings.buySlippagePct);
  });

  /**
   * One change, written to the store — which is what the next buy carries. A value the spec would
   * reject is refused by the store and said out loud; nothing is dropped in silence.
   */
  function apply(next) {
    const { error } = setTradeSettings(next);
    if (error) {
      addToast("warning", "Trade settings not changed", error, 5000);
      return false;
    }
    edited = true;
    return true;
  }

  /** Auto and Fast are the two named tiers; Custom only opens the reveal, whose values are the
   *  ones already held. */
  function pick(mode) {
    picked = mode;
    if (mode === "Auto") {
      apply({ buyGas: "AUTO", sellGas: "AUTO", buySlippagePct: "AUTO", sellSlippagePct: "AUTO", antiMev: false });
    }
    if (mode === "Fast") {
      apply({ buyGas: "HIGH", sellGas: "HIGH", buySlippagePct: "AUTO", sellSlippagePct: "AUTO", antiMev: false });
    }
  }

  /** The slippage box, on blur or Enter: a percent, or empty for `AUTO`. */
  function commitSlippage() {
    const text = slippage.trim();
    const ok = apply(
      text === ""
        ? { buySlippagePct: "AUTO", sellSlippagePct: "AUTO" }
        : { buySlippagePct: Number(text), sellSlippagePct: Number(text) }
    );
    // a refused value goes back to the one the store holds, so the box never claims it
    if (!ok) slippage = slippageText(settings.buySlippagePct);
  }

  /** Save writes the presets the card's chips read, and persists gas, slippage and MEV through
   *  the account's trade preset. */
  async function save() {
    setTradePresets({ buy: numbers(buy), sell: numbers(sell) });
    const result = await saveTradeSettings();
    if (result.error) {
      addToast("error", "Trade settings not saved", result.error, 6000);
      return;
    }
    edited = false;
    if (result.local) {
      addToast("warning", "Gas, slippage and MEV kept in the app", "Sign in to keep them in a trade preset on your account.", 6000);
    } else {
      addToast("success", "Trade settings saved", `Preset ${result.slot}`, 4000);
    }
  }

  /** Reset puts the dialog back to what it held when it opened — the grids and the trade both. */
  function reset() {
    buy = tradePresets().buy.map(String);
    sell = tradePresets().sell.map(String);
    setTradeSettings(opened);
    picked = modeOf(opened);
    slippage = slippageText(opened.buySlippagePct);
    edited = false;
  }

  /** @param {string[]} list */
  function numbers(list) {
    return list.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
  }

  /** @param {string[]} list @param {number} index @param {string} value */
  function edit(list, index, value) {
    list[index] = value;
    edited = true;
  }

  /** Automatic by default; "Custom" opens the gas level, the slippage and MEV protection. */
  const MODES = ["Auto", "Fast", "Custom"];
  const GASES = ["AUTO", "LOW", "MEDIUM", "HIGH"];
</script>

<!-- Escape closes it, the way a dialog is expected to behave -->
<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") onClose();
  }}
/>

<div
  data-state="open"
  data-slot="dialog-overlay"
  class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/70 z-modal cursor-pointer"
  style="pointer-events: auto;"
  onclick={onClose}
  data-aria-hidden="true"
  aria-hidden="true"
></div>

<div
  role="dialog"
  id="radix-_r_h_"
  aria-labelledby="radix-_r_i_"
  data-state="open"
  data-slot="dialog-content"
  class="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] outline-none z-modal"
  tabindex="-1"
  style="pointer-events: auto;"
>
  <div
    class="bg-bg-primary/40 backdrop-blur-sm rounded-3xl border border-bg-tertiary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 w-[440px] p-4"
  >
    <h2 id="radix-_r_i_" data-slot="dialog-title" class="text-lg leading-none font-semibold sr-only">
      {tradeSettings.title}
    </h2>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-2 text-center">
        <h2 class="font-medium text-text-primary">{tradeSettings.heading}</h2>
        <p class="text-sm text-text-secondary leading-relaxed">{tradeSettings.description}</p>
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="font-medium text-text-primary">{tradeSettings.buyLabel}</span>
          <button
            type="button"
            class="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            onclick={reset}
          >
            <RotateCcw />
            {tradeSettings.resetLabel}
          </button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          {#each buy as value, index (index)}
            <div class="flex-1 flex items-center justify-center rounded-xl bg-bg-secondary px-1 py-2 cursor-text border transition-colors duration-75 border-bg-tertiary">
              <span class="inline-flex items-center text-lg font-bold text-text-primary">
                $
                <input
                  size={Math.max(1, String(value).length)}
                  class="min-w-0 appearance-none border-none bg-transparent text-center text-lg font-bold text-text-primary outline-none"
                  value={value}
                  style="width: {Math.max(1, String(value).length)}ch;"
                  oninput={(event) => edit(buy, index, event.currentTarget.value)}
                />
              </span>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <span class="font-medium text-text-primary">{tradeSettings.sellLabel}</span>
        <div class="grid grid-cols-4 gap-2">
          {#each sell as value, index (index)}
            <div class="flex-1 flex items-center justify-center rounded-xl bg-bg-secondary px-1 py-2 cursor-text border transition-colors duration-75 border-bg-tertiary">
              <span class="inline-flex items-center text-lg font-bold text-text-primary">
                <input
                  size={Math.max(1, String(value).length)}
                  class="min-w-0 appearance-none border-none bg-transparent text-center text-lg font-bold text-text-primary outline-none"
                  value={value}
                  style="width: {Math.max(1, String(value).length)}ch;"
                  oninput={(event) => edit(sell, index, event.currentTarget.value)}
                />
                %
              </span>
            </div>
          {/each}
        </div>
      </div>

      <!-- automatic unless you say otherwise: one row, the label and its choices side by side -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between gap-2">
          <span class="font-medium text-text-primary">Gas &amp; slippage</span>
          <div class="flex items-center gap-1">
            {#each MODES as mode (mode)}
              <button
                type="button"
                class="h-8 rounded-lg px-3 text-sm font-bold transition-colors {picked === mode ? 'bg-bg-tertiary text-text-primary' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}"
                onclick={() => pick(mode)}
              >{mode}</button>
            {/each}
          </div>
        </div>

        {#if picked === "Custom"}
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-text-secondary">Gas</span>
            <div class="flex items-center gap-1">
              {#each GASES as gas (gas)}
                <button
                  type="button"
                  class="h-8 rounded-lg px-3 text-sm font-bold transition-colors {gasLevel === gas ? 'bg-bg-tertiary text-text-primary' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}"
                  onclick={() => apply({ buyGas: gas, sellGas: gas })}
                >{gas === "MEDIUM" ? "Med" : gas === "AUTO" ? "Auto" : gas[0] + gas.slice(1).toLowerCase()}</button>
              {/each}
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm text-text-secondary">Slippage</span>
            <div class="flex items-center gap-1">
              <div class="flex items-center justify-center rounded-xl bg-bg-secondary px-3 py-1.5 border border-bg-tertiary">
                <input
                  class="min-w-0 appearance-none border-none bg-transparent text-center text-sm font-bold text-text-primary outline-none"
                  size={Math.max(4, slippage.length)}
                  placeholder="Auto"
                  bind:value={slippage}
                  onchange={commitSlippage}
                />
                <span class="text-sm text-text-tertiary">%</span>
              </div>
              <button
                type="button"
                class="h-8 rounded-lg px-3 text-sm font-bold transition-colors {antiMev ? 'bg-bg-tertiary text-accent-primary' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}"
                aria-pressed={antiMev}
                onclick={() => apply({ antiMev: !antiMev })}
              >MEV</button>
            </div>
          </div>
        {/if}
      </div>

      <p class="min-h-5 text-sm text-text-secondary invisible" aria-live="polite"></p>

      <button
        type="button"
        disabled={!edited}
        class="px-3 text-center cursor-not-allowed bg-bg-secondary border border-bg-tertiary text-text-secondary w-full rounded-2xl py-4 text-base font-bold transition-colors"
       onclick={save}>
        {tradeSettings.saveLabel}
      </button>
    </div>
  </div>
</div>
