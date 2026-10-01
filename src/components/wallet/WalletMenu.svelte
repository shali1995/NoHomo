<script>
  // The wallet's hover panel: Deposit and Withdraw, the two doors into the sheets.
  // Ported from the capture, where it hangs under the
  // cash button as `md:absolute md:top-full left-1/2 -translate-x-1/2` — positioned
  // by the classes, not by script, so hovering the wallet is all it takes.
  //
  // Connect Mobile is ours, in the capture's own row: it is the only door to the phone
  // pairing, which the capture has no surface for (its own site keeps it in Settings).
  import WalletDeposit from "../../icons/wallet-deposit.svelte";
  import WalletWithdraw from "../../icons/wallet-withdraw.svelte";
  import Smartphone from "../../icons/smartphone.svelte";

  /** @type {{ onDeposit: () => void, onWithdraw: () => void, onConnectMobile: () => void }} */
  let { onDeposit, onWithdraw, onConnectMobile } = $props();
</script>

<div
  data-orientation="horizontal"
  data-state="open"
  data-slot="navigation-menu-content"
  class="md:absolute md:w-auto md:top-full z-popover left-1/2 -translate-x-1/2"
  dir="ltr"
>
  <div class="p-1 mt-1 rounded-xl border border-bg-tertiary bg-bg-secondary">
    <!-- the double space before hover: is in the capture -->
    <button
      class="flex items-center gap-3 w-36 py-2 px-2  hover:bg-bg-tertiary focus:opacity-50 focus:outline-none rounded-lg"
      onclick={onDeposit}
    >
      <WalletDeposit />
      <div class="text-sm font-medium">Deposit</div>
    </button>
    <button
      class="flex items-center gap-3 w-36 py-2 px-2 hover:bg-bg-tertiary focus:opacity-50 focus:outline-none rounded-lg"
      onclick={onWithdraw}
    >
      <WalletWithdraw />
      <div class="text-sm font-medium">Withdraw</div>
    </button>
    <!-- Connect Mobile is hidden for now; the flow and its sheet are untouched. Un-comment to bring it back. -->
    {#if false}
    <button
      class="flex items-center gap-3 w-36 py-2 px-2 hover:bg-bg-tertiary focus:opacity-50 focus:outline-none rounded-lg"
      onclick={onConnectMobile}
    >
      <Smartphone />
      <div class="text-sm font-medium">Connect Mobile</div>
    </button>
    {/if}
  </div>
</div>
