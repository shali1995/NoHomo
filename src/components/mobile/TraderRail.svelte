<!--
  The home header's carousel.
  Two sections share one horizontal rail, the way the capture lays them out: the heading
  is an item in the scroller, not a bar above it. Cards are 154.1 dp wide, 90.1 tall, and
  the section they belong to is the trader ranking we already have.
-->
<script>
  import MedalGold from "../../icons/medal-gold.svelte";
  import MedalSilver from "../../icons/medal-silver.svelte";
  import MedalBronze from "../../icons/medal-bronze.svelte";

  let { title, subtitle, traders, onopen } = $props();

  const MEDALS = [MedalGold, MedalSilver, MedalBronze];

  /**
   * Whether a name can actually be read. A trader's label is free text and some of them are
   * blank-but-not-empty — right-to-left marks, zero-width joiners, hair spaces — which draw
   * as an empty line inside the card, so the card reads as a box with nothing in it.
   */
  const VISIBLE = /[^\s\u200b-\u200f\u2060\u2028\u2029\ufeff]/;
  const readable = (trader) => VISIBLE.test(String(trader?.name ?? ""));

  /**
   * Only the cards with a name you can read. A trader whose label is blank draws a card with an
   * empty first line — a face, a medal and a number with nobody attached to them — which is the
   * "box with nothing in it" the rail used to show. The ranking is a top-N either way, so a
   * nameless row is dropped rather than drawn.
   */
  const shown = $derived(traders.filter(readable));
</script>

<div class="rail">
  <div class="head">
    <MedalGold class="h-5 w-5 shrink-0 text-text-secondary" />
    <span class="head-title">{title}{#if subtitle}<span class="head-sub">{subtitle}</span>{/if}</span>
  </div>

  <div class="cards m-rail">
  {#each shown as trader, index (trader.traderKey ?? trader.walletAddress ?? index)}
    <button type="button" class="card" onclick={() => onopen?.(trader)}>
      <div class="card-top">
        {#if trader.avatarImg}
          <img class="avatar" src={trader.avatarImg} alt="" loading="lazy" decoding="async" />
        {:else}
          <span class="avatar avatar--blank">{(trader.name ?? "?").slice(0, 1)}</span>
        {/if}
        <span class="name m-truncate">{trader.name}</span>
      </div>
      <div class="card-body">
        <span class="rank">
          {#if index < 3}
            {@const Medal = MEDALS[index]}
            <Medal class="h-7 w-7" />
          {:else}
            <span class="rank-num m-num">{index + 1}</span>
          {/if}
        </span>
        <span class="pnl m-num">{trader.pnlSign}{trader.pnlValue}</span>
      </div>
    </button>
  {/each}
  </div>
</div>

<style>
  /*
   * The heading sits above the cards, not beside them — that is where the capture puts it
   * (heading at y 157.3, the first card at 185.6, both at x 16). Laid out as one row, the
   * heading took the first slot and left a 90 dp void under it before the cards began.
   */
  .rail {
    display: flex;
    flex-direction: column;
    height: 117.9px;
    padding: 0 16px;
  }

  .cards {
    display: flex;
    gap: 8px;
    margin-top: 8.6px;
  }

  .head {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
    height: 19.7px;
    padding-top: 0.6px;
  }

  .head-title {
    font-size: 16px;
    line-height: 18.7px;
    color: var(--m-text);
    white-space: nowrap;
  }

  .head-sub {
    margin-left: 6px;
    color: var(--m-muted);
  }

  .card {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    width: 154.1px;
    height: 90.1px;
    border: 1px solid var(--m-hairline);
    border-radius: 12px;
    overflow: hidden;
    text-align: left;
  }

  .card-top {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36.2px;
    padding: 8px 8px 0 8px;
  }

  .avatar {
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    border-radius: 10px;
    object-fit: cover;
  }

  .avatar--blank {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--m-card-2);
    font-size: 11px;
    color: var(--m-muted);
  }

  .name {
    min-width: 0;
    font-size: 14px;
    line-height: 16.5px;
    color: var(--m-text);
  }

  .card-body {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 6px;
    padding: 0 8px;
    background: var(--m-bg);
  }

  .rank {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
  }

  .rank-num {
    font-size: 13px;
    color: var(--m-muted);
  }

  .pnl {
    min-width: 0;
    overflow: hidden;
    font-size: 16px;
    line-height: 18.7px;
    color: var(--m-green);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
