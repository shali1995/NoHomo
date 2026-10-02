<!--
  The phone's rewards sheet: what the profile header's Rewards pill opens.

  The capture never opened the Rewards destination — its own notes say so — so the frame here
  is the app's sheet, the one CashSheet and DepositSheet draw: the dim scrim, the 36 dp top
  corners with their #12111A hairline, the custom 36 x 4.8 dp grabber 17.1 dp below the top
  edge, the 24 dp side gutters, drag-to-dismiss and Escape to close. The content inside it is
  the capture's sheet language too: a muted centred title over a 28 dp hero, an outlined r12
  card, an r16 action row with its title over a sub-line and a trailing icon, and a centred
  #4662FB link.

  Every figure is drawn from src/lib/api/referral.svelte.js, which reads the three referral
  endpoints this build does have: the reader's own code (`GET /v2/referral/code`), the
  commission summary (`GET /v2/referral/commissions/summary`) and the newest commission
  records (`GET /v2/referral/commissions`). The hero is `totalRevenueUsdStr`; the card under it
  is the fee rates from `feeRates`; the code row is `code` plus an honest read of `isUsername`;
  the two lists are `topReferrals` and the commission page. Nothing in the sheet is counted,
  named or rounded here — the module formats, and this draws.

  What the API cannot put a unit on is left out rather than guessed at: `withdrawableBalances`
  and `cashbackAvailable` are amounts in a token their responses do not name, and the write
  endpoints behind a withdrawal all return a signed coupon to redeem on chain, which is not a
  flow the phone has. Those are the module's own notes.

  Signed out the referral reads answer "Missing credentials", so the sheet asks for nothing and
  shows the capture's empty state — 48 dp of centred muted text — instead of zeroes pretending
  to be earnings. The pill that opens it is never inert: it always reaches this sheet, and this
  sheet always says which of the two states it is in.
