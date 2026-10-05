<!--
  The phone's buy screen.
  It is a pushed full screen, not a bottom sheet: the capture's own buy route is a plain
  push with the controls anchored to the bottom, which is what this is — the token row on
  top, the amount and its keypad in the middle, the order details and the slide control at
  the foot.

  Two things here are ours, not the capture's, and they sit where the form already has a
  place for them: the order-type row (a market buy or a dip that waits for a price) reads as
  one more step of the amount, and gas, slippage and anti-MEV live inside `Details`, which
  is already the panel that says what the order will cost.
-->
<script>
  import Chevron from "../../../icons/chevron-down.svelte";
  import Plus from "../../../icons/circle-plus.svelte";
  import VerifiedBadge from "../../../icons/verified-badge.svelte";
  import ChainIcon from "../../../icons/network-solana.svelte";
  import { getAddress, getChain, getToken, formatPrice, formatCompact } from "../../../lib/api/token.svelte.js";
  import { tokenImage } from "../../../lib/api/config.js";
  import { formatUsdCompact } from "../../../lib/api/trending.svelte.js";
  import { accountCash, accountLoaded } from "../../../lib/api/account.svelte.js";
  import { getIsLoggedIn, requestConnect } from "../../../lib/auth.svelte.js";
  import { navigate } from "../../../lib/router.js";
  import {
    buy,
    positionsFor,
    sell,
    setCash,
    tradeError,
    tradeFee,
    tradePresets,
    tradeSettings,
    setTradeSettings
  } from "../../../lib/api/trade.svelte.js";
  import { addToast } from "../../../lib/toast.svelte.js";
  import { exitPlanTargets } from "../../../lib/api/trade.svelte.js";
  import BuyExitPlan from "./BuyExitPlan.svelte";
  import { closeMobileTrade } from "../../../lib/mobile-sheets.svelte.js";

  /**
   * Which side of the trade this screen is on. The capture's coin page has one control while
   * you hold nothing and a Sell | Buy pair once you do, so the same screen serves both: buy
   * spends cash by the dollar, sell moves the position by the percent.
   */
  let { side = "buy", onclose = closeMobileTrade } = $props();

  /** The capture's floor: under this the control refuses to send. */
  const MIN_USD = 2;

  /** How far below the market a dip waits. `0` is the market order the capture sends. */
  const DIPS = [
    { id: 0, label: "Now" },
    { id: 10, label: "\u221210%" },
    { id: 25, label: "\u221225%" },
    { id: 50, label: "\u221250%" }
  ];

  const GAS = [
    { id: "AUTO", label: "Auto" },
    { id: "LOW", label: "Low" },
    { id: "MEDIUM", label: "Med" },
    { id: "HIGH", label: "High" }
  ];

  /**
   * The slippage chips, without an Auto one: the custom box beside them *is* the Auto control, the
   * way the desktop's own box is — empty means `AUTO`, and it says so with its placeholder. Two
   * controls for one value is what made the row read as "Auto 0.5% 1% 2% Auto%".
   */
  /**
   * The slippage ceiling's own values, the ones the settings panel offers: Auto, then four fixed
   * ceilings. Auto is a chip like the rest rather than a state the empty box implies, so which one
   * is chosen is visible at a glance.
   */
  const SLIPPAGE = [
    { id: 0.5, label: "0.5%" },
    { id: 1, label: "1%" },
    { id: 3, label: "3%" },
    { id: 5, label: "5%" }
  ];

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "\u232B"];

  let amount = $state("");
  let dip = $state(0);
  let details = $state(false);

  /**
   * The exit plan the buy will carry. Nothing is written to the server before the order: the plan
   * is the buy's own body, so it is held here and read once, at submit.
   */
  // `let`, not `const`: the panel binds to it, and a constant cannot be bound
  let plan = $state({
    open: false,
    takeProfit: { share: "half", pct: "" },
    stopLoss: { share: "all", pct: "" }
  });
  let slide = $state(0);
  let dragging = $state(false);
  /** Ours, not the store's: `isTrading()` is also true while the store reads positions. */
  let sending = $state(false);

  const token = $derived(getToken());
  const symbol = $derived(token?.tokenSymbol ?? token?.tokenName ?? "");
  const chain = $derived(getChain() || "solana");
  const address = $derived(getAddress());
  const price = $derived(formatPrice(token?.quote?.priceUsdStr));
  const logo = $derived(address ? tokenImage(chain, address, 96) : null);
  const mcap = $derived(
    token?.quote?.marketCapUsdStr ? `${formatUsdCompact(token.quote.marketCapUsdStr)} MC` : ""
  );
  const change = $derived.by(() => {
    const raw = token?.stats?.timeframes?.["1h"]?.priceChangePct ?? token?.stats?.timeframes?.["24h"]?.priceChangePct;
    const num = typeof raw === "string" ? parseFloat(raw) : raw;
    if (num === undefined || num === null || isNaN(num)) return null;
    return { up: num >= 0, text: `${Math.abs(num).toFixed(2)}%` };
  });

  const signedIn = $derived(getIsLoggedIn());
  const account = $derived(accountCash());
  const cash = $derived(account?.valueUsd ?? 0);
  const cashKnown = $derived(!signedIn || accountLoaded());
  const value = $derived(Number(amount) || 0);
  const presets = $derived(tradePresets().buy);
  /**
   * `tradeFee()` is the whole estimate — `{ gasFeeUsd, gasFeeUsdStr, gasFeeNative, … }` — and
   * printing it directly was `Number(object)`, which is NaN. The USD figure is the one a buy
   * card shows, so that is the one read.
   */
  const fee = $derived(tradeFee());
  const feeUsd = $derived.by(() => {
    const usd = Number(fee?.gasFeeUsd);
    return Number.isFinite(usd) ? usd : null;
  });
  const settings = $derived(tradeSettings());
  const error = $derived(tradeError());

  /** The account's cash prices the preset chips off the same number the order spends. */
  $effect(() => {
    if (account?.valueUsd) setCash(account.valueUsd);
  });

  const estimate = $derived.by(() => {
    const unit = parseFloat(String(token?.quote?.priceUsdStr ?? ""));
    if (!value || !unit || isNaN(unit)) return null;
    return value / unit;
  });

  const position = $derived(positionsFor(address)[0] ?? null);
  const selling = $derived(side === "sell");
  /** This side's slippage as the store holds it: `AUTO`, or a number. */
  const slippageNow = $derived(selling ? settings.sellSlippagePct : settings.buySlippagePct);
  /** True when the store holds `AUTO`, which is a value a reader picked, not an empty box. */
  const slippageAuto = $derived(slippageNow === "AUTO");
  /**
   * What Auto actually resolves to for this token.
   *
   * The token snapshot carries it — `autoSlippage`, "suggested slippage for the token's main pair",
   * 50 when the pair has no usable liquidity — so Auto is not a mystery setting: the box below the
   * chips prints the number the route is using, and it follows the snapshot live.
   */
  const autoSlippage = $derived.by(() => {
    const value = Number(getToken()?.autoSlippage);
    return Number.isFinite(value) && value > 0 ? value : null;
  });

  /** True when it holds a number no chip stands for — a custom one. */
  const slippageCustom = $derived(
    !slippageAuto && !SLIPPAGE.some((option) => option.id === slippageNow)
  );
  /** The custom box is text while it is being typed; `AUTO` shows as an empty box. */
  const slippageText = (value) => (value === "AUTO" || value == null ? "" : String(value));
  let slippage = $state(slippageText(slippageNow));

  /**
   * The box follows the store, so what it shows is what the next trade carries: picking Auto
   * empties it, picking a chip fills it with that number, and a value the store refuses never
   * stays in it.
   */
  $effect(() => {
    slippage = slippageCustom
      ? slippageText(slippageNow)
      : slippageAuto && autoSlippage != null
        ? autoSlippage.toFixed(1)
        : "";
  });

  /**
   * A typed slippage — the desktop's own rule: empty means Auto, anything else is the number, and
   * a number outside what the spec allows is refused out loud and the box goes back to the store's
   * value rather than showing something that will not be sent.
   */
  function commitSlippage() {
    const text = slippage.trim();
    const next = text === "" ? "AUTO" : Number(text);
    const { error } = setTradeSettings(
      selling ? { sellSlippagePct: next } : { buySlippagePct: next }
    );
    if (error) {
      addToast("warning", "Slippage not changed", error, 5000);
      slippage = slippageText(slippageNow);
    }
  }
  const trading = $derived(sending);
  /** A sell is a share of the position, so its percent is what the order carries. */
  const sellValue = $derived(((position?.valueUsd ?? 0) * (Number(amount) || 0)) / 100);
  const sellShown = $derived(selling ? (amount ? `${amount}%` : "0%") : `$${amount || "0"}`);
  const sellTokens = $derived(
    selling && position ? (Number(position.amount || 0) * (Number(amount) || 0)) / 100 : null
  );

  const tooSmall = $derived(!selling && value > 0 && value < MIN_USD);
  const overCash = $derived(!selling && signedIn && cashKnown && value > cash);
  const ready = $derived(
    selling
      ? !!position && Number(amount) > 0 && Number(amount) <= 100 && !trading && signedIn
      : value >= MIN_USD && !overCash && !trading && signedIn
  );

  const controlLabel = $derived(
    trading
      ? "Placing order..."
      : !signedIn
        ? "Connect Wallet"
        : selling
          ? !position
            ? "Nothing to sell"
            : Number(amount) === 0
              ? "Enter a percent"
              : "Slide to sell"
          : value === 0
            ? "Enter an amount"
            : tooSmall
              ? `$${MIN_USD} minimum`
              : overCash
                ? "Not enough cash"
                : dip === 0
                  ? "Slide to buy"
                  : "Slide to place dip"
  );

  function press(key) {
    if (key === "\u232B") {
      amount = amount.slice(0, -1);
      return;
    }
    if (selling) {
      // A share of the position is a whole percent: `1`, `25`, `100`.
      const next = (amount + key).replace(/\D/g, "").slice(0, 3);
      if (Number(next) > 100) return;
      amount = next;
      return;
    }
    if (key === "." && amount.includes(".")) return;
    // Two decimals is what a dollar amount means; the capture's own keypad stops there too.
    const next = amount + key;
    const decimals = next.split(".")[1];
    if (decimals && decimals.length > 2) return;
    amount = next;
  }

  /**
   * The buy's quick amounts, in dollars.
   *
   * The desktop's row is `side === "buy" ? presets.buy : presets.sell` — dollars on a buy, percents
   * on a sell — and the numbers are the reader's own, from the settings dialog. A buy chip that
   * costs more than the cash on hand is offered greyed out rather than hidden, which is the
   * desktop's own rule (`chip > cash`). The mobile's fourth chip stays Max, because on a phone
   * "everything I have" is the one amount worth a button.
   */
  const buyPresets = $derived(tradePresets().buy.slice(0, 3).map(Number));

  /** `share` is a dollar amount on a buy, a percent on a sell, or the word `max`. */
  function pickPreset(share) {
    if (share === "max") {
      amount = selling
        ? "100"
        : cashKnown
          ? String(Math.floor(cash * 100) / 100)
          : "";
      return;
    }
    amount = selling ? String(share) : String(Number(share));
  }

  function toggleDetails() {
    details = !details;
    // one panel at a time: the exit plan is the other one, and it owns its own open flag
    if (details) plan.open = false;
  }

  /** The exit plan and the order details are the same kind of panel: only one is ever open. */
  $effect(() => {
    if (plan.open) details = false;
  });

  async function submit() {
    if (!signedIn) {
      /*
       * The chooser owns the doors now — a wallet inside this browser, Google, or pairing with a
       * desktop session — so the sheet asks for it rather than deciding here which one applies.
       */
      requestConnect();
      return;
    }
    if (!ready) return;
    sending = true;
    if (selling) {
      const result = await sell({ name: symbol, address, pct: Number(amount) });
      sending = false;
      if (result?.error) {
        addToast("error", result.error);
        return;
      }
      addToast("success", `Sold ${amount}% of ${symbol}`);
      onclose();
      return;
    }
    const strategy = dip === 0 ? { type: "MARKET" } : { type: "DIP", dipPct: dip };
    /**
     * The plan rides the buy, and a row that cannot be sent stops it and says why: the API drops
     * such a row silently, which is the one thing the desktop refuses to copy and this does too.
     */
    const { targets, error: planError } = exitPlanTargets({
      takeProfit: plan.takeProfit,
      stopLoss: plan.stopLoss
    });
    if (planError) {
      addToast("warning", "Exit plan not sent", planError, 6000);
      plan.open = true;
      sending = false;
      return;
    }
    const result = await buy({
      name: symbol,
      address,
      chain,
      usd: value,
      targets: targets ?? [],
      strategy
    });
    sending = false;
    if (result?.error) {
      addToast("error", result.error);
      return;
    }
    addToast("success", dip === 0 ? `Bought ${symbol}` : `Dip placed ${dip}% below market`);
    onclose();
  }

  /* The slide control is the capture's: a thumb dragged to the end. Its own travel was never
     captured (every still has it at rest), so the release point is ours to choose. */
  let track = $state(null);
  const THUMB = 48;

  function onSlideStart(event) {
    if (!ready) return;
    dragging = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onSlideMove(event) {
    if (!dragging || !track) return;
    const box = track.getBoundingClientRect();
    const travel = box.width - THUMB - 7;
    const offset = event.clientX - box.left - THUMB / 2 - 3.5;
    slide = Math.min(travel, Math.max(0, offset));
  }

  function onSlideEnd() {
    if (!dragging) return;
    dragging = false;
    const box = track?.getBoundingClientRect();
    const travel = box ? box.width - THUMB - 7 : 1;
    if (slide / travel > 0.82) {
      submit();
    }
    slide = 0;
  }

  function onSlideKey(event) {
    if (event.key === "Enter" || event.key === " ") submit();
  }
</script>

<div class="buy">
  <div class="token">
    <!--
      The way out sits on the token's own row, beside its mark, rather than owning a row above it.
      A 25 dp band of an 853 dp screen is the difference between the sheet fitting a small phone
      and not, and it was the emptiest line in it.
    -->
    <div class="back">
      <button type="button" aria-label="Back" onclick={closeMobileTrade}>
        <!-- the token header's own chevron, so the two ways back are the same glyph -->
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 5 8 12l7 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="logo">
      {#if logo}
        <img src={logo} alt="" />
      {:else}
        <span class="logo-blank">{(symbol || "?").slice(0, 1)}</span>
      {/if}
      <VerifiedBadge class="badge" />
    </div>

    <div class="names">
      <div class="name-row">
        <span class="symbol m-truncate">{symbol}</span>
        <span class="chain"><ChainIcon class="h-4 w-4" /></span>
      </div>
      <span class="mcap m-num">{mcap}</span>
    </div>

    <div class="quote">
      <span class="price m-num">{price}</span>
      {#if change}
        <span class="change m-num" style="color: {change.up ? 'var(--m-green)' : 'var(--m-red)'}">
          <span class="arrow">{change.up ? "\u25B2" : "\u25BC"}</span>{change.text}
        </span>
      {/if}
    </div>
  </div>

  <div class="amount m-num" class:zero={selling ? Number(amount) === 0 : value === 0}>{sellShown}</div>
  <div class="receive">
    {#if selling}
      {#if sellTokens != null && Number(amount) > 0}
        Selling {formatCompact(sellTokens)} {symbol} · ~${sellValue.toFixed(2)}
      {/if}
    {:else if dip !== 0}
      Waits for {dip}% below market
    {:else if estimate}
      Receive ~{formatCompact(estimate)} {symbol}
    {/if}
  </div>

  {#if !selling}
  <div class="order">
    <span class="order-label">Order</span>
    <div class="order-chips">
      {#each DIPS as option (option.id)}
        <button
          type="button"
          class="small-chip"
          class:small-chip--on={dip === option.id}
          onclick={() => (dip = option.id)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  </div>

  {/if}

  <div class="percents">
    {#if selling}
      {#each tradePresets().sell as share (share)}
        <button type="button" class="percent" onclick={() => pickPreset(share)}>{share}%</button>
      {/each}
    {:else}
      {#each buyPresets as preset (preset)}
        <button
          type="button"
          class="percent"
          disabled={signedIn && cashKnown && preset > cash}
          onclick={() => pickPreset(preset)}
        >
          ${preset.toLocaleString("en-US")}
        </button>
      {/each}
      <button type="button" class="percent" onclick={() => pickPreset("max")}>Max</button>
    {/if}
  </div>

  <div class="keypad">
    {#each KEYS as key (key)}
      <button type="button" class="key" onclick={() => press(key)}>
        {#if key === "\u232B"}
          <span class="backspace">{"\u232B"}</span>
        {:else}
          {key}
        {/if}
      </button>
    {/each}
  </div>

  {#if !selling}
    <BuyExitPlan bind:plan />
  {/if}

  <div class="foot">
    <div class="meta">
      <span class="available">
          {#if selling}
            {#if position}<span class="m-num">${(position.valueUsd ?? 0).toFixed(2)} position</span>{/if}
          {:else if cashKnown}
            <span class="m-num">${cash.toFixed(2)} available</span>
          {/if}
          <button type="button" class="add" aria-label="Add cash" onclick={toggleDetails}>
            <Plus class="h-4 w-4" />
          </button>
        </span>
        <span class="fee">
          {#if value > 0 && feeUsd != null}<span class="m-num">${feeUsd.toFixed(2)} fee</span>{/if}
        <button type="button" class="chevron" aria-label="Order details" onclick={toggleDetails}>
          <Chevron class="h-4 w-4" />
        </button>
      </span>
    </div>

    <div class="control" class:control--ready={ready}>
      {#if ready}
        <div
          class="track"
          bind:this={track}
          role="button"
          tabindex="0"
          aria-label={controlLabel}
          onpointerdown={onSlideStart}
          onpointermove={onSlideMove}
          onpointerup={onSlideEnd}
          onpointercancel={onSlideEnd}
          onkeydown={onSlideKey}
        >
          <span class="track-title">{controlLabel}</span>
          <span class="thumb" style="transform: translateX({slide}px)">
            <span class="thumb-glyph">{"\u00BB"}</span>
          </span>
        </div>
      {:else}
        <button type="button" class="idle" onclick={submit}>
          <span class="idle-square"><span class="thumb-glyph idle-glyph">{"\u00BB"}</span></span>
          <span class="idle-label">{controlLabel}</span>
        </button>
      {/if}
    </div>

    {#if error}
      <p class="error">{error}</p>
    {/if}
  </div>

  <!--
    The order's own numbers and settings, laid over the sheet rather than inside it: grown in the
    flow they pushed the amount, the keys and the control down every time the chevron was tapped,
    which is the same jump the exit plan used to make.
  -->
  {#if details}
    <div class="scrim" role="presentation" onclick={toggleDetails}></div>
    <div class="popup" role="dialog" aria-modal="true" aria-label="Order details">
      <div class="popup-head">
        <span class="popup-title">Details</span>
        <span class="popup-right">
          {#if value > 0 && feeUsd != null}<span class="m-num popup-fee">${feeUsd.toFixed(2)} fee</span>{/if}
          <button type="button" class="done" onclick={toggleDetails}>Done</button>
        </span>
      </div>

<div class="details-body">
        <div class="row">
          <span class="row-label">Fee</span>
          <span class="row-value m-num">{feeUsd != null ? `$${feeUsd.toFixed(2)}` : "\u2014"}</span>
        </div>
        <div class="row">
          <span class="row-label">{selling ? "Estimated proceeds" : "Estimated output"}</span>
          <span class="row-value m-num">
            {#if selling}
              {Number(amount) > 0 ? `~$${sellValue.toFixed(2)}` : "\u2014"}
            {:else}
              {estimate ? `(~${formatCompact(estimate)} ${symbol})  $${value.toFixed(2)}` : "\u2014"}
            {/if}
          </span>
        </div>

        <!-- Ours: what the order costs the network and how much the price may move. -->
        <div class="row row--stack">
          <span class="row-label">Gas</span>
          <span class="row-chips">
            {#each GAS as option (option.id)}
              <button
                type="button"
                class="small-chip"
                class:small-chip--on={(selling ? settings.sellGas : settings.buyGas) === option.id}
                onclick={() =>
                  setTradeSettings(selling ? { sellGas: option.id } : { buyGas: option.id })}
              >
                {option.label}
              </button>
            {/each}
          </span>
        </div>
        <div class="row row--stack">
          <span class="row-label">Slippage</span>
          <span class="row-chips">
            <button
              type="button"
              class="small-chip"
              class:small-chip--on={slippageAuto}
              aria-pressed={slippageAuto}
              onclick={() =>
                setTradeSettings(
                  selling ? { sellSlippagePct: "AUTO" } : { buySlippagePct: "AUTO" }
                )}
            >
              Auto
            </button>
            {#each SLIPPAGE as option (option.id)}
              <button
                type="button"
                class="small-chip"
                class:small-chip--on={slippageNow === option.id}
                aria-pressed={slippageNow === option.id}
                onclick={() =>
                  setTradeSettings(
                    selling ? { sellSlippagePct: option.id } : { buySlippagePct: option.id }
                  )}
              >
                {option.label}
              </button>
            {/each}
          </span>

          <!--
            The custom ceiling, on its own line under the chips and full width, the way the
            settings panel draws it: the word on the left, the number and its sign on the right.
            Typing in it is what selects it, so no chip is on while it holds a value, and it shows
            a value only when that value is one no chip stands for — a chip's number belongs to the
            chip, not to this box.
          -->
          <span class="slip-box" class:slip-box--on={slippageCustom}>
            <span class="slip-word"
              >{slippageAuto ? "Auto" : "Custom"}{slippageAuto && autoSlippage != null ? " ~" : ""}</span
            >
            <input
              class="slip-input m-num"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="Custom"
              aria-label="Custom slippage percent"
              bind:value={slippage}
              onchange={commitSlippage}
              onkeydown={(event) => event.key === "Enter" && event.currentTarget.blur()}
            />
            {#if slippage !== ""}<span class="slip-sign">%</span>{/if}
          </span>
        </div>
        <div class="row">
          <span class="row-label">Anti-MEV</span>
          <button
            type="button"
            class="toggle"
            aria-label="Anti-MEV"
            class:toggle--on={settings.antiMev}
            aria-pressed={settings.antiMev}
            onclick={() => setTradeSettings({ antiMev: !settings.antiMev })}
          >
            <span class="knob"></span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .buy {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--m-bg);
    /* the status bar's inset and nothing more: 24 dp of air above the back arrow was the emptiest
       space in the sheet */
    padding-top: calc(6px + env(safe-area-inset-top));
  }

  .back {
    /*
     * Left: the glyph's edge lands on 16, the token page's own inset — 8 + (40 - 24) / 2.
     * Vertically: on the mark's centre line, which is where the token page's own chevron sits. The
     * row's own middle (50%) is 5 dp below the mark, because the mark starts at the top of the row
     * and the names hang under it — that is what made it read as low.
     */
    position: absolute;
    left: 8px;
    top: 24.53px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    transform: translateY(-50%);
  }

  /* 40 dp of tap target, which is a target and not a drawing. */
  .back button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
  }

  /*
   * The glyph is the token page's own, at the token page's own measures: 24 x 24.5, the muted
   * colour, dimmed to 35% the way the token page's own is. Same control, same weight, both places.
   */
  .back svg {
    width: 24px;
    height: 24.5px;
    color: var(--m-muted);
    opacity: 0.35;
  }

  .token {
    position: relative;
    height: 72px;
    padding: 0 16px;
  }

  .logo {
    position: absolute;
    top: 0.53px;
    left: 48px;
    width: 48px;
    height: 48px;
  }

  .logo img,
  .logo-blank {
    display: block;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
  }

  .logo-blank {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--m-card);
    color: var(--m-muted);
    font-size: 18px;
  }

  .logo :global(.badge) {
    position: absolute;
    right: -4px;
    bottom: -2px;
    width: 18.2px;
    height: 18.2px;
    color: #516af6;
  }

  .names {
    position: absolute;
    top: 3.73px;
    left: 108px;
    display: flex;
    flex-direction: column;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 4.5px;
    height: 21.33px;
  }

  .symbol {
    max-width: 180px;
    font-size: 18px;
    color: var(--m-text);
  }

  .chain {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20.27px;
    height: 20.27px;
    padding: 2px;
    border-radius: 4px;
    background: var(--m-hairline);
    color: var(--m-muted);
  }

  .mcap {
    margin-top: 3.3px;
    font-size: 14px;
    line-height: 16.53px;
    color: var(--m-muted);
  }

  .quote {
    position: absolute;
    top: 0.53px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .price {
    font-size: 18px;
    line-height: 26.13px;
    color: var(--m-text);
  }

  .change {
    display: flex;
    align-items: center;
    gap: 3.7px;
    font-size: 14px;
    line-height: 16.53px;
  }

  .arrow {
    font-size: 8px;
    line-height: 9.07px;
  }

  /*
   * The amount's band: the height it had, and the sheet's spare height on top of that, so the
   * figure has the room a 52 dp number needs and never sits against the token above it. It is
   * capped, because the space it does not need belongs to the keys.
   */
  .amount {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    min-height: 132px;
    max-height: 208px;
    margin-top: 0;
    font-size: 52px;
    line-height: 60.8px;
    text-align: center;
    color: var(--m-text);
  }

  .amount.zero {
    color: var(--m-dim);
  }

  .receive {
    height: 26.67px;
    margin-top: 8px;
    font-size: 16px;
    line-height: 18.67px;
    text-align: center;
    color: var(--m-muted);
  }

  /* Ours: the order type. The capture's form has one buy; this one can also wait for a dip. */
  /* Label and chips as one centred group, so the row reads as its own control. */
  .order {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin: 12px 24px 0;
  }

  .order-label {
    font-size: 14px;
    color: var(--m-muted);
  }

  .order-chips {
    display: flex;
    gap: 6px;
  }

  /* Even chips: four that each fit their own text read as a ragged edge. */
  .order-chips .small-chip {
    min-width: 62px;
    text-align: center;
  }

  .small-chip {
    padding: 5px 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 8px;
    font-size: 14px;
    color: var(--m-muted);
  }

  .small-chip--on {
    background: var(--m-card);
    color: var(--m-text);
    font-weight: 700;
  }

  /*
   * The custom ceiling: the settings panel's own field, full width under the chips — the word on
   * the left in the muted tone, what is typed on the right beside its sign.
   */
  .slip-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: var(--m-card-2);
  }

  .slip-box:focus-within {
    border-color: var(--m-hairline);
  }

  /* a custom value is what this box stands for, so it says so the way a chosen chip does */
  .slip-box--on {
    background: var(--m-card);
  }

  /* Which of the two the line is showing: Auto's own number, or one being typed. */
  .slip-word {
    flex: 0 0 auto;
    margin-right: 10px;
    font-size: 15px;
    color: var(--m-muted);
  }

  .slip-input {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0;
    background: none;
    border: 0;
    outline: none;
    font-size: 16px;
    color: var(--m-text);
    text-align: right;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  /*
   * The word sits on the left, the number on the right, and the two are told apart here: a
   * placeholder can carry its own alignment, so the empty field reads "Custom" on the left and a
   * typed value reads as a value, next to its sign.
   */
  .slip-input::placeholder {
    color: var(--m-muted);
    text-align: left;
  }

  .slip-input::-webkit-outer-spin-button,
  .slip-input::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }

  .slip-sign {
    flex: 0 0 auto;
    margin-left: 6px;
    font-size: 15px;
    color: var(--m-muted);
  }


  .slip-input::-webkit-outer-spin-button,
  .slip-input::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }

  .slip-sign {
    font-size: 14px;
    color: var(--m-muted);
  }

  .percents {
    display: flex;
    gap: 11.73px;
    margin: 20px 24px 0;
  }

  .percent:disabled {
    opacity: 0.4;
  }

  .percent {
    flex: 1 1 0;
    height: 37.33px;
    border-radius: 12px;
    background: var(--m-card);
    font-size: 18px;
    font-weight: 700;
    color: var(--m-text);
  }

  /*
   * The keys are what flexes. Fixed at 240 dp the sheet needed 681 dp before the control, which
   * does not fit a small phone at all — and on a tall one it left the space to the amount, which
   * fills a 188 dp band with one number. Bounded at both ends, it gives on the one and takes on
   * the other, and the keys themselves carry the difference rather than an empty band.
   */
  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    flex: 1 1 auto;
    min-height: 176px;
    max-height: 320px;
    height: auto;
    margin-top: 24px;
  }

  .key {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: var(--m-text);
  }

  .key:active {
    transform: scale(0.96);
  }

  .backspace {
    font-size: 26px;
  }

  /* The details panel overlays the last keypad rows behind a fade, as the capture's does. */
  .details::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
    height: 100px;
    background: linear-gradient(to top, var(--m-bg) 30%, rgba(19, 19, 19, 0));
  }

  .chevron {
    color: var(--m-dim);
  }

  .details-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /*
   * The order-details panel, the exit plan's own anatomy: a scrim, a card pinned to the bottom
   * above the safe area, a title with Done, and the rows inside. Capped and scrollable, because
   * the chips and the toggle make it the taller of the two panels on a short screen.
   */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(6, 6, 12, 0.55);
  }

  .popup {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 41;
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 76%;
    overflow-y: auto;
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

  .popup-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .popup-fee {
    font-size: 16px;
    color: var(--m-muted);
  }

  .done {
    padding: 0;
    background: none;
    border: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
    cursor: pointer;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .row--stack {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .row-label {
    font-size: 14px;
    color: var(--m-muted);
  }

  .row-value {
    font-size: 14px;
    color: var(--m-text);
  }

  .row-chips {
    display: flex;
    gap: 6px;
  }

  .toggle {
    width: 44px;
    height: 26px;
    padding: 3px;
    border-radius: 13px;
    background: var(--m-card);
    display: flex;
  }

  .toggle--on {
    background: rgba(4, 194, 73, 0.25);
  }

  .knob {
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background: var(--m-muted);
    transition: transform 0.15s ease;
  }

  .toggle--on .knob {
    transform: translateX(18px);
    background: var(--m-green);
  }

  .foot {
    /* no spare height to claim any more — the keys and the amount have it */
    margin-top: 12px;
    /*
     * The control clears the home indicator and the browser's own bottom bar. On an old iOS the
     * bar sits over the bottom of the page, and a control flush with the edge is a control the
     * reader cannot reach: this is the inset that puts it above that bar.
     */
    padding: 0 16px calc(11.7px + env(safe-area-inset-bottom));
  }

  .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 18.67px;
    font-size: 16px;
    color: var(--m-muted);
  }

  .available,
  .fee {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .available {
    color: var(--m-muted);
  }

  .fee {
    color: var(--m-text);
  }

  .add {
    color: var(--m-dim);
  }

  .control {
    margin-top: 12.32px;
  }

  .idle {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 56px;
    border: 0.5px solid var(--m-hairline);
    border-radius: 12px;
    background: var(--m-card);
  }

  .idle-square {
    position: absolute;
    left: 3.5px;
    top: 3.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--m-hairline);
  }

  .idle-glyph {
    color: var(--m-dim);
  }

  .idle-label {
    font-size: 18px;
    font-weight: 700;
    color: var(--m-muted);
  }

  /* Enabled: the capture's own slider, a green thumb dragged along the track. */
  .track {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 49px;
    margin: 3.5px 0;
    border-radius: 8.5px;
    background: var(--m-card);
    touch-action: none;
    user-select: none;
  }

  .track-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--m-text);
  }

  .thumb {
    position: absolute;
    left: 3.5px;
    top: 0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 8.5px;
    background: var(--m-green);
    background-image: linear-gradient(160deg, #48e281, #04c249);
  }

  .thumb-glyph {
    font-size: 24px;
    line-height: 1;
    color: #ffffff;
  }

  .error {
    margin: 8px 0 0;
    font-size: 14px;
    color: var(--m-red);
  }

  /* Breakpoints last: a media query has no more weight than the rule it means to
     override, so it has to come after it. */
  /*
   * Small phones: the sheet's own budgets, cut. A 568 dp screen has no room for a 132 dp amount
   * band and 176 dp of keys at once, so on anything under 700 dp the amount keeps a band a little
   * over one line and the keys take what is left.
   */
  @media (max-height: 700px) {
    .amount {
      min-height: 104px;
    }

    .keypad {
      min-height: 152px;
      margin-top: 16px;
    }

    .percents {
      margin-top: 8px;
    }

    .order {
      margin-top: 10px;
    }
  }

  /*
   * The smallest phones still sold as phones: 568 dp tall. Everything here gives a little — the
   * mark's row, the amount's band and its figure, the keys — so that the control, which is the
   * point of the sheet, is on the screen rather than below it.
   */
  @media (max-height: 620px) {
    .token {
      height: 60px;
    }

    .amount {
      min-height: 92px;
      font-size: 42px;
      line-height: 50px;
    }

    .keypad {
      min-height: 128px;
      margin-top: 12px;
    }

    .order,
    .percents {
      margin-top: 6px;
    }

    .foot {
      margin-top: 8px;
      padding-bottom: calc(8px + env(safe-area-inset-bottom));
    }

    .control {
      margin-top: 8px;
    }
  }
</style>
