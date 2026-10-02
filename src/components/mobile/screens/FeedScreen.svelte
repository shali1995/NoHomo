<!--
  The phone's Feed tab: the capture's Global timeline, live.
  It is the twin of the desktop panel rather than a second feed: both read
  src/lib/api/feed.svelte.js, so a row that arrives over the socket is the same object on
  both surfaces, and every figure here (handle, age, symbol, amount, body, like count) is
  the API's own.
  The header is drawn in flow instead of overlaying the list as the capture does — the
  header is opaque, so a scroller that passes under it looks identical to one that starts
  below it. Its bands, chips, radii and font sizes are the capture's dp.
  Three parts of the capture are deliberately absent, because nothing behind them exists:
  the pinned fomo recap post (no endpoint serves it; the desktop panel drops it for the
  same reason), the Friends page of the pager (the module subscribes to the shared wallet
  feeds only), and the filter icon with its sheet (the module's thresholds are constants
  in FEED_FILTERS, not controls). The Friends label is still drawn, in the capture's own
  inactive tone and as text rather than a control, so the tab row keeps its geometry
  without pretending to switch anything.
-->
<script>
  import Heart from "../../../icons/heart.svelte";
  import { getError, getFeedRows, isLoading, startFeed, stopFeed } from "../../../lib/api/feed.svelte.js";

  let { onopen, onopentrader } = $props();

  /** The desktop panel's rows, from the desktop panel's module: swaps and theses, newest first. */
  const rows = $derived(getFeedRows());
  const loadError = $derived(getError());
  // Placeholders only while the first page is genuinely in flight.
  const loading = $derived(isLoading() && rows.length === 0);
  const GHOSTS = 6;

  $effect(() => {
    startFeed();
    return () => stopFeed();
  });

  /** The whole card is one touch target that opens the post, as the capture drew it. */
  function open(row) {
    onopen?.(row);
  }

  /**
   * The author is a wallet, so their name and their avatar open their profile and stop
   * there — the same two triggers the desktop row carries.
   */
  function openAuthor(row, event) {
    event.stopPropagation();
    if (row.walletAddress) onopentrader?.({ walletAddress: row.walletAddress });
  }

  /** A card standing in for a link: Enter and Space activate it. */
  function activated(event) {
    return event.key === "Enter" || event.key === " ";
  }

  /**
   * The capture's side chip: `Buy` green on `#21C95E@20%`, `Sell` red on `#FF622E@20%`.
   * The row object carries the desktop capture's tones, so the phone's own pair is set here.
   */
  const chipStyle = (text) =>
    text === "Sell"
      ? "color: var(--m-red); background-color: rgba(255, 98, 46, 0.2);"
      : "color: var(--m-green); background-color: rgba(33, 201, 94, 0.2);";
</script>

