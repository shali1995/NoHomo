<script>
  // The token page's table card: the Holders / Swaps / Thesis tabs, the two column
  // filters, the sticky column header and the rows.
  //
  // All three tabs are live off src/lib/api/token.svelte.js. The tab labels' counts come
  // from the endpoints; the tab chrome, the column header and the row grid stay the
  // capture's. Thesis rows reuse the captured feed row, which is the component the app
  // renders for a thesis item.
  /** @type {import("../lib/types").TableToggle[]} */
  // inlined from tableToggles.json — no data file, the strings live with the code
  const toggles =   [
    {
      "wrapper": "flex items-center gap-1 rounded-md p-1 hover:opacity-80 cursor-pointer",
      "button": "pointer-events-none inline-flex items-center justify-center",
      "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;",
      "span": "text-text-secondary text-xs",
      "label": "Thesis only"
    },
    {
      "wrapper": "flex items-center gap-1 rounded-md p-1 hover:opacity-80 cursor-pointer",
      "button": "pointer-events-none inline-flex items-center justify-center",
      "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;",
      "span": "text-text-secondary text-xs",
      "label": "Friends only"
    }
  ];
  /** @type {import("../lib/types").TableTab[]} */
  // inlined from tableTabs.json — no data file, the strings live with the code
  const tableTabs =   [
    {
      "wrapper": "flex items-center gap-3",
      "button": "text-text-primary hover:text-text-secondary focus:outline-none capitalize whitespace-nowrap",
      "text": "Holders (3,185)",
      "spans": [
        [
          "",
          "(3,185)"
        ]
      ],
      "label": "Holders",
      "count": "(3,185)"
    },
    {
      "wrapper": "flex items-center gap-3",
      "divider": "w-px h-4 bg-bg-tertiary/40",
      "button": "text-text-tertiary hover:text-text-secondary focus:outline-none capitalize whitespace-nowrap",
      "text": "Swaps",
      "spans": [],
      "label": "Swaps",
      "count": null
    },
    {
      "wrapper": "flex items-center gap-3",
      "divider": "w-px h-4 bg-bg-tertiary/40",
      "button": "text-text-tertiary hover:text-text-secondary focus:outline-none capitalize whitespace-nowrap",
      "text": "Thesis (5,271)",
      "spans": [
        [
          "",
          "(5,271)"
        ]
      ],
      "label": "Thesis",
      "count": "(5,271)"
    },
    {
      "wrapper": "flex items-center gap-3",
      "divider": "w-px h-4 bg-bg-tertiary/40",
      "button": "text-text-tertiary hover:text-text-secondary focus:outline-none capitalize whitespace-nowrap",
      "text": "Top traders",
      "spans": [],
      "label": "Top traders",
      "count": null
    }
  ];
  import FeedRow from "./panel/FeedRow.svelte";
  import Skeleton from "./Skeleton.svelte";
  import FeedRowSkeleton from "./panel/FeedRowSkeleton.svelte";
  import SwapsTable from "./token/SwapsTable.svelte";
  import OverlayBox from "../icons/overlay-box.svelte";
  import { thesisRowFromItem } from "../lib/api/feed.svelte.js";
  import { closeHoverCard, openUserCard, userCardIdentity } from "../lib/hoverCard.svelte.js";
  import { followLink } from "../lib/router.js";
  import {
    getHolderCount,
    getHolders,
    getTheses,
    getThesisCount,
    getTopTraders,
    isHoldersLoading,
    isThesesLoading,
    isTopTradersLoading
  } from "../lib/api/token.svelte.js";

  let activeTab = $state("Holders");

  const holders = $derived(getHolders());
  const topTraders = $derived(getTopTraders());
  const theses = $derived(getTheses().map(thesisRowFromItem));

  // The capture prints the totals beside the tab label. Holders is a live count and
  // Thesis is the endpoint's own `totalCount`; Swaps carries no total, so it shows none.
  const countFor = (label) => {
    if (label === "Holders") return getHolderCount() ? `(${getHolderCount().toLocaleString("en-US")})` : null;
    if (label === "Thesis") return getThesisCount() ? `(${getThesisCount().toLocaleString("en-US")})` : null;
    return null;
  };

  /**
   * A row is a wallet: the holders and the top traders are both a wallet and what it did
   * with this token, so a click on the row opens that wallet's profile.
   * @param {MouseEvent} event
   * @param {string} walletAddress
   */
  function openProfile(event, walletAddress) {
    followLink(event, `/profile/${walletAddress}`);
    closeHoverCard();
  }

  const loading = $derived(
    (activeTab === "Holders" && isHoldersLoading()) ||
      (activeTab === "Thesis" && isThesesLoading()) ||
      (activeTab === "Top traders" && isTopTradersLoading())
  );

  // The table body's height in the capture. The wrapper's class string carries the
  // same measurement (h-[200vh]) and stays verbatim, so the two must agree.

  // Both tables share one shape: a sticky trader column, then equal value columns, so
  // the spacing between figures is even and a fix to one holds for the other. The class
  // rules for these grids live together in app.css, next to each other.
  const GRID_HOLDERS =
    "@[400px]:grid-cols-[12rem_minmax(7.5rem,1fr)_minmax(7.5rem,1fr)] " +
    "@[900px]:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,1fr)]";

  const ROW =
    `group py-2 grid items-center gap-6 min-w-full grid-cols-[1fr_auto] ${GRID_HOLDERS} ` +
    "@[400px]:w-max @[900px]:w-auto hover:bg-bg-secondary";

  // A header label must never wrap: at some zoom levels a narrow column was enough to
  // break one onto a second line and make the header taller than the rows it labels.
  const HEAD_CELL = "text-center whitespace-nowrap";

  /** Placeholder rows to hold the table open until the first page lands. */
  const SKELETON_ROWS = Array.from({ length: 10 }, (_, i) => i);

  // Top traders carries two more figures than Holders, and the capture's own five-column
  // grid gives its last column the whole remaining width -- which leaves the final figure
  // stranded far from the others. These four value columns are equal instead, so the
  // spacing between them is even. (Both rules are in app.css, next to the Holders grid.)
  const GRID_5 =
    "@[400px]:grid-cols-[12rem_minmax(7.5rem,1fr)_minmax(7.5rem,1fr)_minmax(7.5rem,1fr)_minmax(7.5rem,1fr)] " +
    "@[900px]:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]";

  const ROW_TOP =
    `group py-2 grid items-center gap-6 min-w-full grid-cols-[1fr_auto] ${GRID_5} ` +
    "@[400px]:w-max @[900px]:w-auto hover:bg-bg-secondary";

  const HEAD_TOP =
    `hidden @[400px]:grid gap-6 py-1.5 text-xs text-text-tertiary border-b border-bg-tertiary/60 ` +
    `sticky top-0 bg-bg-primary z-5 @[400px]:w-max @[900px]:w-auto min-w-full items-center ${GRID_5}`;

  const COL_TRADER =
    "flex gap-3 items-center sticky @[900px]:static left-0 z-1 pl-3 pr-4 py-2 -my-2 " +
    "border-r @[900px]:border-r-0 overflow-hidden transition-[border-color] " +
    "bg-bg-primary group-hover:bg-bg-secondary border-transparent";
  // The capture draws the selected tab white and the rest grey, and records that mark on
  // whichever single tab was selected when it was taken. Both strings are taken from the
  // capture here, rather than from the tab at hand: reading them off the tab itself left
  // every tab but that one grey even when it was the selected one.
  const TAB_ACTIVE =
    tableTabs.map((tab) => tab.button).find((classes) => classes.includes("text-text-primary")) ??
    tableTabs[0].button;
  const TAB_IDLE = TAB_ACTIVE.replace("text-text-primary", "text-text-tertiary");

