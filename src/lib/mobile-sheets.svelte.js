/**
 * The phone's own screens over the app.
 *
 * A phone shows one thing at a time, so these are plain flags rather than the desktop's
 * sheet registry: the deposit flow and the buy flow open over the screen that asked for
 * them and close back to it, and the withdraw flow is a screen of its own on top of both.
 *
 * The buy screen reads the token the app has selected (`lib/api/token.svelte.js`), so
 * opening it needs no arguments — the token page has already selected what it is showing.
 */
let deposit = $state(false);
let buy = $state(null);
let withdraw = $state(false);

export function isMobileDepositOpen() {
  return deposit;
}

export function openMobileDeposit() {
  deposit = true;
}

export function closeMobileDeposit() {
  deposit = false;
}

/** `null` while closed, otherwise the side the screen is on: `"buy"` or `"sell"`. */
export function mobileTradeSide() {
  return buy;
}

export function openMobileTrade(side = "buy") {
  buy = side;
}

export function closeMobileTrade() {
  buy = null;
}

export function isMobileWithdrawOpen() {
  return withdraw;
}

export function openMobileWithdraw() {
  withdraw = true;
}

export function closeMobileWithdraw() {
  withdraw = false;
}
