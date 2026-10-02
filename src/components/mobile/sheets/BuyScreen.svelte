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
  import ArrowLeft from "../../../icons/arrow-left.svelte";
  import Chevron from "../../../icons/chevron-down.svelte";
  import Plus from "../../../icons/circle-plus.svelte";
  import VerifiedBadge from "../../../icons/verified-badge.svelte";
  import ChainIcon from "../../../icons/network-solana.svelte";
  import { getAddress, getChain, getToken, formatPrice, formatCompact } from "../../../lib/api/token.svelte.js";
  import { tokenImage } from "../../../lib/api/config.js";
  import { formatUsdCompact } from "../../../lib/api/trending.svelte.js";
  import { accountCash, accountLoaded } from "../../../lib/api/account.svelte.js";
  import {
    connectWallet,
    getIsLoggedIn,
    isPhantomInstalled
  } from "../../../lib/auth.svelte.js";
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

  const SLIPPAGE = [
    { id: "AUTO", label: "Auto" },
    { id: 0.5, label: "0.5%" },
    { id: 1, label: "1%" },
    { id: 2, label: "2%" }
  ];

  const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "\u232B"];

  let amount = $state("");
  let dip = $state(0);
  let details = $state(false);

  /**
   * The exit plan the buy will carry. Nothing is written to the server before the order: the plan
   * is the buy's own body, so it is held here and read once, at submit.
   */
  const plan = $state({
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
  const trading = $derived(sending);
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

  function pickPreset(share) {
    if (selling) {
      amount = String(share);
      return;
    }
    if (share === "max") {
      amount = cashKnown ? String(Math.floor(cash * 100) / 100) : "";
      return;
    }
    amount = String(Math.floor(cash * (share / 100) * 100) / 100);
  }

  function toggleDetails() {
    details = !details;
  }

  async function submit() {
    if (!signedIn) {
      /*
       * A phone has two ways in, and which one applies is a fact about where the page is
       * running, not a preference: inside a wallet's own browser the injected provider is
       * there and the wallet signs for itself; in any other browser there is no provider to
       * ask, so the phone pairs with a desktop instead — which is the page `/connect` is.
       */
      if (isPhantomInstalled()) {
        await connectWallet();
        return;
      }
      navigate("/connect");
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
  <div class="back">
    <button type="button" aria-label="Back" onclick={closeMobileTrade}>
      <ArrowLeft class="h-4 w-4" />
    </button>
  </div>

  <div class="token">
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
    {#each selling ? tradePresets().sell : [10, 25, 50] as share (share)}
      <button type="button" class="percent" onclick={() => pickPreset(share)}>{share}%</button>
    {/each}
    {#if !selling}
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
    <BuyExitPlan {plan} />
  {/if}

  {#if details}
    <div class="details">
      <div class="details-head">
        <span class="details-title">Details</span>
        <span class="details-fee">
          {#if value > 0 && feeUsd != null}<span class="m-num">${feeUsd.toFixed(2)} fee</span>{/if}
          <button type="button" class="chevron" aria-label="Close details" onclick={toggleDetails}>
            <Chevron class="h-4 w-4" style="transform: rotate(180deg)" />
          </button>
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
            {#each SLIPPAGE as option (option.id)}
              <button
                type="button"
                class="small-chip"
                class:small-chip--on={(selling ? settings.sellSlippagePct : settings.buySlippagePct) ===
                  option.id}
                onclick={() =>
                  setTradeSettings(
                    selling ? { sellSlippagePct: option.id } : { buySlippagePct: option.id }
                  )}
              >
                {option.label}
              </button>
            {/each}
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

  <div class="foot">
    {#if !details}
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
    {:else}
      <div class="meta meta--spacer"></div>
    {/if}

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
</div>

<style>
  .buy {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background: var(--m-bg);
    padding-top: 24px;
  }

  .back {
    height: 24.53px;
    margin-right: 8px;
    padding-left: 4px;
  }

  .back button {
    display: flex;
    align-items: center;
    height: 24.53px;
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
    left: 16px;
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
    left: 76.27px;
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

  .amount {
    margin-top: 66.9px;
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
  .order {
    display: flex;
    align-items: center;
    gap: 8px;
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

  .percents {
    display: flex;
    gap: 11.73px;
    margin: 20px 24px 0;
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

  .keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    height: 240px;
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
  .details {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 116px;
    background: var(--m-bg);
  }

  .details::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 100%;
    height: 100px;
    background: linear-gradient(to top, var(--m-bg) 30%, rgba(19, 19, 19, 0));
  }

  .details-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 18.67px;
    margin: 0 16px;
  }

  .details-title {
    font-size: 16px;
    color: var(--m-text);
  }

  .details-fee {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 16px;
    color: var(--m-text);
  }

  .chevron {
    color: var(--m-dim);
  }

  .details-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 12px 16px 0;
    padding-top: 12px;
    border-top: 1px solid var(--m-hairline);
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
    margin-top: auto;
    padding: 0 16px 11.7px;
  }

  .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 18.67px;
    font-size: 16px;
    color: var(--m-muted);
  }

  .meta--spacer {
    height: 12px;
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
</style>
