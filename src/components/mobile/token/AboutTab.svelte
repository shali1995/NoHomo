<!--
  The About tab: the token's description and its links, its buy/sell pressure over a chosen
  window, then the holder figures and the pool's stats.

  Everything is the token's own (`getToken`): the description is its AI narrative, the links are
  its scraped socials, the bars and the counts come off `stats.timeframes`. The capture draws a
  third bar for buyers against sellers; the API reports the distinct wallets that traded
  (`traders`) but no buy/sell split of them, so that row is not drawn rather than guessed at.
-->
<script>
  import StatRow from "./StatRow.svelte";
  import RatioBar from "./RatioBar.svelte";
  import Globe from "../../../icons/globe.svelte";
  import XLogo from "../../../icons/x-logo.svelte";
  import Telegram from "../../../icons/telegram.svelte";
  import { formatCompact } from "../../../lib/api/token.svelte.js";
  import { platformName } from "../../../lib/platforms.js";
  import { safeUrl, searchOnXHref } from "../../../lib/utils/urls.js";

  let { token } = $props();

  /** The capture's placeholder, printed when the token carries no narrative of its own. */
  const NO_DESCRIPTION = "No description available for this asset";

  const windows = [
    { id: "5m", label: "5M" },
    { id: "1h", label: "1H" },
    { id: "24h", label: "1D" }
  ];

  let selected = $state("1h");

  const quote = $derived(token?.quote ?? null);
  const holders = $derived(token?.holders ?? null);
  const timeframes = $derived(token?.stats?.timeframes ?? null);
  const window_ = $derived(timeframes?.[selected] ?? null);

  const description = $derived(token?.socials?.aiNarrative?.trim() || NO_DESCRIPTION);

  const links = $derived(token?.socials?.links ?? null);
  const website = $derived(safeUrl(links?.website));
  const twitter = $derived(safeUrl(links?.twitter?.url));
  const telegram = $derived(safeUrl(links?.telegram));
  const searchOnX = $derived(searchOnXHref(token));

  const network = $derived(token?.chain === "SOL" ? "Solana" : (token?.chain ?? ""));
  const supply = $derived(quote?.totalSupplyStr ? formatCompact(quote.totalSupplyStr) : "");

  const buys = $derived(Number(window_?.buys ?? 0));
  const sells = $derived(Number(window_?.sells ?? 0));
  const trades = $derived(buys + sells);

  const buyVolume = $derived(`$${formatCompact(window_?.buyVolumeStr ?? "0")}`);
  const sellVolume = $derived(`$${formatCompact(window_?.sellVolumeStr ?? "0")}`);
  const volumePct = $derived(Number(window_?.buyVolumePct ?? 0));

  const countText = $derived((Number(holders?.holderCount ?? 0)).toLocaleString("en-US"));
  const top10Text = $derived(`${Number(holders?.top10Pct ?? 0).toFixed(2)}%`);

  const marketCap = $derived(`$${formatCompact(quote?.marketCapUsdStr)}`);
  const volume24h = $derived(`$${formatCompact(timeframes?.["24h"]?.volumeStr ?? "0")}`);
  const liquidity = $derived(`$${formatCompact(quote?.liquidityUsdStr)}`);
  const contract = $derived.by(() => {
    const address = token?.tokenAddress ?? "";
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  });

  /** `26h` reads as `1 day ago` here; the capture's own sample is `1 mo. ago`. */
  function createdAgo(seconds) {
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return "";
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min. ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr. ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    return `${Math.floor(days / 30)} mo. ago`;
  }

  const created = $derived(createdAgo(token?.createdAtAgeSeconds));
</script>

<div class="about">
  <div class="head-row">
    <h2 class="title">Description</h2>
    {#if searchOnX}
      <a class="twitter-link" href={searchOnX} target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
          <path d="m21 21-4.34-4.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        Search on Twitter
      </a>
    {/if}
  </div>

  <p class="description" class:description--missing={description === NO_DESCRIPTION}>{description}</p>

  {#if website || twitter || telegram}
    <div class="links">
      {#if website}
        <a class="pill" href={website} target="_blank" rel="noopener">
          <Globe />Website
        </a>
      {/if}
      {#if twitter}
        <a class="pill" href={twitter} target="_blank" rel="noopener">
          <XLogo />Twitter
        </a>
      {/if}
      {#if telegram}
        <a class="pill" href={telegram} target="_blank" rel="noopener">
          <Telegram />Telegram
        </a>
      {/if}
    </div>
  {/if}

  <div class="section">
    <div class="head-row">
      <h2 class="title">Transactions</h2>
      <div class="segmented">
        {#each windows as item (item.id)}
          <button
            type="button"
            class="seg"
            class:seg--on={item.id === selected}
            onclick={() => (selected = item.id)}
          >
            {item.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="ratio-block">
      <RatioBar
        left={buys.toLocaleString("en-US")}
        right={sells.toLocaleString("en-US")}
        unit="buys"
        pct={trades > 0 ? (buys / trades) * 100 : 0}
      />
    </div>
    <div class="ratio-block">
      <RatioBar left={buyVolume} right={sellVolume} unit="vol." pct={volumePct} />
    </div>
  </div>

  <div class="section">
    <h2 class="title">Holders</h2>
    <div class="stats">
      <StatRow label="Number of holders" value={countText} />
      <StatRow label="Top 10 Holding" value={top10Text} />
    </div>
  </div>

  <div class="section section--stats">
    <h2 class="title">Stats</h2>
    <div class="stats">
      <StatRow label="Market cap" value={marketCap} />
      <StatRow label="24h volume" value={volume24h} />
      <StatRow label="Liquidity" value={liquidity} />
      <StatRow label="Supply" value={supply} />
      <StatRow label="Created" value={created} />
      <StatRow label="Launchpad" value={platformName(token?.platformType)} chain />
      <StatRow label="Blockchain" value={network} />
      <StatRow label="Contract address" value={contract} copy address={token?.tokenAddress ?? ""} />
    </div>
  </div>
</div>

<style>
  .about {
    padding: 25.6px 16px 0 16px;
  }

  .head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    line-height: 21.3px;
    color: var(--m-text);
  }

  .twitter-link {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 700;
    line-height: 16.5px;
    color: var(--m-blue);
    text-decoration: none;
  }

  .twitter-link svg {
    width: 16px;
    height: 16px;
  }

  .description {
    margin: 16px 0 0 0;
    font-size: 16px;
    font-weight: 500;
    line-height: 20.3px;
    color: var(--m-text);
  }

  .description--missing {
    color: var(--m-muted);
  }

  .links {
    display: flex;
    gap: 12.3px;
    margin-top: 16.1px;
  }

  .pill {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 36.3px;
    border-radius: 12px;
    background: var(--m-card);
    font-size: 14px;
    font-weight: 700;
    line-height: 16.5px;
    color: var(--m-text);
    text-decoration: none;
  }

  .pill :global(svg) {
    width: 20px;
    height: 20px;
  }

  .section {
    margin-top: 48px;
  }

  /* The stats block follows the holder rows, whose own box is 34.6 dp tall. */
  .section--stats {
    margin-top: 40.1px;
  }

  .segmented {
    display: flex;
    align-items: center;
  }

  .seg {
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  .seg--on {
    background: var(--m-hairline);
    color: var(--m-text);
  }

  .ratio-block {
    margin-top: 16.5px;
  }

  .ratio-block + .ratio-block {
    margin-top: 32px;
  }

  .stats {
    display: flex;
    flex-direction: column;
    margin-top: 24px;
  }
</style>
