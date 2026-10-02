<!--
  The card above the tabs that appears once the account holds the token: what the position is
  worth, how many tokens it is, and what it has made or lost.

  The figures are the trade store's own (`positionsFor`), which is the same row the desktop's
  position card reads. The capture prints a bare `+$0` when the P&L rounds away and colours the
  number by its sign, so a flat position stays grey.

  Under the figures the card carries the exit plan (`ExitPlan`), which is where the capture puts
  the "Add thesis" row — the first band below the position. The plan's writes are serialized
  here rather than inside the panel: every gesture that touches a target is a call of its own,
  and two of them must not race each other into the same target list.
-->
<script>
  import { formatUsd } from "../../../lib/api/token.svelte.js";
  import { commitPositionTargets } from "../../../lib/api/trade.svelte.js";
  import ExitPlan from "./ExitPlan.svelte";

  let { position } = $props();

  /** A commit is out, and whether a later gesture arrived while it was. */
  let saving = $state(false);
  let queued = $state(null);

  /**
   * The whole write path for the plan: a gesture either starts it, or waits behind the one in
   * flight and is replayed with the store's fresh state afterwards. The same shape the desktop
   * card uses, so a chip pressed twice cannot leave the second write unspoken.
   */
  async function applyPlan(plan) {
    if (saving) {
      queued = plan;
      return;
    }
    saving = true;
    try {
      let result = { changed: false };
      let next = plan;
      while (next) {
        queued = null;
        result = await commitPositionTargets(next);
        next = queued;
      }
      return result;
    } finally {
      saving = false;
    }
  }

  const value = $derived(formatUsd(position?.valueUsd ?? 0));

  /** `7.62 STONK`: the amount without trailing zeros, then the symbol. */
  const amount = $derived.by(() => {
    const tokens = Number(position?.amount ?? 0);
    const text = tokens ? tokens.toFixed(2).replace(/\.?0+$/, "") : "0";
    return `${text} ${position?.name ?? ""}`.trim();
  });

  const pnlUsd = $derived(Number(position?.pnlUsd ?? 0));
  const pnlPct = $derived(Number(position?.changePct ?? 0));
  /** The capture prints `+$0` in grey while still showing a `▼ 0.09%`, so the tone follows
   *  the dollar figure rounding away, not the percentage. */
  const flat = $derived(Math.abs(pnlUsd) < 0.005);
  const up = $derived(pnlUsd >= 0);
  const tone = $derived(flat ? "var(--m-muted)" : up ? "var(--m-green)" : "var(--m-red)");

  /** The capture prints `+$0` rather than `+$0.00`. */
  const pnlText = $derived(
    Math.abs(pnlUsd) < 0.005 ? "$0" : `$${Math.abs(pnlUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );
</script>

<div class="card">
  <div class="head">
    <span class="bullet"></span>
    <span class="label">Your position</span>
    <svg class="chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </div>

  <div class="row">
    <div class="stack">
      <span class="value m-num">{value}</span>
      <span class="amount m-num">{amount}</span>
    </div>
    <div class="stack stack--right">
      <span class="value m-num" style="color: {tone}">{up ? "+" : "-"}{pnlText}</span>
      <span class="pct m-num" style="color: {tone}">
        <span class="arrow" style="color: {flat ? 'var(--m-muted)' : up ? 'var(--m-green)' : 'var(--m-red)'}">
          {up ? "\u25B2" : "\u25BC"}
        </span>
        {Math.abs(pnlPct).toFixed(2)}%
      </span>
    </div>
  </div>

  <!-- The live plan: only the targets the trade actually carries, and the chips that add,
       change or clear them. It writes through `commitPositionTargets` and nothing else. -->
  <ExitPlan {position} apply={applyPlan} waiting={saving} />
</div>

<style>
  /* The capture's card is 97.1 dp tall because it carries only the figures; the exit plan sits
     inside it, where the capture puts the first band below them, so the card grows with it. */
  .card {
    min-height: 97.1px;
    margin: 12.3px 16px 0 16px;
    padding: 12px 16px;
    border-radius: 16px;
    background: var(--m-card);
  }

  .head {
    display: flex;
    align-items: center;
    height: 18.7px;
  }

  .bullet {
    width: 5.9px;
    height: 5.9px;
    margin-right: 8px;
    border-radius: 3px;
    background: var(--m-blue);
  }

  .label {
    font-size: 16px;
    font-weight: 500;
    line-height: 18.7px;
    color: var(--m-blue);
  }

  .chevron {
    width: 16px;
    height: 16px;
    margin-left: 4.2px;
    color: var(--m-dim);
  }

  .row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-top: 8px;
  }

  .stack {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .stack--right {
    align-items: flex-end;
    text-align: right;
  }

  .value {
    font-size: 22px;
    font-weight: 500;
    line-height: 26.1px;
    color: var(--m-text);
  }

  .amount {
    margin-top: 3.8px;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .pct {
    display: flex;
    align-items: center;
    margin-top: 3.8px;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .arrow {
    margin-right: 2.6px;
    font-size: 8px;
    font-weight: 400;
    line-height: 9.1px;
  }
</style>
