/**
 * The hover cards' state, in one place because the original portals them to the
 * end of the body and that is why nothing can paint over them. Rendering a card
 * inside the widget that triggers it puts it in that widget's stacking context --
 * measured in the browser, the trader card on the leaderboard came out *under* the
 * chart's iframe. So the triggers only record what is hovered here, and
 * HoverCardLayer renders it at the end of the app.
 */

/**
 * `user` is the hovered trader's identity, the same idea: the wallet identifies them, the
 * row supplies the label, and `traderCard.svelte.js` supplies the numbers.
 *
 * `token` is the hovered token's identity — chain, address, and the bits the row already
 * knows (symbol, logo, href) so the card can paint its header at once. Its numbers come
 * from `tokenCard.svelte.js`, keyed on the same chain + address.
 *
 * @type {{ token: import("./types").TokenHoverIdentity | null, user: import("./types").UserHoverCard | null, anchor: { x: number, y: number } | null }}
 */
import { clearTokenCard, ensureTokenCard } from "./api/tokenCard.svelte.js";
import { clearTraderCard, ensureTraderCard } from "./api/traderCard.svelte.js";
import { currentFitScale } from "./utils/fit.js";
/** @type {{ cards: Record<string, import("./types").UserHoverCard> }} */
// inlined from userHoverCards.json — no data file, the strings live with the code
const userHoverCards =   {
    "source": "Four recorded trader hover cards: pointfarmcap, unipcs, theveeman and The__Solstice.",
    "cards": {
      "pointfarmcap": {
        "href": "/profile/pointfarmcap",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "point farm capital",
        "handle": "@pointfarmcap",
        "bio": "be the change you want to see onchain",
        "following": "0",
        "followers": "282K",
        "portfolio": null,
        "pnl": null
      },
      "unipcs": {
        "href": "/profile/unipcs",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "Unipcs",
        "handle": "@unipcs",
        "bio": "\"If the Lord will, we shall live, and do this, or that.\" - James 4:15",
        "following": "40",
        "followers": "679.2K",
        "portfolio": null,
        "pnl": null
      },
      "theveeman": {
        "href": "/profile/theveeman",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "Vee",
        "handle": "@theveeman",
        "bio": "",
        "following": "71",
        "followers": "243.4K",
        "portfolio": null,
        "pnl": null
      },
      "The__Solstice": {
        "href": "/profile/The__Solstice",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "TheS◎Lstice",
        "handle": "@The__Solstice",
        "bio": "holder in a trader’s world",
        "following": "84",
        "followers": "278.8K",
        "portfolio": "$8,232,012.09",
        "pnl": {
          "sign": "+",
          "value": "$3,680,222.72",
          "color": "rgb(33, 201, 94)"
        }
      }
    },
    "defaultCard": "The__Solstice",
    "defaultCardNote": "Shown for a trader the capture has no card for yet: the card is one component, the numbers get filled in later."
  };

export const hoverCard = $state({
  token: null,
  user: null,
  anchor: null
});

let closeTimer = null;

/**
 * Where the card hangs. `x` always puts it to the right of the trigger; `y` is the
 * trigger's middle, which is where the card's top edge goes unless the trigger asked for
 * `placement: "above"` — the tables ask for that, so the card clears the row instead of
 * covering it and running off the bottom of the window.
 *
 * @param {MouseEvent} event
 * @param {{ placement?: "side" | "above" }} [options]
 */
function anchorFrom(event, options) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: rect.right + 12,
    y: rect.top + rect.height / 2,
    top: rect.top,
    bottom: rect.bottom,
    placement: options?.placement ?? "side"
  };
}

/** The gap between the card and the row it belongs to. */
const CARD_GAP = 8;
/** The closest a card may come to the top or the bottom of the window. */
const VIEWPORT_MARGIN = 8;

/**
 * The wrapper's own style, which is where the card is placed.
 *
 * With `placement: "above"` the card's *bottom* goes just above the trigger, so a row near
 * the bottom of the window gets its card above the pointer rather than half off screen.
 * The height is the card's own, measured once it has rendered, so the card settles into
 * place before the browser paints it. If there is no room above, the card falls back to
 * below the trigger, still inside the window.
 *
 * @param {{ x: number, y: number, top?: number, bottom?: number, placement?: string } | null} anchor
 * @param {number} cardHeight
 */
