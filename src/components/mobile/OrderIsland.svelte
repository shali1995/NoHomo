<!--
  The order, as a pill at the top of the phone: what a buy or a sell is doing right now.

  The desktop says this under its trade card — a spinner, `Buying $5.00 SAM`, `Just now`, and then
  the tick with `Bought $5.00 SAM` (`components/trade/OrderStatus.svelte`). That row is the trade
  store's own record, written by `placeOrder` for every order the app can place, so this pill reads
  the same record and shows the same words and the same three states: out, landed, failed.

  What is different is only where it lives and how it arrives. The desktop's row is a strip under a
  panel the reader is already looking at; a phone has no such place, and the one every phone has for
  "something is happening" is the top of the screen. So: a dark capsule that drops in over whatever
  page is up, a spinner while the swap is out, a drawn tick on a filled green disc when it lands, a
  red disc when it fails — and the age counting, because this is the only place it is said.
-->
<script>
  import { fade } from "svelte/transition";
  import { activeOrder, openPositions } from "../../lib/api/trade.svelte.js";

  /** The store's own row, and then the row it just had. */
  const live = $derived(activeOrder());
  let last = $state(null);
  let lastSeen = $state(0);
  let clock = $state(Date.now());

  $effect(() => {
    if (live) {
      last = live;
      lastSeen = Date.now();
    }
  });

  /**
   * The store clears its row four seconds after the exchange *accepts* an order, which is right for
   * a strip inside a panel being watched and too short for the only feedback a phone has. The last
   * row is therefore held a few seconds longer: the order is still working then — acceptance is not
   * a fill — so saying so is the truth, and the pill is there to be seen rather than gone before
   * the eye arrives.
   */
  const HOLD_MS = 8000;
  $effect(() => {
    if (!live && !last) return;
    const timer = setInterval(() => (clock = Date.now()), 500);
    return () => clearInterval(timer);
  });

  const order = $derived(live ?? (last && clock - lastSeen < HOLD_MS ? last : null));

  /** The store's own six states, in the store's own words. */
  const WORDS = {
    buying: "Buying",
    bought: "Bought",
    selling: "Selling",
    sold: "Sold",
    failed: "Failed",
    cancelled: "Cancelled"
  };

  const verb0 = $derived(WORDS[order?.state] ?? "");
  const settled = $derived(order?.state === "bought" || order?.state === "sold");
  const stopped = $derived(order?.state === "failed" || order?.state === "cancelled");

  /**
   * A dip is not a swap that fills: it is placed, and then it waits for the price to fall to it.
   * Left as "Buying", it spins for as long as the wait lasts, which reads as broken — so a resting
   * buy takes over the pill the moment it exists, and "placed" is its ending.
   *
   * It is recognised by the trade store rather than by anything the caller passes: placing a dip
   * creates a position carrying its own `dipPill`, stamped with when the order was placed. A dip
   * placed before this order (an older one still waiting) is not ours and is ignored.
   */
  const resting = $derived.by(() => {
    if (!order || settled || stopped) return false;
    const beganAt = Math.floor((since || order.startedAt || Date.now()) / 1000) - 5;
    return openPositions().some((held) => Number(held?.dipPill?.placedAt ?? 0) >= beganAt);
  });

  const verb = $derived(resting ? "Dip placed" : verb0);

  /** A terminal stage is shown for four seconds and then the pill is gone. */
  let terminalSince = $state(0);
  $effect(() => {
    if (!order || (!resting && !settled && !stopped)) {
      terminalSince = 0;
      return;
    }
    if (!terminalSince) terminalSince = Date.now();
  });
  const done = $derived(terminalSince > 0 && clock - terminalSince > 4000);

  /** The age, counted from when the row first appeared: the store prints "Just now" and stops. */
  let since = $state(0);
  $effect(() => {
    if (!order) {
      since = 0;
      return;
    }
    if (!since) since = Date.now();
  });

  const age = $derived.by(() => {
    if (!since) return order?.age ?? "";
    const seconds = Math.max(0, Math.round((clock - since) / 1000));
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
  });

  /** Put away by hand; a new order brings it back. */
  let dismissed = $state(false);
  $effect(() => {
    if (live) dismissed = false;
  });
</script>

