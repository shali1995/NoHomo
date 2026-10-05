<!--
  "Your positions" on the phone: the watchlist tab's second half.

  The desktop panel's own three things, in the phone's language — the title with the count of what
  is open, the Open/Closed switch with its accent tint and pulsing dot, and the rows: the token,
  what is held, and the net P&L that decides the colour. Dust sits behind the same toggle the
  desktop's accordion is, and closed trades read as rows here rather than as the desktop's table,
  because a table on a 375 dp screen is a table with four of its five columns missing.

  The lists themselves are the shared ones (`openPositions`, `dustPositions`, `closedPositions`),
  so a position is the same position on both frames.
-->
<script>
  import TokenBadge from "../../icons/token-badge.svelte";
  import { closedPositions, dustPositions, openPositions } from "../../lib/api/trade.svelte.js";
  import { navigate } from "../../lib/router.js";

  let tab = $state("open");
  let dustOpen = $state(false);

  const open = $derived(openPositions());
  const dust = $derived(dustPositions());
  const closed = $derived(closedPositions());

  /** Net P&L after fees, which is what the desktop's row prints and colours. */
  const netUsd = (position) => Number(position?.pnlUsd ?? 0);
  const netPct = (position) =>
    Number(position?.investedUsd ?? 0) > 0
      ? (netUsd(position) / Number(position.investedUsd)) * 100
      : Number(position?.changePct ?? 0);
  const ink = (position) => (netUsd(position) >= 0 ? "#21c95e" : "#ff622e");
  const usdText = (position) =>
    `${netUsd(position) < 0 ? "-" : ""}$${Math.abs(netUsd(position)).toFixed(2)}`;
  const pctText = (position) => `${Math.abs(netPct(position)).toFixed(1)}%`;

  function openToken(position) {
    if (position?.address) navigate(`/tokens/${position.chain}/${position.address}`);
  }
</script>

<div class="pos">
  <div class="head">
    <span class="title">Your positions</span>
    {#if tab === "open" && open.length > 0}
      <span class="count m-num">{open.length}</span>
    {/if}

    <div class="switch" role="group" aria-label="Positions">
      <button
        type="button"
        class="opt"
        class:opt--on={tab === "open"}
        aria-pressed={tab === "open"}
        onclick={() => (tab = "open")}
      >
        Open{#if tab === "open"}<span class="pulse" aria-hidden="true"></span>{/if}
      </button>
      <button
        type="button"
        class="opt"
        class:opt--on={tab === "closed"}
        aria-pressed={tab === "closed"}
        onclick={() => (tab = "closed")}
      >
        Closed
      </button>
    </div>
  </div>

  {#snippet positionRow(position)}
    <button type="button" class="row" onclick={() => openToken(position)}>
      <span class="logo">
        {#if position.image}
          <img src={position.image} alt="" loading="lazy" decoding="async" />
        {/if}
        <span class="badge"><TokenBadge /></span>
      </span>
      <span class="who">
        <span class="name m-truncate">{position.name}</span>
        <span class="amount m-truncate">{position.amountText}</span>
      </span>
      <span class="figs">
        <span class="usd m-num">{usdText(position)}</span>
        <span class="pct m-num" style="color: {ink(position)}">
          <span class="arrow" aria-hidden="true">{netUsd(position) >= 0 ? "\u25B2" : "\u25BC"}</span>
          {pctText(position)}
        </span>
      </span>
    </button>
  {/snippet}

  {#if tab === "open"}
    {#if open.length === 0 && dust.length === 0}
      <p class="empty">No open positions</p>
    {:else}
      {#each open as position (position.id ?? position.address)}
        {@render positionRow(position)}
      {/each}

      {#if dust.length > 0}
        <!-- The desktop's own accordion: the small ones out of the list, one press away. -->
        <button type="button" class="dust" aria-expanded={dustOpen} onclick={() => (dustOpen = !dustOpen)}>
          {dustOpen ? "Hide" : "Show"} dust ({dust.length})
        </button>
        {#if dustOpen}
          {#each dust as position (position.id ?? position.address)}
            {@render positionRow(position)}
          {/each}
        {/if}
      {/if}
    {/if}
  {:else if closed.length === 0}
    <p class="empty">No closed positions</p>
  {:else}
    {#each closed as row (row.id ?? row.address)}
      <button type="button" class="row" onclick={() => openToken(row)}>
        <span class="logo">
          {#if row.image}<img src={row.image} alt="" loading="lazy" decoding="async" />{/if}
        </span>
        <span class="who">
          <span class="name m-truncate">{row.name}</span>
          <span class="amount m-truncate">
            ${Number(row.investedUsd ?? 0).toFixed(2)} invested{#if row.ageText} · {row.ageText}{/if}
          </span>
        </span>
        <span class="figs">
          <span class="usd m-num">{row.pnlText}</span>
          <span class="pct m-num" style="color: {row.pnlUp ? "#21c95e" : "#ff622e"}">
            <span class="arrow" aria-hidden="true">{row.pnlUp ? "\u25B2" : "\u25BC"}</span>
            {row.pnlPct}
          </span>
        </span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .pos {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  .count {
    font-size: 13px;
    color: var(--m-muted);
  }

  /* The desktop's segmented pill: 0.5 dp of frame, a tinted side for the one that is chosen. */
  .switch {
    display: flex;
    gap: 2px;
    margin-left: auto;
    padding: 2px;
    border: 1px solid var(--m-hairline);
    border-radius: 10px;
    background: var(--m-bg);
  }

  .opt {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 3px 7px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    color: var(--m-dim);
  }

  .opt--on {
    background: rgba(81, 106, 246, 0.16);
    color: var(--m-blue-soft);
  }

  /* The dot only pulses on the chosen side, which is the desktop's own rule. */
  .pulse {
    position: relative;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--m-blue-soft);
  }

  .pulse::after {
    content: "";
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    background: var(--m-blue);
    opacity: 0.35;
    animation: pulse-ring 1.8s ease-out infinite;
  }

  @keyframes pulse-ring {
    0% {
      transform: scale(0.5);
      opacity: 0.45;
    }
    70% {
      transform: scale(1);
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 0;
    text-align: left;
    border-bottom: 1px solid var(--m-hairline);
  }

  .row:last-child {
    border-bottom: 0;
  }

  .logo {
    position: relative;
    flex: 0 0 auto;
    width: 36px;
    height: 36px;
  }

  .logo img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
  }

  .badge {
    position: absolute;
    right: -3px;
    bottom: -3px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .badge :global(svg) {
    width: 16px;
    height: 16px;
  }

  .who {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .name {
    font-size: 14px;
    color: var(--m-text);
  }

  .amount {
    font-size: 12px;
    color: var(--m-muted);
  }

  .figs {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    flex: 0 0 auto;
  }

  .usd {
    font-size: 14px;
    color: var(--m-text);
  }

  /* The arrow the desktop's rows carry: a 6 dp glyph on the percent's own line. */
  .pct {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
  }

  .arrow {
    font-size: 6px;
    line-height: 1;
  }

  .dust {
    align-self: flex-start;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 700;
    color: var(--m-muted);
  }

  .empty {
    padding: 16px;
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-dim);
    text-align: center;
  }
</style>
