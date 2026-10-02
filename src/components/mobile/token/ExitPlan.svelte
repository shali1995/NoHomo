<!--
  The exit plan the position card carries: the take profit and the stop loss the position is
  actually running, and the controls that add, change or clear them.

  Every value here is read from the live plan (`position.liveTargets`, which the trade store
  builds from the trade's own `activeTargets`), so nothing is a number the capture happened to
  paint. A kind with no live target gets no value row — only its share chips, which is how one
  is added. That is why a position running only a take profit never shows a stop-loss row it
  does not have.

  Writes go through the store's one exit-plan path, not a second one: a row carries the share
  word (`TARGET_SHARES`) and the percent away from entry, and `commitPositionTargets` turns
  that into a `TradeTargetConfig`, diffs it against the server's own targets, and calls
  `targets/add`, `targets/update/{id}` or `targets/remove/{id}`. There is no Save button: a
  chip press, or leaving the percent box, is the whole gesture.

  The chips are the buy sheet's own (Gas / Slippage): radius 8, a 1 px hairline, the active one
  filled with the card colour and set in 700. The rows are the About tab's stat rows at the
  position card's scale — label 14/500 muted, value 14/500 text.
-->
<script>
  import Chevron from "../../../icons/chevron-down.svelte";
  import { sellPctShare, TARGET_SHARES } from "../../../lib/api/trade.svelte.js";

  let { position, apply = null, waiting = false } = $props();

  /**
   * The shares a target may sell: a share of what is still held, never a token count. The word
   * is the store's own key in `TARGET_SHARES`; the chip prints the label.
   */
  const SHARES = [
    { word: "quarter", label: "Quarter" },
    { word: "half", label: "Half" },
    { word: "all", label: "All" }
  ];

  const KINDS = ["TAKE_PROFIT", "STOP_LOSS"];

  /** The percent a row is armed with when nothing has been typed — the desktop card's defaults. */
  const DEFAULT_PCT = { TAKE_PROFIT: "50", STOP_LOSS: "20" };

  /**
   * The live plan as the panel can express it. A percent trigger is the only kind a row holds;
   * a price, multiple or market-cap target is shown untouched further down.
   */
  const targets = $derived((position?.liveTargets ?? []).filter(Boolean));
  const percentTarget = (kind) =>
    targets.find((target) => target.kind === kind && target.trigger?.type === "PERCENT") ?? null;
  const otherTargets = $derived(targets.filter((target) => target.trigger?.type !== "PERCENT"));

  /**
   * Open or shut. The plan is a band the card carries under its figures, and a plan that is
   * already set needs no room: the header says what it is, and the controls wait behind it. The
   * desktop keeps its own plan behind the same kind of header for the same reason.
   */
  let open = $state(false);

  /** What the header says while shut: the live plan in the words the chips use. */
  const summary = $derived(
    KINDS.filter((kind) => percentTarget(kind))
      .map((kind) => {
        const word = sellPctShare(percentTarget(kind).sellPct) ?? `${percentTarget(kind).sellPct}%`;
        const pct = Number(percentTarget(kind).trigger?.changePct ?? 0);
        return `${word} at ${sign(kind)}${Math.abs(Number(pct.toFixed(2)))}%`;
      })
      .join(" · ")
  );

  /** The percent boxes' own draft, keyed by kind: the string the reader is looking at. */
  let draft = $state({ TAKE_PROFIT: "", STOP_LOSS: "" });

  /**
   * The plan's signature — what the server holds, as one string. The boxes are re-seeded from
   * it, and only when it really changes, so a price tick that replaces the trade's raw object
   * cannot throw away a number being typed.
   */
  const planKey = $derived.by(() =>
    KINDS.map((kind) => {
      const target = percentTarget(kind);
      return target ? `${target.id}:${target.sellPct}:${Math.abs(Number(target.trigger.changePct))}` : "none";
    }).join("|")
  );

  /** The boxes back onto the server's own numbers, exactly as it holds them. */
  function seed() {
    for (const kind of KINDS) {
      const target = percentTarget(kind);
      const pct = target ? Math.abs(Number(target.trigger.changePct)) : NaN;
      draft[kind] = Number.isFinite(pct) ? String(pct) : "";
    }
  }

  $effect(() => {
    // only the key is tracked: reading the boxes in here would re-seed on every keystroke
    void planKey;
    if (waiting) return;
    seed();
  });

  /** The direction is the kind's, never the sign: the box holds the absolute change. */
  const sign = (kind) => (kind === "STOP_LOSS" ? "\u2212" : "+");

  /** `half` as the note prints it; a share the three words cannot say prints its own percent. */
  const shareText = (share) => (Object.hasOwn(TARGET_SHARES, share) ? share : `${share}%`);

  /** The word a live target's share reads back as, or null when it is some other percentage. */
  const liveWord = (kind) => {
    const target = percentTarget(kind);
    return target ? sellPctShare(target.sellPct) : null;
  };

  /** The share a live target sells, as the number the store's own words cover. */
  const livePct = (kind) => {
    const target = percentTarget(kind);
    return target ? Number(target.sellPct) : null;
  };

  /**
   * One kind's row as the store wants it: the target it came from, the share word, the percent.
   * A live target is written back from the server's own numbers unless the reader moved them,
   * so a kind that did not change is skipped by the store's diff rather than rewritten.
   */
  function rowFor(kind, share, pct) {
    const target = percentTarget(kind);
    if (!target) return { id: null, share, pct };
    return {
      id: target.id,
      share: share ?? sellPctShare(target.sellPct) ?? Number(target.sellPct),
      pct: pct ?? String(Math.abs(Number(target.trigger.changePct)))
    };
  }

  /**
   * Both rows at once, which is what the store reads: the row the reader touched as they left
   * it, and the other one exactly as the server holds it — or, where the server holds nothing,
   * as a row with no percent, which is the store's own "not part of the plan".
   */
  function commit(kind, share, pct) {
    const other = kind === "TAKE_PROFIT" ? "STOP_LOSS" : "TAKE_PROFIT";
    const otherRow = percentTarget(other) ? rowFor(other) : { id: null, share: "half", pct: "" };
    const row = percentTarget(kind) ? rowFor(kind, share, pct) : { id: null, share: share ?? "half", pct: pct ?? "" };
    void apply?.({
      address: position?.address,
      takeProfit: kind === "TAKE_PROFIT" ? row : otherRow,
      stopLoss: kind === "STOP_LOSS" ? row : otherRow
    });
  }

  /** The percent box, on change or Enter. An emptied box clears the target; a value that is not
   *  a percent above zero is put back rather than sent as a clear nobody asked for. */
  function editPct(kind, value) {
    const typed = String(value).trim();
    if (typed && !(Number(typed) > 0)) {
      seed();
      return;
    }
    draft[kind] = typed;
    commit(kind, undefined, typed);
  }

  /**
   * A share chip: how much the target sells. The percent stays whatever it already is, so
   * changing the share cannot move the price the target fires at. Pressing the share that is
   * already on takes the target away, which is the only clear control a row needs.
   */
  function pickShare(kind, word) {
    if (liveWord(kind) === word) {
      draft[kind] = "";
      commit(kind, word, "");
      return;
    }
    const pct = draft[kind] || DEFAULT_PCT[kind];
    draft[kind] = pct;
    commit(kind, word, pct);
  }
</script>

{#if targets.length || apply}
  <div class="plan">
    <button type="button" class="head" aria-expanded={open} onclick={() => (open = !open)}>
      <span class="band">Exit plan</span>
      <span class="value" class:value--set={!!summary}>{summary || "Set exit plan"}</span>
      <span class="chevron" class:chevron--up={open}><Chevron style="width: 16px; height: 16px" /></span>
    </button>

    {#if open}
    <div class="body">

    {#each KINDS as kind (kind)}
      {@const target = percentTarget(kind)}
      {@const active = liveWord(kind)}
      <div class="row">
        <span class="label">{kind === "STOP_LOSS" ? "Stop loss" : "Take profit"}</span>

        {#if target}
          <span class="box">
            <span class="sign">{sign(kind)}</span>
            <input
              class="pct m-num"
              type="number"
              inputmode="decimal"
              min="0.1"
              max={kind === "STOP_LOSS" ? 100 : 10000}
              step="0.1"
              aria-label={kind === "STOP_LOSS" ? "Stop loss percent" : "Take profit percent"}
              value={draft[kind]}
              onchange={(event) => editPct(kind, event.currentTarget.value)}
              onkeydown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
            />
            <span class="sign">%</span>
          </span>
        {:else}
          <!-- No live target, so there is no value to print: the chips below add one. -->
          <span class="empty">Not set</span>
        {/if}
      </div>

      <div class="shares">
        <span class="share-label">Sells</span>
        {#each SHARES as option (option.word)}
          <button
            type="button"
            class="chip"
            class:chip--on={active === option.word}
            aria-pressed={active === option.word}
            onclick={() => pickShare(kind, option.word)}
          >
            {option.label}
          </button>
        {/each}
        {#if target}
          <!-- The share the chips are showing, in the store's own words: a chip is a
               percentage, and the note says it in the word a plan is read in. -->
          <span class="note m-num">sells {shareText(active ?? livePct(kind))}</span>
        {/if}
      </div>
    {/each}

    {#if otherTargets.length}
      <!-- Targets whose trigger this panel cannot hold in a percent box: a price, a multiple, a
           market cap. They stay live and are only shown, never rewritten from here. -->
      {#each otherTargets as target (target.id)}
        <div class="row row--other">
          <span class="label">{target.kind === "STOP_LOSS" ? "Stop loss" : "Take profit"}</span>
          <span class="value m-num">{target.label}</span>
          <span class="note m-num">sells {shareText(sellPctShare(target.sellPct))}</span>
        </div>
      {/each}
    {/if}
    </div>
    {/if}
  </div>
{/if}

<style>
  /* A band inside the position card, under its two figures. */
  .plan {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--m-hairline);
  }

  /*
   * The header is the whole control: the band names it, the value says what is set, and the
   * chevron turns. Everything below it is the plan's own business and stays behind the toggle.
   */
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
  }

  .value {
    flex: 1 1 auto;
    overflow: hidden;
    font-size: 14px;
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

  .body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
  }

  .band {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 14.4px;
    color: var(--m-dim);
  }

  .row {
    display: flex;
    align-items: center;
    height: 24px;
  }

  /* Label 14/500 muted, value 14/500 text: the capture's own row pair. */
  .label {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .empty {
    flex: 0 0 auto;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-dim);
  }

  .value {
    flex: 0 0 auto;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-text);
  }

  /* The percent box, dressed as the row's own value rather than as a form field. */
  .box {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-text);
  }

  .pct {
    width: 46px;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: var(--m-text);
    text-align: right;
    outline: none;
    appearance: textfield;
    -moz-appearance: textfield;
  }

  .pct::-webkit-outer-spin-button,
  .pct::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }

  /* The buy sheet's chips: radius 8, a hairline, the card fill for the active one. */
  .shares {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 1px 0 14px;
  }

  .share-label {
    font-size: 12px;
    font-weight: 500;
    line-height: 14.4px;
    color: var(--m-muted);
  }

  .chip {
    padding: 4px 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .chip--on {
    background: var(--m-card);
    color: var(--m-text);
    font-weight: 700;
  }

  .note {
    margin-left: auto;
    font-size: 12px;
    font-weight: 500;
    line-height: 14.4px;
    color: var(--m-dim);
  }

  .row--other {
    height: 22px;
  }
</style>