{#snippet ava(row)}
  {#if row.avatar.eyes}
    <span class="ava ava--eyes">
      <img src={row.avatar.imgSrc} alt="" />
    </span>
  {:else}
    <img class="ava" src={row.avatar.imgSrc} alt="" />
  {/if}
{/snippet}

{#snippet who(row)}
  <span
    class="who"
    role="link"
    tabindex="0"
    onclick={(event) => openAuthor(row, event)}
    onkeydown={(event) => {
      if (!activated(event)) return;
      openAuthor(row, event);
    }}
  >
    <span class="handle m-truncate">{row.name.text}</span>
  </span>
{/snippet}

<div class="feed">
  <div class="head">
    <div class="tabs">
      <div class="half half--left">
        <span class="tab tab--on" aria-current="page">Global<span class="rule"></span></span>
      </div>
      <div class="half half--right">
        <span class="tab" aria-disabled="true">Friends</span>
      </div>
    </div>
  </div>

  <div class="list m-scroll">
    {#if loadError}
      <p class="error">{loadError}</p>
    {/if}

    {#if loading}
      {#each Array.from({ length: GHOSTS }) as _, index (index)}
        <div class="card card--ghost">
          <span class="ghost-disc"></span>
          <span class="ghost-col">
            <span class="ghost-line"></span>
            <span class="ghost-line ghost-line--short"></span>
          </span>
        </div>
      {/each}
    {/if}

    {#each rows as row (row.id)}
      {#if row.type === "swap"}
        <!-- The capture's trade card: the same rail, the side chip, and the token's own
             32 dp avatar with the amount beside it. No body and no like row, which is why
             it is ~91 dp tall against a thesis card's ~130. -->
        <div
          class="card card--trade"
          role="link"
          tabindex="0"
          onclick={() => open(row)}
          onkeydown={(event) => {
            if (!activated(event)) return;
            event.preventDefault();
            open(row);
          }}
        >
          <div class="rail">{@render ava(row)}</div>

          <div class="col">
            <div class="author">
              {@render who(row)}
              <span class="chip" style={chipStyle(row.badge.text)}>{row.badge.text}</span>
              <span class="age">{row.time.text}</span>
            </div>

            <div class="line">
              <img class="tok" src={row.tokenLogo.img.src} alt="" />
              <span class="symwrap">
                <span class="sym m-truncate">{row.line[0].text}</span>
                <span class="dots dots--trade"></span>
              </span>
              <span class="rest">
                {#each row.line.slice(1) as cell (cell.text)}
                  <span class="amount m-num">{cell.text}</span>
                {/each}
              </span>
            </div>
          </div>
        </div>
      {:else}
        <!-- The capture's thesis card: avatar rail, author row, the token's price row, the
             body, and the like count, each row 8 dp below the last. -->
        <div
          class="card"
          role="link"
          tabindex="0"
          onclick={() => open(row)}
          onkeydown={(event) => {
            if (!activated(event)) return;
            event.preventDefault();
            open(row);
          }}
        >
          <div class="rail">{@render ava(row)}</div>

          <div class="col">
            <span class="thread"></span>

            <div class="author">
              {@render who(row)}
              <span class="chip chip--thesis">Thesis</span>
              <span class="age">{row.time.text}</span>
            </div>

            <div class="tokenrow">
              <img class="tok" src={row.tokenLogo.img.src} alt="" />
              <span class="symwrap">
                <span class="sym m-truncate">{row.ticker.text}</span>
                <span class="dots"></span>
              </span>
              {#each row.amount as cell (cell.kind + (cell.text ?? ""))}
                <span class="amount m-num">{cell.text}</span>
              {/each}
            </div>

            <p class="body">{row.quoteText}</p>

            <div class="foot">
              <Heart style="width: 18px; height: 18px; color: var(--m-dim)" />
              <span class="count m-num">{row.likes.count}</span>
            </div>
          </div>
        </div>
      {/if}
    {/each}

    <!-- Room for the floating bar, so the last card is not trapped under it. -->
    <div class="tail"></div>
  </div>
</div>

<style>
  .feed {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  /* The capture's header sits below the 24 dp status bar and is 45.3 dp tall, its bottom
     hairline included. */
  .head {
    flex: 0 0 auto;
    height: 45.3px;
    margin-top: calc(24px + env(safe-area-inset-top));
    background: var(--m-bg);
    border-bottom: 1px solid var(--m-hairline);
  }

  .tabs {
    display: flex;
    height: 44.3px;
  }

  .half {
    position: relative;
    flex: 1 1 0;
    height: 44.3px;
    min-width: 0;
  }

  /* The labels are pinned to the capture's own x: `Global`'s right edge 51.8 dp in from the
     centre line, `Friends`' left edge 48 dp out from it. */
  .tab {
    position: absolute;
    top: 12px;
    font-size: 16px;
    font-weight: 500;
    line-height: 20.3px;
    color: var(--m-dim);
    white-space: nowrap;
  }

  .half--left .tab {
    right: 51.8px;
  }

  .half--right .tab {
    left: 48px;
  }

  .tab--on {
    color: var(--m-text);
  }

  /* The active-tab indicator: a 110.4 dp rule centred on the label, its bottom flush with
     the header's bottom hairline. */
  .rule {
    position: absolute;
    left: 50%;
    top: calc(100% + 8.8px);
    width: 110.4px;
    height: 3.2px;
    transform: translateX(-50%);
    background: var(--m-blue);
  }

  .list {
    flex: 1 1 auto;
    min-height: 0;
  }

  .error {
    padding: 8px 12.3px;
    font-size: 12px;
    color: var(--m-muted);
  }

  /* One post: 12.3 dp gutters (the capture's own band, which is where its 12 dp padding
     lands after rounding), 16 dp above and below, a 0.5 dp #161522 hairline between cards
     rather than a divider of its own. */
  .card {
    display: flex;
    gap: 12.3px;
    padding: 16px 12.3px;
    border-bottom: 0.5px solid var(--m-card-2);
    cursor: pointer;
  }

  .card:active {
    background: var(--m-card);
  }

  .rail {
    flex: 0 0 auto;
  }

  /* 27.7 dp with a 1 dp ring; a wallet with no picture keeps the ring and shows the eyes. */
  .ava {
    display: block;
    width: 27.7px;
    height: 28.3px;
    border: 1px solid var(--m-hairline);
    border-radius: 14px;
    background: var(--m-card);
    object-fit: cover;
  }

  .ava--eyes {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ava--eyes img {
    width: 70%;
    height: 70%;
  }

  .col {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .card--trade .col {
    gap: 5.8px;
  }

  /* The capture's L-shaped thread: from below the avatar, down and across into the token
     avatar. Decoration only, on the thesis card. */
  .thread {
    position: absolute;
    top: 24.6px;
    left: -26.2px;
    width: 19.7px;
    height: 40px;
    border-bottom: 2.5px solid var(--m-hairline);
    border-left: 2.5px solid var(--m-hairline);
    border-bottom-left-radius: 8px;
    pointer-events: none;
  }

  .author {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 18.7px;
    min-width: 0;
  }

  .who {
    display: flex;
    min-width: 0;
    flex-shrink: 1;
    cursor: pointer;
  }

  .handle {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-text);
  }

  /* `Thesis` on `#516AF6@20%`; the trade card's `Buy` / `Sell` chips take their own pair. */
  .chip {
    flex: 0 0 auto;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 700;
    line-height: 14.4px;
  }

  .chip--thesis {
    color: var(--m-blue);
    background: rgba(81, 106, 246, 0.2);
  }

  .age {
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 500;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  /* The token row: avatar, symbol over its dotted underline, then the amount, 8 dp apart. */
  .tokenrow {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 19.7px;
    min-width: 0;
  }

  .tok {
    flex: 0 0 auto;
    width: 19.7px;
    height: 19.7px;
    border: 1px solid var(--m-hairline);
    border-radius: 20px;
    background: var(--m-card-2);
    object-fit: cover;
  }

  .symwrap {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
  }

  .sym {
    max-width: 100%;
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-text);
  }

  /* The contract-address affordance: 1 dp dots, 3.838 dp apart on a thesis card and
     4.633 dp on a trade card, 1.1 dp below the symbol's box. */
  .dots {
    width: 100%;
    height: 2.1px;
    margin-top: 1.1px;
    background-image: radial-gradient(circle at 1px 1px, var(--m-dim) 1px, transparent 1.05px);
    background-size: 3.838px 2.1px;
    background-repeat: repeat-x;
  }

  .dots--trade {
    background-size: 4.633px 2.1px;
  }

  .amount {
    flex: 0 0 auto;
    font-size: 14px;
    font-weight: 400;
    line-height: 16.5px;
    color: var(--m-text);
  }

  /* The capture sets the body at 14/400 with tight line boxes: a two-line thesis is
     33.1 dp tall, a four-line one 66.1. */
  .body {
    margin: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 16.55px;
    color: var(--m-text);
    white-space: pre-line;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .foot {
    display: flex;
    align-items: center;
    gap: 5.4px;
    height: 18.1px;
  }

  .count {
    font-size: 12px;
    font-weight: 500;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  /* The trade card's own line: the 32 dp token avatar, then the symbol 8 dp out, then the
     size and the market cap 4 dp apart. The symbol is centred on the avatar and its
     dotted underline hangs below it, as the capture draws it. */
  .line {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding-bottom: 2.5px;
    min-width: 0;
  }

  .rest {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .card--trade .tok {
    width: 32px;
    height: 32px;
    border-radius: 32px;
  }

  .card--trade .symwrap {
    padding-top: 7.5px;
  }

  .card--trade .amount {
    line-height: 32px;
  }

  .tail {
    height: 84px;
  }

  .card--ghost {
    cursor: default;
  }

  .ghost-disc {
    flex: 0 0 auto;
    width: 27.7px;
    height: 28.3px;
    border-radius: 14px;
    background: var(--m-card);
  }

  .ghost-col {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .ghost-line {
    width: 140px;
    height: 16px;
    border-radius: 6px;
    background: var(--m-card);
  }

  .ghost-line--short {
    width: 96px;
  }
</style>
