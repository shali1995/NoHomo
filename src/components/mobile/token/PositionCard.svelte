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
  import { formatCompact, formatPrice, formatUsd, getAddress, getChain } from "../../../lib/api/token.svelte.js";
  import {
    cancelPendingSwap,
    commitPositionTargets,
    isCancellingSwap
  } from "../../../lib/api/trade.svelte.js";
  import TokenBadge from "../../../icons/token-badge.svelte";
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

  /**
   * The two rows the desktop card carries under the figures. "Avg entry" prints the market cap on
   * the desktop — its own label for that row, value and all — and the mobile keeps the desktop's
   * wording rather than inventing a second one for the same number.
   */
  const invested = $derived(`$${Number(position?.investedUsd ?? 0).toFixed(2)}`);
  /**
   * What was paid, not what it costs now.
   *
   * `entryMcapUsd` and `entryPriceUsd` are the trade's own averages — the API's `avgEntryMcap` and
   * `avgEntryPrice`, "the average price paid per token across confirmed buys, excluding fees" — so
   * one buy and a DCA'd position read the same way: the cap, with the price that implies it in
   * parentheses. It used to print the live market cap, which is a different number entirely.
   *
   * Both are 0 until a buy confirms, and then there is nothing to print but a dash.
   */
  const avgEntry = $derived.by(() => {
    const cap = Number(position?.entryMcapUsd ?? 0);
    const price = Number(position?.entryPriceUsd ?? 0);
    if (!(cap > 0) && !(price > 0)) return "\u2014";
    const capText = cap > 0 ? `$${formatCompact(cap)}` : "";
    const priceText = price > 0 ? `(${formatPrice(price)})` : "";
    return [capText, priceText].filter(Boolean).join(" ");
  });

  /**
   * The exit plan's live targets, as the desktop card's chips: the kind and its number, what it
   * fires at, and how much it sells. `metTargets` is history and the desktop leaves those to the
   * plan's own panel, so only the live ones are read here.
   */
  const targetPills = $derived(
    (position?.liveTargets ?? []).filter(Boolean).map((target) => ({
      ...target,
      note: target.note ?? `sell ${Number(target.sellPct ?? 0)}%`
    }))
  );

  /**
   * The resting buy, in the desktop's own pill: what it is, the level it waits at, and what it will
   * spend. The desktop reveals a Cancel button on hover and cancels on click; a phone has no hover,
   * so the first tap asks and the second one cancels — a stray touch must not pull an order.
   */
  const dip = $derived(position?.dipPill ?? null);
  let asking = $state(null);
  let askTimer = null;

  function askToCancel(pill) {
    if (isCancellingSwap(pill.swapId)) return;
    if (asking === pill.id) {
      clearTimeout(askTimer);
      asking = null;
      void cancelPendingSwap({ chain: getChain(), address: getAddress(), swapId: pill.swapId });
      return;
    }
    asking = pill.id;
    clearTimeout(askTimer);
    askTimer = setTimeout(() => (asking = null), 3000);
  }

  $effect(() => () => clearTimeout(askTimer));

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
    <!-- The desktop puts the token's own mark beside the figures, with the verified badge cut
         into its lower-right corner; the mobile card had no mark at all. -->
    <div class="mark">
      {#if position?.image}
        <img src={position.image} alt="" />
      {/if}
      <span class="badge" aria-hidden="true"><TokenBadge /></span>
    </div>
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

  <!-- What the position cost and what it is measured against, as the desktop card has them. -->
  <div class="facts">
    <div class="fact">
      <span class="fact-label">Invested</span>
      <span class="fact-value m-num">{invested}</span>
    </div>
    <div class="fact">
      <span class="fact-label">Avg entry</span>
      <span class="fact-value m-num">{avgEntry}</span>
    </div>
  </div>

  {#if targetPills.length}
    <!-- One equal column per target, so two of them share the row the way the desktop's do. -->
    <div class="pills" style="grid-template-columns: repeat({targetPills.length}, minmax(0, 1fr));">
      {#each targetPills as pill (pill.id)}
        <div class="pill pill--{pill.kind === "STOP_LOSS" ? "stop" : "target"}">
          <span class="pill-tag">{pill.tag}</span>
          <span class="pill-label m-num">{pill.label}</span>
          <span class="pill-note m-num">{pill.note}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if dip}
    <!-- The resting buy: the same yellow pill the desktop shows, with a tap asking first. -->
    <button
      type="button"
      class="pill"
      class:pill--asking={asking === dip.id}
      title="Cancel dip buy"
      onclick={() => askToCancel(dip)}
    >
      <span class="pill-tag">{dip.tag}</span>
      <span class="pill-label m-num">{dip.label}</span>
      {#if isCancellingSwap(dip.swapId)}
        <span class="pill-spin" aria-hidden="true"></span>
      {:else if asking === dip.id}
        <span class="pill-note pill-note--ask">Cancel</span>
      {:else}
        <span class="pill-note m-num">{dip.note}</span>
      {/if}
    </button>
  {/if}

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

  .mark {
    position: relative;
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    margin-right: 12px;
  }

  .mark img {
    display: block;
    width: 32px;
    height: 32px;
    border: 1px solid var(--m-hairline);
    border-radius: 16px;
    object-fit: cover;
    background: var(--m-card-2);
  }

  .badge {
    position: absolute;
    right: -3px;
    bottom: -3px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge :global(svg) {
    display: block;
    width: 14px;
    height: 14px;
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

  /* Invested and Avg entry: the desktop's two rows, at the card's own label/value scale. */
  .facts {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--m-hairline);
  }

  .fact {
    display: flex;
    align-items: center;
    justify-content: space-between;
    line-height: 1;
  }

  .fact-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .fact-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-text);
  }

  /*
   * The plan's chips: a green take profit and a red stop, spread across the card.
   *
   * These are the desktop's own colours, not the phone palette's — `--color-green-transparent`
   * is #21c95e at 20% with #21c95e for its ink, and red is #ff622e in both places. The two
   * surfaces show the same pills, so they read the same on both.
   */
  .pills {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }

  /*
   * Both class names on purpose: the base `.pill` below carries the dip's own colour, and a
   * single-class variant would lose to it on nothing more than source order — which is exactly
   * how a take profit spent a while painted yellow. Two classes cannot be beaten by order.
   */
  .pill.pill--target {
    background: #21c95e33;
  }

  .pill.pill--stop {
    background: #ff622e33;
  }

  .pill.pill--target .pill-tag,
  .pill.pill--target .pill-label,
  .pill.pill--target .pill-note {
    color: #21c95e;
  }

  .pill.pill--stop .pill-tag,
  .pill.pill--stop .pill-label,
  .pill.pill--stop .pill-note {
    color: #ff622e;
  }

  /* The dip pill: yellow, as the desktop draws it and as its line on the chart reads. */
  .pill {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    width: 100%;
    margin-top: 10px;
    padding: 5px 8px;
    border: 0;
    border-radius: 10px;
    background: #e1b0481f;
    cursor: pointer;
  }

  .pill--asking {
    background: #e1b0483d;
  }

  .pill-tag,
  .pill-label {
    font-size: 12px;
    font-weight: 700;
    color: #ffbf17;
  }

  .pills .pill {
    margin-top: 0;
    cursor: default;
  }

  .pill-note {
    font-size: 12px;
    color: #ffbf17;
    opacity: 0.5;
  }

  .pill-note--ask {
    font-weight: 700;
    opacity: 1;
  }

  /* The desktop's spinner while the cancel is in the air. */
  .pill-spin {
    width: 12px;
    height: 12px;
    border: 2px solid #ffbf17;
    border-top-color: transparent;
    border-radius: 50%;
    animation: pill-spin 0.8s linear infinite;
  }

  @keyframes pill-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .arrow {
    margin-right: 2.6px;
    font-size: 8px;
    font-weight: 400;
    line-height: 9.1px;
  }
</style>
