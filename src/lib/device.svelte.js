/**
 * Which of the app's two shells is mounted.
 *
 * The phone UI and the desktop frame are different structures — a bottom pill against a
 * top bar — so this is decided in JS and only one of them mounts. Hiding the other with
 * `display: none` would leave it running: both would hold the sockets, both would fetch.
 */
const PHONE_QUERY = "(max-width: 900px)";

let phone = $state(false);
let listening = false;

export function startDevice() {
  if (listening || typeof window === "undefined") return () => {};
  listening = true;
  const query = window.matchMedia(PHONE_QUERY);
  const sync = () => {
    phone = query.matches;
  };
  sync();
  query.addEventListener("change", sync);
  return () => {
    query.removeEventListener("change", sync);
    listening = false;
  };
}

export function isPhone() {
  return phone;
}
