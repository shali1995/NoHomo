<!--
  The phone leaderboard: two page tabs, the source filter, the window row, your own
  standing, and the ranked traders.
  The bands, their heights and the row anatomy are the capture's — a 45.3 dp tab bar with a
  110.4 dp accent indicator under the live label, a 32.5 dp filter row, 68.3 dp trader rows
  whose rank slot is 24 dp and whose avatar is a 40 dp disc, and 84 px of tail room because
  the floating nav bar overlays the bottom of the screen.
  Everything drawn here comes off live reads. The Leaderboard tab is the trader-ranking
  endpoint; the Friends tab is the viewer's own follow list. The capture's clans carousel,
  the clan tag beside a trader's name and the token cluster at the right of a row have no
  source on either, so they are left out rather than invented.
  The pill is the source the ranking is read from. The capture's `All` trade-type filter has
  no data behind it here (the API ranks by source, not by Tokens/Perps), so the pill carries
  the filter we do have and opens its real options.
-->
<script>
  import Mark from "../../../icons/nohomo.svelte";
  import Check from "../../../icons/check.svelte";
  import MedalGold from "../../../icons/medal-gold.svelte";
  import MedalSilver from "../../../icons/medal-silver.svelte";
  import MedalBronze from "../../../icons/medal-bronze.svelte";
  import {
    SOURCE_OPTIONS,
    WINDOW_LABELS,
    getError,
    getRows,
    getSource,
    getWindowLabel,
    isLoading,
    selectSource,
    selectWindow,
    startLeaderboard,
    stopLeaderboard
  } from "../../../lib/api/leaderboard.svelte.js";
  import { avatarUrl } from "../../../lib/api/config.js";
  import { api } from "../../../lib/api/client.js";
  import { getAuthToken } from "../../../lib/auth.svelte.js";
  import {
    accountAvatar,
    accountLoaded,
    accountName,
    accountPnl24h,
    accountProfile
  } from "../../../lib/api/account.svelte.js";

  let { onopen, onopentrader } = $props();

  const MEDALS = [MedalGold, MedalSilver, MedalBronze];
  /** The tab the row of page labels is on. The capture's two pages, both live here. */
  const PAGES = [
    { id: "friends", label: "Friends" },
    { id: "leaderboard", label: "Leaderboard" }
  ];

  const rows = $derived(getRows());
  const loading = $derived(isLoading());
  const error = $derived(getError());
  const windowLabel = $derived(getWindowLabel());
  const source = $derived(getSource());
  const sourceLabel = $derived(
    SOURCE_OPTIONS.find((option) => option.value === source)?.label ?? source
  );

  let page = $state("leaderboard");
  let menuOpen = $state(false);

  /**
   * The account's own standing. It waits for the profile read rather than painting from a
   * half-answered session: the card's whole content is the account's own identity, so a
   * shortened wallet alone would be a card about nothing.
   */
  const own = $derived.by(() => {
    if (!accountLoaded() || !accountProfile()) return null;
    const name = accountName();
    if (!name) return null;
    return { name, pnl: accountPnl24h() };
  });

  /*
   * The follow list. It is the session's own (`/v2/user/following`), so it is only asked
   * for when there is a token — a signed-out reader gets the empty state, not a 401.
   * The response carries profiles, not rankings: no wallet address, no PnL, so a friend is
   * drawn as identity only.
   */
  let friends = $state.raw([]);
  let friendsLoading = $state(false);
  let friendsError = $state("");

  async function readFollowing() {
    const token = getAuthToken();
    if (!token) {
      friends = [];
      friendsError = "";
      return;
    }
    friendsLoading = true;
    friendsError = "";
    try {
      const { data, error: responseError } = await api.GET("/v2/user/following", {
        params: { query: { limit: 50 } }
      });
      /*
       * A 401 makes the API client drop the session, and a response that lands after that
       * belongs to a signed-out screen: it must not write a failure over the empty state.
       */
      if (getAuthToken() !== token) return;
      if (responseError || !data) throw new Error("Unable to load the accounts you follow");
      friends = (data.data ?? []).map((profile) => ({
        id: profile.id,
        name: profile.displayName || profile.username,
        handle: `@${profile.username}`,
        avatarImg: avatarUrl(profile.photoId) ?? undefined
      }));
    } catch (cause) {
      if (getAuthToken() !== token) return;
      friends = [];
      friendsError =
        cause instanceof Error ? cause.message : "Unable to load the accounts you follow";
    } finally {
      if (getAuthToken() === token) friendsLoading = false;
    }
  }

  /** The window row is a shared store, so a tap on the selected one is a no-op, not a reload. */
  function pickWindow(label) {
    selectWindow(label);
  }

  function pickSource(value) {
    menuOpen = false;
    selectSource(value);
  }

  $effect(() => {
    startLeaderboard();
    return () => stopLeaderboard();
  });

  $effect(() => {
    if (page === "friends") void readFollowing();
  });
