<!--
  The phone's cash sheet: what the total-cash row opens.

  It is a TrueSheet in the capture — a scrim over the profile, 36 dp rounded top corners, a
  custom grabber instead of the native one, no close button, and a height that follows its
  content. All of that is here: the scrim dismisses it, the grabber drags it away, Escape
  closes it, and the two doors it can act on are wired to the callbacks its caller passes.

  The figure is the account's own cash (`accountCashText`, the USD stablecoin the app wallet
  holds). The card under it splits that pot the way the capture splits it; only the spot
  half has a source in the API, so the perps half and the row that would move cash between
  them are left out rather than printed as zero. The capture's Send row and its transfer
  history link have no phone destination in this build, so they are left out too.
-->
<script>
  import { accountCashText, accountLoaded } from "../../../lib/api/account.svelte.js";
  import { getCash } from "../../../lib/api/profile.svelte.js";

  let { onclose, ondeposit, onwithdraw } = $props();

  /** A zero is still cash: the sheet stays useful for an account with no stablecoin. */
  const cash = $derived(accountCashText() ?? getCash()?.value ?? (accountLoaded() ? "$0.00" : null));

  /** Drag-to-dismiss: the grabber follows the finger and lets go past 60 dp. */
  let offset = $state(0);
  let dragging = $state(false);
  let startY = 0;

  function pointerdown(event) {
    dragging = true;
    startY = event.clientY;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function pointermove(event) {
    if (!dragging) return;
    offset = Math.max(0, event.clientY - startY);
  }

  function pointerup() {
    if (!dragging) return;
    dragging = false;
    const gone = offset > 60;
    offset = 0;
    if (gone) onclose?.();
  }

  function onkeydown(event) {
    if (event.key === "Escape") onclose?.();
  }
</script>

<svelte:window {onkeydown} />

<div class="scrim" role="presentation" onclick={() => onclose?.()}></div>

<div
  class="sheet"
  role="dialog"
  aria-modal="true"
  aria-label="Total cash"
  style="transform: translateY({offset}px); transition: {dragging ? 'none' : 'transform 160ms ease'}"
>
  <div
    class="grabber"
    role="presentation"
    onpointerdown={pointerdown}
    onpointermove={pointermove}
    onpointerup={pointerup}
    onpointercancel={pointerup}
  >
    <span class="grabber-bar"></span>
  </div>

  <div class="content">
    <p class="title">Total cash</p>
    <p class="total m-num">
      {#if cash}{cash}{:else}<span class="skeleton skeleton--total"></span>{/if}
    </p>

    <div class="breakdown">
      <div class="break-row">
        <span class="break-label">Tokens cash</span>
        <span class="break-value m-num">
          {#if cash}{cash}{:else}<span class="skeleton skeleton--value"></span>{/if}
        </span>
      </div>
    </div>

    <button type="button" class="action" onclick={() => ondeposit?.()}>
      <span class="action-text">
        <span class="action-title">Deposit</span>
        <span class="action-sub">Crypto, to your own wallet address</span>
      </span>
      <svg class="action-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5.5a1 1 0 0 1 1 1V11h2.5a1 1 0 0 1 0 2H13v2.5a1 1 0 0 1-2 0V13H8.5a1 1 0 0 1 0-2H11V8.5a1 1 0 0 1 1-1Z"
        />
      </svg>
    </button>

    <button type="button" class="action" onclick={() => onwithdraw?.()}>
      <span class="action-text">
        <span class="action-title">Withdraw</span>
        <span class="action-sub">Crypto wallet, on Solana</span>
      </span>
      <svg class="action-icon action-icon--lg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fill-rule="evenodd"
          d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5.2 3.9 3.9a1 1 0 0 1-1.4 1.4L13 11v4.4a1 1 0 0 1-2 0V11l-1.5 1.5a1 1 0 0 1-1.4-1.4L12 7.2Z"
        />
      </svg>
    </button>
  </div>
</div>

<style>
  /* The native dim the capture's TrueSheet puts over the screen behind it. */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.5);
  }

  /* Content-tall, so the sheet grows with what it holds the way `detents: [-1]` does. */
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    border: 1px solid var(--m-card);
    border-bottom: 0;
    border-radius: 36px 36px 0 0;
    background: var(--m-bg);
    padding-bottom: env(safe-area-inset-bottom);
    touch-action: none;
  }

  /* 36 x 4.8 dp pill, 17.1 dp below the sheet's top edge. */
  .grabber {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    height: 26.1px;
    padding-top: 17.1px;
    cursor: grab;
  }

  .grabber-bar {
    width: 36px;
    height: 4.8px;
    border-radius: 2.5px;
    background: var(--m-hairline);
  }

  .content {
    display: flex;
    flex-direction: column;
    padding: 12px 24px 24px 24px;
  }

  .title {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
    text-align: center;
  }

  .total {
    margin-top: 3.8px;
    font-size: 28px;
    font-weight: 500;
    line-height: 32.5px;
    color: var(--m-text);
    text-align: center;
  }

  /* The pot split: a hairline card, 8 dp inside, a 12 dp gap between rows. */
  .breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16.5px;
    padding: 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
  }

  .break-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    line-height: 16.5px;
  }

  .break-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .break-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-text);
  }

  /* The doors: 73 dp card-tone rows, 16 dp inside, title over its sub-line. */
  .action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: var(--m-card);
    text-align: left;
  }

  .action + .action {
    margin-top: 12.3px;
  }

  .action-text {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .action-title {
    font-size: 18px;
    font-weight: 500;
    line-height: 21.3px;
    color: var(--m-text);
  }

  .action-sub {
    font-size: 12px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .action-icon {
    flex: 0 0 auto;
    width: 19.7px;
    height: 19.7px;
    color: var(--m-text);
  }

  .action-icon--lg {
    width: 24px;
    height: 24px;
  }

  .skeleton {
    display: inline-block;
    border-radius: 6px;
    background: var(--m-card);
  }

  .skeleton--total {
    width: 96px;
    height: 30px;
    vertical-align: middle;
  }

  .skeleton--value {
    width: 60px;
    height: 14px;
    vertical-align: middle;
  }
</style>
