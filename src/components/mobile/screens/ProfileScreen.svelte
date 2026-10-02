<!--
  The phone's profile screen: the fifth tab of the bottom bar, and the page a trader row or
  a shared link pushes over the tabs.

  Every band is the capture's, drawn at its own sizes: the 132 dp band behind the round
  icon buttons, the avatar over its page-coloured ring, the identity block, the stats and
  the meta strip, the 483.2 dp balance block with its tab strip and its PnL chart, the
  total-cash row and the positions section with its Open/Closed control.

  The figures are ours. The account's own name, photo, social counts and balance come from
  src/lib/api/account.svelte.js; the wallet's PnL series, average hold, trade count and
  positions come from src/lib/api/profile.svelte.js, which this screen starts for its wallet
  and leaves running while it is mounted — the same store the desktop profile page uses, so
  a row tapped here opens a page the desktop already knows how to draw.

  `pushed` is the difference between the two: a pushed page was opened from a link or a row
  and carries a back arrow, while the tab root is the reader's own profile and does not.

  What the capture draws but this build cannot fill is left out rather than faked, and
  reported: the settings gear (no phone settings screen exists), the "Add a bio" call to
  action (nothing in the API carries a bio), the "Joined <month>" chip (no signup date
  anywhere), and the All / Tokens / Perps filter row (every position the API returns is a
  token position, so the filters would filter nothing).

  The Rewards pill is the capture's own, at its measured 114.1 dp top and 36 dp height, and
  it opens src/components/mobile/sheets/RewardsSheet.svelte over the real `/v2/referral`
  reads — the referral API exists, so the button has a destination rather than being dropped.
  It is the reader's own rewards, so it is drawn on their own page only, never over a
  trader's.