{#if order && !dismissed && !done}
  <div class="island-slot" style="top: calc(env(safe-area-inset-top, 0px) + 10px)">
    <button
      type="button"
      class="island"
      class:island--settled={settled}
      class:island--resting={resting}
      class:island--stopped={stopped}
      aria-live="polite"
      onclick={() => (dismissed = true)}
      in:fade={{ duration: 140 }}
      out:fade={{ duration: 200 }}
    >
      <!--
        The mark, keyed by state: a change of state is a new mark, so each one lands on its own
        rather than being swapped out under the reader's eye.
      -->
      {#key order.state}
        <span class="mark">
          {#if settled}
            <span class="disc disc--ok">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  class="tick"
                  d="M6.5 12.6 10.4 16.4 17.6 8.6"
                  stroke="#060510"
                  stroke-width="2.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          {:else if stopped}
            <span class="disc disc--no">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M8.6 8.6 15.4 15.4M15.4 8.6 8.6 15.4"
                  stroke="#060510"
                  stroke-width="2.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>
          {:else if resting}
            <!-- Waiting on the market, not working: a hollow ring in the dip's own yellow. -->
            <span class="waiting"></span>
          {:else}
            <span class="spinner"></span>
          {/if}
        </span>
      {/key}

      <span class="said">
        {verb}
        <span class="what">{order.text}</span>
      </span>
      <span class="age">{age}</span>
    </button>
  </div>
{/if}

<style>
  /*
   * The slot centres the pill and keeps it clear of the status bar. The pill carries the entrance
   * animation itself, so nothing else may own its transform.
   */
  .island-slot {
    position: fixed;
    /*
     * A plain 10 dp always applies. The status-bar inset is added in the inline style on the
     * element instead of here: an `env()` inside this rule took the whole rule out — the slot
     * computed to `position: static` and the pill sat off the bottom of the screen.
     */
    top: 10px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    padding: 0 16px;
    z-index: 60;
    pointer-events: none;
  }

  .island {
    display: flex;
    align-items: center;
    gap: 9px;
    max-width: 100%;
    padding: 8px 15px 8px 11px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    background: rgba(11, 10, 16, 0.82);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(22px) saturate(180%);
    -webkit-backdrop-filter: blur(22px) saturate(180%);
    cursor: pointer;
    pointer-events: auto;
    /* the drop: a little travel, a spring that overshoots, and it settles */
    animation: island-drop 520ms cubic-bezier(0.34, 1.4, 0.64, 1) both;
    transition:
      border-color 240ms ease-out,
      box-shadow 240ms ease-out;
  }

  @keyframes island-drop {
    0% {
      transform: translateY(-18px) scale(0.86);
      opacity: 0;
    }
    65% {
      transform: translateY(1.5px) scale(1.015);
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  /* Landed: a green edge and a breath of green light. */
  .island--settled {
    border-color: rgba(4, 194, 73, 0.35);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.6),
      0 0 20px rgba(4, 194, 73, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  /* Placed and waiting: the dip's own yellow, and no glow that would promise a fill. */
  .island--resting {
    border-color: rgba(255, 199, 79, 0.32);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.6),
      0 0 20px rgba(255, 199, 79, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .island--stopped {
    border-color: rgba(255, 81, 33, 0.38);
    box-shadow:
      0 14px 34px rgba(0, 0, 0, 0.6),
      0 0 20px rgba(255, 81, 33, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .mark {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
  }

  /* A filled disc with a dark mark drawn through it — what a phone uses for "done". */
  .disc {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    animation: disc-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  /*
   * The phone palette is defined on the shell, and this pill is rendered outside it (see the
   * comment on the slot), so `var(--m-green)` and friends resolve to nothing out here — a disc
   * with no colour at all. The values are therefore written out: the shell's own.
   */
  .disc--ok {
    background: #04c249;
    box-shadow: 0 0 12px rgba(4, 194, 73, 0.45);
  }

  .disc--no {
    background: #ff5121;
    box-shadow: 0 0 12px rgba(255, 81, 33, 0.4);
  }

  .disc svg {
    display: block;
    width: 18px;
    height: 18px;
  }

  @keyframes disc-pop {
    0% {
      transform: scale(0.4);
      opacity: 0;
    }
    70% {
      transform: scale(1.12);
      opacity: 1;
    }
    100% {
      transform: scale(1);
    }
  }

  /* The tick draws itself once the disc has landed. */
  .tick {
    stroke-dasharray: 22;
    stroke-dashoffset: 22;
    animation: tick-draw 300ms 60ms cubic-bezier(0.4, 1.2, 0.5, 1) forwards;
  }

  @keyframes tick-draw {
    to {
      stroke-dashoffset: 0;
    }
  }

  /* Waiting: a hollow ring in the dip's yellow, standing by rather than running. */
  .waiting {
    width: 16px;
    height: 16px;
    border: 2px solid #ffc74f;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255, 199, 79, 0.35);
  }

  /* Out and pending: a thin ring with one lit quarter, turning. */
  .spinner {
    width: 16px;
    height: 16px;
    border: 1.6px solid rgba(152, 153, 163, 0.22);
    border-top-color: #f7f7f7;
    border-radius: 50%;
    animation: island-spin 0.8s linear infinite;
  }

  @keyframes island-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .said {
    flex: 1 1 auto;
    overflow: hidden;
    font-size: 14px;
    font-weight: 500;
    line-height: 17px;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #9899a3;
  }

  .what {
    color: #f7f7f7;
    font-variant-numeric: tabular-nums;
  }

  .age {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 400;
    line-height: 17px;
    color: #474b52;
    white-space: nowrap;
  }
</style>
