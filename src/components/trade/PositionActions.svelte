<script>
  // The quick block under a position row: buy chips and sell chips, the panel the ⚡ button
  // opens. The capture only ever caught these disabled (the block was collapsed in every
  // snapshot that holds them), so the disabled dressing is the capture's and the live
  // dressing is the app's own chip: bg-bg-secondary, bold, text-text-primary, hovering to
  // the tertiary surface every other row control uses.
  //
  // Signed out there is nothing to buy or sell, so the block is one door — Connect Wallet, in
  // the same chip — instead of two rows of controls that could not act.
  import { buy, cashAvailable, positionsFor, sell, tradePresets } from "../../lib/api/trade.svelte.js";
  import { getIsLoggedIn, requestConnect } from "../../lib/auth.svelte.js";

  /** @type {{ token: import("../../lib/api/trade.svelte.js").Position }} */
  let { token } = $props();

  // the capture's settings dialog owns both lists
  const presets = $derived(tradePresets());
  const BUY_AMOUNTS = $derived(presets.buy);
  const SELL_PCTS = $derived(presets.sell);

  const held = $derived(positionsFor(token.address).length > 0);
  const cash = $derived(cashAvailable());
  const signedIn = $derived(getIsLoggedIn());

  /** The chip every control in this block wears, enabled and disabled dressing apart. */
  const CHIP = "min-w-0 flex-1 rounded-lg border border-transparent bg-bg-secondary py-2 text-sm font-bold leading-tight transition-colors text-center text-text-primary hover:bg-bg-tertiary";
  const CHIP_DISABLED = `${CHIP} disabled:cursor-not-allowed disabled:text-text-tertiary`;
</script>

<div class="flex flex-col gap-2 pl-3 py-2">
  <div class="flex w-full items-center gap-3">
    <div class="shrink-0 text-sm text-green">Buy</div>
    <div class="flex flex-1 items-center gap-2">
      {#each BUY_AMOUNTS as usd (usd)}
        <button
          type="button"
          disabled={cash < usd || !!token.dipPill}
          class={CHIP_DISABLED}
          onclick={() => buy({ name: token.name, address: token.address, chain: token.chain, usd })}
        >${usd}</button>
      {/each}
    </div>
  </div>

  <div class="flex w-full items-center gap-3">
    <div class="shrink-0 text-sm text-red">Sell</div>
    <div class="flex flex-1 items-center gap-2">
      {#each SELL_PCTS as pct (pct)}
        <button
          type="button"
          disabled={!held}
          class={CHIP_DISABLED}
          onclick={() => sell({ name: token.name, address: token.address, pct })}
        >{pct}%</button>
      {/each}
    </div>
  </div>
</div>
