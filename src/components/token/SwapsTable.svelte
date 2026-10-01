<script>
  // The token page's Swaps tab.
  //
  // The capture mounts this panel but keeps it hidden (`display: none !important`)
  // and its rows are still loading skeletons, so everything structural here -- the
  // container chain, the sticky header, the column grid and the row grid -- is read
  // verbatim from the capture. The values come from the /feed/token
  // response this tab requests (43 swaps), and the text classes for the loaded cells
  // come from the equivalent cells of the captured profile swaps table, which is the
  // same column set.
  /** @type {import("../../lib/types").TokenSwapsData} */
  // inlined from tokenSwaps.json — no data file, the strings live with the code
  const table =   {
    "panelClasses": "flex flex-col flex-1 min-h-0",
    "innerClasses": "@container flex flex-col min-w-0 min-h-0 flex-1",
    "relativeClasses": "relative flex flex-1 flex-col min-h-0",
    "scrollClasses": "flex-1 overflow-y-auto overflow-x-hidden min-h-0",
    "scrollStyle": "overflow: auto; overflow-anchor: none;",
    "legendClasses": "legend-list-content-container",
    "legendStyle": "display: block; min-height: 100%; box-sizing: border-box; overflow-anchor: none;",
    "stickyStyle": "position: sticky; top: 0px; z-index: 10;",
    "headClasses": "hidden gap-3 px-3 py-1.5 text-xs text-text-tertiary border-b border-bg-tertiary/60 shrink-0 bg-bg-primary @[500px]:grid @[500px]:grid-cols-[1fr_4rem_7rem_6rem_2rem] @[500px]:items-center",
    "headCells": [
      {
        "classes": "",
        "text": "Trader"
      },
      {
        "classes": "",
        "text": "Action"
      },
      {
        "classes": "",
        "text": "Amount"
      },
      {
        "classes": "",
        "text": "Market Cap"
      },
      {
        "classes": "text-right",
        "text": "Time"
      }
    ],
    "bodyClasses": "relative flex flex-col px-3 py-2",
    "rowClasses": "grid items-center gap-3 py-2 grid-cols-[1fr_auto_auto_auto_auto] @[500px]:grid-cols-[1fr_4rem_7rem_6rem_2rem]",
    "traderCellClasses": "flex items-center gap-3",
    "avatar": {
      "classes": "shrink-0 cursor-pointer",
      "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;"
    },
    "avatarImgClasses": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
    "nameClasses": "text-sm truncate",
    "badgeClasses": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
    "amountClasses": "text-sm",
    "mcapClasses": "text-sm",
    "timeCellClasses": "text-right",
    "timeClasses": "text-xs text-text-tertiary",
    "rows": [
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "AcuaMexi",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$26.16",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:49:00.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Maximus",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$250.00",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:49:00.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Netzz",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$60.24",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:55.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "PURRZ",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$44.82",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:55.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "LostStiffMink",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$43.74",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:55.000Z"
      },
      {
        "avatar": "",
        "name": "NovelRoseElk",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$22.82",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:50.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Neko",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$202.41",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:50.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "ipandzy",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$14.51",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:50.000Z"
      },
      {
        "avatar": "",
        "name": "DonFuego",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$36.22",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:50.000Z"
      },
      {
        "avatar": "",
        "name": "AwfulAliveSmelt",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$499.00",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:50.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "dodo",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$81.00",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:40.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Theo Bon Sol",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$29.97",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:35.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "noel007",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$26.39",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:30.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Teh Pahit",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$476.73",
        "mcap": "$1.4M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:30.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "sF",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$121.44",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:20.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "cryptomaster1",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$760.12",
        "mcap": "$1.5M",
        "time": "now",
        "timeTitle": "2026-09-21T14:48:20.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "pnd24",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$173.42",
        "mcap": "$1.4M",
        "time": "45s",
        "timeTitle": "2026-09-21T14:48:15.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Uberhuman Capital",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$119.62",
        "mcap": "$1.5M",
        "time": "45s",
        "timeTitle": "2026-09-21T14:48:15.000Z"
      },
      {
        "avatar": "",
        "name": "cyphercry",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$29.76",
        "mcap": "$1.5M",
        "time": "55s",
        "timeTitle": "2026-09-21T14:48:05.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Andrew Bullington",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$23.50",
        "mcap": "$1.4M",
        "time": "60s",
        "timeTitle": "2026-09-21T14:48:00.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "KIM JONG DIN",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$300.00",
        "mcap": "$1.5M",
        "time": "60s",
        "timeTitle": "2026-09-21T14:48:00.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "CRYPTO ALPHA",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$50.46",
        "mcap": "$1.4M",
        "time": "60s",
        "timeTitle": "2026-09-21T14:48:00.000Z"
      },
      {
        "avatar": "",
        "name": "hholymmoly",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$200.17",
        "mcap": "$1.4M",
        "time": "70s",
        "timeTitle": "2026-09-21T14:47:50.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "soulja",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$55.46",
        "mcap": "$1.4M",
        "time": "70s",
        "timeTitle": "2026-09-21T14:47:50.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "enh4nced",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$74.61",
        "mcap": "$1.4M",
        "time": "75s",
        "timeTitle": "2026-09-21T14:47:45.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Hades",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$73.85",
        "mcap": "$1.5M",
        "time": "75s",
        "timeTitle": "2026-09-21T14:47:45.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "computer",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$125.00",
        "mcap": "$1.5M",
        "time": "80s",
        "timeTitle": "2026-09-21T14:47:40.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "TACHASYPERI",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$46.99",
        "mcap": "$1.4M",
        "time": "95s",
        "timeTitle": "2026-09-21T14:47:25.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "BOS11",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$45.24",
        "mcap": "$1.5M",
        "time": "95s",
        "timeTitle": "2026-09-21T14:47:25.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "gykk",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$111.59",
        "mcap": "$1.4M",
        "time": "100s",
        "timeTitle": "2026-09-21T14:47:20.000Z"
      },
      {
        "avatar": "",
        "name": "Mcfly11",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$14.26",
        "mcap": "$1.5M",
        "time": "110s",
        "timeTitle": "2026-09-21T14:47:10.000Z"
      },
      {
        "avatar": "",
        "name": "Egoody",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$19.84",
        "mcap": "$1.5M",
        "time": "110s",
        "timeTitle": "2026-09-21T14:47:10.000Z"
      },
      {
        "avatar": "",
        "name": "happybunnymoney",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$34.09",
        "mcap": "$1.5M",
        "time": "110s",
        "timeTitle": "2026-09-21T14:47:10.000Z"
      },
      {
        "avatar": "",
        "name": "Justdaily",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$506.15",
        "mcap": "$1.4M",
        "time": "115s",
        "timeTitle": "2026-09-21T14:47:05.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Myst🚀",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$51.17",
        "mcap": "$1.5M",
        "time": "115s",
        "timeTitle": "2026-09-21T14:47:05.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "ZNikita",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$1,996.00",
        "mcap": "$1.5M",
        "time": "120s",
        "timeTitle": "2026-09-21T14:47:00.000Z"
      },
      {
        "avatar": "",
        "name": "Veplus",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$137.07",
        "mcap": "$1.5M",
        "time": "120s",
        "timeTitle": "2026-09-21T14:47:00.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Theo Bon Sol",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$30.75",
        "mcap": "$1.5M",
        "time": "125s",
        "timeTitle": "2026-09-21T14:46:55.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "BullShark11",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$145.54",
        "mcap": "$1.4M",
        "time": "125s",
        "timeTitle": "2026-09-21T14:46:55.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "Zebba",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$75.74",
        "mcap": "$1.4M",
        "time": "125s",
        "timeTitle": "2026-09-21T14:46:55.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "imking",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$1,947.50",
        "mcap": "$1.4M",
        "time": "130s",
        "timeTitle": "2026-09-21T14:46:50.000Z"
      },
      {
        "avatar": "/images/nohomo-eyes.png",
        "name": "royalsoul369",
        "action": "Buy",
        "actionStyle": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
        "amount": "$80.44",
        "mcap": "$1.6M",
        "time": "130s",
        "timeTitle": "2026-09-21T14:46:50.000Z"
      },
      {
        "avatar": "",
        "name": "isak",
        "action": "Sell",
        "actionStyle": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
        "amount": "$54.07",
        "mcap": "$1.4M",
        "time": "130s",
        "timeTitle": "2026-09-21T14:46:50.000Z"
      }
    ]
  };
  import { getSwaps, isSwapsLoading } from "../../lib/api/token.svelte.js";
  import { closeHoverCard, openUserCard, userCardIdentity } from "../../lib/hoverCard.svelte.js";
  import { followLink } from "../../lib/router.js";

  const rows = $derived(getSwaps());
  const loading = $derived(isSwapsLoading());

  /**
   * The row is a swap one wallet made, so a click goes to that wallet's profile. The row
   * is a div, so it carries the link's own keyboard behaviour as well.
   * @param {MouseEvent | KeyboardEvent} event
   * @param {string} href
   */
  function openProfile(event, href) {
    followLink(event, href);
    closeHoverCard();
  }