-->
<script>
  import ArrowLeft from "../../../icons/arrow-left.svelte";
  import CashCoin from "../../../icons/cash-coin.svelte";
  import ChipAvgHold from "../../../icons/chip-avg-hold.svelte";
  import ChipTrades from "../../../icons/chip-trades.svelte";
  import Earnings from "../../../icons/earnings.svelte";
  import History from "../../../icons/history.svelte";
  import Share from "../../../icons/share.svelte";
  import TransfersHistory from "../../profile/TransfersHistory.svelte";
  import CashSheet from "../sheets/CashSheet.svelte";
  import RewardsSheet from "../sheets/RewardsSheet.svelte";
  import {
    accountAvatar,
    accountCashText,
    accountLoaded,
    accountName,
    accountProfile,
    accountTotalText,
    accountWallets
  } from "../../../lib/api/account.svelte.js";
  import { openMobileDeposit, openMobileWithdraw } from "../../../lib/mobile-sheets.svelte.js";
  import { isTransfersOpen, openTransfers } from "../../../lib/api/transfers.svelte.js";
  import {
    averageHold,
    closedPositions,
    hasOverview,
    isProfileLoading,
    openPositions,
    panelFailed,
    pnlForRange,
    profileIdentity,
    signedUsd,
    splitUsd,
    startProfile,
    stopProfile,
    tradesLabel
  } from "../../../lib/api/profile.svelte.js";

  let { wallet = "", pushed = false, onback, onopen } = $props();

  /** The capture's four chart windows; the module slices its daily series for each. */
  const RANGES = [
    { id: "24H", label: "24h" },
    { id: "7D", label: "7d" },
    { id: "30D", label: "30d" },
    { id: "ALL", label: "All" }
  ];

  let range = $state("24H");
  let side = $state("open");
  let cashOpen = $state(false);
  let rewardsOpen = $state(false);
  let copied = $state(false);
  let copyTimer = 0;

  /** The two segment boxes, measured: the capture's pill tweens its width as well as its left. */
  let openWidth = $state(53.3);
  let closedWidth = $state(54.8);

  const pillStyle = $derived(
    side === "open"
      ? `transform: translateX(0); width: ${openWidth}px;`
      : `transform: translateX(${openWidth + 2}px); width: ${closedWidth}px;`
  );

  // The wallet's own reads: identity, PnL series and positions. They stay live while the
  // screen is mounted and are dropped when it goes, the way the desktop page does it.
  $effect(() => {
    const address = wallet;
    if (address) startProfile(address);
    return () => stopProfile();
  });

  const identity = $derived(profileIdentity());
  const account = $derived(accountProfile());
  const loaded = $derived(accountLoaded());

  /**
   * Whether this is the reader's own profile. The tab root always is; a pushed page is when
   * its wallet is one the app manages, which is the same test the desktop page makes.
   */
  const ownAddress = $derived(
    accountWallets().find((held) => held.isPrimary)?.address ?? accountWallets()[0]?.address ?? ""
  );
  const own = $derived(!pushed || (!!wallet && wallet === ownAddress));

  /** Your own page wears the account's username and photo; a trader's wears its label. */
  const name = $derived(own ? accountName() || identity.name : identity.name);
  const handle = $derived(own && accountName() ? `@${accountName()}` : identity.handle);
  const avatar = $derived(own ? (accountAvatar() ?? identity.avatar) : identity.avatar);

  /** Following / Followers are the account's own social counts — only its own page has them. */
  const stats = $derived.by(() => {
    if (!own || !account) return null;
    return {
      following: String(account.followingCount ?? 0),
      followers: String(account.followerCount ?? 0)
    };
  });

  /**
   * The meta strip: the wallet's average hold and its trade count, both from the trader
   * read. The capture's third item, the join date, has no source in the API — neither the
   * user profile nor the trader overview carries a signup date — so it is left out.
   */
  const meta = $derived.by(() => {
    if (!hasOverview()) return [];
    const hold = averageHold();
    const items = [];
    if (hold) items.push({ id: "hold", icon: "hold", text: `${hold} avg. hold` });
    items.push({ id: "trades", icon: "trades", text: tradesLabel() });
    return items;
  });

  const slice = $derived(pnlForRange(range));

  /**
   * The figure over the chart, split into its whole and fractional parts so the cents can
   * take the dim tone.
   *
   * On your own page it is what the account is worth, summed the way the home widget sums
   * it. A trader's page has no equity to read — `/v2/user/wallets` only answers for the
   * session — so it shows the wallet's own cumulative realized PnL, which is the figure the
   * desktop portfolio panel puts in the same place and the one its chart ends on.
   */
  const total = $derived.by(() => {
    if (own) {
      const text = accountTotalText();
      if (!text) return null;
      const cut = text.lastIndexOf(".");
      return { whole: text.slice(0, cut < 0 ? text.length : cut), cents: cut < 0 ? null : text.slice(cut) };
    }
    if (!slice.points.length) return null;
    const parts = splitUsd(slice.total);
    return { whole: parts.int, cents: parts.frac };
  });

  /** The window's change under the balance, in the ink its sign asks for. */
  const change = $derived.by(() => {
    if (slice.points.length < 2) return null;
    return { text: signedUsd(slice.change).text, up: slice.change >= 0 };
  });

  const ink = $derived(change && !change.up ? "var(--m-red)" : "var(--m-green)");

  /**
   * The chart, in the capture's 483.2 x 130.1 box: one line through the window's points and
   * the end-of-series dot on the right edge, where the box clips half of its glow.
   */
  const chart = $derived.by(() => {
    const values = slice.points.map((point) => point.value);
    if (values.length < 2) return null;
    const W = 483.2;
    const H = 130.1;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const step = W / (values.length - 1);
    // A window that did not move has no range to scale into: it draws level, mid-box.
    const flat = max - min < 1e-9;
    const y = (value) => (flat ? H / 2 : H - 8 - ((value - min) / span) * (H - 22));
    const line = values
      .map((value, index) => `${index ? "L" : "M"}${(index * step).toFixed(2)} ${y(value).toFixed(2)}`)
      .join(" ");
    return {
      line,
      area: `${line} L${W} ${H} L0 ${H} Z`,
      dotX: W,
      dotY: y(values[values.length - 1])
    };
  });

  const cash = $derived(accountCashText() ?? (loaded ? "$0.00" : null));

  const openRows = $derived(openPositions());
  const closedRows = $derived(closedPositions());
  const rows = $derived(side === "open" ? openRows : closedRows);
  const rowCount = $derived(rows.length);
  const rowsLoading = $derived(isProfileLoading() && rowCount === 0);
  const rowsFailed = $derived(panelFailed("tokens") && rowCount === 0);

  /** The share door: the native sheet where there is one, the clipboard where there is not. */
  async function share() {
    const address = wallet || identity.wallet;
    if (!address) return;
    const url = `${location.origin}/profile/${address}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard?.writeText(url);
    } catch {
      return;
    }
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 1500);
  }

  /** The history door: the app's own transfers ledger, over the same wallet. */
  function openLedger() {
    const address = wallet || identity.wallet;
    if (address) openTransfers(address);
  }

  function deposit() {
    cashOpen = false;
    openMobileDeposit();
  }

  function withdraw() {
    cashOpen = false;
    openMobileWithdraw();
  }
</script>

<div class="profile">
  <header class="head">
    <!-- The captured band: 132 dp of card tone behind the round buttons, cornered on top. -->
    <div class="band">
      {#if pushed}
        <div class="tools tools--left">
          <button type="button" class="tool" aria-label="Back" onclick={() => onback?.()}>
            <span class="disc"><ArrowLeft /></span>
          </button>
        </div>
      {/if}

      <div class="tools">
        <button type="button" class="tool" aria-label="Share" onclick={share}>
          <span class="disc"><Share /></span>
        </button>
        <button type="button" class="tool" aria-label="Transfers history" onclick={openLedger}>
          <span class="disc"><History /></span>
        </button>
      </div>

      {#if copied}
        <p class="copied" role="status">Copied</p>
      {/if}
    </div>

    <!-- The capture's Rewards pill: 106.7 x 36 dp at 114.1 dp, right edge 15.4 dp off the
         screen, so it sits beside the round icon buttons and on the avatar's centre line.
         It is the reader's own rewards, so a trader's page does not carry it. -->
    {#if own}
      <button type="button" class="rewards" onclick={() => (rewardsOpen = true)}>
        <Earnings />
        <span class="rewards-label">Rewards</span>
      </button>
    {/if}

    <div class="avatar">
      <span class="ring"></span>
      <span class="avatar-disc">
        {#if avatar}
          <img src={avatar} alt="" />
        {:else}
          <img class="mark" src="/images/nohomo-eyes.png" alt="" />
        {/if}
      </span>
    </div>

    {#if name}
      <h1 class="name m-truncate">{name}</h1>
    {:else if !loaded}
      <span class="skeleton skeleton--name"></span>
    {/if}

    {#if name}
      <p class="handle m-truncate">{handle}</p>
    {:else if !loaded}
      <span class="skeleton skeleton--handle"></span>
    {/if}

    {#if stats}
      <div class="stats">
        <div class="stat">
          <span class="stat-value m-num">{stats.following}</span>
          <span class="stat-label">Following</span>
        </div>
        <div class="stat">
          <span class="stat-value m-num">{stats.followers}</span>
          <span class="stat-label">Followers</span>
        </div>
      </div>
    {/if}

    {#if meta.length}
      <div class="meta m-rail">
        {#each meta as item (item.id)}
          <div class="meta-item">
            {#if item.icon === "hold"}
              <ChipAvgHold />
            {:else}
              <ChipTrades />
            {/if}
            <span class="meta-text">{item.text}</span>
          </div>
        {/each}
      </div>
    {/if}
  </header>

  <div class="body m-scroll">
    <!-- The balance block bleeds 3.2 dp past the left edge, the way the capture lays it out. -->
    <div class="balance">
      <div class="readout">
        <div class="balance-figures">
          <div class="balance-line m-num">
            {#if total}
              {total.whole}{#if total.cents}<span class="cents">{total.cents}</span>{/if}
            {:else if !loaded}
              <span class="skeleton skeleton--total"></span>
            {:else}
              <span class="cents">$0.00</span>
            {/if}
          </div>
          <div class="balance-sub m-num">
            {#if change}
              <span class="signed" class:down={!change.up}>{change.text}</span>
              <span class="window">{range.toLowerCase()}</span>
            {/if}
          </div>
        </div>

        <div class="tabs">
          {#each RANGES as tab (tab.id)}
            <button
              type="button"
              class="tab"
              class:tab--on={tab.id === range}
              aria-pressed={tab.id === range}
              onclick={() => (range = tab.id)}
            >
              {tab.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="plot">
        <svg class="canvas" viewBox="0 0 483.2 130.1" preserveAspectRatio="none" style="--ink: {ink}">
          <defs>
            <linearGradient id="pf-area" x1="0" y1="0" x2="0" y2="1">
              <stop class="area-top" offset="0" />
              <stop class="area-bottom" offset="1" />
            </linearGradient>
            <radialGradient id="pf-glow">
              <stop class="glow-core" offset="0" />
              <stop class="glow-edge" offset="1" />
            </radialGradient>
          </defs>
          {#if chart}
            <path class="area" d={chart.area} fill="url(#pf-area)" />
            <path class="line" d={chart.line} />
            <circle class="glow" cx={chart.dotX} cy={chart.dotY} r="14" fill="url(#pf-glow)" />
            <circle class="dot" cx={chart.dotX} cy={chart.dotY} r="3.6" />
          {/if}
        </svg>
      </div>
    </div>

    <!-- Total cash: the row opens the breakdown, the plus opens the deposit flow. A
         foreign wallet's cash is not readable — only the session's own is — so the whole
         row is the reader's own, exactly as the desktop profile draws it. -->
    {#if own && (cash || !loaded)}
      <div class="cash-row">
        <button
          type="button"
          class="cash-main"
          aria-label="Total cash breakdown"
          onclick={() => (cashOpen = true)}
        >
          <span class="cash-disc"><CashCoin /></span>
          <span class="cash-text">
            <span class="cash-label">Total cash</span>
            <span class="cash-value m-num">
              {#if cash}{cash}{:else}<span class="skeleton skeleton--cash"></span>{/if}
            </span>
          </span>
        </button>

        <button type="button" class="square" aria-label="Deposit" onclick={openMobileDeposit}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>

        <button type="button" class="square" aria-label="Cash actions" onclick={() => (cashOpen = true)}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.9" />
            <circle cx="12" cy="12" r="1.9" />
            <circle cx="19" cy="12" r="1.9" />
          </svg>
        </button>
      </div>
    {/if}

    <section class="positions">
      <div class="positions-head">
        <h2 class="positions-title m-num">Positions ({rowCount})</h2>

        <div class="segmented">
          <span class="seg-pill" style={pillStyle}></span>
          <button
            type="button"
            class="seg"
            class:seg--on={side === "open"}
            bind:clientWidth={openWidth}
            onclick={() => (side = "open")}
          >
            <span class="seg-label">Open</span>
            <span class="live"><span class="live-dot"></span></span>
          </button>
          <button
            type="button"
            class="seg"
            class:seg--on={side === "closed"}
            bind:clientWidth={closedWidth}
            onclick={() => (side = "closed")}
          >
            <span class="seg-label">Closed</span>
          </button>
        </div>
      </div>

      <div class="position-list">
        {#if rowsLoading}
          {#each Array.from({ length: 3 }) as _, index (index)}
            <div class="ghost">
              <span class="ghost-disc"></span>
              <span class="ghost-line"></span>
            </div>
          {/each}
        {:else if rowsFailed}
          <p class="empty">Couldn't load positions</p>
        {:else if rowCount === 0}
          <p class="empty">{side === "open" ? "No open positions" : "No closed positions"}</p>
        {:else}
          {#each rows as row (row.key)}
            <button type="button" class="position" onclick={() => onopen?.(row)}>
              <span class="position-logo">
                <img src={row.img} alt="" loading="lazy" decoding="async" />
              </span>
              <span class="position-main">
                <span class="position-ticker m-truncate">{row.ticker}</span>
                <span class="position-sub m-truncate">{row.sub}</span>
              </span>
              <span class="position-right">
                <span class="position-value m-num">{row.value}</span>
                <span class="position-pnl m-num" class:down={!row.up}>
                  {row.sign}{row.pnl}
                </span>
              </span>
            </button>
          {/each}
        {/if}
      </div>
    </section>

    <!-- The floating bar overlays the bottom of the screen: leave it its room. -->
    <div class="tail"></div>
  </div>

  {#if cashOpen}
    <CashSheet onclose={() => (cashOpen = false)} ondeposit={deposit} onwithdraw={withdraw} />
  {/if}

  {#if rewardsOpen}
    <RewardsSheet onclose={() => (rewardsOpen = false)} />
  {/if}

  {#if isTransfersOpen()}
    <TransfersHistory />
  {/if}
</div>

<style>
  .profile {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  /* 102 dp of room for the band, 16 dp gutters, a hairline under the whole header. */
  .head {
    position: relative;
    flex: 0 0 auto;
    padding: 102px 16px 8px 16px;
    border-bottom: 1px solid var(--m-hairline);
  }

  .band {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 132px;
    border-radius: 24px 24px 0 0;
    background: var(--m-card);
    overflow: hidden;
  }

  /* Three 43.7 dp hit targets in a row 4 dp apart, the last ending 16 dp off the edge. */
  .tools {
    position: absolute;
    top: 26.1px;
    right: 16px;
    display: flex;
    gap: 4px;
  }

  .tools--left {
    right: auto;
    left: 16px;
  }

  .tool {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 43.7px;
    height: 43.7px;
  }

  /* 36 dp circle: a dark translucent fill the blur shows through, 22.5 dp icon. */
  .disc {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 18px;
    background: rgba(25, 25, 25, 0.22);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    color: var(--m-text);
  }

  .disc :global(svg) {
    width: 22.5px;
    height: 22.5px;
  }

  /* The capture's Rewards pill: 36 dp tall, r8, #4662FB fill under a 1 dp #6F85FF -> #4662FB
     rim, 12 dp of padding with a 6 dp gap between the 17.6 dp gift and its 14/700 label. */
  .rewards {
    position: absolute;
    top: 114.1px;
    right: 15.4px;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid transparent;
    border-radius: 8px;
    background:
      linear-gradient(var(--m-blue), var(--m-blue)) padding-box,
      linear-gradient(180deg, var(--m-blue-rim), var(--m-blue)) border-box;
    color: var(--m-text);
  }

  .rewards:active {
    transform: translateY(0.5px) scale(0.99);
  }

  .rewards :global(svg) {
    width: 17.6px;
    height: 17.6px;
  }

  .rewards-label {
    font-size: 14px;
    font-weight: 700;
    line-height: 16.5px;
    color: var(--m-text);
  }

  .copied {
    position: absolute;
    left: 16px;
    bottom: 8px;
    font-size: 12px;
    color: var(--m-muted);
  }

  /* The avatar sits on a 3 dp ring of the page colour, the way the capture strokes it. */
  .avatar {
    position: relative;
    width: 60px;
    height: 60px;
  }

  .ring {
    position: absolute;
    inset: -3px;
    border-radius: 33px;
    border: 3px solid var(--m-bg);
  }

  .avatar-disc {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 30px;
    overflow: hidden;
    background: var(--m-pink);
  }

  .avatar-disc img {
    width: 60px;
    height: 60px;
    object-fit: cover;
  }

  .avatar-disc .mark {
    width: 45px;
    height: 45px;
    object-fit: contain;
  }

  .name {
    margin-top: 7.9px;
    font-size: 22px;
    font-weight: 500;
    line-height: 26.1px;
    color: var(--m-text);
  }

  .handle {
    margin-top: 3.3px;
    font-size: 16px;
    font-weight: 500;
    line-height: 18.7px;
    color: var(--m-muted);
  }

  .stats {
    display: flex;
    gap: 16px;
    margin-top: 15.4px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
    line-height: 16.5px;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 700;
    color: var(--m-text);
  }

  .stat-label {
    font-size: 12px;
    font-weight: 400;
    color: var(--m-muted);
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 16px;
    margin-top: 16px;
    overflow-x: auto;
  }

  .meta-item {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 3.7px;
    height: 16px;
    color: var(--m-muted);
  }

  .meta-item :global(svg) {
    width: 16px;
    height: 16px;
    color: var(--m-muted);
  }

  .meta-text {
    font-size: 12px;
    font-weight: 400;
    color: var(--m-muted);
    white-space: nowrap;
  }

  .body {
    flex: 1 1 auto;
    min-height: 0;
  }

  /* 483.2 dp on a 480 dp screen: the extra 3.2 hangs off the left edge. */
  .balance {
    display: flex;
    flex-direction: column;
    width: calc(100% + 3.2px);
    margin-left: -3.2px;
    padding-top: 16px;
    background: var(--m-bg);
  }

  .readout {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    height: 54.9px;
    padding: 0 16px;
  }

  .balance-line {
    font-size: 28px;
    font-weight: 500;
    line-height: 32.5px;
    color: var(--m-text);
  }

  .cents {
    color: var(--m-dim);
  }

  .balance-sub {
    display: flex;
    align-items: center;
    gap: 4.7px;
    margin-top: 4.3px;
  }

  .signed {
    font-size: 16px;
    font-weight: 500;
    line-height: 18.7px;
    color: var(--m-green);
  }

  .signed.down {
    color: var(--m-red);
  }

  .window {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-dim);
  }

  .tabs {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab {
    min-width: 28px;
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 13.9px;
    text-align: center;
    color: var(--m-dim);
  }

  .tab--on {
    background: var(--m-hairline);
    color: var(--m-text);
  }

  .plot {
    position: relative;
    height: 130.1px;
    margin-top: 0.5px;
    overflow: hidden;
    /* The capture's dotted backdrop: a faint grid of dots on the page colour. */
    background-image: radial-gradient(circle, rgba(203, 208, 235, 0.09) 1px, transparent 1.2px);
    background-size: 9.3px 9.3px;
    background-position: 3px 3px;
  }

  .canvas {
    display: block;
    width: 100%;
    height: 130.1px;
  }

  .line {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }

  .area-top {
    stop-color: var(--ink);
    stop-opacity: 0.22;
  }

  .area-bottom {
    stop-color: var(--ink);
    stop-opacity: 0;
  }

  .glow-core {
    stop-color: var(--ink);
    stop-opacity: 0.32;
  }

  .glow-edge {
    stop-color: var(--ink);
    stop-opacity: 0;
  }

  .dot {
    fill: var(--ink);
  }

  /* 64 dp section: 16 dp of air above a 48 dp row, the row inset 16 dp. */
  .cash-row {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 64px;
    padding: 16px 16px 0 16px;
  }

  .cash-main {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 12px;
    min-width: 0;
    text-align: left;
  }

  .cash-disc {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 999px;
    background: var(--m-hairline);
    color: var(--m-text);
  }

  .cash-disc :global(svg) {
    width: 27.7px;
    height: 27.7px;
  }

  .cash-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .cash-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .cash-value {
    font-size: 18px;
    font-weight: 500;
    line-height: 22px;
    color: var(--m-text);
  }

  /* The + and … doors: 40 dp squares on the second card tone with a gradient rim. */
  .square {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid transparent;
    border-radius: 8px;
    background:
      linear-gradient(var(--m-card-2), var(--m-card-2)) padding-box,
      linear-gradient(180deg, #2e2d41, #161522) border-box;
    color: var(--m-text);
  }

  .square :global(svg) {
    width: 24px;
    height: 24px;
  }

  .positions {
    padding-top: 24px;
  }

  .positions-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 27.7px;
    padding: 0 16px;
  }

  .positions-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 20.3px;
    color: var(--m-text);
  }

  /* The Open/Closed control: a 2 dp inset track with a pill that slides between halves. */
  .segmented {
    position: relative;
    display: flex;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--m-hairline);
    border-radius: 8px;
    background: var(--m-bg);
  }

  .seg-pill {
    position: absolute;
    top: 2px;
    bottom: 2px;
    left: 2px;
    border-radius: 6px;
    background: rgba(81, 106, 246, 0.2);
    transition:
      transform 160ms ease,
      width 160ms ease;
  }

  .seg {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 21.9px;
    padding: 0 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  .seg--on {
    color: var(--m-blue-soft);
  }

  .live {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 8px;
    height: 8px;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    background: var(--m-blue);
  }

  .position-list {
    display: flex;
    flex-direction: column;
    padding-top: 12px;
  }

  .position {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 60px;
    padding: 6px 16px;
    text-align: left;
  }

  .position-logo {
    display: block;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
  }

  .position-logo img {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
  }

  .position-main,
  .position-right {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .position-main {
    flex: 1 1 auto;
    gap: 2px;
    align-items: flex-start;
  }

  .position-right {
    flex: 0 0 auto;
    gap: 2px;
    align-items: flex-end;
  }

  .position-ticker {
    font-size: 16px;
    color: var(--m-text);
  }

  .position-sub {
    font-size: 12px;
    color: var(--m-muted);
  }

  .position-value {
    font-size: 16px;
    color: var(--m-text);
  }

  .position-pnl {
    font-size: 12px;
    color: var(--m-green);
  }

  .position-pnl.down {
    color: var(--m-red);
  }

  /* The capture's empty state: 48 dp of centred muted text with 16 dp above and below. */
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    margin: 16px 16px;
    font-size: 14px;
    font-weight: 500;
    color: var(--m-dim);
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 60px;
    padding: 6px 16px;
  }

  .ghost-disc {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: var(--m-card);
  }

  .ghost-line {
    width: 120px;
    height: 16px;
    border-radius: 6px;
    background: var(--m-card);
  }

  .skeleton {
    display: block;
    border-radius: 6px;
    background: var(--m-card);
  }

  .skeleton--name {
    width: 140px;
    height: 24px;
    margin-top: 9.9px;
  }

  .skeleton--handle {
    width: 116px;
    height: 17px;
    margin-top: 5.3px;
  }

  .skeleton--total {
    display: inline-block;
    width: 96px;
    height: 30px;
  }

  .skeleton--cash {
    display: inline-block;
    width: 72px;
    height: 18px;
  }

  /* Room for the floating bar, so the last row is not trapped under it. */
  .tail {
    height: 84px;
  }
</style>
