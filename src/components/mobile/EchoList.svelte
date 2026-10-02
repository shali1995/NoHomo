<!--
  The phone's Echo facet: the live ranking Echo's own service streams, drawn in the phone's
  row anatomy.
  It is the twin of the desktop panel's Echo view, not a second ranking: both read
  src/lib/api/echo.svelte.js, so the filter set, the stream and the OpenDEX market cache are
  the same state, and every figure in a row is the API's own.
  The stream is owned here, because this component only exists while Echo is the selected
  facet: mounting opens the one stream for the current kind / period / rows, a change to any
  of those closes it and opens the new one, and leaving the facet closes it.
  The rows flow in order rather than being placed at a stride: a snapshot replaces them every
  couple of seconds, so their height is the ranking's own, not a fixed 53 px slot.
  Echo's filter rail comes first, then the rows — the two things the home screen mounts as
  one facet beside the four scanner rankings.
-->
<script>
  import { untrack } from "svelte";
  import {
    echo,
    echoFilters,
    echoQueryKey,
    echoRowView,
    echoVisibleRows,
    ensureEchoStream,
    retryEchoStream,
    stopEchoMarkets,
    stopEchoStream,
    syncEchoMarkets
  } from "../../lib/api/echo.svelte.js";
  import EchoFilters from "./EchoFilters.svelte";

  /** `onopen(row)` takes a row carrying an href; `onopentrader(trader)` a walletAddress. */
  let { onopen, onopentrader } = $props();

  /** Placeholder rows: enough to hold the list open while the first snapshot is in flight. */
  const GHOST_ROWS = 8;
  /** The app's own mark, the last resort when Echo has no image and the token route fails. */
  const APP_MARK = "/images/nohomo-eyes.png";
  /** How often the ages are recomputed, and how long a stream may stay quiet before it is reopened. */
  const CLOCK_MS = 5_000;
  const QUIET_MS = 90_000;

  // Re-runs exactly when the server-side filter set changes: the old stream is closed by the
  // cleanup and the new filter set is streamed. One stream, always.
  $effect(() => {
    const key = echoQueryKey();
    ensureEchoStream(key);
    return () => stopEchoStream();
  });

  /**
   * The clock the ages read. A snapshot replaces the rows every couple of seconds, but "5m"
   * has to keep counting while nothing arrives, and a stream that has gone quiet without
   * erroring — a half-open connection — shows up only as an age that stops moving, so the
   * same tick reopens it. The watchdog only ever fires after a snapshot has landed: the
   * slower windows take seconds to answer at all, and a first load that is merely still
   * running is left alone.
   */
  let nowMs = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => {
      nowMs = Date.now();
      if (echo.loaded && echo.streamState === "open" && nowMs - echo.lastSnapshotAt > QUIET_MS) {
        retryEchoStream();
      }
    }, CLOCK_MS);
    return () => clearInterval(timer);
  });

  // The clock is read inside, so the age ceiling and the ages themselves follow it and not
  // only the arriving snapshots.
  const rows = $derived.by(() => {
    void nowMs;
    return echoVisibleRows();
  });
  const views = $derived(rows.map((row) => echoRowView(row)));

  // The 24h change and the token age are OpenDEX's, read in batches and cached per address, so
  // a snapshot every couple of seconds costs nothing for a row already resolved. The sweep
  // reads the cache it may extend, so it runs untracked: the effect depends on the snapshot
  // alone, and an arriving socket frame does not re-run it.
  $effect(() => {
    const addresses = echo.rows.map((row) => row.address);
    untrack(() => syncEchoMarkets(addresses));
  });

  // Unmount only: the market sockets and the stale-entry timer go with the view, the cache
  // stays so a return to Echo does not re-read every token.
  $effect(() => () => stopEchoMarkets());

  // Placeholders only while the first snapshot is genuinely in flight. A stream that cannot
  // be reached leaves the store's `loading` standing, so the error is what ends the
  // skeletons: otherwise a phone with no reachable Echo service shows them forever, and the
  // Retry that would open the stream again is never drawn.
  const loading = $derived(echo.loading && rows.length === 0 && !echo.error);
  const emptyMessage = $derived(
    echo.error
      ? echo.error
      : echo.loaded
        ? echoFilters.maxAgeSeconds || echoFilters.change !== "all"
          ? "No tokens match the age and 24h-change filters."
          : "No tokens in this window."
        : "Waiting for the first snapshot…"
  );

  /** The token's own page: the row carries the href the app's router already knows. */
  function openToken(view) {
    onopen?.(view);
  }

  /** The trader is a wallet, so their name opens their profile and stops there. */
  function openTrader(wallet, event) {
    event.stopPropagation();
    if (wallet?.address) onopentrader?.({ walletAddress: wallet.address });
  }

  /** A row standing in for a link: Enter and Space activate it. */
  function activated(event) {
    return event.key === "Enter" || event.key === " ";
  }

  /** The change is a signed percentage, so it takes the phone's own green and red. */
  function changeColor(label) {
    return label.startsWith("-") ? "var(--m-red)" : "var(--m-green)";
  }

  /** Echo's image, else the app's token route, and the app's mark if even that does not load. */
  function useAppMark(event) {
    const image = event.currentTarget;
    if (image.dataset.fallback) return;
    image.dataset.fallback = "1";
    image.src = APP_MARK;
  }
