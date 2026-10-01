<script>
  // The Transfers history panel: what moved in and out of the wallet, newest first,
  // from src/lib/api/transfers.svelte.js.
  //
  // The capture never opened this panel, so its chrome is the app's own dialog — the one
  // the deposit sheet uses — and its words are fomo's own: Transfers history, Received,
  // Sent, No transfers yet, Failed to load transfers.
  import Skeleton from "../Skeleton.svelte";
  import Close from "../../icons/close.svelte";
  import {
    closeTransfers,
    hasMoreTransfers,
    isTransfersLoading,
    loadMoreTransfers,
    transfersError,
    transfersRetention,
    transfersRows
  } from "../../lib/api/transfers.svelte.js";

  const rows = $derived(transfersRows());
  const loading = $derived(isTransfersLoading());
  const error = $derived(transfersError());
  const retention = $derived(transfersRetention());
  const SKELETON_ROWS = Array.from({ length: 6 }, (_, i) => i);
  const ICON_STYLE = "width: 28px; height: 28px;";

  /** The list pages itself in as it is scrolled to the end. */
  function onScroll(event) {
    if (!hasMoreTransfers()) return;
    const box = event.currentTarget;
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 120) void loadMoreTransfers();
  }
</script>

<div
  data-state="open"
  data-slot="dialog-overlay"
  class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/70 z-modal"
  style="pointer-events: auto;"
  data-aria-hidden="true"
  aria-hidden="true"
  onclick={closeTransfers}
></div>

<div
  role="dialog"
  aria-labelledby="transfers-history-title"
  data-state="open"
  data-slot="dialog-content"
  class="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] outline-none z-modal"
  tabindex="-1"
>
  <button
    type="button"
    data-slot="dialog-close"
    class="glass-round absolute -top-11 right-0 flex size-10 items-center justify-center text-white transition-opacity hover:opacity-80 focus:outline-none"
    onclick={closeTransfers}
  >
    <Close />
    <span class="sr-only">Close</span>
  </button>

  <div
    class="bg-bg-primary/40 backdrop-blur-sm rounded-3xl border border-bg-tertiary flex flex-col h-120 w-100 p-4 gap-3"
  >
    <h2 id="transfers-history-title" class="text-lg leading-none font-semibold sr-only">Transfers history</h2>

    <div class="flex items-center justify-between shrink-0">
      <div class="text-sm font-medium">Transfers history</div>
      {#if retention}<div class="text-xs text-text-tertiary">{retention}</div>{/if}
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto" onscroll={onScroll}>
      {#if error}
        <div class="flex items-center justify-center min-h-15 text-sm text-text-tertiary">{error}</div>
      {:else if loading && rows.length === 0}
        <div class="flex flex-col">
          {#each SKELETON_ROWS as key (key)}
            <div class="flex items-center gap-3 py-2">
              <Skeleton class="rounded-full shrink-0" style={ICON_STYLE} />
              <div class="flex flex-col flex-1 min-w-0 gap-1">
                <Skeleton class="h-3.5 w-32" />
                <Skeleton class="h-3 w-20" />
              </div>
              <Skeleton class="h-3 w-8" />
            </div>
          {/each}
        </div>
      {:else if rows.length === 0}
        <div class="flex items-center justify-center min-h-15 text-sm text-text-tertiary">No transfers yet</div>
      {:else}
        <div class="flex flex-col">
          {#each rows as row (row.key)}
            <div class="flex items-center gap-3 py-2">
              <img class="rounded-full border border-bg-tertiary shrink-0" src={row.img} alt="" style={ICON_STYLE} />
              <div class="flex flex-col flex-1 min-w-0">
                <div class="text-sm truncate">
                  {row.direction} <span class="text-text-secondary" translate="no">{row.amount}</span>
                </div>
                <div class="text-xs text-text-tertiary truncate" translate="no" title={row.counterpartyFull}>{row.counterparty}</div>
              </div>
              <div class="text-xs text-text-tertiary shrink-0" translate="no" title={row.timeTitle}>{row.time}</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
