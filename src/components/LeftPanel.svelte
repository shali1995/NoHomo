<script>
  // The left discovery panel: the tab strip (Alerts / Tokens / Leaderboard / Feed),
  // the watchlist filter pills, the view each pill opens and the two split-view actions.
  // Class strings, inline styles and rendered text are the capture's; the Feed and
  // Leaderboard tabs mount their own components in place of the pill views.
  //
  // A pill picks one of four live lists: Trending reads the trending scanner
  // (src/lib/api/trending.svelte.js), Graduated and Bonding read the two trench phases
  // (src/lib/api/trenches.svelte.js) and Echo reads the Echo rankings stream
  // (src/lib/api/echo.svelte.js), whose Filter button opens that view's own controls.
  // Each view is its own file under panel/, and they all draw in the capture's `ListShell`.
  // The capture's hardcoded 3922px spacer described its own virtualized window, so every
  // list derives its height from its live row count.
  //
  // Watchlist, Crypto and Most held have no endpoint wired in this replica, so they keep
  // the trending list.
  /** @type {import("../lib/types").PanelTab[]} */
  // inlined from panelTabs.json — no data file, the strings live with the code
  const panelTabs =   [
    {
      "text": "Alerts",
      "classes": "flex-none flex items-center justify-start gap-1 text-left whitespace-nowrap text-text-secondary hover:text-text-primary",
      "icon": "alerts",
      "iconWrapperClasses": "relative flex items-center justify-center shrink-0",
      "dotClasses": "absolute -top-0.5 -right-0.5 size-2 border border-bg-secondary rounded-full bg-red invisible"
    },
    {
      "divider": "w-px h-4 bg-bg-tertiary/40"
    },
    {
      "text": "Tokens",
      "classes": "flex-none text-left whitespace-nowrap hover:text-text-primary focus:text-text-primary focus:outline-none"
    },
    {
      "divider": "w-px h-4 bg-bg-tertiary/40"
    },
    {
      "text": "Leaderboard",
      "classes": "flex-none text-left whitespace-nowrap text-text-secondary hover:text-text-primary"
    },
    {
      "divider": "w-px h-4 bg-bg-tertiary/40"
    },
    {
      "text": "Feed",
      "classes": "flex-none text-left whitespace-nowrap text-text-secondary hover:text-text-primary"
    }
  ];
  /** @type {import("../lib/types").PanelButton[]} */
  // inlined from panelButtons.json — no data file, the strings live with the code
  const panelButtons =   [
    {
      "label": "Split bottom",
      "classes": "flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-bg-tertiary bg-bg-secondary py-1 text-xs text-text-tertiary hover:text-text-primary hover:opacity-80 focus:outline-none",
      "spanClasses": "",
      "icon": "split-bottom"
    },
    {
      "label": "Split right",
      "classes": "flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-bg-tertiary bg-bg-secondary py-1 text-xs text-text-tertiary hover:text-text-primary hover:opacity-80 focus:outline-none",
      "spanClasses": "",
      "icon": "split-right"
    }
  ];
  import CollapsePanel from "../icons/collapse-panel.svelte";
  import FeedPanel from "./panel/FeedPanel.svelte";
  import LeaderboardPanel from "./panel/LeaderboardPanel.svelte";
  import AlertsBell from "../icons/alerts-bell.svelte";
  import SplitBottom from "../icons/split-bottom.svelte";
  import SplitRight from "../icons/split-right.svelte";
  import Filter from "../icons/filter.svelte";
  import TrendingList from "./panel/TrendingList.svelte";
  import TrenchesList from "./panel/TrenchesList.svelte";
  import EchoList from "./panel/EchoList.svelte";
  import AssetList from "./panel/AssetList.svelte";
  import EchoFilters from "./panel/EchoFilters.svelte";
  import { startTrending, stopTrending } from "../lib/api/trending.svelte.js";
  import { BONDING_PHASE, GRADUATED_PHASE, startTrenches, stopTrenches } from "../lib/api/trenches.svelte.js";

  let active = $state("Tokens");

  // Both stores stay live for as long as the panel is up, so switching pills re-renders
  // from data already held instead of re-seeding.
  $effect(() => {
    startTrending();
    startTrenches();
    return () => {
      stopTrending();
      stopTrenches();
    };
  });

  const filters = ["Watchlist", "Echo", "Trending", "Crypto", "Stocks", "Graduated", "Bonding"];
  let filter = $state("Echo");

  // The Echo pill's Filter button opens its own controls (kind, period, limit and the
  // client-side Newest / Age / 24h-change chips). Closed by default, and closing it leaves
  // the stream and the table untouched.
  let echoFiltersOpen = $state(false);

  // Geometry the capture measured, kept as style strings so the rendered attributes
  // stay byte-identical.
  const PANEL_STYLE = "width: 340px;";

  const PILL = "text-text-secondary hover:bg-bg-tertiary-solid focus:bg-bg-tertiary-solid focus:outline-none inline-flex h-6 items-center justify-center border border-bg-tertiary-solid rounded-md px-1.5 text-xs font-bold leading-none shrink-0 whitespace-nowrap";

  const PILL_ACTIVE = "bg-bg-tertiary-solid hover:bg-bg-tertiary-solid focus:bg-bg-tertiary-solid focus:outline-none inline-flex h-6 items-center justify-center border border-bg-tertiary-solid rounded-md px-1.5 text-xs font-bold leading-none shrink-0 whitespace-nowrap";