export function wrapperStyle(anchor, cardHeight) {
  // The card hangs outside the box the app is scaled into, so that it keeps its place in
  // the layering (above the ticker, as on the captured page). The app's scale is applied
  // here instead, around the card's own top-left corner — the anchor — which is what makes
  // a card read the same size as the rows it points at. Height and clearance are therefore
  // in the card's scaled size, while the anchor is a viewport measurement.
  const scale = currentFitScale();
  const height = cardHeight * scale;
  const gap = CARD_GAP * scale;
  const margin = VIEWPORT_MARGIN * scale;
  const x = anchor?.x ?? 0;
  let y = anchor?.y ?? 0;
  if (anchor?.placement === "above" && height > 0 && anchor.top != null) {
    y = anchor.top - height - gap;
    if (y < margin && typeof window !== "undefined") {
      y = Math.min(anchor.bottom + gap, window.innerHeight - height - margin);
      y = Math.max(y, margin);
    }
  }
  return `position: fixed; left: 0px; top: 0px; transform: translate(${x}px, ${y}px) scale(${scale}); transform-origin: 0 0; min-width: max-content; --radix-popper-transform-origin: 0px 50%; z-index: 50;`;
}

/**
 * @param {import("./types").TokenHoverCard} card
 * @param {MouseEvent} event
 */
/**
 * @param {import("./types").TokenHoverIdentity} identity
 * @param {MouseEvent} event
 */
export function openTokenCard(identity, event, options) {
  if (closeTimer) clearTimeout(closeTimer);
  hoverCard.token = identity;
  hoverCard.user = null;
  hoverCard.anchor = anchorFrom(event, options);
  void ensureTokenCard(identity?.chain, identity?.address);
}

/**
 * @param {import("./types").UserHoverCard | null} card
 * @param {MouseEvent} event
 */
/**
 * @param {import("./types").UserHoverIdentity} identity
 * @param {MouseEvent} event
 */
export function openUserCard(identity, event, options) {
  if (!identity?.walletAddress) return;
  if (closeTimer) clearTimeout(closeTimer);
  hoverCard.user = identity;
  hoverCard.token = null;
  hoverCard.anchor = anchorFrom(event, options);
  void ensureTraderCard(identity);
}

/**
 * The trader card's identity, for any row that knows which wallet it is showing.
 *
 * The wallet is what identifies the trader — the card fetches its numbers by it — and the
 * row supplies the name and the avatar it already draws, so the card cannot disagree with
 * the row under the pointer. The capture's bio is kept only where the capture recorded
 * that very trader. A row carries no window of its own, so the card answers for the last
 * day, the window its own rows are showing.
 *
 * @param {{ chain?: string, walletAddress?: string, name?: string | null, handle?: string | null,
 *           avatar?: string, href?: string }} row
 * @returns {import("./types").UserHoverIdentity}
 */
export function userCardIdentity(row) {
  const name = row?.name ?? "";
  const key = name ? String(name).toLowerCase().replace(/[^a-z0-9_]/g, "") : "";
  const captured = key ? (userHoverCards.cards[key] ?? null) : null;
  return {
    href: row?.href ?? `/profile/${row?.walletAddress ?? ""}`,
    chain: row?.chain,
    walletAddress: row?.walletAddress,
    name,
    handle: row?.handle ?? captured?.handle,
    avatar: row?.avatar,
    bio: captured?.bio ?? null,
    timeRange: "ONE_DAY"
  };
}

/**
 * The pointer left a trigger. Two things must not close the card: moving inside the
 * same trigger (the feed row is one trigger and the avatar inside it is another, so
 * entering the avatar fires the row's leave) and moving into the card itself, which
 * has its own enter handler.
 * @param {MouseEvent} [event]
 */
export function closeHoverCard(event) {
  const from = event?.currentTarget;
  const to = event?.relatedTarget;

  if (from instanceof Node && to instanceof Node && from.contains(to)) {
    return;
  }

  closeTimer = setTimeout(() => {
    hoverCard.token = null;
    hoverCard.user = null;
    hoverCard.anchor = null;
    clearTokenCard();
    clearTraderCard();
  }, 140);
}

/** The pointer is inside the card: cancel a pending close. */
export function keepHoverCard() {
  if (closeTimer) clearTimeout(closeTimer);
}
