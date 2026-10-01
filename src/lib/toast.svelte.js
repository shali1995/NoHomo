/**
 * The notices. Ombra's toast store, ported: one queue, a timer per notice, and the four things
 * that act on it — add, add-action, update, remove.
 *
 * `updateToast` is what makes a trade read well: the submitted notice is upgraded in place to
 * the confirmed one rather than a second notice stacking under it, which is how ombra shows a
 * buy going from "Buy Submitted" to "Swap Confirmed".
 *
 * @typedef {object} ToastDetail
 * @property {string} label
 * @property {string} value
 * @property {string} [href]
 * @property {string} [color]
 *
 * @typedef {object} Toast
 * @property {number} id
 * @property {"success"|"error"|"warning"|"info"} type
 * @property {string} title
 * @property {string} [message]
 * @property {ToastDetail[]} [details]
 * @property {number} duration
 * @property {string} [iconUrl]
 * @property {() => void} [onClick]
 */

/** @type {Toast[]} */
let toasts = $state([]);
/** @type {Map<number, ReturnType<typeof setTimeout>>} */
const timers = new Map();
let counter = 0;

export function getToasts() {
  return toasts;
}

/** @param {number} id */
function schedule(id, duration) {
  const running = timers.get(id);
  if (running) clearTimeout(running);
  if (duration > 0) timers.set(id, setTimeout(() => removeToast(id), duration));
}

/**
 * @param {"success"|"error"|"warning"|"info"} type
 * @param {string} title
 * @param {string} [message]
 * @param {number} [duration]
 * @param {ToastDetail[]} [details]
 * @returns {number} the notice's id
 */
export function addToast(type, title, message, duration = 5000, details) {
  const id = ++counter;
  toasts = [...toasts, { id, type, title, message, details, duration }];
  schedule(id, duration);
  return id;
}

/**
 * @param {{ type?: Toast["type"], title: string, message?: string, iconUrl?: string,
 *           onClick?: () => void, duration?: number, details?: ToastDetail[] }} input
 * @returns {number}
 */
export function addActionToast({ type = "info", title, message, iconUrl, onClick, duration = 8000, details }) {
  const id = ++counter;
  toasts = [...toasts, { id, type, title, message, iconUrl, onClick, duration, details }];
  schedule(id, duration);
  return id;
}

/** @param {number} id @param {Partial<Toast>} patch */
export function updateToast(id, patch) {
  toasts = toasts.map((toast) => (toast.id === id ? { ...toast, ...patch } : toast));
  const next = toasts.find((toast) => toast.id === id);
  if (next) schedule(id, patch.duration ?? next.duration);
}

/** @param {number} id */
export function removeToast(id) {
  const running = timers.get(id);
  if (running) clearTimeout(running);
  timers.delete(id);
  toasts = toasts.filter((toast) => toast.id !== id);
}