</script>

<svelte:window onclick={() => (menuOpen = false)} />

<div class="screen-root">
  <nav class="pages" aria-label="Leaderboard pages">
    {#each PAGES as item (item.id)}
      <span class="cell" class:cell--left={item.id === "friends"}>
        <button
          type="button"
          class="page"
          class:page--on={page === item.id}
          aria-current={page === item.id ? "page" : undefined}
          onclick={() => (page = item.id)}
        >
          {item.label}{#if item.id === "friends" && friends.length} ({friends.length}){/if}
        </button>
      </span>
    {/each}
    <!-- 110.4 wide at 259.7 under the live label: the capture's own box, moved with the tab. -->
    <span class="indicator" style="left: {page === "friends" ? 109.9 : 259.7}px"></span>
  </nav>

  <div class="body m-scroll">
    <div class="filters">
      <span class="type-wrap">
        <button
          type="button"
          class="type-pill"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Ranking source: {sourceLabel}"
          onclick={(event) => {
            event.stopPropagation();
            menuOpen = !menuOpen;
          }}
        >
          {sourceLabel}
        </button>

        {#if menuOpen}
          <span class="menu" role="menu">
            {#each SOURCE_OPTIONS as option (option.value)}
              <button
                type="button"
                class="menu-row"
                role="menuitemradio"
                aria-checked={option.value === source}
                onclick={() => pickSource(option.value)}
              >
                <span class="menu-label">{option.label}</span>
                {#if option.value === source}
                  <Check class="menu-check" />
                {/if}
              </button>
            {/each}
          </span>
        {/if}
      </span>

      <div class="windows">
        {#each WINDOW_LABELS as label (label)}
          <!-- The module's labels are the desktop panel's dressing; the capture's phone row
               reads `24h / 7d / 30d / All`, so the same value is set in its own case here. -->
          <button
            type="button"
            class="window"
            class:window--on={label === windowLabel}
            aria-pressed={label === windowLabel}
            onclick={() => pickWindow(label)}
          >
            {label === "ALL" ? "All" : label.toLowerCase()}
          </button>
        {/each}
      </div>
    </div>

    {#if own}
      <section class="own" aria-label="Your standing">
        <span class="own-avatar">
          {#if accountAvatar()}
            <img src={accountAvatar()} alt="" loading="lazy" decoding="async" />
          {:else}
            <Mark class="own-mark" />
          {/if}
        </span>
        <span class="own-id">
          <span class="own-label m-truncate">Your standing</span>
          <span class="own-name m-truncate">{own.name}</span>
        </span>
        <span class="own-pnl m-num">
          {#if own.pnl}
            <span class="sign">{own.pnl.up ? "+" : "-"}</span>{own.pnl.text}<span class="per">24h</span>
          {/if}
        </span>
      </section>
    {/if}

    {#if page === "friends"}
      <div class="list">
        {#if friends.length}
          {#each friends as friend (friend.id)}
            <div class="row">
              <span class="avatar">
                {#if friend.avatarImg}
                  <img src={friend.avatarImg} alt="" loading="lazy" decoding="async" />
                {:else}
                  <span class="avatar-blank">{(friend.name ?? "?").slice(0, 1)}</span>
                {/if}
              </span>
              <span class="id">
                <span class="name m-truncate">{friend.name}</span>
                <span class="handle m-truncate">{friend.handle}</span>
              </span>
            </div>
          {/each}
        {:else if friendsLoading}
          {#each Array.from({ length: 4 }) as _, index (index)}
            <div class="ghost">
              <span class="ghost-disc"></span>
              <span class="ghost-lines">
                <span class="ghost-line"></span>
                <span class="ghost-line ghost-line--short"></span>
              </span>
            </div>
          {/each}
        {:else}
          <p class="state">{friendsError || "You do not follow anyone yet"}</p>
        {/if}
      </div>
    {:else}
      <div class="list">
        {#if rows.length === 0 && loading}
          {#each Array.from({ length: 8 }) as _, index (index)}
            <div class="ghost">
              <span class="ghost-disc"></span>
              <span class="ghost-lines">
                <span class="ghost-line"></span>
                <span class="ghost-line ghost-line--short"></span>
              </span>
            </div>
          {/each}
        {:else if rows.length === 0 && error}
          <p class="state">{error}</p>
        {:else}
          {#each rows as row (row.traderKey)}
            <button
              type="button"
              class="trader"
              title={`${row.winRate} win rate over ${row.trades} trades`}
              onclick={() => onopen?.(row)}
            >
              <span class="rank">
                {#if row.medal}
                  {@const Medal = MEDALS[row.medal - 1]}
                  <Medal class="rank-medal" />
                {:else}
                  <span class="rank-num m-num">{row.rankText}.</span>
                {/if}
              </span>

              <span class="avatar">
                {#if row.avatarImg}
                  <img src={row.avatarImg} alt="" loading="lazy" decoding="async" />
                {:else}
                  <span class="avatar-blank">{(row.name ?? "?").slice(0, 1)}</span>
                {/if}
              </span>

              <span class="id">
                <span class="name m-truncate">{row.name}</span>
                <span class="handle m-truncate">{row.handle}</span>
              </span>

              <span
                class="pnl m-num"
                style="color: {row.pnlSign === '+' ? 'var(--m-green)' : 'var(--m-red)'}"
              >
                {row.pnlSign}{row.pnlValue}
              </span>
            </button>
          {/each}
        {/if}
      </div>
    {/if}

    <div class="tail"></div>
  </div>
</div>

<style>
  .screen-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
  }

  /*
   * The capture's top of screen is the system bar, 24 dp of nothing; the shell draws none,
   * so the tab bar starts under that space. Two equal 240 dp cells put the live label at the
   * capture's x (268.3 for Leaderboard, 126.4 for Friends), with the indicator moving under
   * whichever cell is live.
   */
  .pages {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    height: 69.3px;
    padding-top: 24px;
    border-bottom: 1px solid var(--m-hairline);
  }

  .cell {
    display: flex;
    flex: 1 1 0;
    justify-content: center;
    padding: 12px 0;
  }

  .cell--left {
    align-items: flex-end;
  }

  .page {
    font-size: 16px;
    font-weight: 500;
    line-height: 20.3px;
    color: var(--m-dim);
  }

  .page--on {
    color: var(--m-text);
  }

  .indicator {
    position: absolute;
    bottom: 0;
    width: 110.4px;
    height: 3.2px;
    border-radius: 2px;
    background: var(--m-blue);
  }

  .body {
    flex: 1 1 auto;
    min-height: 0;
  }

  .filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32.5px;
    margin-top: 18.2px;
    padding-left: 18.1px;
    padding-right: 10.1px;
  }

  /* The pill is the ranking's source; the menu under it lists the sources we can read. */
  .type-wrap {
    position: relative;
    display: flex;
  }

  .type-pill {
    display: flex;
    align-items: center;
    height: 32.5px;
    padding: 6px 10px;
    border: 1px solid var(--m-hairline);
    border-radius: 100px;
    background: var(--m-card);
    font-size: 16px;
    font-weight: 700;
    color: var(--m-text);
  }

  /* 160 dp, 9.1 dp under the pill and 7 dp left of it: the capture's trade-type menu. */
  .menu {
    position: absolute;
    z-index: 20;
    top: calc(100% + 9.1px);
    left: -6.9px;
    display: flex;
    flex-direction: column;
    width: 160px;
    padding: 4px 0;
    border: 1px solid var(--m-hairline);
    border-radius: 23px;
    background: rgba(6, 5, 16, 0.965);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .menu-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    height: 42.7px;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 500;
    color: var(--m-text);
    text-align: left;
  }

  .menu-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-row :global(.menu-check) {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    color: var(--m-text);
  }

  .windows {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /*
   * The unselected box is as wide as its label and 21.9 dp tall; the label's line box is
   * pinned so the padding, not the font's leading, sets that height.
   */
  .window {
    padding: 4px 6px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    line-height: 13.9px;
    color: var(--m-dim);
  }

  .window--on {
    background: var(--m-hairline);
    color: var(--m-text);
  }

  .own {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 72px;
    margin: 12.5px 16px 0 16px;
    padding: 14px 12px;
    border-radius: 16px;
    background: var(--m-card);
  }

  .own-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 44px;
    height: 44px;
    border-radius: 22px;
    overflow: hidden;
    background: var(--m-pink);
    color: var(--m-text);
  }

  .own-avatar img {
    width: 44px;
    height: 44px;
    object-fit: cover;
  }

  .own-avatar :global(.own-mark) {
    width: 33px;
    height: 33px;
  }

  .own-id {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1 1 auto;
  }

  .own-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--m-muted);
  }

  .own-name {
    font-size: 18px;
    font-weight: 500;
    color: var(--m-text);
  }

  .own-pnl {
    flex: 0 0 auto;
    font-size: 18px;
    font-weight: 500;
    color: #ff622e;
  }

  .own-pnl .per {
    margin-left: 4px;
    font-size: 14px;
    color: var(--m-muted);
  }

  .list {
    display: flex;
    flex-direction: column;
    margin-top: 8px;
  }

  /*
   * 480 x 68.3, 18 dp gutters, 12 dp between the slots. The two text lines sit 24 dp apart
   * and the block is 44.3 dp tall, which is why the row aligns it rather than centring it.
   */
  .row,
  .trader {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    height: 68.3px;
    padding: 10px 18px;
  }

  .trader {
    text-align: left;
  }

  .trader:active {
    background: var(--m-card);
  }

  /* The follow list is not a ranking: no rank slot, so the avatar takes the 18.1 gutter. */

  .rank {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 24px;
    height: 16.5px;
    color: var(--m-muted);
  }

  .rank-num {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
  }

  .rank :global(.rank-medal) {
    width: 16px;
    height: 16px;
  }

  .avatar {
    position: relative;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    overflow: hidden;
  }

  .avatar img {
    display: block;
    width: 40px;
    height: 40px;
    object-fit: cover;
  }

  .avatar-blank {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--m-card);
    font-size: 16px;
    color: var(--m-muted);
  }

  /*
   * The capture hangs the two text lines 2 dp below the middle of the row — the name's line
   * starts 11.7 dp down and the avatar is centred — so the block carries that offset rather
   * than sitting centred with the disc.
   */
  .id {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
    height: 44.3px;
    transform: translateY(2px);
  }

  .name {
    height: 20.3px;
    font-size: 16px;
    font-weight: 500;
    line-height: 20.3px;
    color: var(--m-text);
  }

  .handle {
    height: 20.3px;
    margin-top: 3.7px;
    font-size: 14px;
    font-weight: 400;
    line-height: 20.3px;
    color: var(--m-muted);
  }

  .pnl {
    flex: 0 0 auto;
    font-size: 16px;
    font-weight: 500;
    line-height: 20.3px;
    transform: translateY(2px);
  }

  /* Room for the floating bar, so the last row is not trapped under it. */
  .tail {
    height: 84px;
  }

  .state {
    margin: 0;
    padding: 24px 18px;
    font-size: 14px;
    color: var(--m-muted);
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 68.3px;
    padding: 10px 18px;
  }

  .ghost-disc {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background: var(--m-card);
  }

  .ghost-lines {
    display: flex;
    flex-direction: column;
    gap: 3.7px;
  }

  .ghost-line {
    width: 140px;
    height: 20.3px;
    border-radius: 6px;
    background: var(--m-card);
  }

  .ghost-line--short {
    width: 96px;
  }
</style>
