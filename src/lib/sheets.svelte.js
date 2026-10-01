/**
 * Which of the wallet's sheets is open.
 *
 * They are the whole app's, not the top bar's: the cash row on your own profile opens the
 * same two, the way Ombra's profile page opens its withdrawal modal and its deposit watch
 * from the wallet list rather than from the navbar. They are mounted once, inside the fitted
 * box (src/App.svelte), so they keep the size and layering they have on the captured page.
 */
let depositOpen = $state(false);
let withdrawOpen = $state(false);

export function isDepositOpen() {
  return depositOpen;
}

export function isWithdrawOpen() {
  return withdrawOpen;
}

export function openDeposit() {
  depositOpen = true;
}

export function openWithdraw() {
  withdrawOpen = true;
}

export function closeDeposit() {
  depositOpen = false;
}

export function closeWithdraw() {
  withdrawOpen = false;
}
