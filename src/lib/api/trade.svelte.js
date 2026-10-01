/**
 * Trading: the positions the account holds, the trades it has closed, and the buy and sell
 * that move them.
 *
 * Read from the API the way Ombra reads them:
 *   - open positions   — `GET /v2/trade/active`
 *   - closed trades    — `GET /v2/trade/completed`
 *   - buy              — `POST /v2/trade/{chain}/{token}/buy`
 *   - sell             — `POST /v2/trade/{chain}/{token}/sell`
 *   - presets          — `GET /v2/trade/presets`, `POST /v2/trade/presets/{slot}/update`
 *                        (where gas, slippage and anti-MEV are persisted)
 *
 * Two things about those calls are worth knowing before reading on. A trade needs **no wallet
 * signature** — the JWT is the whole authorisation, and the funds sit in the managed wallet —
 * so unlike a withdrawal there is nothing to hand to Phantom. And a 200 means the order was
 * *accepted*, not filled: the fill arrives later, which is why the order row has a submitted
 * state and a settled one.
 *
 * Buys are always funded from the chain's USD stablecoin. Ombra offers that as a preference
 * (`buyWith: 'NATIVE' | 'FIAT'`); this app does not, so the field is fixed below rather than
 * exposed anywhere.
 *
 * Signed out there is nothing to read and nothing to trade: both lists are empty, and a buy or
 * a sell only asks for the connect sheet (src/lib/auth.svelte.js) instead of moving anything.
 */

import { getAuthToken, getIsLoggedIn, onAuthTokenChange, requestConnect } from "../auth.svelte.js";
import { api } from "./client.js";
import { subscribe, unsubscribe } from "../ws/client.js";
import { addToast, updateToast } from "../toast.svelte.js";
import { liveAccumulatedParams } from "../utils/livecursor.js";
import { accountWallets } from "./account.svelte.js";
import { formatCompact, formatPrice, getToken } from "./token.svelte.js";

/** Under this a position is dust: the capture groups it away behind "Show dust". */
const DUST_USD = 2;

/**
 * Every manual buy is funded from USD. Ombra makes this a setting; we only support the one
 * value, so it is a constant here — one place, and the reason written down.
 */
const BUY_WITH = "FIAT";

/** The `AUTO` mode both gas and slippage take when nothing has been picked. */
const AUTO = "AUTO";

/** The gas tiers the spec allows (`GasPreset`, `v2.d.ts:5450`). */
const GAS_PRESETS = ["AUTO", "LOW", "MEDIUM", "HIGH"];

/** The preset slots the server keeps (`TradePresetSlot`, `v2.d.ts:10286`), in the order ombra
 *  looks at them when it picks the slot a form loads from (`trade.svelte.ts:546-548`). */
const PRESET_SLOTS = ["S1", "S2", "S3"];

/**
 * The quick presets, from the capture's own settings dialog — buy amounts in dollars and sell
 * amounts in **percent**. The sell ones are how a position is sold in part: 50 sells half.
 *
 * They live in `localStorage` the way ombra keeps its preferences, so the dialog is not a
 * decoration that forgets.
 */
const PRESETS_KEY = "fomo_trade_presets";
const DEFAULT_PRESETS = { buy: [10, 100, 500, 1000], sell: [10, 25, 50, 100] };

function readPresets() {
  if (typeof localStorage === "undefined") return { ...DEFAULT_PRESETS };
  try {
    const stored = JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "null");
    if (!stored) return { ...DEFAULT_PRESETS };
    return {
      buy: Array.isArray(stored.buy) && stored.buy.length ? stored.buy : DEFAULT_PRESETS.buy,
      sell: Array.isArray(stored.sell) && stored.sell.length ? stored.sell : DEFAULT_PRESETS.sell
    };
  } catch {
    return { ...DEFAULT_PRESETS };
  }
}

let presets = $state(readPresets());

/** The presets the card's chips and the dialog both read. */
export function tradePresets() {
  return presets;
}