</script>

<div class="flex gap-3 h-[200vh]">
  <div class="flex flex-col rounded-lg border border-bg-tertiary flex-1 min-w-0 min-h-0" style="height: 200vh;">
    <div class="px-2 pl-3 rounded-t-lg bg-bg-secondary flex items-center justify-between shrink-0 h-10">
      <div class="flex gap-3 text-sm min-w-0 overflow-x-auto no-scrollbar">
        {#each tableTabs as tab (tab.label)}
          <div class={tab.wrapper}>
            {#if tab.divider}<div class={tab.divider}></div>{/if}
            <button
              class={tab.label === activeTab ? TAB_ACTIVE : TAB_IDLE}
              onclick={() => (activeTab = tab.label)}
            >{tab.label}{#if countFor(tab.label)} <span>{countFor(tab.label)}</span>{/if}</button>
          </div>
        {/each}
      </div>

      <div class="flex items-center gap-3 shrink-0">
        {#each toggles as toggle (toggle.label)}
          <div class={toggle.wrapper}>
            <button class={toggle.button} style={toggle.buttonStyle}>
              <OverlayBox />
            </button>
            <span class={toggle.span}>{toggle.label}</span>
          </div>
        {/each}
      </div>
    </div>

    {#if activeTab === "Swaps"}
      <SwapsTable />
    {:else}
      <div class="flex flex-col flex-1 min-h-0">
        <div class="flex flex-col flex-1 min-h-0">
          <!-- the captured nesting, including the @container that the rows'
               @[400px]: rules resolve against -->
          <div class="@container flex flex-col overflow-hidden flex-1 min-w-0 min-h-0">
            <div class="relative flex flex-col flex-1 min-h-0">
              <div class="pointer-events-none absolute right-0 top-0 bottom-0 w-4 z-10 bg-linear-to-l from-bg-primary/80 to-transparent transition-opacity"></div>
              <div class="flex flex-col flex-1 overflow-x-auto overflow-y-auto min-h-0 scrollbar-none overscroll-x-none">
                {#if activeTab === "Top traders"}
                  <div class={HEAD_TOP}>
                    <div class="sticky @[900px]:static left-0 z-1 bg-bg-primary pl-3 pr-4 border-r @[900px]:border-r-0 transition-colors self-stretch -my-1.5 flex items-center border-transparent whitespace-nowrap">Trader</div>
                    <div class={HEAD_CELL}>Invested</div>
                    <div class={HEAD_CELL}>Sold</div>
                    <div class={HEAD_CELL}>PnL</div>
                    <div class={HEAD_CELL}>Remaining</div>
                  </div>
                {:else if activeTab === "Holders"}
                  <!-- column header, a sibling of the list, as captured -->
                  <div class={`hidden @[400px]:grid gap-6 py-1.5 text-xs text-text-tertiary border-b border-bg-tertiary/60 sticky top-0 bg-bg-primary z-5 @[400px]:w-max @[900px]:w-auto min-w-full items-center ${GRID_HOLDERS}`}>
                    <div class="sticky @[900px]:static left-0 z-1 bg-bg-primary pl-3 pr-4 border-r @[900px]:border-r-0 transition-colors self-stretch -my-1.5 flex items-center border-transparent whitespace-nowrap">Trader</div>
                    <div class={HEAD_CELL}>Holding</div>
                    <div class={HEAD_CELL}>Supply</div>
                  </div>
                {/if}

                <div class="flex flex-col shrink-0 min-w-full @[400px]:w-max @[900px]:w-auto">
                  {#if activeTab === "Thesis"}
                    {#if theses.length === 0 && isThesesLoading()}
                      {#each SKELETON_ROWS as key (key)}
                        <div class="border-b border-bg-secondary">
                          <FeedRowSkeleton type="thesis" />
                        </div>
                      {/each}
                    {/if}
                    {#each theses as row (row.id)}
                      <div class="border-b border-bg-secondary">
                        <FeedRow {row} placement="above" />
                      </div>
                    {/each}
                  {:else if activeTab === "Top traders"}
                    {#if topTraders.length === 0 && isTopTradersLoading()}
                      {#each SKELETON_ROWS as key (key)}
                        <div>
                          <div class={ROW_TOP}>
                            <div class={COL_TRADER}>
                              <div class="flex gap-3 items-center min-w-0">
                                <Skeleton class="rounded-full shrink-0" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;" />
                                <div class="flex flex-col gap-0.5 items-start min-w-0">
                                  <Skeleton class="h-4 w-28" />
                                  <Skeleton class="h-3 w-16" />
                                </div>
                              </div>
                            </div>
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex min-w-0">
                              <Skeleton class="h-4 w-20" />
                              <Skeleton class="h-3 w-16" />
                            </div>
                            <div class="flex-col justify-center gap-px items-end flex @[400px]:hidden pr-3">
                              <Skeleton class="h-4 w-20" />
                            </div>
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex"><Skeleton class="h-4 w-16" /></div>
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex"><Skeleton class="h-4 w-16" /></div>
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex"><Skeleton class="h-4 w-16" /></div>
                          </div>
                        </div>
                      {/each}
                    {/if}
                    {#each topTraders as row (row.key)}
                      <div>
                        <button class={ROW_TOP} onclick={(event) => openProfile(event, row.walletAddress)}>
                          <div class={COL_TRADER}>
                            <!-- Same trigger as the holders rows: the identity block. -->
                            <div
                              class="flex gap-3 items-center min-w-0"
                              data-state="closed"
                              data-slot="hover-card-trigger"
                              onmouseenter={(event) => openUserCard(userCardIdentity(row), event, { placement: "above" })}
                              onmouseleave={closeHoverCard}
                            >
                              {#if row.cells[0]?.avatarEyes}
                                <div
                                  class="rounded-full flex items-center justify-center object-cover shrink-0"
                                  style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; background-color: {row.cells[0].avatarBg};"
                                >
                                  <img class="w-[70%] h-[70%]" src={row.cells[0].avatar} alt="" />
                                </div>
                              {:else}
                                <img
                                  class="rounded-full flex items-center justify-center object-cover shrink-0"
                                  src={row.cells[0]?.avatar}
                                  alt=""
                                  style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;"
                                />
                              {/if}
                              <div class="flex flex-col gap-0.5 items-start min-w-0">
                                <div class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-left text-sm leading-5">
                                  <div class="min-w-0 truncate">{row.cells[0]?.texts[0]}</div>
                                </div>
                                <div class="text-xs leading-4 text-left font-normal text-text-secondary">
                                  {row.cells[0]?.texts[1]}
                                </div>
                              </div>
                            </div>
                          </div>

                          {#each row.cells.slice(1) as cell, cellIndex (cellIndex)}
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex tabular-nums min-w-0">
                              <div class="flex items-center gap-1 text-sm leading-5" style={cell.style ?? ""}>{cell.texts[0]}</div>
                              <div class="text-xs leading-4 font-normal text-text-secondary truncate max-w-full">
                                {cell.texts[1]}
                              </div>
                            </div>
                          {/each}

                          <div class="flex-col justify-center gap-px items-end flex @[400px]:hidden pr-3 tabular-nums">
                            <div class="flex items-center gap-1 text-sm leading-5">{row.cells[1]?.texts[0]}</div>
                          </div>
                        </button>
                      </div>
                    {/each}
                  {:else}
                    {#if holders.length === 0 && isHoldersLoading()}
                      <!-- Rows the shape of a trader row, on the same grid, so the table
                           keeps its columns and height while the page loads. -->
                      {#each SKELETON_ROWS as key (key)}
                        <div>
                          <div class={ROW}>
                            <div class={COL_TRADER}>
                              <div class="flex gap-3 items-center min-w-0">
                                <Skeleton class="rounded-full shrink-0" style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;" />
                                <div class="flex flex-col gap-0.5 items-start min-w-0">
                                  <Skeleton class="h-4 w-28" />
                                  <Skeleton class="h-3 w-16" />
                                </div>
                              </div>
                            </div>
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex min-w-0">
                              <Skeleton class="h-4 w-20" />
                              <Skeleton class="h-3 w-16" />
                            </div>
                            <div class="flex-col justify-center gap-px items-end flex @[400px]:hidden pr-3">
                              <Skeleton class="h-4 w-20" />
                            </div>
                            <div class="flex-col items-center gap-0.5 hidden @[400px]:flex">
                              <Skeleton class="h-4 w-20" />
                            </div>
                          </div>
                        </div>
                      {/each}
                    {/if}
                    {#each holders as row (row.key)}
                      <div>
                        <button class={ROW} onclick={(event) => openProfile(event, row.walletAddress)}>
                          <div class={COL_TRADER}>
                            <!-- The capture's own trader trigger: the identity block opens
                                 the trader's hover card. -->
                            <div
                              class="flex gap-3 items-center min-w-0"
                              data-state="closed"
                              data-slot="hover-card-trigger"
                              onmouseenter={(event) => openUserCard(userCardIdentity(row), event, { placement: "above" })}
                              onmouseleave={closeHoverCard}
                            >
                              {#if row.cells[0]?.avatarEyes}
                                <div
                                  class="rounded-full flex items-center justify-center object-cover shrink-0"
                                  style="width: 32px; height: 32px; min-width: 32px; min-height: 32px; background-color: {row.cells[0].avatarBg};"
                                >
                                  <img class="w-[70%] h-[70%]" src={row.cells[0].avatar} alt="" />
                                </div>
                              {:else}
                                <img
                                  class="rounded-full flex items-center justify-center object-cover shrink-0"
                                  src={row.cells[0]?.avatar}
                                  alt=""
                                  style="width: 32px; height: 32px; min-width: 32px; min-height: 32px;"
                                />
                              {/if}
                              <div class="flex flex-col gap-0.5 items-start min-w-0">
                                <div class="flex items-center gap-1 min-w-0 w-full">
                                  {#if row.cells[0]?.tokenAvatar}
                                    <img
                                      class={row.cells[0].tokenAvatarClass}
                                      src={row.cells[0].tokenAvatar}
                                      alt={row.cells[0].tokenAvatarAlt ?? ""}
                                      title={row.cells[0].tokenAvatarTitle ?? ""}
                                      style={row.cells[0].tokenAvatarStyle}
                                    />
                                  {/if}
                                  <div class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-left text-sm leading-5">
                                    <div class="min-w-0 truncate">{row.cells[0]?.texts[0]}</div>
                                  </div>
                                </div>
                                <div class="flex gap-1 items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" class="w-3 h-3 text-text-tertiary">
                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M8.00016 1.33334C4.31816 1.33334 1.3335 4.318 1.3335 8C1.3335 11.682 4.31816 14.6667 8.00016 14.6667C11.6822 14.6667 14.6668 11.682 14.6668 8C14.6668 4.318 11.6822 1.33334 8.00016 1.33334ZM10.3535 10.3534C10.2562 10.4507 10.1282 10.5 10.0002 10.5C9.87216 10.5 9.74414 10.4514 9.64681 10.3534L7.64681 8.35335C7.55281 8.25936 7.50016 8.132 7.50016 8V4.66667C7.50016 4.39067 7.72416 4.16667 8.00016 4.16667C8.27616 4.16667 8.50016 4.39067 8.50016 4.66667V7.79265L10.3535 9.646C10.5488 9.842 10.5488 10.158 10.3535 10.3534Z" fill="currentColor" />
                                  </svg>
                                  <div class="text-xs leading-4 text-left font-normal text-text-secondary">
                                    {row.cells[0]?.texts[1]}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="flex-col items-center gap-0.5 hidden @[400px]:flex tabular-nums min-w-0">
                            <div class="flex items-center gap-1 text-sm leading-5">{row.cells[1]?.texts[0]}</div>
                            <div class="text-xs leading-4 font-normal text-text-secondary truncate max-w-full">
                              {row.cells[1]?.texts[1]}
                            </div>
                          </div>

                          <div class="flex-col justify-center gap-px items-end flex @[400px]:hidden pr-3 tabular-nums">
                            <div class="flex items-center gap-1 text-sm leading-5">{row.cells[1]?.texts[0]}</div>
                          </div>

                          <!-- Supply, in the same shape as every other cell here and in
                               the Top traders table: the figure centred on its own line,
                               the caption centred under it. -->
                          <div class="flex-col items-center gap-0.5 hidden @[400px]:flex tabular-nums min-w-0">
                            <div class="flex items-center gap-1 text-sm leading-5">{row.cells[2]?.texts[0] ?? ""}</div>
                            <div class="text-xs leading-4 font-normal text-text-secondary truncate max-w-full">
                              {row.cells[2]?.texts[1] ?? ""}
                            </div>
                          </div>
                        </button>
                      </div>
                    {/each}
                  {/if}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
