<script>
  // The trade card: side switch, amount, presets, Max, the submit that reports what it is
  // doing, and the token warning. Markup is the capture's, element for element.
  //
  // What the capture holds and this keeps: the submit's four faces — `Buy STONK` while it is
  // idle or ready, `Minimum amount $2` under the $2 floor the capture enforces, `Fetching
  // quote...` while the quote is out, and the disabled dressing for all of the quiet ones.
  // Under it the order row reports the buy or the sell, and the presets grey out when the
  // cash does not cover them, which is what the $7.72 wallet in the capture shows.
  //
  // Signed out the card does not trade at all: the submit is the door to the connect sheet and
  // says "Connect Wallet", because there is no account for an order to belong to.
  import { getAddress, getChain, getToken } from "../../lib/api/token.svelte.js";
  import { accountCash, accountLoaded } from "../../lib/api/account.svelte.js";
  import { getIsLoggedIn, requestConnect } from "../../lib/auth.svelte.js";
  import { getTokenStats } from "../../lib/api/token.svelte.js";
  import { activeOrder, buy, cashAvailable, commitPositionTargets, exitPlanTargets, positionsFor, sell, sellPctShare, setCash, TARGET_SHARES, tradeFee, tradePresets } from "../../lib/api/trade.svelte.js";
  import { addToast } from "../../lib/toast.svelte.js";
  import { untrack } from "svelte";
  import Info from "../../icons/info.svelte";
  import Settings from "../../icons/settings.svelte";
  import TradeSettingsSheet from "./TradeSettingsSheet.svelte";
  import Skeleton from "../Skeleton.svelte";
  import AnimatedNumber from "./AnimatedNumber.svelte";
  import OrderStatus from "./OrderStatus.svelte";

  /** The capture's own floor: under this the submit refuses to send. */
  const MIN_USD = 2;

  let side = $state("buy");
  /** The percentage a Sell submits: the presets set it, 100 is the whole position. */
  let sellPct = $state(100);
  let amount = $state("");
  let quoting = $state(false);
  let settingsOpen = $state(false);
  let quoteTimer = 0;

  const chain = $derived(getChain() || "solana");
  const address = $derived(getAddress());
  /**
   * The live token names itself `tokenSymbol` / `tokenName`; reading `symbol` found nothing and
   * every page fell through to the capture's own token, so the button said "Buy STAMP" anywhere.
   *
   * While the token is still loading there is no name to print, and the capture's own is not a
   * stand-in for it — a button naming a token you are not looking at is worse than a bare one.
   */
  const symbol = $derived(getToken()?.tokenSymbol ?? getToken()?.tokenName ?? null);

  // The cash the card quotes is the account's, when there is a session to read one from: the
  // app wallet's USD stablecoin. The capture's $7.72 stands in until then.
  const signedIn = $derived(getIsLoggedIn());
  const account = $derived(accountCash());
  /**
   * Signed in, the pot is whatever the account actually holds — a demo balance must not stand in
   * for it and let a buy be validated against money that is not there, nor be printed while the
   * real one is still on its way in. Signed out the pot is the store's own figure, which nothing
   * spends now that there is no signed-out trade: the card's submit is the connect sheet's door.
   */
  const cash = $derived(signedIn ? (account?.valueUsd ?? 0) : cashAvailable());
  /** Whether that figure is known yet: the card waits rather than showing a stale one. */
  const cashKnown = $derived(!signedIn || accountLoaded());

  // The account's cash is handed to the shared store so the row's quick chips price
  // themselves off the same number. It reads the account, never the store, so the write
  // cannot feed back into this effect.
  $effect(() => {
    if (account?.valueUsd) setCash(account.valueUsd);
  });

  const position = $derived(positionsFor(address)[0] ?? null);
  const held = $derived(!!position);
  // The capture's settings dialog owns these: buy amounts in dollars, sell amounts in percent.
  const presets = $derived(tradePresets());
  const fee = $derived(tradeFee());
  /** How far below today's cap you're willing to wait. One unit, one meaning. */
  const DIPS = [0, 10, 25, 50];
  let dipPick = $state(0);
  /** A sell waits for the other direction, so the two sides keep their own choice. */
  let risePick = $state(0);
  const chips = $derived(side === "buy" ? presets.buy : presets.sell);
  const value = $derived(Number(amount) || 0);
  const heldTokens = $derived(!!position && !position.pending);
  const tooSmall = $derived(side === "buy" && value > 0 && value < MIN_USD);
  const sellValue = $derived(((position?.valueUsd ?? 0) * sellPct) / 100);
  /**
   * The rise row is not a sale. A chip picked there names a take-profit — the share the sell
   * presets chose, fired at +X% — so the submit that follows writes that target instead of
   * selling, and both the enablement and the label have to say so.
   */
  const setsTarget = $derived(side === "sell" && held && risePick !== 0);
  /** The buy's own trigger: `Now` is a market order, a percent is a dip the backend waits for. */
  const buyStrategy = $derived(dipPick === 0 ? { type: "MARKET" } : { type: "DIP", dipPct: dipPick });
  /** A resting dip closes buying until it is cancelled: one waiting order per trade. */
  const dipResting = $derived(side === "buy" ? (position?.dipPill ?? null) : null);
  const ready = $derived(
    side === "buy"
      ? value >= MIN_USD && value <= cash && !dipResting
      : setsTarget
        ? true
        // The minimum is the buy's, not the sell's. The lightning and the sell chips already sell
        // whatever is held, and the store's own guard sits in `buy()` — so the card does not block a
        // small exit either.
        : heldTokens
  );
  const label = $derived(
    quoting
      ? "Fetching quote..."
      : dipResting
        ? "Dip resting — cancel it to buy again"
        : setsTarget
        ? `Set target · ${sellPct}% at +${risePick}%`
        // signed out, the warning is not the point — the button wears its normal face and sits
        // greyed until there is an amount, and then it offers the door
        : signedIn && tooSmall
          ? `Minimum amount $${MIN_USD}`
          : side === "buy"
            ? `Buy${symbol ? ` ${symbol}` : ""}`
            : // a sell is a share of the position, so the percent is what is sent and the dollars
              // are only an estimate of it — saying both is the difference between guessing and knowing
              `Sell ${sellPct}%${position && sellValue > 0 ? ` \u2248 $${sellValue.toFixed(2)}` : ""}`
  );

  const BUY = "flex-1 p-2 rounded-lg text-base font-bold transition-colors bg-green-transparent text-green";
  const SELL = "flex-1 p-2 rounded-lg text-base font-bold transition-colors bg-bg-secondary hover:bg-bg-tertiary text-text-secondary";
  const SELL_ACTIVE = "flex-1 p-2 rounded-lg text-base font-bold transition-colors bg-critical-transparent text-critical";
  const PRESET = "hover-scrim h-8 rounded-lg bg-bg-secondary px-3 text-sm font-bold text-text-primary disabled:opacity-50";
  const SUBMIT_READY = "py-2 text-center bg-accent-primary text-white hover:bg-accent-primary/90 flex h-11 items-center justify-center gap-2 rounded-xl border border-bg-tertiary/60 px-4 text-base font-bold overflow-hidden cursor-pointer";
  const SUBMIT_IDLE = "py-2 text-center cursor-not-allowed bg-bg-secondary text-text-secondary flex h-11 items-center justify-center gap-2 rounded-xl border border-bg-tertiary/60 px-4 text-base font-bold overflow-hidden";

  /**
   * Typing asks for a quote, which the capture shows as `Fetching quote...` on the submit
   * before it settles back to the label. Locally that is a short timer; the point is that
   * the state exists and is reachable.
   */
  function onAmountInput() {
    if (quoteTimer) clearTimeout(quoteTimer);
    quoting = true;
    quoteTimer = setTimeout(() => (quoting = false), 450);
  }

  // Which kind of order this is, and a plan. The kind is real now: the buy's dip chip becomes
  // the body's `strategy`, and the sell's rise chip becomes a take-profit in the exit plan's own
  // row. The button is enabled whenever the form is ready, whatever a chip says.
  /**
   * The slider is shown while the pointer is on the order block, and it stays open after the kind
   * is changed until the pointer leaves — so choosing "At MC" cannot look like nothing happened.
   * A drag holds it open too, in case the pointer slips off the track while pulling.
   */
  /** A market cap typed in thousands, the way the token's own figures are read. */
  let mcInput = $state("");
  let planOpen = $state(false);
  /**
   * When to sell is the percent in the box. How much goes is one of three words — `sellPct` is a
   * share of the tokens still held, so half is 50 and all is 100, never a token count.
   */
  const SHARES = ["half", "quarter", "all"];
  let slShare = $state("all");
  const nextShare = (word) => {
    const index = SHARES.indexOf(String(word));
    return index === -1 ? "half" : SHARES[(index + 1) % SHARES.length];
  };
  let tpShare = $state("half");
  const CHIP = "h-8 rounded-lg px-3 text-sm font-bold transition-colors";
  const CHIP_ON = `${CHIP} bg-bg-tertiary text-text-primary`;
  const CHIP_OFF = `${CHIP} bg-bg-secondary text-text-secondary hover:text-text-primary`;
  let tpPct = $state("");
  let slPct = $state("");
  /** The server target each row was seeded from, when the position already carries one. */
  let tpId = $state(null);
  let slId = $state(null);
  /** A commit is out: the next click-away queues behind it rather than overtaking it. */
  let savingPlan = $state(false);
  let planPending = false;
  /** `half` as the row prints it; a sellPct that is no word prints as its own percentage. */
  const shareText = (share) => (Object.hasOwn(TARGET_SHARES, share) ? share : `${share}%`);
  /**
   * What the button says once a chip is picked — the button carries what will happen. A rise
   * chip says it already (`Set target · 50% at +25%`), so the suffix would only repeat it.
   */
  const orderSuffix = $derived(
    side === "buy"
      ? dipPick
        ? ` on a −${dipPick}% dip`
        : ""
      : setsTarget
        ? ""
        : risePick
          ? ` after +${risePick}%`
          : ""
  );
  /**
   * Signed out, none of this is a trade: the submit asks for the connect sheet and says so,
   * whatever the form holds. `ready` and the quote have nothing to gate in that state, and the
   * chips' suffix would only describe an order that cannot be sent.
   */
  // the button keeps its own face until there is something to act on: signed out with an amount
  // in play it offers the door instead, and pressing it opens the connect sheet
  /**
   * `value` carries a preset amount even signed out, so the question is never "is there a number"
   * but "has this person typed one". Until they do, the button is the signed-in button — same
   * face, same greyed state — and only then does it turn into the door.
   */
  const typed = $derived(String(amount ?? "").trim() !== "");
  const submitLabel = $derived(signedIn || !typed ? label : "Connect Wallet");
  const submitSuffix = $derived(signedIn ? orderSuffix : "");
  const submitReady = $derived(signedIn ? ready && !quoting : typed);

  const planText = $derived(
    // "Sell" is the row's own meaning, so the sentence spends its width on the numbers
    [tpPct && `${shareText(tpShare)} at +${tpPct}%`, slPct && `${shareText(slShare)} at −${slPct}%`]
      .filter(Boolean)
      .join(" · ")
  );

  /**
   * The signature of the targets the server holds for this position. The rows are seeded from
   * it, and re-seeded only when it really changes — a price tick replaces the raw trade but
   * leaves this string alone, so an edit in progress is not thrown away under the reader.
   */
  const planKey = $derived.by(() => {
    if (!position || !Array.isArray(position.raw?.activeTargets)) return "pre";
    const live = (position.raw.activeTargets ?? []).filter((target) => target.status === "LIVE");
    const part = (kind) => {
      const target = live.find((t) => t.kind === kind && t.trigger?.type === "PERCENT");
      return target
        ? `${target.id}:${target.sellPct}:${Math.abs(Number(target.trigger.changePct))}`
        : "none";
    };
    return `held|${part("TAKE_PROFIT")}|${part("STOP_LOSS")}`;
  });

  /**
   * The rows back onto the server's own numbers. `sellPct` comes back as the word it is, or as
   * its own percentage when the server holds one the three words cannot say.
   */
  function seedRows() {
    // the capture's signed-out position carries no targets list: nothing to seed from
    if (!Array.isArray(position?.raw?.activeTargets)) return;
    const live = position.raw.activeTargets.filter((target) => target.status === "LIVE");
    const seed = (kind) => live.find((t) => t.kind === kind && t.trigger?.type === "PERCENT") ?? null;
    const tp = seed("TAKE_PROFIT");
    tpId = tp?.id ?? null;
    tpPct = tp ? String(Math.abs(Number(tp.trigger.changePct))) : "";
    if (tp) tpShare = sellPctShare(tp.sellPct) ?? Number(tp.sellPct);
    const sl = seed("STOP_LOSS");
    slId = sl?.id ?? null;
    slPct = sl ? String(Math.abs(Number(sl.trigger.changePct))) : "";
    if (sl) slShare = sellPctShare(sl.sellPct) ?? Number(sl.sellPct);
  }

  $effect(() => {
    // only the key is tracked: reading the rows inside would re-seed on every raw replacement
    void planKey;
    if (savingPlan) return;
    untrack(seedRows);
  });

  /** The two rows as the store wants them: the id they came from, the word, and the percent. */
  const planRows = () => ({
    takeProfit: { id: tpId, share: tpShare, pct: tpPct },
    stopLoss: { id: slId, share: slShare, pct: slPct }
  });

  /**
   * The click-away commit for a held position. There is no Save button: a `change`/Enter on a
   * percent box or a share word toggled is the whole gesture. A second gesture while the first
   * is out queues behind it, so nothing is lost to a blur that raced a click.
   *
   * It returns the last write's own answer — whether anything changed, and why not if the
   * server refused — so a caller can tell the reader the truth instead of guessing.
   */
  async function commitPlan() {
    if (!held) return { changed: false };
    if (savingPlan) {
      planPending = true;
      return { changed: false };
    }
    savingPlan = true;
    let result = { changed: false };
    try {
      do {
        planPending = false;
        result = await commitPositionTargets({ address, ...planRows() });
      } while (planPending);
      // back to the server's numbers once the last write lands
      seedRows();
    } finally {
      savingPlan = false;
    }
    return result;
  }

  /**
   * The rise row's own gesture, and it is not a sale. The chip says which take-profit the reader
   * wants, so the exit plan's take-profit row takes those numbers — the share the sell presets
   * chose, fired at +X% (`{ type: "PERCENT", changePct: X }`) — and the shared commit path writes
   * it. One row, one target: the card and the plan can neither disagree nor hold two take-profits.
   */
  async function setRiseTarget() {
    if (!held) return;
    if (!signedIn) {
      // signed out there is no plan to write to; saying so beats a chip that looks like it worked
      addToast("info", "Target not set", "Sign in to set an exit target", 5000);
      return;
    }
    tpShare = sellPct;
    tpPct = String(risePick);
    const { changed, error } = await commitPlan();
    // a target the server refused keeps the chip, so the choice is not lost with the notice
    if (error) return;
    // and a target the plan already holds leaves it where it is: the label still tells the truth
    if (changed) risePick = 0;
  }

  function submit() {
    // Signed out the press is the connect request, never an order: the store's own buy and sell
    // refuse the same way, and this is so the button says what it does before it is pressed.
    if (!signedIn) {
      requestConnect();
      return;
    }
    if (!ready || quoting || !symbol) return;
    if (side === "buy") {
      // The exit plan rides the buy. A row that cannot be sent stops the buy and says why —
      // the one thing ombra's silent drop must not be copied into.
      const { targets, error } = exitPlanTargets({
        takeProfit: { share: tpShare, pct: tpPct },
        stopLoss: { share: slShare, pct: slPct }
      });
      if (error) {
        addToast("warning", "Exit plan not sent", error, 5000);
        planOpen = true;
        return;
      }
      // the chip's own trigger rides the body: `Now` is a market order, a percent is a dip
      buy({ name: symbol, address, chain, usd: value, targets: targets ?? [], strategy: buyStrategy });
      amount = "";
      return;
    }
    if (setsTarget) {
      // the rise chip names a target, not a sale, so this press writes the take-profit row
      void setRiseTarget();
      return;
    }
    sell({ name: symbol, address, pct: sellPct });
    // a percentage is about one decision, not the next one: back to the whole position
    sellPct = 100;
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "Escape") planOpen = false;
  }}
