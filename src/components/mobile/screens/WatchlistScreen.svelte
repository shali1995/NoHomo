<!--
  The list half of the phone home's Watchlist tab: the account's saved tokens over the
  holdings slot. The header band above it belongs to the home screen, so this renders no
  header of its own — the capture's two labelled rows, the token rows, and the empty state.
  Every row is a real favourite of the signed-in account (`GET /v2/user/favourites`). The
  endpoint carries no 24h change and no image, so a row shows the live price and market cap
  and draws its disc from the app's own token-image endpoint; the #FFBF35 star in the disc's
  corner is the membership flag itself, and tapping it removes the favourite — the other half
  of the same endpoint. Signed out, the endpoint answers "Missing credentials", which is a
  normal state here: the list shows one plain line instead of rows.
-->
<script>
  import { api } from "../../../lib/api/client.js";
  import { tokenImage } from "../../../lib/api/config.js";
  import { formatUsdCompact, splitPrice } from "../../../lib/api/trending.svelte.js";
  import { chainSlug } from "../../../lib/routes.js";
  import PositionsSection from "../PositionsSection.svelte";

  let { onopen } = $props();

  let rows = $state.raw([]);
  let loading = $state(true);
  let generation = 0;

  /** One favourite as the capture's row: the live price split for its subscript, the cap, the disc. */
  function favouriteRow(item) {
    const token = item?.token ?? {};
    const symbol = token.symbol ?? "";
    const price = splitPrice(item?.priceUsdStr);
    return {
      key: `${token.chain}:${token.address}`,
      chain: token.chain,
      address: token.address,
      href: `/tokens/${chainSlug(token.chain)}/${token.address}`,
      initial: symbol.slice(0, 1) || "?",
      symbol,
      logo: tokenImage(token.chain, token.address),
      mcap: formatUsdCompact(item?.marketCapUsdStr),
      pricePrefix: price.pricePrefix,
      sub: price.sub,
      priceSuffix: price.priceSuffix
    };
  }

  async function load() {
    const mine = ++generation;
    loading = true;
    try {
      const { data, error } = await api.GET("/v2/user/favourites");
      if (mine !== generation) return;
      // A signed-out session (400 "Missing credentials") and an empty list are the same
      // thing to draw: no rows. There is nothing else to say about either on this screen.
      rows = error || !data ? [] : (data.favourites ?? []).map(favouriteRow);
    } catch {
      if (mine === generation) rows = [];
    } finally {
      if (mine === generation) loading = false;
    }
  }

  /**
   * The star is the membership flag and the only control on the row: removing it calls the
   * endpoint's own DELETE. The row goes at once and comes back if the API refuses, so the
   * list never claims a change the server did not make.
   */
  async function remove(row) {
    const before = rows;
    rows = rows.filter((item) => item.key !== row.key);
    const { error } = await api.DELETE("/v2/user/favourites/{chain}/{tokenAddress}", {
      params: { path: { chain: row.chain, tokenAddress: row.address } }
    });
    if (error) rows = before;
  }

  $effect(() => {
    void load();
    return () => {
      generation += 1;
    };
  });
</script>

<div class="wl">
  <div class="labels">
    <span class="label">Your watchlist</span>
    <!-- The capture draws this one in the tertiary tone and there is no bulk endpoint to
         answer it, so it stays a label rather than a control that would do nothing. -->
    <span class="clear">Clear all</span>
  </div>

  {#if rows.length}
    <div class="sub">Tokens</div>
    {#each rows as row (row.key)}
      <div class="row">
        <button type="button" class="trow" onclick={() => onopen?.(row)}>
          <span class="logo">
            {#if row.logo}
              <img src={row.logo} alt="" loading="lazy" decoding="async" />
            {:else}
              <span class="initial">{row.initial}</span>
            {/if}
          </span>

          <span class="left">
            <span class="symbol m-truncate">{row.symbol}</span>
            <span class="mcap m-num">{row.mcap} MC</span>
          </span>

          <span class="right">
            <span class="price m-num"
              >{row.pricePrefix}{#if row.sub}<sub>{row.sub}</sub>{/if}{row.priceSuffix}</span
            >
          </span>
        </button>

        <!-- The membership flag is the row's one control: it removes the favourite. -->
        <button
          type="button"
          class="star"
          aria-label="Remove {row.symbol} from your watchlist"
          onclick={() => remove(row)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
            />
          </svg>
        </button>
      </div>
    {/each}
  {:else if loading}
    {#each Array.from({ length: 5 }) as _, index (index)}
      <div class="ghost">
        <span class="ghost-disc"></span>
        <span class="ghost-line"></span>
      </div>
    {/each}
  {:else}
    <p class="empty">Your watchlist is empty</p>
  {/if}

  <!-- The desktop panel's "Your positions", in the phone's language: the switch, the rows, the
       dust, and the closed trades behind the other side of the switch. -->
  <PositionsSection />
</div>

<style>
  .wl {
    display: flex;
    flex-direction: column;
    padding: 0 16px;
  }

  .labels {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 16.5px;
    margin-top: 4px;
    font-size: 14px;
    line-height: 16.5px;
  }

  .label {
    color: var(--m-muted);
  }

  .clear {
    color: var(--m-dim);
  }

  /* "Tokens" sits 16 below the labels row and 8 above the first token. */
  .sub {
    margin-top: 16px;
    margin-bottom: 8px;
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .trow {
    display: flex;
    align-items: center;
    width: 100%;
    height: 66.7px;
    padding: 8px 0;
    text-align: left;
    background: var(--m-bg);
  }

  .trow:active {
    background: var(--m-card);
  }

  /* The row is the wrapper so the star can sit over the disc's corner without nesting one
     control inside another. */
  .row {
    position: relative;
    display: block;
  }

  .logo {
    position: relative;
    flex: 0 0 auto;
    width: 48px;
    height: 48px;
    margin-right: 12px;
  }

  .logo img,
  .initial {
    display: block;
    width: 48px;
    height: 48px;
    border-radius: 24px;
    border: 1px solid var(--m-hairline);
    object-fit: cover;
    overflow: hidden;
  }

  .initial {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--m-card);
    font-size: 18px;
    color: var(--m-muted);
  }

  /* The capture's 16 dp star on the disc's lower-right corner. */
  .star {
    position: absolute;
    top: 41.6px;
    left: 36.3px;
    display: block;
    width: 16px;
    height: 16px;
  }

  .star svg {
    width: 16px;
    height: 16px;
    fill: #ffbf35;
    stroke: #060510;
    stroke-width: 1.4;
  }

  .left,
  .right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 50.7px;
    min-width: 0;
  }

  .left {
    flex: 1 1 auto;
    align-items: flex-start;
  }

  .right {
    flex: 0 0 auto;
    align-items: flex-end;
    /* The capture's right column is the price over the change. This endpoint carries no
       24h change, so the price keeps the change line's place at the top of the column. */
    justify-content: flex-start;
  }

  .symbol {
    font-size: 18px;
    line-height: 21.3px;
    color: var(--m-text);
  }

  .mcap {
    margin-top: 8px;
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  .price {
    font-size: 18px;
    line-height: 26.1px;
    color: var(--m-text);
  }

  .price sub {
    font-size: 0.62em;
    vertical-align: -0.25em;
  }

  .empty {
    padding: 16px;
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-dim);
    text-align: center;
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 66.7px;
    padding: 8px 0;
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