</script>

<div class="echo">
  <EchoFilters />

  {#if echo.error && views.length > 0}
    <!-- The stream can fail while rows are still on screen; saying so beats rows that
         silently stopped moving. -->
    <p class="strip">
      <span class="strip-text m-truncate">{echo.error}</span>
      <button type="button" class="retry" onclick={retryEchoStream}>Retry</button>
    </p>
  {/if}

  <div class="rows">
    {#if loading}
      {#each Array.from({ length: GHOST_ROWS }) as _, index (index)}
        <div class="ghost">
          <span class="ghost-disc"></span>
          <span class="ghost-line"></span>
        </div>
      {/each}
    {:else if views.length === 0}
      <div class="empty">
        <p class="empty-text">{emptyMessage}</p>
        {#if echo.error || echo.loaded}
          <button type="button" class="retry" onclick={retryEchoStream}>Retry</button>
        {/if}
      </div>
    {:else}
      {#each views as view (view.key)}
        <!-- The headline figure is the market cap, as the desktop's row headlines it; the flow
             is the third line's own business and printing it here would say it twice. The flow
             stands in only when there is no cap to show. -->
        {@const amount = view.primary || view.flowLabel}
        <div
          class="row"
          role="link"
          tabindex="0"
          title={view.title}
          onclick={() => openToken(view)}
          onkeydown={(event) => {
            if (!activated(event)) return;
            event.preventDefault();
            openToken(view);
          }}
        >
          <span class="logo">
            <img src={view.logo} alt="" loading="lazy" decoding="async" onerror={useAppMark} />
            <span class="rank m-num" title="Echo rank">{view.rank}</span>
          </span>

          <!--
            The desktop Echo row's three lines, in the phone's own type. A phone has no width
            for a second column, so each line carries its own figures at its own end instead:
            the token and what it is worth, then what Echo counted, then who moved it.
          -->
          <span class="body">
            <span class="line line--head">
              <span class="symbol m-truncate">{view.name}</span>
              <span class="figures">
                {#if amount}<span class="amount m-num">{amount}</span>{/if}
                {#if view.changeLabel}
                  <span class="change m-num" style="color: {changeColor(view.changeLabel)}"
                    >{view.changeLabel}</span
                  >
                {/if}
              </span>
            </span>

            <span class="line line--detail">
              {#if view.detail}<span class="detail m-truncate">{view.detail}</span>{/if}
              {#if view.ageLabel}
                <span class="age m-num" title={view.ageTitle}>· {view.ageLabel}</span>
              {/if}
            </span>

            {#if view.wallets.length > 0 || view.extraLabel || view.multipleLabel || view.flowLabel}
              <span class="line line--flow">
                {#each view.wallets as wallet (wallet.address)}
                  <button
                    type="button"
                    class="wallet"
                    title={wallet.label}
                    aria-label={wallet.label}
                    onclick={(event) => openTrader(wallet, event)}
                  >
                    {#if wallet.imageUrl}
                      <img
                        src={wallet.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onerror={useAppMark}
                      />
                    {:else}
                      <span>{wallet.letter}</span>
                    {/if}
                  </button>
                {/each}
                {#if view.extraLabel}
                  <span class="extra" title={view.extraTitle}>{view.extraLabel}</span>
                {/if}
                {#if view.multipleLabel}
                  <span class="multiple" title={view.multipleTitle}>{view.multipleLabel}</span>
                {/if}
                {#if view.flowLabel}
                  <span class="flow m-num">{view.flowLabel}</span>
                {/if}
              </span>
            {/if}
          </span>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .echo {
    display: block;
  }

  /* The capture's own lead-in between the facet row's rail and the first row. */
  .rows {
    display: flex;
    flex-direction: column;
    margin-top: 11.7px;
  }

  /*
   * The Echo row carries three lines where the scanner rows carry two, because Echo knows
   * three things about a token — what it is worth, what was counted, and who moved it — and
   * the desktop row is built the same way. Its figures and its disc are the desktop's own
   * sizes, so the two surfaces read alike: a 52 dp disc, 14 dp for the token and its headline
   * figure, 12 dp for everything counted. Nothing in the capture has an Echo view to match,
   * so there is no captured row here to keep to.
   */
  .row {
    display: flex;
    align-items: flex-start;
    width: 100%;
    padding: 8px 16px;
    text-align: left;
    background: var(--m-bg);
    cursor: pointer;
  }

  .row:active {
    background: var(--m-card);
  }

  .logo {
    position: relative;
    flex: 0 0 auto;
    width: 52px;
    height: 52px;
    margin-right: 8px;
  }

  .logo img {
    display: block;
    width: 52px;
    height: 52px;
    border-radius: 26px;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
    background: var(--m-card);
  }

  /* 18 dp on the disc's lower-left corner, over a 1 dp ring of the page colour: the desktop
     puts the rank there, and it never costs a column. */
  .rank {
    position: absolute;
    left: -4px;
    bottom: -4px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border: 1px solid var(--m-bg);
    border-radius: 9px;
    background: var(--m-card-2);
    font-size: 10px;
    font-weight: 700;
    line-height: 11.6px;
    color: var(--m-muted);
  }

  /* One column of three lines, 4 dp apart — the desktop's own `gap-1`. */
  .body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .line {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }

  /* The figures sit at the line's end, the way the desktop's own `ml-auto` group does. */
  .figures {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-left: auto;
    flex: 0 0 auto;
  }

  .figures .amount {
    font-size: 14px;
    line-height: 16px;
  }

  /* Everything Echo counted is one step down from the token and its headline figure. */
  .line--detail,
  .line--flow {
    font-size: 12px;
    line-height: 14px;
    color: var(--m-muted);
  }

  .line--flow {
    overflow: hidden;
  }

  .age,
  .change {
    flex: 0 0 auto;
  }

  .age {
    color: var(--m-dim);
  }

  .change {
    font-size: 12px;
    line-height: 14px;
  }

  .amount {
    color: var(--m-text);
  }

  /* The caller: 16 dp, ringed in the page colour so a run of them reads as separate faces. */
  .wallet {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 1px solid var(--m-bg);
    border-radius: 8px;
    overflow: hidden;
    background: var(--m-card-2);
    font-size: 9px;
    color: var(--m-muted);
  }

  .wallet img {
    display: block;
    width: 16px;
    height: 16px;
    object-fit: cover;
  }

  /* "+64": how many more callers Echo counted beyond the faces it can draw. */
  .extra {
    flex: 0 0 auto;
    font-size: 12px;
    line-height: 14px;
    color: var(--m-dim);
  }

  /* The multiple since Echo first caught the token — a gain, so it reads green. */
  .multiple {
    flex: 0 0 auto;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(4, 194, 73, 0.16);
    font-size: 12px;
    font-weight: 700;
    line-height: 14px;
    color: var(--m-green);
  }

  .flow {
    flex: 0 0 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* The token's name, at the desktop's own size: `text-sm` over `leading-4`. */
  .symbol {
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    color: var(--m-text);
    min-width: 0;
  }

  .strip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    min-width: 0;
  }

  .strip-text {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 12px;
    line-height: 13.9px;
    color: var(--m-muted);
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 24px;
  }

  .empty-text {
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    color: var(--m-muted);
  }

  /* The phone's chip, as a real control: it retries the stream. */
  .retry {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    height: 34.1px;
    padding: 0 8px;
    border: 1px solid var(--m-hairline);
    border-radius: 10px;
    background: var(--m-bg);
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-text);
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 66.7px;
    padding: 8px 16px;
  }

  .ghost-disc {
    width: 48px;
    height: 48px;
    border-radius: 24px;
    background: var(--m-card);
  }

  .ghost-line {
    width: 120px;
    height: 16px;
    border-radius: 6px;
    background: var(--m-card);
  }
</style>
