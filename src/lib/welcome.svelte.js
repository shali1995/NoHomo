/**
 * The welcome popup, asked for from outside itself.
 *
 * The footer's terms link is the popup — there are no terms pages — so it raises this and the popup
 * answers. A count rather than a flag, so pressing it again while it is already open still counts.
 */
let requests = $state(0);

export function openWelcome() {
  requests += 1;
}

export function getWelcomeRequests() {
  return requests;
}