/** @param {{ buy?: number[], sell?: number[] }} next */
export function setTradePresets(next) {
  presets = { ...presets, ...next };
  if (typeof localStorage !== "undefined") localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

/**
 * Gas, slippage and anti-MEV for the trades this app sends — the settings sheet's row, in the
 * spec's own shape (`TradeSettings` without `targets`, `v2.d.ts:10297`).
 *
 * They are held here rather than in the dialog because two readers need them: the buy body that
 * carries them, and the dialog that sets them. Ombra keeps the same five the same way
 * (`trade.svelte.ts:67-71`). The defaults are the spec's and are not moved: `AUTO` gas on both
 * sides, `AUTO` slippage on both sides, no anti-MEV.
 *
 * Either gas value may also be a custom priority fee in native tokens, which this app has no
 * control for (`NativePriorityFee`, `v2.d.ts:6138`). One that arrives in a saved preset is
 * carried back exactly as it came rather than replaced with `AUTO`.
 */
const DEFAULT_TRADE_SETTINGS = {
  antiMev: false,
  buyGas: AUTO,
  buySlippagePct: AUTO,
  sellGas: AUTO,
  sellSlippagePct: AUTO
};

let tradeSettingsState = $state({ ...DEFAULT_TRADE_SETTINGS });

/** The gas, slippage and anti-MEV the next buy carries, and the dialog reads and writes. */
export function tradeSettings() {
  return tradeSettingsState;
}

/** How many decimals a number prints, for the spec's own bounds (12 for a fee, 3 for a percent). */
function decimalsOf(value) {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** A legal gas value: one of the four tiers, or a non-negative priority fee in native tokens. */
function isGas(value) {
  return (
    GAS_PRESETS.includes(value) ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0 && decimalsOf(value) <= 12)
  );
}

/** A legal slippage value: `AUTO`, or 0-100 percent in steps of 0.001 (`SlippageSetting`). */
function isSlippage(value) {
  return (
    value === AUTO ||
    (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100 && decimalsOf(value) <= 3)
  );
}

/** Why these settings could not be sent, or null when they can — the check the API would run. */
function tradeSettingsError(held) {
  if (!isGas(held.buyGas)) return "Invalid buy gas";
  if (!isGas(held.sellGas)) return "Invalid sell gas";
  if (!isSlippage(held.buySlippagePct)) return "Buy slippage must be between 0 and 100";
  if (!isSlippage(held.sellSlippagePct)) return "Sell slippage must be between 0 and 100";
  if (typeof held.antiMev !== "boolean") return "Invalid anti-MEV value";
  return null;
}

/**
 * Set gas, slippage and anti-MEV. A value the spec would reject is refused here and reported
 * rather than sent or quietly dropped; the dialog puts the control back where it was.
 *
 * @param {Partial<{ antiMev: boolean, buyGas: any, buySlippagePct: any, sellGas: any, sellSlippagePct: any }>} next
 * @returns {{ error?: string }}
 */
export function setTradeSettings(next) {
  const wanted = { ...tradeSettingsState, ...next };
  const error = tradeSettingsError(wanted);
  if (error) return { error };
  tradeSettingsState = wanted;
  // the card prints the network fee for the tier a trade would send, so that tier has moved
  void reloadFee();
  return {};
}

/**
 * The preset slot the settings are kept in, and what the server holds there.
 *
 * Gas, slippage and anti-MEV are only ever persisted through a trade preset: the API keeps them
 * in `TradeSettings` inside a slot, and `POST /v2/trade/presets/{slot}/update` replaces the whole
 * preset (`v2.d.ts:1592`, `trade_update_preset` at `v2.d.ts:21361`).
 */
let presetSlot = null;
/** The preset as it was read, so the parts the dialog has no control for — the amount, the buy
 *  strategy, the targets — are carried back untouched when the preset is replaced. */
let presetHeld = null;
/** Whether a saved preset has already filled the settings. Ombra loads a slot into its form once
 *  and not again (`trade.svelte.ts:546-552`), so a later read cannot overwrite an edit. */
let presetLoaded = false;
let presetLoading = false;

/** Fill the settings from a preset, the fields ombra reads (`trade.svelte.ts:628-634`). */
function loadPreset(preset) {
  const s = preset?.settings ?? {};
  tradeSettingsState = {
    antiMev: s.antiMev === true,
    buyGas: s.buyGas ?? AUTO,
    buySlippagePct: s.buySlippagePct ?? AUTO,
    sellGas: s.sellGas ?? AUTO,
    sellSlippagePct: s.sellSlippagePct ?? AUTO
  };
}

/**
 * Read the saved preset and fill the settings from it — ombra's `fetchTradeConfigs`
 * (`trade.svelte.ts:540-555`): the first configured slot wins, it is loaded once, and a slot that
 * has gone is forgotten. A read that fails changes nothing: the dialog keeps what it holds and a
 * save says what the server answered.
 */
export async function fetchTradeSettings() {
  if (!getAuthToken() || presetLoading) return;
  presetLoading = true;
  try {
    const { data } = await api.GET("/v2/trade/presets");
    const slots = data ?? {};
    if (presetSlot && !slots[presetSlot]) {
      presetSlot = null;
      presetHeld = null;
    }
    if (!presetSlot) {
      const found = PRESET_SLOTS.find((id) => slots[id]);
      if (!found) return;
      presetSlot = found;
    }
    presetHeld = slots[presetSlot] ?? null;
    if (!presetLoaded) {
      presetLoaded = true;
      loadPreset(presetHeld);
    }
  } catch (failure) {
    console.warn("[trade] presets not read", failure);
  } finally {
    presetLoading = false;
  }
}

/** Forget which slot was read, so the next session reads its own. The settings themselves stay:
 *  they are what the dialog is showing, and what the next trade sends. */
function forgetPreset() {
  presetSlot = null;
  presetHeld = null;
  presetLoaded = false;
}

/**
 * The amount a preset has to carry (`BuyCore.amount`, greater than zero). The dialog has no
 * amount of its own — its buy boxes are the trade card's quick chips — so the slot's own amount is
 * kept and only a slot that does not exist yet is seeded from the first quick chip.
 */
function amountForPreset(held) {
  const value = Number(held?.amount?.value);
  const type = held?.amount?.type === "NATIVE" ? "NATIVE" : "USD";
  if (Number.isFinite(value) && value > 0) return { type, value };
  const quick = (presets.buy ?? []).map(Number).find((number) => Number.isFinite(number) && number > 0);
  return { type: "USD", value: quick ?? DEFAULT_PRESETS.buy[0] };
}

/**
 * Persist gas, slippage and anti-MEV through the server's preset slot.
 *
 * The slot is the only place the API keeps them, and ombra sends the *whole* preset rather than a
 * patch (`trade.svelte.ts:579-593`), writing into `S1` when nothing is saved yet
 * (`createTradeConfig`, `560-577`). The parts the dialog has no control for — the amount, the
 * strategy, the targets — are carried back exactly as the slot held them, so replacing the preset
 * cannot drop them.
 *
 * @returns {Promise<{ slot?: string, local?: boolean, error?: string }>}
 */
export async function saveTradeSettings() {
  const error = tradeSettingsError(tradeSettingsState);
  if (error) return { error };
  // No session, no slot: the values stay in the app (they are what the next trade sends) and the
  // dialog says where they did and did not go.
  if (!getAuthToken()) return { local: true };

  const slot = presetSlot ?? PRESET_SLOTS[0];
  const body = {
    amount: amountForPreset(presetHeld),
    strategy: presetHeld?.strategy ?? { type: "MARKET" },
    settings: { ...tradeSettingsState, targets: presetHeld?.settings?.targets ?? [] }
  };
  try {
    const { data, error: failure } = await api.POST("/v2/trade/presets/{slot}/update", {
      params: { path: { slot } },
      body
    });
    if (failure) throw new Error(errorMessage(failure));
    presetSlot = slot;
    // a 200 is the bare preset for that slot (`v2.d.ts:21372`)
    presetHeld = data ?? body;
    presetLoaded = true;
    return { slot };
  } catch (failure) {
    const said = failure instanceof Error ? failure.message : String(failure);
    return { error: said };
  }
}

/**
 * @typedef {object} Position
 * @property {string} id          chain and the *trade's* id — a token can be traded more than
 *                                once, so the token address alone is not a key
 * @property {string} name        the token's symbol, as the row prints it
 * @property {string} address
 * @property {string} chain
 * @property {string} image
 * @property {number} amount
 * @property {string} amountText  `4.91STAMP` — amount and symbol, unspaced, as captured
 * @property {number} valueUsd
 * @property {number} investedUsd  what the buys put in — the capture's "Invested" row
 * @property {number} changePct    the trade's own P&L, which is the figure the row shows
 *
 * @typedef {object} ClosedTrade
 * @property {string} id
 * @property {string} name
 * @property {string} address
 * @property {string} chain
 * @property {string} image
 * @property {number} investedUsd
 * @property {string} ageText
 * @property {string} ageTitle
 * @property {string} avgEntry
 * @property {string} avgExit
 * @property {string} pnlText
 * @property {string} pnlPct
 * @property {boolean} pnlUp
 *
 * @typedef {object} Order
 * @property {"buy"|"sell"} side
 * @property {string} text
 * @property {"buying"|"bought"|"selling"|"sold"|"failed"} state
 * @property {string} age
 */

/**
 * The token picture, keyed on its chain — a trade carries no image, and this is the line the
 * capture's own rows use (`solana_solana_{mint}`, `evm_{chainId}_{address}`). The defined.fi
 * URLs the capture also holds end in a content hash that cannot be reconstructed.
 */
function tokenImage(chain, address) {
  return chain === "SOL"
    ? `https://metadata.mobula.io/assets/logos/solana_solana_${address}.webp`
    : `https://metadata.mobula.io/assets/logos/evm_${chain}_${address}.webp`;
}

/**
 * A row's key: the trade, not the token. One token can be bought, sold and bought again, so
 * two rows can carry the same address — keying on it made Svelte's each block throw on the
 * duplicate (`each_key_duplicate`).
 *
 * @param {string} chain @param {any} trade
 */
function tradeKey(chain, trade) {
  const stamp = trade.createdAtTimestamp ?? trade.updatedAtTimestamp ?? "";
  return `${chain}:${trade.id ?? `${trade.tokenAddress}:${stamp}`}`;
}

/**
 * A number out of an API field, which arrives in one of three shapes: a plain number, an exact
 * decimal as a string, or the backend's `{ source, parsedValue }` wrapper. Reading the wrapper
 * as a number yields 0 — which is how a real position turns into "$0.00" and falls through the
 * dust threshold.
 *
 * @param {unknown} value
 */
function num(value) {
  if (value && typeof value === "object") {
    const inner = /** @type {any} */ (value);
    return num(inner.parsedValue ?? inner.value ?? inner.usd ?? inner.amount);
  }
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

/** `4.91STAMP` — the capture prints the amount and the symbol with no gap. */
function amountText(amount, symbol) {
  return `${Number(amount.toFixed(2))}${symbol}`;
}

/** The capture's own words for a fresh row. */
function ageText(seconds) {
  if (!Number.isFinite(seconds) || seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

/**
 * A live target as the card's chip prints it: `TP1`, `+200%`, `sell 50%`.
 *
 * The wire gives a trigger as one of four kinds, so it is read back into the one thing a chip
 * can say: a multiplier of 3 is a `+200%` rise, a stop of 0.2 is a `-80%` fall. Only live
 * targets are shown — a fired one is history, and belongs with the closed trades.
 *
 * @param {any[]} active the trade's `activeTargets`
 */
function liveTargetChips(active) {
  const counts = { TAKE_PROFIT: 0, STOP_LOSS: 0 };
  return (Array.isArray(active) ? active : [])
    .filter((target) => String(target?.status ?? "LIVE") === "LIVE")
    .map((target) => {
      const kind = String(target?.kind) === "STOP_LOSS" ? "STOP_LOSS" : "TAKE_PROFIT";
      counts[kind] += 1;
      const trigger = target?.trigger ?? {};
      const change = Number(trigger.changePct);
      const multiplier = Number(trigger.multiplier);
      const price = num(trigger.priceUsd);
      const cap = num(trigger.marketCapUsd);
      let label = "—";
      if (trigger.type === "PERCENT" && Number.isFinite(change)) {
        label = `${kind === "STOP_LOSS" ? "-" : "+"}${Number(Math.abs(change).toFixed(2))}%`;
      } else if (trigger.type === "MULTIPLIER" && Number.isFinite(multiplier) && multiplier > 0) {
        // the wire's factor, said the way a chip can: what it moves the price by. Below 1 is a
        // fall and above 1 is a rise, for either kind — only the sign of the arithmetic decides.
        const pct = (multiplier - 1) * 100;
        label = `${pct < 0 ? "-" : "+"}${Number(Math.abs(pct).toFixed(2))}%`;
      } else if (trigger.type === "PRICE" && price) {
        label = formatPrice(price);
      } else if (trigger.type === "MARKET_CAP_USD" && cap) {
        label = `$${formatCompact(cap)} MC`;
      }
      return {
        id: String(target?.id ?? `${kind}:${counts[kind]}`),
        kind,
        tag: `${kind === "STOP_LOSS" ? "SL" : "TP"}${counts[kind]}`,
        label,
        sellPct: Number(target?.sellPct ?? 0),
        /** kept raw: the chart's price lines need the trigger, not just its printed label */
        trigger: trigger ?? null
      };
    });
}

/**
 * One `ActiveTrade` into the shape the rows draw.
 *
 * The P&L the row shows is the trade's own — `pnl.pct` and `pnl.usd` — net of fees, which is
 * what Ombra's panel does too (its `pnl` is gross, so `totalFees` comes off it). `Invested` is
 * `totalBought`, not the current value: the capture's own row prints $3.50 against a $3.49
 * position.
 *
 * @param {any} trade
 * @returns {Position}
 */
/**
 * Levels moved from the chart, keyed by swap id, until the engine's own reads catch up. The trigger
 * POST answers with the new level, but `/v2/trade/active` is read a moment later and still carries
 * the old one — so without this the row is rebuilt from the stale list and the pill flips back.
 */
const pendingDipLevels = new Map();

function toPosition(trade, previous) {
  const merged = previous?.raw ? { ...previous.raw, ...trade } : trade;
  const chain = String(merged.chain ?? "SOL");
  const symbol = merged.tokenSymbol ?? merged.tokenName ?? previous?.name ?? "?";
  const amount = num(merged.tokensRemaining);
  const feesUsd = num(merged.totalFees?.usd);
  return {
    id: tradeKey(chain, merged),
    name: symbol,
    address: merged.tokenAddress,
    chain,
    image: tokenImage(chain, merged.tokenAddress),
    amount,
    amountText: amountText(amount, symbol),
    valueUsd: num(merged.currentValue?.usd),
    investedUsd: num(merged.totalBought?.usd),
    changePct: num(merged.pnl?.pct),
    pnlUsd: num(merged.pnl?.usd) - feesUsd,
    pending: String(merged.status) === "PENDING",
    /** The exit plan the position is actually running, for the card's chips. */
    /**
     * Targets that have already fired. The card shows only what is still armed, so these exist
     * for the chart: a level that was hit is history worth seeing, not something to erase.
     */
    metTargets: liveTargetChips(
      (merged.metTargets ?? []).map((target) => ({ ...target, status: "LIVE" }))
    ).map((chip) => ({ ...chip, met: true })),

    /**
     * The exit plan, read from one place for both the card's pills and the chart's lines. A
     * filled trade reports it as `activeTargets`; a *pending* order has nothing active yet and
     * keeps the plan as the config it will apply on fill, so an unfilled order showed no target
     * pills and no target lines at all.
     */
    liveTargets: (() => {
      const active = liveTargetChips(merged.activeTargets);
      if (active.length) return active;
      return liveTargetChips(
        (merged.settings?.targets ?? []).map((config, index) => ({
          id: `config:${index}`,
          kind: config?.kind,
          sellPct: config?.sellPct,
          status: "LIVE",
          trigger: config?.trigger
        }))
      );
    })(),
    /**
     * What the chart's target lines are measured from: the trade's own entry, in both of the
     * chart's two modes. `avgEntryMcap` is 0 until a buy confirms, so a waiting order draws
     * nothing rather than a line at zero.
     */
    /**
     * A resting dip, as one blue pill beside the exit plan: the condition it waits for, and
     * what it will spend when it fires. `PendingTradeSwap` keeps the amount as a typed value,
     * so only the USD kind can be printed here.
     */
    dipPill: (() => {
      const pending = (merged.pendingSwaps ?? []).find((swap) => swap?.side === "BUY");
      const strategy = pending?.strategy ?? {};
      const pct = strategy.type === "DIP" ? Math.abs(num(strategy.dipPct)) : 0;
      /** A dip we placed is stored as its level, so the level is what there is to show. */
      const stored = strategy.type === "LIMIT" ? num(strategy.priceUsd) : 0;
      // a level moved a moment ago outranks the stored one until the reads agree
      const swapId = Number(pending?.id);
      const moved = pendingDipLevels.get(swapId) ?? 0;
      if (moved > 0 && Math.abs(stored - moved) < 1e-12) pendingDipLevels.delete(swapId);
      const priceUsd = moved > 0 ? moved : stored;
      if (!(pct > 0) && !(priceUsd > 0)) return null;
      const snapshot = getToken() ?? {};
      const supply = num(snapshot.totalSupply ?? snapshot.quote?.totalSupply);
      const levelMcap = priceUsd > 0 && supply > 0 ? priceUsd * supply : 0;
      const amount = pending?.amount ?? {};
      const spent =
        amount.type === "USD" && num(amount.value) > 0 ? `buy $${num(amount.value).toFixed(2)}` : "buy";
      return {
        id: `dip:${pending?.id ?? pct}`,
        kind: "DIP",
        tag: "DIP",
        label: pct > 0 ? `-${Number(pct.toFixed(2))}%` : `$${formatCompact(String(levelMcap))} MC`,
        note: spent,
        /**
         * When the order was placed, in seconds. A dip's condition is fixed at that moment — the
         * API gives the swap a `createdAt` and a dedicated endpoint to change a resting trigger,
         * which only makes sense for a stored level — so this is what the chart anchors the line
         * on. Without it the line followed the live price and slid with the market.
         */
        placedAt: Math.floor(Number(pending?.createdAt?.timestamp ?? 0) / 1000),
        /** The engine's own trigger price, when the order carries one — a locked level. */
        triggerPriceUsd: priceUsd > 0 ? priceUsd : 0,
        /** the id the cancel endpoint takes — one swap, exactly as `CancelPendingRequest` defines */
        swapId: Number.isFinite(Number(pending?.id)) ? Number(pending.id) : null,
        trigger: pending?.strategy ?? null
      };
    })(),
    entryPriceUsd: num(merged.avgEntryPrice?.usd),
    entryMcapUsd: num(merged.avgEntryMcap?.usd),
    raw: merged
  };
}

/**
 * One `CompletedTrade` into the closed row.
 *
 * @param {any} trade
 * @returns {ClosedTrade}
 */
function toClosed(trade, previous) {
  const merged = previous?.raw ? { ...previous.raw, ...trade } : trade;
  const chain = String(merged.chain ?? "SOL");
  const symbol = merged.tokenSymbol ?? merged.tokenName ?? previous?.name ?? "?";
  const investedUsd = num(merged.totalBought?.usd);
  const pnlUsd = num(merged.pnl?.usd) - num(merged.totalFees?.usd);
  const pnlPct = num(merged.pnl?.pct);
  // The spec has no `closedAtTimestamp`: a finished trade's own stamp is `updatedAtTimestamp`.
  // Those stamps are milliseconds, so anything past ~1973 seconds has to come down — reading
  // one as seconds put every closed trade in the future, which prints as "Just now".
  const stamp = num(merged.updatedAtTimestamp ?? merged.createdAtTimestamp);
  const closedAt = stamp > 1e11 ? stamp / 1000 : stamp;
  const seconds = closedAt > 0 ? Math.max(0, Math.floor(Date.now() / 1000 - closedAt)) : NaN;
  return {
    id: tradeKey(chain, merged),
    name: symbol,
    address: merged.tokenAddress,
    chain,
    image: tokenImage(chain, merged.tokenAddress),
    investedUsd,
    ageText: ageText(seconds),
    ageTitle: seconds >= 0 ? new Date(closedAt * 1000).toLocaleString() : "",
    avgEntry: merged.avgEntryPrice?.usdStr ? `$${merged.avgEntryPrice.usdStr}` : "—",
    avgExit: merged.avgClosingPrice?.usdStr ? `$${merged.avgClosingPrice.usdStr}` : "—",
    pnlText: `${pnlUsd >= 0 ? "+ " : "- "}$${Math.abs(pnlUsd).toFixed(2)}`,
    pnlPct: `${Math.abs(pnlPct).toFixed(2)}%`,
    pnlUp: pnlUsd >= 0,
    raw: merged
  };
}

let live = $state.raw(null);
let closedLive = $state.raw(null);
/** Totals the tabs count from, and the cursor each page of the list was read with. */
let totals = $state.raw({ active: 0, pending: 0, all: 0, completed: 0 });
/**
 * Two cursors per list, because they mean different things and I had them as one.
 *
 * `*PageCursor` is what a load-more asks for (`nextCursor`). The **window** cursor is where the
 * socket subscription is anchored — the page's own `cursor` — and the client drops any frame
 * whose window it has not acknowledged. Feeding the page cursor into `endCursor` anchored the
 * subscription at a position the server never described, so trade frames were dropped and the
 * P&L never moved.
 */
let activeCursor = $state.raw(null);
let completedCursor = $state.raw(null);
let activeWindowCursor = $state.raw(null);
let completedWindowCursor = $state.raw(null);
const seenCursors = new Set();
/** Trades the server has said are finished: a late frame must not put one back. */
const completedIds = new Set();
/** Only the newest read may write, so an overlapping poll cannot overwrite it. */
let generation = 0;
let loading = $state(false);
let error = $state("");
/** @type {Order | null} */
let order = $state(null);
let orderTimer = 0;
/** The notice this trade owns, so a fill upgrades it instead of stacking a second one. */
let orderToast = 0;
let cash = $state(0);
/** The network fee the card prints once an amount is in play (ombra's fee estimate). */
let fee = $state.raw(null);
let started = false;

/**
 * The rows the card draws: the account's while there is a session, and none when there is not.
 * A read that failed leaves them empty too (`reloadTrades`), rather than somebody else's
 * positions — the capture's own rows belonged to no reader.
 */
function rows() {
  if (!getAuthToken()) return [];
  return live ?? [];
}

/** @returns {ClosedTrade[]} */
function closedRows() {
  if (!getAuthToken()) return [];
  return closedLive ?? [];
}

/**
 * The chain this app reads and trades on. SOL only, and its buys are funded from USDC — the
 * pairing the spec calls for when `buyWith` is `FIAT`.
 */
function appChain() {
  return "SOL";
}

/**
 * The order row. `apply` runs when the request comes back — the capture's numbers move when
 * the row turns into its tick, not when the button is pressed.
 *
 * @param {"buy"|"sell"} side
 * @param {string} text
 * @param {() => Promise<void>} apply
 */
async function placeOrder(side, text, apply) {
  if (orderTimer) clearTimeout(orderTimer);
  order = { side, text, state: side === "buy" ? "buying" : "selling", age: "Just now" };
  // Ombra's wording: a submitted notice, then the same notice confirmed — one per trade.
  orderToast = addToast("info", side === "buy" ? "Buy Submitted" : "Sell Submitted",
    side === "buy" ? `Buying ${text}` : `Selling ${text}`, 0);
  try {
    await apply();
    // A 200 is *acceptance*, not a fill. Only the socket's SWAP_CONFIRMED/SWAP_FINALIZED may
    // turn this row into "Bought" — claiming it here told the reader a trade had filled when
    // the swap could still fail. The submitted notice stands until then.
    error = "";
  } catch (failure) {
    const said = failure instanceof Error ? failure.message : String(failure);
    order = { side, text, state: "failed", age: "Just now" };
    error = said;
    updateToast(orderToast, {
      type: "error",
      title: side === "buy" ? "Buy Failed" : "Sell Failed",
      message: said,
      duration: 6000
    });
    console.warn("[trade] order failed", failure);
  }
  orderTimer = setTimeout(() => (order = null), 4000);
}

export function activeOrder() {
  return order;
}

export function tradeError() {
  return error;
}

export function clearTradeError() {
  error = "";
}

export function isLoadingTrades() {
  return loading;
}

export function isTrading() {
  return started;
}

/**
 * The network fee for this chain, one read — ombra also keeps it live on `fee-estimate:{chain}`,
 * which is more than a card that prints one number needs.
 */
export async function reloadFee() {
  if (!getAuthToken()) {
    fee = null;
    return;
  }
  // `type` is required (a GasPreset, not optional as I first assumed — the API answers 400
  // without it). The tier is the one a buy would send; a custom priority fee has no tier to ask
  // the estimate for, so that falls back to AUTO.
  const tier = GAS_PRESETS.includes(tradeSettingsState.buyGas) ? tradeSettingsState.buyGas : AUTO;
  const { data, error: failure } = await api.GET("/v2/trade/{chain}/fee-estimate", {
    params: { path: { chain: appChain() }, query: { type: tier } }
  });
  fee = failure ? null : (data ?? null);
}

/** The fee as the card prints it, or null when there is nothing to print. */
export function tradeFee() {
  return fee;
}

/** The funding pot: the chain's USD stablecoin, the only thing a buy here can spend. */
export function cashAvailable() {
  // the capture's own balance is not ours to lend: signed out there is no cash to show or spend
  return getIsLoggedIn() ? cash : 0;
}

/** @param {number} next */
export function setCash(next) {
  cash = next;
}

/**
 * What the list shows, and what goes behind "Show dust".
 *
 * An order that has not filled yet holds no tokens, so its value is 0 — grouping that as dust
 * would file a pending buy away with the leftovers. Only a filled position can be dust.
 *
 * @returns {Position[]}
 */
export function openPositions() {
  return rows().filter((held) => held.pending || held.valueUsd >= DUST_USD);
}

/** @returns {Position[]} */
export function dustPositions() {
  return rows().filter((held) => !held.pending && held.valueUsd < DUST_USD);
}

/** The counts the panel's tabs read. */
export function tradeTotals() {
  return totals;
}

/** A read that has more pages behind it. */
export function hasMoreTrades() {
  return { open: !!activeCursor, closed: !!completedCursor };
}

/** @param {string} address @returns {Position[]} */
export function positionsFor(address) {
  return rows().filter((held) => held.address === address);
}

/** @returns {ClosedTrade[]} */
export function closedPositions() {
  return closedRows();
}

/**
 * Read the first page of both lists.
 *
 * The API pages at 20, so a read is a *merge* by id rather than a replacement: replacing threw
 * away every row past the first page on each poll, which is why positions used to disappear a
 * minute after they appeared. The generation guards a read that lands after a newer one.
 */
/**
 * Move a resting buy's trigger. The engine answers with the whole trade, so the row and the
 * chart take their new level from the same response the list would have given anyway.
 */
async function reloadTradeTrigger(address, swapId, strategy) {
  try {
    const result = await api.POST("/v2/trade/{chain}/{token}/pending-buy/{swap_id}/trigger", {
      params: { path: { chain: appChain(), token: address, swap_id: swapId } },
      body: { strategy }
    });
    if (result.error) throw new Error(errorMessage(result.error));
    const trade = result.data?.trade;
    if (trade) patchPosition(trade);
    return true;
  } catch (failure) {
    addToast("error", "Dip not updated", failure instanceof Error ? failure.message : String(failure), 8000);
    void reloadTrades();
    return false;
  }
}

/**
 * Move a resting dip to a new level, from the chart. The caller converts the chart's own units
 * into the price the order stores.
 */
export async function moveDipLevel({ address, swapId, priceUsd }) {
  const price = Number(priceUsd);
  if (!(price > 0)) return false;
  // The POST answers with the updated trade and `reloadTradeTrigger` patches it in. The list read
  // that follows still carries the old level for a moment, so this move is held until it agrees.
  const ok = await reloadTradeTrigger(address, Number(swapId), { type: "LIMIT", priceUsd: price });
  if (ok) pendingDipLevels.set(Number(swapId), price);
  return ok;

}

/**
 * Move a sell target to a new level, from the chart. Our rows only ever express a percent
 * trigger, so a drag is a percent change against the entry — the same shape the exit-plan rows
 * send, so the two paths cannot disagree about what a target is.
 */
export async function moveTargetLevel({ address, id, kind, sellPct, changePct }) {
  const isStop = kind === "STOP_LOSS";
  const wanted = Math.abs(Number(changePct));
  if (!Number.isFinite(wanted) || wanted <= 0) return false;
  /**
   * The engine stores a percent to a fixed precision and refuses anything finer — "target.changePct
   * has more precision than target storage supports". Observed: one decimal. A drag to 29.515 is
   * answered 400, 29.52 likewise, and 29.5 is accepted. So the ladder starts there rather than
   * asking three times, and a whole number is the fallback if that ever changes.
   */
  let lastMessage = "Target not moved";
  for (const places of [1, 0]) {
    const pct = Number(wanted.toFixed(places));
    if (!(pct > 0)) break;
    if (isStop && pct >= 100) break;
    const config = {
      kind: isStop ? "STOP_LOSS" : "TAKE_PROFIT",
      sellPct: Number(sellPct),
      trigger: { type: "PERCENT", changePct: pct }
    };
    if (isStop) config.mode = "NORMAL";
    try {
      const result = await api.POST("/v2/trade/{chain}/{token}/targets/update/{id}", {
        params: { path: { chain: appChain(), token: address, id: String(id) } },
        body: config
      });
      if (result.error) {
        lastMessage = errorMessage(result.error);
        // only a precision complaint is worth answering with a coarser number
        if (places > 0 && /precision/i.test(lastMessage)) continue;
        throw new Error(lastMessage);
      }
      const trade = result.data?.trade;
      if (trade) patchPosition(trade);
      return true;
    } catch (failure) {
      lastMessage = failure instanceof Error ? failure.message : String(failure);
      if (places > 0 && /precision/i.test(lastMessage)) continue;
      break;
    }
  }
  addToast("error", "Target not moved", lastMessage, 8000);
  void reloadTrades();
  return false;
}

/** The dips whose cancel is out, so a pill can spin and a second tap cannot send twice. */
let cancellingSwaps = $state.raw(new Set());

/** Whether this swap's cancel is already in flight. */
export function isCancellingSwap(swapId) {
  return cancellingSwaps.has(Number(swapId));
}

function releaseCancelling(swapId) {
  if (!cancellingSwaps.has(swapId)) return;
  const next = new Set(cancellingSwaps);
  next.delete(swapId);
  cancellingSwaps = next;
}

/**
 * Cancel a resting dip. `POST /v2/trade/{chain}/{token}/cancel` takes one swap id and a 200 is
 * only an acceptance — the frame is what confirms it, and that is what removes the swap and its
 * pill. A request that never lands releases the id and says so with the server's own words.
 */
export async function cancelPendingSwap({ chain, address, swapId }) {
  const id = Number(swapId);
  console.info("[cancel] called " + JSON.stringify({ swapId, id, finite: Number.isFinite(id), already: cancellingSwaps.has(id), auth: !!getAuthToken(), address, chain }));
  if (!Number.isFinite(id) || cancellingSwaps.has(id)) return;
  cancellingSwaps = new Set(cancellingSwaps).add(id);
  if (!getAuthToken()) {
    releaseCancelling(id);
    return;
  }
  try {
    const result = await api.POST("/v2/trade/{chain}/{token}/cancel", {
      params: { path: { chain: chain ?? appChain(), token: address } },
      body: { swapId: id }
    });
    console.info("[cancel] response " + JSON.stringify({ error: result.error ?? null, status: result.response?.status ?? null }));
    if (result.error) throw new Error(errorMessage(result.error));
  } catch (failure) {
    console.info("[cancel] failed " + (failure instanceof Error ? failure.message : String(failure)));
    releaseCancelling(id);
    addToast("error", "Cancel Failed", failure instanceof Error ? failure.message : String(failure), 8000);
    void reloadTrades();
  }
}

export async function reloadTrades() {
  if (!getAuthToken()) {
    live = null;
    closedLive = null;
    return;
  }
  const mine = ++generation;
  loading = true;
  // No chain filter, and that is not a detail. A cursor is only valid for the key it was issued
  // for: reading `?chain=SOL` and then subscribing with the cursor alone makes the server answer
  // `PARAMS_INVALID: invalid user trades endCursor`, and the window never opens. Ombra's panel
  // reads unfiltered (`fetchActiveTrades()` with no chain) and subscribes with `{ endCursor }`,
  // which is why its cursors agree.
  const [active, closed] = await Promise.all([
    api.GET("/v2/trade/active"),
    api.GET("/v2/trade/completed")
  ]);
  if (mine !== generation) return;
  if (active.error || closed.error) {
    // Empty, not the capture's rows: a signed-in reader whose read failed must not be shown a
    // dust holding and a closed trade that are not theirs.
    live = [];
    closedLive = [];
    error = "Could not read your positions";
    loading = false;
    return;
  }
  const activeRows = (active.data?.trades ?? []).map((t) => toPosition(t));
  const closedRowsNow = (closed.data?.trades ?? []).map((t) => toClosed(t));
  closedRowsNow.forEach((row) => completedIds.add(row.id));
  live = mergeById(activeRows.filter((row) => !completedIds.has(row.id)), []);
  closedLive = mergeById(closedRowsNow, []);
  totals = {
    active: active.data?.totalActiveCount ?? activeRows.length,
    pending: active.data?.totalPendingCount ?? 0,
    all: active.data?.totalCount ?? activeRows.length,
    completed: closed.data?.totalCount ?? closedRowsNow.length
  };
  // the page's own cursor anchors the socket window; `nextCursor` is what a load-more asks for
  activeWindowCursor = active.data?.cursor ?? null;
  completedWindowCursor = closed.data?.cursor ?? null;
  activeCursor = active.data?.nextCursor ?? null;
  completedCursor = closed.data?.nextCursor ?? null;
  seenCursors.clear();
  error = "";
  loading = false;
}

/** The next page of open positions, appended to what is already here. */
export async function loadMoreOpen() {
  if (!activeCursor || !getAuthToken() || seenCursors.has(activeCursor)) return;
  const requested = activeCursor;
  seenCursors.add(requested);
  const mine = generation;
  const { data, error: failure } = await api.GET("/v2/trade/active", {
    params: { query: { cursor: requested } }
  });
  if (failure || mine !== generation) {
    seenCursors.delete(requested);
    return;
  }
  live = mergeById((data?.trades ?? []).map((t) => toPosition(t)), live ?? []);
  activeCursor = data?.nextCursor ?? null;
  activeWindowCursor = data?.cursor ?? activeWindowCursor;
}

/** The next page of closed trades. */
export async function loadMoreClosed() {
  if (!completedCursor || !getAuthToken() || seenCursors.has(completedCursor)) return;
  const requested = completedCursor;
  seenCursors.add(requested);
  const mine = generation;
  const { data, error: failure } = await api.GET("/v2/trade/completed", {
    params: { query: { cursor: requested } }
  });
  if (failure || mine !== generation) {
    seenCursors.delete(requested);
    return;
  }
  closedLive = mergeById((data?.trades ?? []).map((t) => toClosed(t)), closedLive ?? []);
  completedCursor = data?.nextCursor ?? null;
  completedWindowCursor = data?.cursor ?? completedWindowCursor;
}

/** Newest first, by id, with the incoming row winning a clash. */
function mergeById(incoming, existing) {
  const byId = new Map();
  for (const row of existing) byId.set(row.id, row);
  for (const row of incoming) byId.set(row.id, row);
  return [...byId.values()];
}

/**
 * The smallest buy this app will send. Ombra reads it from settings; the capture's own card
 * prints it as `Minimum amount $2` and validates with it, so it is the same number here — and
 * it lives in the store because the quick chips call `buy` directly, bypassing the card.
 */
const MIN_USD = 2;

/**
 * A trade needs a managed wallet on the chain. Ombra checks this before the request so the
 * reader is told what is missing rather than handed the server's version of it.
 */
function assertTradable(chain) {
  if (!getAuthToken()) return;
  if (accountWallets().some((wallet) => wallet.chain === chain)) return;
  throw new Error(`No managed wallet found for ${chain}`);
}

/** What the API said went wrong, in the words it used. */
function errorMessage(payload) {
  if (!payload) return "The trade was refused";
  const said = payload.message ?? payload.error ?? payload.detail?.message ?? payload.title ?? payload.detail;
  return typeof said === "string" && said ? said : "The trade was refused";
}

/**
 * The exit plan's share words. `sellPct` is a percentage of the tokens still held — never a
 * token count and never dollars — so the word is the whole meaning: half is 50, all is 100.
 */
export const TARGET_SHARES = { half: 50, quarter: 25, all: 100 };

/** @param {string|number} share */
export function shareSellPct(share) {
  // own property, not `in`: a word like `toString` is on Object's prototype, not in the plan
  if (Object.hasOwn(TARGET_SHARES, share)) return TARGET_SHARES[share];
  const value = Number(share);
  return Number.isFinite(value) ? value : NaN;
}

/** The word a server `sellPct` reads back as, or null when it is some other percentage. */
export function sellPctShare(sellPct) {
  const value = Number(sellPct);
  return Object.keys(TARGET_SHARES).find((word) => TARGET_SHARES[word] === value) ?? null;
}

/** The row's own name, for the notice a refused row puts up. */
function targetName(kind) {
  return kind === "STOP_LOSS" ? "Stop loss" : "Take profit";
}

/**
 * One exit-plan row into a `TradeTargetConfig`, or the reason it is not one.
 *
 * A row whose percent box is empty is simply **not part of the plan** — `{ config: null }`, no
 * target and no complaint. A row with a percent that cannot be sent is an error the caller has
 * to say out loud: ombra drops such a row on the floor (`trade.svelte.ts:995-999`) and the
 * reader is never told, which is the bug this refuses to copy.
 *
 * Direction is the `kind`'s, never a sign: a take profit rises, a stop loss falls, and ombra
 * sends the percent change absolute. So the `+`/`−` dressing on the card chooses the kind and
 * the number that goes on the wire is positive either way.
 *
 * @param {"TAKE_PROFIT"|"STOP_LOSS"} kind
 * @param {{ share?: string|number, pct?: string|number, mode?: "NORMAL"|"TRAILING" }} row
 * @returns {{ config?: any, error?: string }}
 */
export function exitPlanTarget(kind, row) {
  const sellPct = shareSellPct(row?.share);
  if (!Number.isFinite(sellPct) || sellPct <= 0 || sellPct > 100) {
    return { error: `${targetName(kind)}: sell half, quarter or all of the position` };
  }
  const typed = String(row?.pct ?? "").trim();
  if (!typed) return { config: null };
  const changePct = Number(typed);
  if (!Number.isFinite(changePct) || changePct <= 0) {
    return { error: `${targetName(kind)} needs a percent above 0` };
  }
  // the spec's own bound: a stop-loss percent change must be less than 100
  if (kind === "STOP_LOSS" && changePct >= 100) {
    return { error: "A stop loss must be under 100%" };
  }
  const trigger = { type: "PERCENT", changePct: Math.abs(changePct) };
  const mode = row?.mode === "TRAILING" ? "TRAILING" : "NORMAL";
  return {
    config: kind === "STOP_LOSS" ? { kind, sellPct, trigger, mode } : { kind, sellPct, trigger }
  };
}

/**
 * The whole exit plan, take profit first, as the buy body carries it.
 *
 * @param {{ takeProfit?: any, stopLoss?: any }} plan
 * @returns {{ targets?: any[], error?: string }}
 */
export function exitPlanTargets(plan) {
  const targets = [];
  for (const [kind, row] of [["TAKE_PROFIT", plan?.takeProfit], ["STOP_LOSS", plan?.stopLoss]]) {
    if (!row) continue;
    const { config, error } = exitPlanTarget(kind, row);
    if (error) return { error };
    if (config) targets.push(config);
  }
  return { targets };
}

/** Whether a row already says exactly what the server's live target says. */
function sameTarget(live, wanted) {
  if (!live || live.kind !== wanted.kind) return false;
  if (Number(live.sellPct) !== Number(wanted.sellPct)) return false;
  if ((live.mode ?? "NORMAL") !== (wanted.mode ?? "NORMAL")) return false;
  const a = live.trigger ?? {};
  const b = wanted.trigger ?? {};
  if (a.type !== b.type) return false;
  switch (b.type) {
    case "PERCENT":
      return Math.abs(Number(a.changePct)) === Math.abs(Number(b.changePct));
    case "MULTIPLIER":
      return Number(a.multiplier) === Number(b.multiplier);
    case "PRICE":
      return Number(a.priceUsd) === Number(b.priceUsd);
    case "MARKET_CAP_USD":
      return Number(a.marketCapUsd) === Number(b.marketCapUsd);
    default:
      return false;
  }
}

/**
 * The buy's own trigger, in the spec's own shape (`BuyStrategy`, `v2.d.ts:4550`): a market order
 * that runs right away, or a dip that waits for a fall of `dipPct` — a **positive**
 * percentage-point drop, above 0 and at most 100 (`ChangePercent`).
 *
 * A chip shows `−50%`; the wire carries `50`. The direction lives in the type, never in the sign,
 * so the number is made positive here rather than trusted to arrive that way. The spec also caps
 * the resolution at 0.001 percentage points, which `decimalsOf` is the same check `isSlippage`
 * already makes.
 *
 * @param {any} strategy
 * @returns {any | null} the value to send, or null for one that cannot honestly be sent
 */
function checkedStrategy(strategy) {
  if (strategy?.type === "MARKET") return { type: "MARKET" };
  if (strategy?.type === "LIMIT") {
    const priceUsd = Number(strategy.priceUsd);
    // the engine holds this number, so it has to be a real one before it is sent
    if (Number.isFinite(priceUsd) && priceUsd > 0) return { type: "LIMIT", priceUsd };
  }
  if (strategy?.type === "DIP") {
    const dipPct = Math.abs(Number(strategy.dipPct));
    if (Number.isFinite(dipPct) && dipPct > 0 && dipPct <= 100 && decimalsOf(dipPct) <= 3) {
      return { type: "DIP", dipPct };
    }
  }
  return null;
}

/** The body a manual buy sends: USD in, funded from the stablecoin, the trigger the chip chose,
 *  and the gas, slippage and anti-MEV the dialog holds — one `TradeSettings` with the exit plan
 *  beside them. With `Now` and no exit-plan rows this is the plain market buy it always was. */
function buyBody(usd, targets = [], strategy = { type: "MARKET" }) {
  return {
    amount: { type: "USD", value: Number(usd.toFixed(2)) },
    buyWith: BUY_WITH,
    strategy,
    settings: { ...tradeSettingsState, targets }
  };
}

/**
 * Fold a trade the API handed back into the rows, by id.
 *
 * A completed trade leaves the open list and joins the closed one — which is what turns the
 * token page's "Closed trades" section on the moment a sell lands.
 *
 * @param {Position} position
 */
/**
 * Fold a trade into the open rows. `trade` is whatever the API or a frame gave us — often not
 * the whole trade — and it is merged onto the row already held, newest first.
 *
 * @param {any} trade
 */
function patchPosition(trade) {
  const open = live ?? [];
  const key = tradeKey(String(trade.chain ?? appChain()), trade);
  // a late frame must not put a finished trade back into the open list
  if (completedIds.has(key)) return;
  const existing = open.find((held) => held.id === key);
  const next = toPosition(trade, existing);
  // A price tick must not shuffle the list: an update keeps its row's position, and only a
  // trade we have not seen goes to the top. Ombra's upsert does the same.
  live = existing
    ? open.map((held) => (held.id === key ? next : held))
    : [next, ...open];
}

/** @param {ClosedTrade} row */
/** @param {any} trade */
function patchClosed(trade) {
  const key = tradeKey(String(trade.chain ?? appChain()), trade);
  const closed = closedLive ?? [];
  const existing = closed.find((held) => held.id === key);
  const row = toClosed(trade, existing);
  completedIds.add(key);
  live = (live ?? []).filter((held) => held.id !== key);
  closedLive = [row, ...closed.filter((held) => held.id !== key)];
  if (!existing) totals = { ...totals, completed: totals.completed + 1 };
}

/**
 * A buy. The order row reports it, and the position moves when the order comes back — a 200
 * here means accepted, so the row's own lifecycle is the only thing that says "done".
 *
 * `targets` is the card's exit plan, already built by `exitPlanTargets`. It rides the buy's own
 * `settings.targets` — a `TradeTargetConfig` list, not live targets — so a take profit and a
 * stop loss can be in place from the first fill. The store does not re-derive it: a target that
 * is not one is refused here rather than quietly dropped.
 *
 * `strategy` is the chip: `{ type: "MARKET" }` for `Now`, `{ type: "DIP", dipPct }` for a percent.
 * One the spec would refuse stops the buy instead of being replaced with a market order, so a
 * "Buy on a −50% dip" can never quietly become a buy at the current price.
 *
 * @param {{ name: string, address: string, chain?: string, usd: number, targets?: any[], strategy?: any }} input
 */
export function buy({ name, address, chain, usd, targets = [], strategy = { type: "MARKET" } }) {
  /**
   * Signed out there is no account to buy for, so the press is a request for the connect sheet
   * and nothing else — no order row, no notice, no local move.
   */
  if (!getAuthToken()) {
    requestConnect();
    return;
  }
  /**
   * One waiting order per trade. While a dip rests the UI closes buying; this is the backstop,
   * so no path can quietly stack a second resting order.
   */
  if ((live ?? []).find((held) => held.address === address)?.dipPill) {
    addToast("warning", "Dip resting", "Cancel the resting dip before buying again", 5000);
    return;
  }
  void placeOrder("buy", `$${usd.toFixed(2)}${name}`, async () => {
    if (!(usd >= MIN_USD)) throw new Error(`Minimum amount $${MIN_USD}`);
    const rounded = Number(usd.toFixed(2));
    if (!(rounded > 0)) throw new Error("Invalid amount");
    for (const target of targets) {
      const sellPct = Number(target?.sellPct);
      const trigger = target?.trigger;
      if (!trigger?.type || !Number.isFinite(sellPct) || sellPct <= 0 || sellPct > 100) {
        throw new Error("Invalid exit plan");
      }
    }
    // the trigger the chip chose, checked before the request rather than sent on trust
    const wanted = checkedStrategy(strategy);
    if (!wanted) throw new Error("A dip must be above 0% and at most 100%");
    /**
     * A dip is a **fixed level**, not a live percentage. The user asks for "10% down"; what the
     * engine needs is the price that equals it, measured from the price now, because a level
     * that follows the market can never be reached by the market falling. The level goes on the
     * wire as a `LIMIT`, which is why it can be read back — and drawn — without drift.
     */
    let sent = wanted;
    if (wanted.type === "DIP") {
      const snapshot = getToken() ?? {};
      const priceNow = Number(snapshot.quote?.priceUsdStr ?? 0);
      if (!(priceNow > 0)) throw new Error("No price to measure the dip against");
      sent = { type: "LIMIT", priceUsd: priceNow * (1 - wanted.dipPct / 100) };
    }

    /**
     * A trade keeps one resting buy, so a second dip **moves that order's level** instead of
     * stacking another one — the same rule as editing a target rather than adding one. The
     * engine exposes exactly this: `pending-buy/{swap_id}/trigger`, whose body is the strategy.
     */
    if (wanted.type === "DIP") {
      const resting = (positionsFor(address)[0]?.raw?.pendingSwaps ?? []).find(
        (swap) => swap?.side === "BUY"
      );
      if (resting?.id) {
        const updated = await reloadTradeTrigger(address, resting.id, sent);
        if (updated) return;
      }
    }
    assertTradable(chain ?? appChain());
    // the gas, slippage and anti-MEV ride this buy, so they are checked before it is sent
    const refused = tradeSettingsError(tradeSettingsState);
    if (refused) throw new Error(refused);
    const result = await api.POST("/v2/trade/{chain}/{token}/buy", {
      // the app trades on one chain: a caller's chain string is never allowed to reach the
      // path, since a lowercase `solana` is not a `Chain` and the request would 400
      params: { path: { chain: appChain(), token: address } },
      body: buyBody(usd, targets, sent)
    });
    if (result.error) throw new Error(errorMessage(result.error));
    const trade = result.data?.trade;
    if (trade) patchPosition(trade);
  });
}

/**
 * Edit the exit plan of a position that already exists.
 *
 * The rows are the card's two: take profit and stop loss. Each may still carry the id of the
 * live target it was seeded from, and the diff is against the server's own `activeTargets`, so
 * only a row that actually changed is spoken about:
 *
 *   - a row with a percent and no target yet      -> `targets/add`
 *   - a row with a percent that differs           -> `targets/update/{id}`
 *   - a row emptied of its percent                -> `targets/remove/{id}`
 *   - a row that already matches the server       -> nothing
 *
 * then the trade's settings minus `targets`, in ombra's order (`PositionsPanel.svelte:324-381`).
 * A row that cannot be sent stops the whole commit and says why — never a silent drop.
 *
 * The notice the reader sees is the server's own: `TARGET_ADDED` / `TARGET_UPDATED` /
 * `TARGET_REMOVED`, handled off the socket below.
 *
 * @param {{ address: string, takeProfit?: any, stopLoss?: any }} input
 */
export async function commitPositionTargets({ address, takeProfit, stopLoss }) {
  if (!getAuthToken()) return { changed: false };
  const position = (live ?? []).find((held) => held.address === address);
  if (!position) return { changed: false };
  const chain = appChain();
  const raw = position.raw ?? {};
  const liveTargets = (raw.activeTargets ?? []).filter((target) => target.status === "LIVE");
  /** Removals first, then the adds and updates, the way ombra's save runs them. */
  const removals = [];
  /** @type {Array<{ op: "add"|"update", id?: string, config: any }>} */
  const changes = [];
  for (const [kind, row] of [["TAKE_PROFIT", takeProfit], ["STOP_LOSS", stopLoss]]) {
    const { config, error } = exitPlanTarget(kind, row);
    if (error) {
      addToast("warning", `${targetName(kind)} not saved`, error, 5000);
      return { changed: false };
    }
    // only the row's own target is touched: a live target of another trigger type (a multiple,
    // a price, a market cap) was never shown in the percent box, so it is left exactly as it is
    /**
     * Which live target this row owns. The remembered id is the first choice, but a row can lose
     * it — the sell side sets `tpPct` without an id, and a card seeded before a commit never
     * learns the new one — and then the row looked unowned and the commit **added a second
     * target** instead of updating the first. Since these rows only ever express a percent
     * trigger, the kind's own percent target is the fallback, and it needs no memory.
     */
    const owned =
      (row?.id ? liveTargets.find((target) => target.id === row.id) : null) ??
      liveTargets.find((target) => target.kind === kind && target.trigger?.type === "PERCENT");
    if (!config) {
      if (owned) removals.push(owned.id);
      continue;
    }
    if (!owned) changes.push({ op: "add", config });
    else if (!sameTarget(owned, config)) changes.push({ op: "update", id: owned.id, config });
  }
  if (!removals.length && !changes.length) return { changed: false };
  try {
    let trade = null;
    for (const id of removals) {
      const result = await api.DELETE("/v2/trade/{chain}/{token}/targets/remove/{id}", {
        params: { path: { chain, token: address, id } }
      });
      if (result.error) throw new Error(errorMessage(result.error));
      trade = result.data?.trade ?? trade;
    }
    for (const change of changes) {
      const result =
        change.op === "update"
          ? await api.POST("/v2/trade/{chain}/{token}/targets/update/{id}", {
              params: { path: { chain, token: address, id: /** @type {string} */ (change.id) } },
              // a bare TradeTargetConfig, not a wrapper
              body: change.config
            })
          : await api.POST("/v2/trade/{chain}/{token}/targets/add", {
              params: { path: { chain, token: address } },
              body: change.config
            });
      if (result.error) throw new Error(errorMessage(result.error));
      trade = result.data?.trade ?? trade;
    }
    // the trade's settings minus `targets`, and nothing invented: the target list was just
    // spoken for by the calls above
    const stored = raw.settings ?? {};
    const settings = {
      antiMev: !!stored.antiMev,
      buyGas: stored.buyGas ?? AUTO,
      buySlippagePct: stored.buySlippagePct ?? AUTO,
      sellGas: stored.sellGas ?? AUTO,
      sellSlippagePct: stored.sellSlippagePct ?? AUTO
    };
    const result = await api.POST("/v2/trade/{chain}/{token}/settings", {
      params: { path: { chain, token: address } },
      body: settings
    });
    if (result.error) throw new Error(errorMessage(result.error));
    if (trade) patchPosition(trade);
    await reloadTrades();
    return { changed: true };
  } catch (failure) {
    const said = failure instanceof Error ? failure.message : String(failure);
    addToast("error", "Exit plan not saved", said, 6000);
    // whatever the server did take is the truth now, so the rows go back to it
    await reloadTrades();
    return { changed: false, error: said };
  }
}

/**
 * A sell, by percent of what is held. The body is `{ pct }` and nothing else: gas, slippage
 * and anti-MEV come from the trade's own saved settings.
 *
 * @param {{ name: string, address: string, pct: number }} input
 */
export function sell({ name, address, pct }) {
  /** The same door as the buy: signed out this asks for the connect sheet and does nothing. */
  if (!getAuthToken()) {
    requestConnect();
    return;
  }
  const held = (live ?? []).find((item) => item.address === address);
  // the amount this sale moves, not the whole holding: half of 4.91 is 2.46
  const sold = held ? Number(((held.amount * pct) / 100).toFixed(2)) : null;
  const text = held ? `${sold}${held.name || name}` : `${pct}%`;
  void placeOrder("sell", text, async () => {
    assertTradable(held?.chain ?? appChain());
    const result = await api.POST("/v2/trade/{chain}/{token}/sell", {
      params: { path: { chain: appChain(), token: address } },
      // no rounding: a fractional percentage is legal, and 33.3 must not become 33
      body: { pct: Math.min(100, Math.max(1, pct)) }
    });
    if (result.error) throw new Error(errorMessage(result.error));
    const trade = result.data?.trade;
    if (!trade) return;
    if (String(trade.status) === "COMPLETED") {
      const key = tradeKey(String(trade.chain ?? "SOL"), trade);
      live = (live ?? []).filter((item) => item.id !== key);
      patchClosed(trade);
      return;
    }
    patchPosition(trade);
  });
}

/**
 * The live half. Ombra has no polling: the positions arrive as frames on two windowed topics,
 * opened at the cursor of the page that was just read, and private updates ride the `user`
 * topic. A reconnect skips the client's own re-subscribe (`recovery: 'refetch'`) and comes back
 * here instead, so a fresh page is read and the subscription re-opened at its cursor — the gap
 * is then covered by that read, not missed.
 */
const ORDER_STATE = {
  BUY_CREATED: "buying",
  SELL_CREATED: "selling",
  BUY_SUBMITTED: "buying",
  SELL_SUBMITTED: "selling",
  SWAP_SUBMITTED: null,
  SWAP_CONFIRMED: "filled",
  SWAP_QUICK_CONFIRM: "filled",
  SWAP_FINALIZED: "filled",
  SWAP_FAILED: "failed",
  TRADE_UPDATE_ERROR: "failed",
  TRADE_CANCEL_CONFIRMED: "cancelled",
  TRADE_ABORT_CONFIRMED: "cancelled"
};

function settleOrder(state, side) {
  if (!order) return;
  const filled = state === "filled";
  const failed = state === "failed" || state === "cancelled";
  const next = filled
    ? order.side === "buy" ? "bought" : "sold"
    : state === "cancelled" ? "cancelled"
    : failed ? "failed"
    : side === "sell" ? "selling" : "buying";
  order = { ...order, state: next, age: "Just now" };
  if (filled || failed) {
    if (orderTimer) clearTimeout(orderTimer);
    orderTimer = setTimeout(() => (order = null), 4000);
  }
}

/**
 * A snapshot of a whole list, merged by id. `tradeScope` says which list it is authoritative
 * for; the rows are keyed the same way everywhere (chain and the trade's id).
 */
function onTradesFrame(event, data, topic, meta) {
  if (event !== "USER_TRADES" && event !== "USER_TRADES_UPDATE") return;
  if (event === "USER_TRADES_UPDATE") return onTradesUpdate(event, data, topic, meta);
  // the topic is the authority, the way ombra reads it; `tradeScope` is the same answer twice
  const scope = topic === "trades:completed" ? "COMPLETED" : topic === "trades:active" ? "ACTIVE" : meta?.tradeScope;
  if (scope === "COMPLETED") {
    const rowsNow = (data?.trades ?? []).map((t) => toClosed(t));
    rowsNow.forEach((row) => completedIds.add(row.id));
    closedLive = mergeById(rowsNow, closedLive ?? []);
    const done = new Set(rowsNow.map((row) => row.id));
    live = (live ?? []).filter((held) => !done.has(held.id));
    return;
  }
  const rowsNow = (data?.trades ?? []).map((t) => toPosition(t));
  // a completed trade never comes back into the open list, even if a stale frame names it
  live = mergeById(rowsNow.filter((row) => !completedIds.has(row.id)), live ?? []);
}

/**
 * A delta: the removed ids first, then whatever changed — through the same funnel as every
 * other trade, so one that has completed leaves the open list on the way in.
 *
 * The ids are the frame's own `meta` (the spec's `TradeWsMetaFields`), not a field inside the
 * payload: reading `data.meta` there found nothing and dropped every removal.
 */
function onTradesUpdate(event, data, topic, meta) {
  if (event !== "USER_TRADES_UPDATE") return;
  // a removal can name a row in either list, the way ombra applies it to both
  /**
   * A frame that names swaps is the answer to their cancels. ombra's `tradeFailureSwapIds`
   * reads the ids from the detail **and** from the payload, and this frame uses both shapes;
   * reading only `detail` left the pill spinning forever after the engine had accepted.
   */
  for (const id of [
    ...(data?.detail?.swapIds ?? []),
    ...(data?.swapIds ?? []),
    data?.detail?.swapId,
    data?.swapId
  ]) {
    releaseCancelling(Number(id));
  }
  /**
   * The cancellation is confirmed here, and the frame carries no trade (`trade=none`), so the
   * position's remaining swaps are re-read — that is what retires the pill. ombra reaches the
   * same place through its trade payload and dirty-marking.
   */
  if (update === "TRADE_CANCEL_CONFIRMED" || update === "TRADE_ABORT_CONFIRMED") void reloadTrades();
  const gone = meta?.removedTradeIds ?? [];
  if (gone.length) {
    live = (live ?? []).filter((held) => !gone.includes(held.id));
    closedLive = (closedLive ?? []).filter((held) => !gone.includes(held.id));
  }
  for (const trade of data?.trades ?? []) {
    if (String(trade.status) === "COMPLETED") patchClosed(trade);
    else patchPosition(trade);
  }
}

/** A private update: the trade itself, the swaps it made, and where the order stands. */
function onUserFrame(event, data, topic, meta) {
  if (event !== "USER_TRADE_UPDATE" && event !== "USER_TRADE_UPDATE_ERROR") return;
  const update = meta?.tradeUpdate ?? data?.meta?.tradeUpdate;
  const trade = data?.trade;
  /**
   * A frame that names swaps is the answer to their cancels. ombra's `tradeFailureSwapIds`
   * reads the ids from the detail **and** from the payload; reading only one shape left the
   * pill spinning after the engine had already accepted the cancel.
   */
  for (const id of [
    ...(data?.detail?.swapIds ?? []),
    ...(data?.swapIds ?? []),
    data?.detail?.swapId,
    data?.swapId
  ]) {
    releaseCancelling(Number(id));
  }
  /**
   * The confirmation arrives with no trade of its own (`trade=none`), so the position's swaps
   * are re-read — that is what retires the pill. ombra reaches the same place through its trade
   * payload and dirty-marking.
   */
  if (update === "TRADE_CANCEL_CONFIRMED" || update === "TRADE_ABORT_CONFIRMED") void reloadTrades();
  const gone = meta?.removedTradeIds ?? [];
  // `removedTradeIds` carries bare ids while a row is keyed `CHAIN:id`, so the tail is compared
  if (gone.length) {
    live = (live ?? []).filter(
      (held) => !gone.some((dropped) => String(held.id).split(":").pop() === String(dropped))
    );
  }
  if (trade && getAuthToken()) {
    if (String(trade.status) === "COMPLETED") patchClosed(trade);
    else patchPosition(trade);
  }
  const state = ORDER_STATE[update];
  if (state !== undefined && state !== null) // The frame's side is often absent, and without the fallback the row reported a sell as
    // a buy — `settleOrder` defaults to the buy words when it is given no side.
    settleOrder(state, String(data?.detail?.side ?? order?.side ?? "").toLowerCase());
  // The server's own word on a target change. The commit paths above deliberately say nothing
  // on success, so the notice the reader sees is the one the backend accepted — ombra's switch,
  // word for word and duration for duration (`trade.svelte.ts:1515-1526`).
  const tokenLabel = trade?.tokenSymbol ? ` ${trade.tokenSymbol}` : "";
  switch (update) {
    case "TARGET_ADDED":
      addToast("success", `Target Added${tokenLabel}`, undefined, 3000);
      break;
    case "TARGET_UPDATED":
      addToast("success", `Target Updated${tokenLabel}`, undefined, 3000);
      break;
    case "TARGET_REMOVED":
      addToast("success", `Target Removed${tokenLabel}`, undefined, 3000);
      break;
    case "TARGET_MET":
      addToast("warning", `Target Met${tokenLabel}`, "Sell target triggered", 6000);
      break;
  }
  if (event === "USER_TRADE_UPDATE_ERROR" && !order) {
    error = "The trade failed";
  }
}

let subscriptions = [];

function closeSubscriptions() {
  for (const key of subscriptions) unsubscribe(key);
  subscriptions = [];
}

function openSubscriptions() {
  closeSubscriptions();
  subscriptions = [
    subscribe("trades:active", onTradesFrame, liveAccumulatedParams(activeWindowCursor), {
      recovery: "refetch",
      onReconnect: () => void reseed(),
      // A cursor that has aged out is terminal for the subscription — the client will not retry
      // it — so the window has to be rebuilt, the way our trending store already does.
      onError: (reason) => {
        // The client will not retry a subscription it has marked failed, and this hook is the
        // only place the reason surfaces — so it is always said, not only acted on.
        console.warn("[trade] subscription error", reason);
        if (String(reason).startsWith("CURSOR_")) void reseed();
      }
    }),
    subscribe("trades:completed", onTradesFrame, liveAccumulatedParams(completedWindowCursor), {
      recovery: "refetch",
      onReconnect: () => void reseed(),
      onError: (reason) => {
        // The client will not retry a subscription it has marked failed, and this hook is the
        // only place the reason surfaces — so it is always said, not only acted on.
        console.warn("[trade] subscription error", reason);
        if (String(reason).startsWith("CURSOR_")) void reseed();
      }
    }),
    subscribe("user", onUserFrame)
  ];
}

/** A clean re-read, then the subscriptions reopened at the new cursors. */
async function reseed() {
  if (!getAuthToken()) {
    closeSubscriptions();
    live = null;
    closedLive = null;
    forgetPreset();
    return;
  }
  await Promise.all([reloadTrades(), reloadFee(), fetchTradeSettings()]);
  openSubscriptions();
}

/** Read once, then let the socket keep it live. */
export function startTrade() {
  if (started) return;
  started = true;
  void reseed();
}

export function stopTrade() {
  closeSubscriptions();
  started = false;
  live = null;
  closedLive = null;
}

// the row the card draws for the token it is on
export { DUST_USD };

// Like the account store: read on load, re-read when the session changes, so the panel is
// never showing another session's positions.
if (typeof window !== "undefined") {
  startTrade();
  onAuthTokenChange(() => void reseed());
}