/>

<div class="border border-bg-tertiary rounded-2xl p-2 flex flex-col gap-2">
  <div class="flex gap-2">
    <button type="button" class={side === "buy" ? BUY : SELL} onclick={() => (side = "buy")}>Buy</button>
    <button type="button" class={side === "sell" ? SELL_ACTIVE : SELL} onclick={() => (side = "sell")}>Sell</button>
  </div>

  <div class="bg-bg-secondary rounded-xl flex items-stretch text-3xl gap-px cursor-text relative border border-transparent focus-within:border-bg-tertiary">
    <div class="flex flex-1 min-w-0 items-center gap-px p-4 pr-0">
      <div class="text-text-tertiary">$</div>
      <input
        placeholder="0"
        class="flex-1 min-w-0 bg-transparent outline-none placeholder:text-text-tertiary {amount ? 'text-text-primary' : ''}"
        bind:value={amount}
        oninput={onAmountInput}
      />
    </div>
    <div class="shrink-0 max-w-1/2 flex flex-col items-end justify-center p-4 pl-6 relative cursor-pointer">
      {#if position}
        <!-- What the capture puts here once you hold the token: how much you hold, and how it
             has moved (its cell holds `9.83 STONK` over `(+0.08%)`). -->
        <AnimatedNumber class="text-sm text-text-secondary leading-[1.4] truncate max-w-full" value={position.amountText.replace(/(\d)(?=[A-Za-z])/, "$1 ")} />
        <span class="flex items-center text-xs text-text-tertiary">
          <span>(</span>
          <AnimatedNumber value="{position.changePct >= 0 ? "+" : "-"}{Math.abs(position.changePct).toFixed(2)}%" />
          <span>)</span>
        </span>
      {:else}
        <div class="text-sm font-medium text-text-tertiary">Enter amount</div>
      {/if}
    </div>
  </div>

  <div class="flex gap-1">
    <div class="grid grid-cols-4 gap-2 flex-1">
      {#each chips as chip (chip)}
        <button
          type="button"
          disabled={side === "buy" ? chip > cash : !held}
          class={PRESET}
          onclick={() => {
            // A buy chip fills the amount; a sell chip is the percentage itself.
            if (side === "buy") {
              amount = String(chip);
              onAmountInput();
            } else {
              sellPct = chip;
            }
          }}>{side === "buy" ? `$${chip}` : `${chip}%`}</button>
      {/each}
    </div>
    <button
      type="button"
      class="h-8 w-8 shrink-0 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
      aria-label="Trade settings"
      onclick={() => (settingsOpen = true)}
    >
      <Settings />
    </button>
  </div>

    <!-- The buy's dip row, and the sell's rise row. A rise row with nothing held has nothing to
         sell and no position to hang a take-profit on, so it is not offered at all. -->
    {#if side === "buy" || held}
      <div class="grid grid-cols-4 gap-2">
        {#each DIPS as dip (dip)}
          <button
            type="button"
            class="h-8 rounded-lg text-sm font-bold transition-colors {(side === "buy" ? dipPick : risePick) === dip
              ? 'bg-bg-tertiary text-text-primary'
              : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}"
            onclick={() => (side === "buy" ? (dipPick = dip) : (risePick = dip))}>{dip === 0 ? "Now" : `${side === "buy" ? "−" : "+"}${dip}%`}</button>
        {/each}
      </div>
    {/if}

  <div class="flex flex-col px-2 text-sm">
    <div class="flex justify-between items-center">
      <div class="text-text-secondary">
        {#if cashKnown}
          <span>${cash.toFixed(2)} available</span>
        {:else}
          <!-- the balance arrives a beat after the page: a placeholder holds its place so no old
               number is read as this account's -->
          <Skeleton class="h-4 w-20 rounded-sm" />
        {/if}
      </div>
      {#if !cashKnown}
        <span></span>
      {:else if amount && fee?.gasFeeUsdStr}
        <!-- the capture's own swap: once an amount is in play the Max control gives way to the
             network fee for the swap -->
        <span class="text-text-primary shrink-0" translate="no">{fee.gasFeeUsdStr} fee</span>
      {:else}
        <button
          type="button"
          class="text-accent-primary hover:opacity-80 transition-opacity cursor-pointer shrink-0"
          onclick={() => {
            amount = cash.toFixed(2);
            onAmountInput();
          }}>Max</button>
      {/if}
    </div>
  </div>

  <button
    disabled={!submitReady}
    class={submitReady ? SUBMIT_READY : SUBMIT_IDLE}
    onclick={submit}
  >
    <div class="min-w-0 truncate animate-flip-up">{submitLabel}{submitSuffix}</div>
  </button>

  <OrderStatus order={activeOrder()} />

  <div
    class="flex flex-col gap-2"
  >
  <button
    type="button"
    class="flex w-full items-center justify-between gap-2 px-2 py-1 text-sm"
    aria-expanded={planOpen}
    onclick={() => (planOpen = !planOpen)}
  >
    <span class="text-text-secondary shrink-0">Exit plan</span>
    <span class="flex min-w-0 items-center gap-1">
      <span class="truncate {planText ? 'text-text-primary font-medium' : 'text-text-tertiary'}">{planText || "Set exit plan"}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="none"
        class="size-3 shrink-0 text-text-tertiary transition-transform {planOpen ? 'rotate-180' : ''}"
        aria-hidden="true"
      >
        <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </button>

  <div
    class="grid transition-[grid-template-rows] duration-300 ease-out {planOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}"
  >
    <div class="overflow-hidden min-h-0" style="visibility: {planOpen ? 'visible' : 'hidden'};">
    <div class="flex flex-col gap-2 px-2 text-sm">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-text-secondary">Take profit</span>
          <button
            type="button"
            class="text-text-primary transition-colors"
            onclick={() => {
              tpShare = nextShare(tpShare);
              void commitPlan();
            }}>{shareText(tpShare)}</button
          >
          <!-- one button, not three: tap the word, and it cycles -->
          
        </div>
        <div class="flex items-center gap-1 bg-bg-secondary rounded-lg px-3 py-1.5">
          <span class="text-text-tertiary">+</span>
          <input
            placeholder="50"
            class="w-16 bg-transparent outline-none placeholder:text-text-tertiary"
            bind:value={tpPct}
            onchange={() => void commitPlan()}
          />
          <span class="text-text-tertiary">%</span>
        </div>
      </div>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="text-text-secondary">Stop loss</span>
          <button
            type="button"
            class="text-text-primary transition-colors"
            onclick={() => {
              slShare = nextShare(slShare);
              void commitPlan();
            }}>{shareText(slShare)}</button
          >
          
        </div>
        <div class="flex items-center gap-1 bg-bg-secondary rounded-lg px-3 py-1.5">
          <span class="text-text-tertiary">−</span>
          <input
            placeholder="20"
            class="w-16 bg-transparent outline-none placeholder:text-text-tertiary"
            bind:value={slPct}
            onchange={() => void commitPlan()}
          />
          <span class="text-text-tertiary">%</span>
        </div>
      </div>
    </div>

    </div>
  </div>
  </div>


  <div class="flex items-center justify-between gap-2 px-2 py-1 text-sm text-text-secondary font-medium">
    <div class="flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" class="size-3 shrink-0">
        <path d="M13.0716 9.43447L8.66695 1.197C7.81362 -0.399 5.52095 -0.399 4.66695 1.197L0.262326 9.43447C-0.590341 11.0305 0.556326 13 2.37199 13H11.9613C13.777 13 14.9236 11.0305 13.0716 9.43447ZM7.33399 5.5C7.33399 5.13133 7.63199 4.83333 8.00066 4.83333C8.36933 4.83333 8.66733 5.13133 8.66733 5.5V8.16667C8.66733 8.53533 8.36933 8.83333 8.00066 8.83333C7.63199 8.83333 7.33399 8.53533 7.33399 8.16667V5.5ZM8.00066 11.1667C7.63199 11.1667 7.33399 10.8687 7.33399 10.5C7.33399 10.1313 7.63199 9.83333 8.00066 9.83333C8.36933 9.83333 8.66733 10.1313 8.66733 10.5C8.66733 10.8687 8.36933 11.1667 8.00066 11.1667Z" fill="currentColor"/>
      </svg>
      <span class="text-xs font-bold">Unverified token</span>
    </div>
    <button type="button" class="flex items-center text-text-tertiary p-1 -m-1" aria-label="What this means">
      <Info />
    </button>
  </div>
</div>

{#if settingsOpen}
  <TradeSettingsSheet onClose={() => (settingsOpen = false)} />
{/if}