</script>

<div class="relative flex shrink-0 pb-2" style={PANEL_STYLE}>
  <div class="flex min-w-0 flex-1 overflow-hidden">
    <div class="flex gap-3 flex-1 min-h-0 min-w-0 animate-fade-in">
      <div class="flex flex-col flex-1 gap-3 min-h-0 min-w-0">
        <div class="flex flex-1 flex-col rounded-xl border border-bg-tertiary min-h-0 min-w-0 pb-2">
          <div class="p-2 pl-3 rounded-t-xl bg-bg-secondary flex items-center shrink-0">
            <div class="relative flex-1 min-w-0">
              <div class="no-scrollbar overflow-x-auto overflow-y-hidden flex items-center gap-2 text-sm font-medium">
                <!-- The dividers all share one class string, so only the labelled tabs
                     key on their text; a divider keys on its position instead. -->
                {#each panelTabs as tab, i ("divider" in tab ? `divider-${i}` : tab.text)}
                  {#if "divider" in tab}
                    <div class={tab.divider}></div>
                  {:else}
                    <button
                      class={active === tab.text
                        ? tab.classes.replace("text-text-secondary ", "")
                        : tab.classes.includes("text-text-secondary")
                          ? tab.classes
                          : tab.classes.replace("whitespace-nowrap ", "whitespace-nowrap text-text-secondary ")}
                      onclick={() => (active = tab.text)}
                    >
                      {#if tab.icon === "alerts"}
                        <span class={tab.iconWrapperClasses}>
                          <AlertsBell />
                          <span class={tab.dotClasses} aria-hidden="true"></span>
                        </span>
                      {/if}
                      <span>{tab.text}</span>
                    </button>
                  {/if}
                {/each}
              </div>
            </div>
            <div class="ml-auto flex items-center gap-1 shrink-0">
              <button class="text-text-tertiary hover:text-text-primary focus:outline-none p-1" aria-label="Collapse discovery panel">
                <CollapsePanel aria-hidden="true" />
              </button>
            </div>
          </div>

          {#if active === "Leaderboard"}
            <LeaderboardPanel />
          {:else if active === "Feed"}
            <FeedPanel />
          {:else}
          <div class="flex flex-col flex-1 min-h-0">
            <div class="relative shrink-0">
              <div class="no-scrollbar overflow-x-auto overflow-y-hidden cursor-grab flex gap-2 px-3 pt-2 pb-1 whitespace-nowrap">
                {#each filters as item (item)}
                  <button class={filter === item ? PILL_ACTIVE : PILL} onclick={() => (filter = item)}>{item}</button>
                {/each}
              </div>
              <div class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l to-transparent from-bg-primary"></div>
            </div>

            {#if filter === "Echo"}
              <!-- The filter control the capture puts on the feed, over Echo's own list.
                   It now opens Echo's controls: the stream's kind/period/limit and the
                   client-side filters. -->
              <div class="flex items-center gap-3 px-3 pt-2 pb-1 shrink-0">
                <button
                  type="button"
                  class="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary outline-none"
                  aria-expanded={echoFiltersOpen}
                  onclick={() => (echoFiltersOpen = !echoFiltersOpen)}
                >
                  <Filter />
                  <span>Filter</span>
                </button>
              </div>
              {#if echoFiltersOpen}
                <EchoFilters />
              {/if}
            {/if}

            {#if filter === "Crypto"}
              <AssetList kind="majors" />
            {:else if filter === "Stocks"}
              <AssetList kind="stocks" />
            {:else if filter === "Echo"}
              <EchoList />
            {:else if filter === "Graduated"}
              <TrenchesList phase={GRADUATED_PHASE} />
            {:else if filter === "Bonding"}
              <TrenchesList phase={BONDING_PHASE} />
            {:else}
              <TrendingList />
            {/if}
          </div>
          {/if}

          <div class="mx-2 mt-1 flex items-center gap-2">
            {#each panelButtons as button (button.label)}
              <button class={button.classes}>
                {#if button.icon === "split-bottom"}
                  <SplitBottom />
                {:else}
                  <SplitRight />
                {/if}
                <span class={button.spanClasses}>{button.label}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- The capture records the handle's markup and h-12 w-3 size, not a drag
       interaction, so it is inert in this replica. -->
  <div class="group absolute right-0 top-1/2 z-10 flex h-12 w-3 -translate-y-1/2 translate-x-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent-primary">
    <div class="h-8 w-1 rounded-full transition-colors bg-text-tertiary group-hover:bg-text-secondary group-focus-visible:bg-text-secondary"></div>
  </div>
</div>