</script>

<div class={table.panelClasses}>
  <div class={table.innerClasses}>
    <div class={table.relativeClasses}>
      <div class={table.scrollClasses} style={table.scrollStyle}>
        <div class={table.legendClasses} style={table.legendStyle}>
          <div style={table.stickyStyle}>
            <div class={table.headClasses}>
              {#each table.headCells as cell (cell.text)}
                <div class={cell.classes}>{cell.text}</div>
              {/each}
            </div>
          </div>

          <div class={table.bodyClasses}>
            {#each rows as row (row.id)}
              <div
                class="{table.rowClasses} cursor-pointer"
                role="link"
                tabindex="0"
                onclick={(event) => openProfile(event, `/profile/${row.walletAddress}`)}
                onkeydown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  openProfile(event, `/profile/${row.walletAddress}`);
                }}
              >
                <!-- The capture never opened this tab, so its rows carry no trigger of
                     their own. The trigger is the wallet's own block, not the cell that
                     holds it: the cell is the grid's `1fr` column, so a card anchored on
                     it lands at the far right of the table instead of beside the name. -->
                <div class={table.traderCellClasses}>
                  <div
                    class="flex items-center gap-3 min-w-0"
                    data-state="closed"
                    data-slot="hover-card-trigger"
                    onmouseenter={(event) => openUserCard(userCardIdentity(row), event, { placement: "above" })}
                    onmouseleave={closeHoverCard}
                  >
                    <div class={table.avatar.classes} style={table.avatar.style}>
                      <img class={table.avatarImgClasses} src={row.avatar} alt="" style="width: 24px; height: 24px;" />
                    </div>
                    <div class={table.nameClasses}>{row.name}</div>
                  </div>
                </div>
                <div>
                  <div class={table.badgeClasses} style={row.actionStyle}>{row.action}</div>
                </div>
                <div class={table.amountClasses}>{row.amount}</div>
                <div class={table.mcapClasses}>{row.mcap}</div>
                <div class={table.timeCellClasses}>
                  <span class={table.timeClasses} title={row.timeTitle}>{row.time}</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