-->
<script>
  import { navigate } from "../../../lib/router.js";
  import Copy from "../../../icons/copy.svelte";
  import {
    loadMoreReferral,
    referralChainRows,
    referralCode,
    referralCodeIsUsername,
    referralCommissionRows,
    referralError,
    referralHasMore,
    referralLoaded,
    referralRateRows,
    referralSignedIn,
    referralTopRows,
    referralTotalText,
    startReferral,
    stopReferral
  } from "../../../lib/api/referral.svelte.js";

  /** @type {{ onclose: () => void }} */
  let { onclose } = $props();

  // The reads and the live `user` frames live while the sheet is on screen, the way the
  // profile screen keeps its own wallet's reads alive for as long as it is mounted.
  $effect(() => {
    startReferral();
    return () => stopReferral();
  });

  const signedIn = $derived(referralSignedIn());
  const loaded = $derived(referralLoaded());
  const error = $derived(referralError());
  const total = $derived(referralTotalText());
  const rateRows = $derived(referralRateRows());
  const chainRows = $derived(referralChainRows());
  const topRows = $derived(referralTopRows());
  const commissionRows = $derived(referralCommissionRows());
  const hasMore = $derived(referralHasMore());
  const code = $derived(referralCode());

  /** The API says which form the code takes; both lines say only that. */
  const codeNote = $derived(
    referralCodeIsUsername() ? "Your username is your referral code" : "Your generated referral code"
  );

  /**
   * The split by chain is drawn only when there is more than one chain to split: the program
   * runs on Solana alone today, so a single row would only repeat the hero above it.
   */
  const showChains = $derived(chainRows.length > 1);

  let copied = $state(false);
  let copyTimer = 0;

  /** Copies the code the sheet is showing, and says so only when the clipboard took it. */
  async function copyCode() {
    if (!code || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 1500);
  }

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
  aria-label="Rewards"
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

  <div class="content m-scroll">
    <p class="title">Rewards</p>

    {#if !signedIn}
      <p class="empty">Sign in to see your rewards</p>
      <!-- The phone's one way in: `/connect` is the QR pairing page, and the deposit sheet
           offers the same door. Without it a signed-out reader has no way forward here. -->
      <button type="button" class="pair" onclick={() => navigate("/connect")}>Scan the QR code</button>
    {:else if error && !total}
      <p class="empty">{error}</p>
    {:else if !loaded || !total}
      <p class="total"><span class="skeleton skeleton--total"></span></p>
    {:else}
      <p class="total m-num">{total}</p>
      <p class="sub">Referral commissions earned</p>

      {#if rateRows.length}
        <div class="card">
          {#each rateRows as row (row.key)}
            <div class="card-row">
              <span class="card-label">{row.label}</span>
              <span class="card-value m-num">{row.value}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if showChains}
        <div class="card">
          {#each chainRows as row (row.key)}
            <div class="card-row">
              <span class="card-label">{row.label}</span>
              <span class="card-value m-num">{row.value}</span>
            </div>
          {/each}
        </div>
      {/if}

      {#if code}
        <button type="button" class="action" aria-label="Copy referral code" onclick={copyCode}>
          <span class="action-text">
            <span class="action-title m-truncate" translate="no">{code}</span>
            <span class="action-sub" aria-live="polite">{copied ? "Copied" : codeNote}</span>
          </span>
          <span class="action-icon"><Copy /></span>
        </button>
      {/if}

      <section class="section">
        <h2 class="section-title">Top referrals</h2>
        {#if topRows.length}
          {#each topRows as row (row.key)}
            <div class="list-row">
              <span class="list-main">
                <span class="list-name m-truncate" translate="no">{row.name}</span>
                <span class="list-sub m-num">{row.sub}</span>
              </span>
              <span class="list-value m-num">{row.value}</span>
            </div>
          {/each}
        {:else}
          <p class="empty">No referrals yet</p>
        {/if}
      </section>

      <section class="section">
        <h2 class="section-title">Recent commissions</h2>
        {#if commissionRows.length}
          {#each commissionRows as row (row.key)}
            <div class="list-row">
              <span class="list-main">
                <span class="list-name m-truncate" translate="no">{row.name}</span>
                <span class="list-sub" title={row.timeTitle}>{row.time}</span>
              </span>
              <span class="list-value m-num">{row.value}</span>
            </div>
          {/each}
        {:else}
          <p class="empty">No commissions yet</p>
        {/if}
      </section>

      {#if hasMore}
        <button type="button" class="link" onclick={() => loadMoreReferral()}>Show more</button>
      {/if}
    {/if}
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

  /*
   * Content-tall like the capture's cash sheet, but the rewards list can run longer than the
   * screen: the sheet stops short of the top edge and scrolls its own body instead of pushing
   * the grabber off screen.
   */
  .sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    display: flex;
    flex-direction: column;
    max-height: calc(100dvh - 32px);
    border: 1px solid var(--m-card);
    border-bottom: 0;
    border-radius: 36px 36px 0 0;
    background: var(--m-bg);
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* 36 x 4.8 dp pill, 17.1 dp below the sheet's top edge. Only the handle eats the gesture. */
  .grabber {
    display: flex;
    flex: 0 0 auto;
    align-items: flex-start;
    justify-content: center;
    height: 26.1px;
    padding-top: 17.1px;
    cursor: grab;
    touch-action: none;
  }

  .grabber-bar {
    width: 36px;
    height: 4.8px;
    border-radius: 2.5px;
    background: var(--m-hairline);
  }

  /* `align-self` only means something in a flex parent, and this content column is a plain
     block, so the button centres itself with its own margins. */
  .pair {
    display: block;
    width: fit-content;
    margin-inline: auto;
    align-self: center;
    margin-top: 4px;
    padding: 12px 20px;
    border-radius: 12px;
    background: var(--m-blue);
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .content {
    flex: 1 1 auto;
    min-height: 0;
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

  .sub {
    margin-top: 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
    text-align: center;
  }

  /* The capture's cash-breakdown card: hairline outline, 8 dp inside, a 12 dp gap between rows. */
  .card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16.5px;
    padding: 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
  }

  .card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    line-height: 16.5px;
  }

  .card-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .card-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-text);
  }

  /* The capture's action row: 16 dp card tone, r16, a title over its sub-line, trailing icon. */
  .action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: var(--m-card);
    text-align: left;
  }

  .action:active {
    transform: translateY(0.5px) scale(0.995);
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
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    color: var(--m-text);
  }

  /* The captured copy glyph ships with an `absolute` utility class; it belongs in the row. */
  .action-icon :global(svg) {
    position: static;
    width: 19.7px;
    height: 19.7px;
  }

  .section {
    margin-top: 20px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  /* 56 dp rows: 16 dp name over its sub-line, the money on the right. */
  .list-row {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 56px;
    border-bottom: 1px solid var(--m-hairline);
  }

  .list-main {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .list-name {
    font-size: 16px;
    color: var(--m-text);
  }

  .list-sub {
    font-size: 12px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .list-value {
    flex: 0 0 auto;
    font-size: 16px;
    color: var(--m-green);
  }

  /* The capture's centred accent link, without the icon its transfer-history link carries. */
  .link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 19.7px;
    margin-top: 16px;
    font-size: 16px;
    font-weight: 700;
    color: var(--m-blue);
  }

  /* The capture's empty state: 48 dp of centred muted text with 16 dp above and below. */
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    margin: 16px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--m-dim);
    text-align: center;
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
</style>
