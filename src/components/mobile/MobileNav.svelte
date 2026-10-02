<!--
  The phone's bottom bar: a floating pill with a blur behind it, five tabs.
  Geometry, radii, tints and the blur are the capture's (a 456 dp pill, 104 radius,
  `rgba(6,5,16,.965)` over a blur, five 89.6 dp slots, the selected one sitting on a
  faint surface). The icons are ours: the capture ships them as bitmaps and glyph fonts
  (`assets_images_homefilled`, ionicons), which is not something to copy over.
-->
<script>
  import HomeIcon from "../../icons/home.svelte";
  import SearchIcon from "../../icons/search.svelte";
  import MembersIcon from "../../icons/members.svelte";
  import Mark from "../../icons/nohomo.svelte";

  let { tab, onselect } = $props();

  const TABS = [
    { id: "home", label: "Home" },
    { id: "search", label: "Search" },
    { id: "feed", label: "Feed" },
    { id: "leaderboard", label: "Traders" },
    { id: "profile", label: "Profile" }
  ];
</script>

<nav class="nav" aria-label="Primary">
  <div class="pill">
    {#each TABS as item (item.id)}
      <button
        type="button"
        class="slot"
        class:slot--on={tab === item.id}
        aria-label={item.label}
        aria-current={tab === item.id ? "page" : undefined}
        onclick={() => onselect?.(item.id)}
      >
        <span class="glyph">
          {#if item.id === "home"}
            <HomeIcon class="glyph-home" />
          {:else if item.id === "search"}
            <SearchIcon class="glyph-search" />
          {:else if item.id === "feed"}
            <Mark class="glyph-mark" />
          {:else if item.id === "leaderboard"}
            <MembersIcon class="glyph-users" />
          {:else}
            <span class="avatar">
              <Mark class="glyph-avatar" />
            </span>
          {/if}
        </span>
      </button>
    {/each}
  </div>
</nav>

<style>
  .nav {
    position: absolute;
    z-index: 30;
    inset: auto 0 -8px 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  /* 456 wide on the capture's 480 dp screen: 12 dp of gutter either side. */
  .pill {
    pointer-events: auto;
    display: flex;
    width: 456px;
    max-width: calc(100% - 24px);
    height: 61.9px;
    padding: 5.3px;
    border: 1px solid var(--m-hairline);
    border-radius: 104px;
    background: rgba(6, 5, 16, 0.965);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .slot {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    height: 52.3px;
    border: 1px solid transparent;
    border-radius: 100px;
    color: var(--m-muted);
  }

  /* The selected tab sits on a faint surface of its own; the capture calls it out with
     `rgba(203,208,235,.078)` plus the same colour as a hairline. */
  .slot--on {
    background: var(--m-hairline);
    border-color: var(--m-hairline);
    color: var(--m-text);
  }

  .glyph {
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
  }

  /*
   * Every glyph is sized here rather than with utility classes. These are child components'
   * roots, so a scoped selector only reaches them through `:global`, and the prebuilt app.css
   * has no fractional steps for the sizes the capture uses. The capture's own: 28x24 for home
   * and users, 28x28 for search, 32.5 for the mark, 18 inside the account disc.
   */
  .glyph :global(.glyph-home),
  .glyph :global(.glyph-users) {
    width: 28px;
    height: 24px;
  }

  .glyph :global(.glyph-search) {
    width: 28px;
    height: 28px;
    stroke-width: 2.2;
  }

  /* Our mark is a light raster where the capture tints a grey glyph, so it is dimmed to sit
     as the quieter of the five until it is the one you are on. */
  .glyph :global(.glyph-mark) {
    width: 32.5px;
    height: 32.5px;
    opacity: 0.38;
  }

  .slot--on .glyph :global(.glyph-mark) {
    opacity: 1;
  }

  .glyph :global(.glyph-avatar) {
    width: 18px;
    height: 18px;
  }

  /* The fifth tab is the account: a 24 dp pink disc with the mark inside it. */
  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 12px;
    background: var(--m-pink);
    color: var(--m-text);
  }
</style>
