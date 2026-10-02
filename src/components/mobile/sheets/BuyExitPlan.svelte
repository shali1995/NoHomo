<!--
  The exit plan a buy is placed with: a take profit and a stop loss, each with how much it sells
  and the percent it fires at.

  It is the desktop panel's own section, in the phone's language — the same collapsed header that
  says what the plan is, and the same two rows behind it: the label, a word that cycles through
  half / quarter / all, and a percent box with the sign the kind implies. Nothing is written to the
  server here: the plan is not a thing until the buy carries it, and the buy is what sends it
  (`exitPlanTargets` builds the body). That is why a row with an empty percent box is simply not
  part of the plan, and why a row that cannot be sent stops the buy and says so instead of being
  dropped quietly — which is what the desktop refuses to copy from ombra, and what this refuses
  too.

  The plan itself is the caller's state object: the buy sheet has to read it at the moment the
  order goes, so it lives there and this only edits it.
-->
<script>
  import Chevron from "../../../icons/chevron-down.svelte";
  import { sellPctShare, TARGET_SHARES } from "../../../lib/api/trade.svelte.js";

  let { plan, onchange = null, waiting = false } = $props();

  /** The three words a row cycles through, in the desktop's own order. */
  const SHARES = ["half", "quarter", "all"];

  /** `half` as the row prints it; a share that is no word prints as its own percentage. */
  const shareText = (share) => (Object.hasOwn(TARGET_SHARES, share) ? share : `${share}%`);

  function cycle(kind) {
    const row = plan[kind];
    const index = SHARES.indexOf(String(row.share));
    row.share = index === -1 ? "half" : SHARES[(index + 1) % SHARES.length];
    onchange?.(kind);
  }

  /** A percent box, left: the plan holds what was typed, and the caller hears about it. */
  function type(kind, value) {
    plan[kind].pct = String(value ?? "").trim();
    onchange?.(kind);
  }

  /** What the header says when the plan is not empty: the same sentence the desktop prints. */
  const summary = $derived(
    [
      plan.takeProfit.pct && `${shareText(plan.takeProfit.share)} at +${plan.takeProfit.pct}%`,
      plan.stopLoss.pct && `${shareText(plan.stopLoss.share)} at −${plan.stopLoss.pct}%`
    ]
      .filter(Boolean)
      .join(" · ")
  );

  /** Seeded from the word the store uses, so a plan edited elsewhere reads back the same. */
  const word = (kind) => sellPctShare(plan[kind].share) ?? plan[kind].share;
</script>

<div class="plan">
  <button
    type="button"
    class="head"
    aria-expanded={plan.open}
    onclick={() => (plan.open = !plan.open)}
  >
    <span class="title">Exit plan</span>
    <span class="right">
      <span class="value" class:value--set={!!summary}>{summary || "Set"}</span>
      <span class="chevron" class:chevron--up={plan.open}><Chevron style="width: 16px; height: 16px" /></span>
    </span>
  </button>
</div>

<!--
  The rows live in a popup rather than under the row that opens them: a panel that grows inside the
  sheet pushes the amount and the keypad down the moment it is tapped, which moves the thing the
  reader was about to use and takes the sheet's own height with it. Laid over the sheet it costs
  nothing and closes the way a phone's panels do — on Done, or on the scrim.
-->
{#if plan.open}
  <div class="scrim" role="presentation" onclick={() => (plan.open = false)}></div>
  <div class="popup" role="dialog" aria-modal="true" aria-label="Exit plan">
    <div class="popup-head">
      <span class="popup-title">Exit plan</span>
      <button type="button" class="done" onclick={() => (plan.open = false)}>Done</button>
    </div>
    {#each [{ kind: "takeProfit", label: "Take profit", sign: "+", placeholder: "50" }, { kind: "stopLoss", label: "Stop loss", sign: "−", placeholder: "20" }] as row (row.kind)}
      <div class="row">
        <div class="left">
          <span class="label">{row.label}</span>
          <button type="button" class="share" disabled={waiting} onclick={() => cycle(row.kind)}>
            {word(row.kind)}
          </button>
        </div>
        <span class="box">
          <span class="sign">{row.sign}</span>
          <input
            class="pct m-num"
            type="number"
            inputmode="decimal"
            min="0.1"
            max="10000"
            step="0.1"
            placeholder={row.placeholder}
            aria-label={`${row.label} percent`}
            disabled={waiting}
            value={plan[row.kind].pct}
            oninput={(event) => (plan[row.kind].pct = event.currentTarget.value)}
            onchange={(event) => type(row.kind, event.currentTarget.value)}
          />
          <span class="sign">%</span>
        </span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .plan {
    margin: 0 16px;
  }

  /*
   * The row is the footer's own meta line — "Exit plan" where "$7.98 available" sits, its value
   * and chevron where the fee chevron sits. One line, the sheet's own type, no padding of its own:
   * a whole 12 dp band above and below it was the last of the dead space in this sheet.
   */
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 18.67px;
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(6, 6, 12, 0.55);
  }

  /* Laid over the sheet, above the safe area, and closing on Done or on the scrim. */
  .popup {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px 16px calc(16px + env(safe-area-inset-bottom));
    border-radius: 18px 18px 0 0;
    background: var(--m-card);
    box-shadow: 0 -12px 40px rgba(0, 0, 0, 0.45);
  }

  .popup-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .popup-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .done {
    padding: 0;
    background: none;
    border: 0;
    font-size: 16px;
    font-weight: 700;
    /* neutral: this panel is the same one on a buy and on a sell */
    color: var(--m-text);
    cursor: pointer;
  }

  .title {
    flex: 0 0 auto;
    font-size: 16px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .value {
    flex: 0 1 auto;
    overflow: hidden;
    font-size: 16px;
    font-weight: 500;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--m-dim);
  }

  /* A plan that says something reads brighter than the invitation to set one. */
  .value--set {
    color: var(--m-text);
  }

  .chevron {
    display: flex;
    flex: 0 0 auto;
    color: var(--m-dim);
    transition: transform 200ms ease-out;
  }

  .chevron--up {
    transform: rotate(180deg);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .label {
    font-size: 15px;
    font-weight: 500;
    color: var(--m-muted);
  }

  /* One word, tapped to cycle — the desktop's own control, rather than three chips. */
  .share {
    padding: 0;
    background: none;
    border: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--m-text);
    cursor: pointer;
  }

  .box {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 10px;
    background: var(--m-card-2);
  }

  .sign {
    font-size: 14px;
    color: var(--m-dim);
  }

  .pct {
    width: 56px;
    background: none;
    border: 0;
    outline: none;
    font-size: 15px;
    font-weight: 500;
    text-align: right;
    color: var(--m-text);
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .pct::placeholder {
    color: var(--m-dim);
  }

  .pct::-webkit-outer-spin-button,
  .pct::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }
</style>
