<!--
  The position's exit plan, on the card: the same panel the buy sheet shows, wired to the trade.

  The panel is `sheets/BuyExitPlan.svelte` and it is one component in both places — the plan a buy
  will carry and the plan a position is running are the same plan, so they are the same panel.
  What this file adds is the two things only a live position needs:

    - the plan is seeded from what the trade actually holds (`position.liveTargets`), so a target
      set anywhere reads back here, and it is re-seeded only when the server's own numbers really
      change — a price tick cannot throw away a percent being typed;
    - a change is a write, through the store's one exit-plan path (`commitPositionTargets`, which
      turns the rows into `targets/add`, `targets/update/{id}` or `targets/remove/{id}` and diffs
      them against the server). A row whose percent box is empty is not part of the plan — the
      store's own rule — which is how a target is cleared.
-->
<script>
  import { untrack } from "svelte";
  import { sellPctShare } from "../../../lib/api/trade.svelte.js";
  import BuyExitPlan from "../sheets/BuyExitPlan.svelte";

  let { position, apply = null, waiting = false } = $props();

  const KINDS = ["TAKE_PROFIT", "STOP_LOSS"];
  /** The word each kind starts on when the trade holds nothing — the desktop card's defaults. */
  const DEFAULT_WORD = { TAKE_PROFIT: "half", STOP_LOSS: "all" };

  const targets = $derived((position?.liveTargets ?? []).filter(Boolean));
  const percentTarget = (kind) =>
    targets.find((target) => target.kind === kind && target.trigger?.type === "PERCENT") ?? null;

  /** The plan the panel edits. Shut by default: a set plan needs no room to say what it is. */
  // `let`, not `const`: the panel binds to it, and a constant cannot be bound
  let plan = $state({
    open: false,
    takeProfit: { share: DEFAULT_WORD.TAKE_PROFIT, pct: "" },
    stopLoss: { share: DEFAULT_WORD.STOP_LOSS, pct: "" }
  });

  const rowOf = (kind) => (kind === "TAKE_PROFIT" ? plan.takeProfit : plan.stopLoss);

  /** What the server holds, as one string, so the rows are re-seeded only when it really changes. */
  const planKey = $derived.by(() =>
    KINDS.map((kind) => {
      const target = percentTarget(kind);
      return target ? `${target.id}:${target.sellPct}:${Math.abs(Number(target.trigger.changePct))}` : "none";
    }).join("|")
  );

  function seed() {
    for (const kind of KINDS) {
      const target = percentTarget(kind);
      const row = rowOf(kind);
      const pct = target ? Math.abs(Number(target.trigger.changePct)) : NaN;
      row.pct = Number.isFinite(pct) ? String(pct) : "";
      row.share = target
        ? (sellPctShare(target.sellPct) ?? String(Number(target.sellPct)))
        : DEFAULT_WORD[kind];
    }
  }

  $effect(() => {
    /**
     * Only the signature is tracked, and the seeding happens untracked. Reading the position
     * inside this effect — which `seed` does, through `percentTarget` — would make every tick of
     * the price re-run it, and every re-run puts the server's numbers back over whatever is being
     * typed. That is a percent box that clears itself mid-keystroke.
     */
    void planKey;
    untrack(() => {
      if (waiting) return;
      seed();
    });
  });

  /**
   * One kind's row as the store wants it. The row the reader touched goes as they left it; the
   * other goes back exactly as the server holds it, so the store's diff skips it rather than
   * rewriting a target nobody touched. Where the server holds nothing, the row is a row with no
   * percent — the store's own way of saying it is not part of the plan.
   */
  function rowFor(kind, touched) {
    const target = percentTarget(kind);
    const row = rowOf(kind);
    if (!target) return { id: null, share: row.share, pct: row.pct };
    const pct = touched ? row.pct : String(Math.abs(Number(target.trigger.changePct)));
    // a percent that cannot be sent is put back rather than sent as a clear nobody asked for
    if (pct && !(Number(pct) > 0)) {
      seed();
      return null;
    }
    return {
      id: target.id,
      share: touched ? row.share : (sellPctShare(target.sellPct) ?? Number(target.sellPct)),
      pct
    };
  }

  function write(touched) {
    const takeProfit = rowFor("TAKE_PROFIT", touched === "takeProfit");
    const stopLoss = rowFor("STOP_LOSS", touched === "stopLoss");
    if (!takeProfit || !stopLoss) return;
    void apply?.({ address: position?.address, takeProfit, stopLoss });
  }
</script>

{#if targets.length || apply}
  <BuyExitPlan bind:plan {waiting} onchange={write} />
{/if}
