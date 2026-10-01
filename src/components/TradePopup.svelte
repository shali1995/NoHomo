<script>
  // Trade detail modal (position popup), ported verbatim from the capture: one
  // recorded state for the open position (tradeId 94c8704c…) and one for the closed
  // one (tradeId 99816644…).
  // This file is the captured shell — backdrop, dialog panel, title, the trader
  // header and the two columns. Each region inside them is a component under
  // src/components/trade/ whose markup is byte-for-byte the capture's.
  import Close from "../icons/close.svelte";
  // inlined from tradePopup.json — no data file, the strings live with the code
  const tradePopup =   {
    "defaultTradeId": "94c8704c-5262-4dcd-a63a-0a1b55f761a1",
    "trades": {
      "94c8704c-5262-4dcd-a63a-0a1b55f761a1": {
        "profile": {
          "href": "/profile/The__Solstice",
          "name": "The__Solstice",
          "avatarKind": "image",
          "avatarSrc": "/images/nohomo-eyes.png",
          "avatarClasses": "rounded-full flex items-center justify-center shrink-0 object-cover",
          "avatarStyle": "width: 28px; height: 28px; min-width: 28px; min-height: 28px;",
          "placeholderStyle": "",
          "placeholderImgClasses": "",
          "placeholderImgSrc": "",
          "showFollow": true
        },
        "token": {
          "href": "/tokens/solana/4UHmZGe6X4DZ5dxYGiGXMhi3Sp34uPWtHB7qDMyvRbYB",
          "symbol": "QUEEF",
          "address": "4UHmZG...yvRbYB",
          "imageSrc": "/images/nohomo-eyes.png",
          "imageStyle": "height: 48px; width: 48px;",
          "imageBadge": null,
          "statusLabel": "Open",
          "statusClasses": "text-xs py-0.5 px-1 rounded-sm flex items-center gap-1 bg-accent-primary-transparent text-accent-primary",
          "statusDotStyle": "height: 6px; width: 6px; animation: 1.5s ease-in-out 0s infinite normal none running dot-glow-pulse;",
          "network": "solana",
          "links": [
            "search"
          ],
          "marketCap": "$2.8M MC",
          "changeArrow": "▲",
          "changeArrowStyle": "color: rgb(33, 201, 94); font-weight: 400; font-size: 8px;",
          "changeValue": "217.91%",
          "changeValueStyle": "font-size: 14px; font-weight: 400; color: rgb(33, 201, 94);"
        },
        "chart": {
          "indicatorStyle": "left: calc(80% - 1.2px); width: calc(20% - 0.8px);",
          "tabs": [
            {
              "label": "LIVE",
              "selected": false
            },
            {
              "label": "1H",
              "selected": false
            },
            {
              "label": "4H",
              "selected": false
            },
            {
              "label": "1D",
              "selected": false
            },
            {
              "label": "ALL",
              "selected": true
            }
          ],
          "markers": [
            {
              "l": 393.83,
              "t": 43.9255,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 373.319,
              "t": 25.4883,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 342.553,
              "t": 4,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 335.716,
              "t": 4,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 332.298,
              "t": 46.4691,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 301.532,
              "t": 52.4986,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 298.113,
              "t": 45.8924,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 216.071,
              "t": 111.891,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 168.213,
              "t": 117.803,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 168.213,
              "t": 89.8026,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 79.3333,
              "t": 110.006,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 55.4043,
              "t": 98.1891,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 45.1489,
              "t": 108.704,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 45.1489,
              "t": 80.7037,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 38.3121,
              "t": 96.4761,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 38.3121,
              "t": 68.4761,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 28.0567,
              "t": 88.919,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 28.0567,
              "t": 60.919,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 28.0567,
              "t": 32.919,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 24.6383,
              "t": 92.2982,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 24.6383,
              "t": 64.2982,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 24.6383,
              "t": 36.2982,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 24.6383,
              "t": 8.29819,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 24.6383,
              "t": 4,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 24.6383,
              "t": 4,
              "letter": "B",
              "tone": "bg-green"
            },
            {
              "l": 428.014,
              "t": 35.9666,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 397.248,
              "t": 39.1925,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 397.248,
              "t": 11.1925,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 393.83,
              "t": 15.9255,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 373.319,
              "t": 4,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 342.553,
              "t": 4,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 328.879,
              "t": 49.4156,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 308.369,
              "t": 19.9646,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 294.695,
              "t": 58.7158,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 284.44,
              "t": 4,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 281.021,
              "t": 4,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 257.092,
              "t": 74.714,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 253.674,
              "t": 106.883,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 226.326,
              "t": 105.472,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 219.489,
              "t": 106.615,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 175.05,
              "t": 105.998,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 168.213,
              "t": 61.8026,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 79.3333,
              "t": 82.0064,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 34.8936,
              "t": 99.3683,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 34.8936,
              "t": 71.3683,
              "avatar": "/images/nohomo-eyes.png"
            },
            {
              "l": 24.6383,
              "t": 4,
              "avatar": "/images/nohomo-eyes.png"
            }
          ]
        },
        "comments": [
          {
            "ago": "3h",
            "title": "Sep 21, 2026, 5:58 PM",
            "text": "",
            "link": "https://x.com/MacroCRG/status/2101973349823897763",
            "likes": "24",
            "thesis": true,
            "first": true,
            "last": false
          },
          {
            "ago": "5h",
            "title": "Sep 21, 2026, 3:50 PM",
            "text": "Okay just FUCKING SEND IT",
            "link": null,
            "likes": "59",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "6h",
            "title": "Sep 21, 2026, 3:44 PM",
            "text": "Give it a second if we're confirming the next big bull market wave here fartcoin can 3x in a week and queef 10x",
            "link": null,
            "likes": "19",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "6h",
            "title": "Sep 21, 2026, 3:36 PM",
            "text": "Still adding in this range for the move",
            "link": null,
            "likes": "22",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "7h",
            "title": "Sep 21, 2026, 2:06 PM",
            "text": "I really think we just fucking gigasend this week man",
            "link": null,
            "likes": "42",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "10h",
            "title": "Sep 21, 2026, 11:41 AM",
            "text": "Watch this become one of my biggest bags",
            "link": null,
            "likes": "88",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "11h",
            "title": "Sep 21, 2026, 10:37 AM",
            "text": "BREAKOUT\n\n",
            "link": "https://x.com/The__Solstice/status/2101878301497401422",
            "likes": "36",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "12h",
            "title": "Sep 21, 2026, 9:20 AM",
            "text": "Big week.",
            "link": null,
            "likes": "27",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "13h",
            "title": "Sep 21, 2026, 8:18 AM",
            "text": "Selling the retest of the breakout before fartcoin full sends anon?",
            "link": null,
            "likes": "42",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "14h",
            "title": "Sep 21, 2026, 7:36 AM",
            "text": "Fartcoin is the lowest cap alt w the highest mindshare and we can genuinely push it multiples and ride with it\n\nInsane mechanics at play here LETS FKING GO",
            "link": null,
            "likes": "53",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "14h",
            "title": "Sep 21, 2026, 7:13 AM",
            "text": "Oh we're gonna cook like crazy aren't we",
            "link": null,
            "likes": "51",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "16h",
            "title": "Sep 21, 2026, 5:32 AM",
            "text": "Zcat went insane cause it was the best way to get exposure to zcat as they were confident it would hit 10,000$+ some day\n\nFartcoin over 1$+ is very easy in a raging bull market we can go insane from here\n\n",
            "link": "https://x.com/The__Solstice/status/2101801329501077894",
            "likes": "49",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "16h",
            "title": "Sep 21, 2026, 5:10 AM",
            "text": "FARTCOIN GOIN FOR IT BREAKOUT AND FULL SEND BB\n\nFARTCOIN 2X=QUEEF 10X",
            "link": null,
            "likes": "31",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "18h",
            "title": "Sep 21, 2026, 3:15 AM",
            "text": "Kind of looks like allinu chart before it went insane",
            "link": null,
            "likes": "38",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "19h",
            "title": "Sep 21, 2026, 2:38 AM",
            "text": "I don't think this volume and idea go to waste\n\nFull send queef and fartcoin it's coming",
            "link": null,
            "likes": "36",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "22h",
            "title": "Sep 20, 2026, 11:36 PM",
            "text": "",
            "link": "https://x.com/The__Solstice/status/2101711721727754622",
            "likes": "33",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "22h",
            "title": "Sep 20, 2026, 10:58 PM",
            "text": "Stonk ripping face. Btc and fartcoin moving up. You think the top fartcoin meme is done here? You imbecile send it infinitely higher",
            "link": null,
            "likes": "51",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "1d",
            "title": "Sep 20, 2026, 4:34 PM",
            "text": "Fartcoin beginning to candle FELLOW QUEEFERS WE ARE GONNA MAKE IT",
            "link": null,
            "likes": "63",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "1d",
            "title": "Sep 20, 2026, 1:19 PM",
            "text": "Lowest cap alt meme pair with the highest mindshare\n\nWe have a chance to do the funniest thing here\n\n",
            "link": "https://x.com/The__Solstice/status/2101556444642566302",
            "likes": "82",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "1d",
            "title": "Sep 20, 2026, 1:16 PM",
            "text": "Pussys queef.. wait it's also a cat ??",
            "link": null,
            "likes": "39",
            "thesis": false,
            "first": false,
            "last": false
          },
          {
            "ago": "1d",
            "title": "Sep 20, 2026, 12:31 PM",
            "text": "Top fartcoin meme could catch a nasty bid",
            "link": null,
            "likes": "89",
            "thesis": false,
            "first": false,
            "last": true
          }
        ],
        "summary": {
          "layout": "open",
          "value": "$40,616.73",
          "pnlSign": "+",
          "pnlValue": "$17,825.15",
          "pnlStyle": "font-size: 18px; font-weight: 500; color: rgb(33, 201, 94);",
          "amount": "14.1MQUEEF",
          "changeArrow": "▲",
          "changeArrowStyle": "color: rgb(33, 201, 94); font-weight: 400; font-size: 8px;",
          "changeValue": "78.21%",
          "changeValueStyle": "font-size: 14px; font-weight: 500; color: rgb(152, 153, 163);",
          "stats": [
            {
              "label": "Avg. entry",
              "value": "$1.6M MC"
            },
            {
              "label": "Invested",
              "value": "$22,791.58"
            }
          ]
        },
        "transactions": {
          "count": 25,
          "popoverControls": "radix-_r_2n_",
          "investedNote": null,
          "rows": [
            {
              "action": "Buy",
              "amount": "$1,996.33",
              "mcap": "$3M",
              "date": "Sep 21, 3:36 PM"
            },
            {
              "action": "Buy",
              "amount": "$1,973.38",
              "mcap": "$3.4M",
              "date": "Sep 21, 2:00 PM"
            },
            {
              "action": "Buy",
              "amount": "$1,376.65",
              "mcap": "$4.1M",
              "date": "Sep 21, 11:41 AM"
            },
            {
              "action": "Buy",
              "amount": "$1,921.85",
              "mcap": "$3M",
              "date": "Sep 21, 11:08 AM"
            },
            {
              "action": "Buy",
              "amount": "$111.00",
              "mcap": "$3M",
              "date": "Sep 21, 11:05 AM"
            },
            {
              "action": "Buy",
              "amount": "$1,176.73",
              "mcap": "$2.6M",
              "date": "Sep 21, 8:37 AM"
            },
            {
              "action": "Buy",
              "amount": "$302.05",
              "mcap": "$2.6M",
              "date": "Sep 21, 8:32 AM"
            },
            {
              "action": "Buy",
              "amount": "$117.59",
              "mcap": "$753.7K",
              "date": "Sep 21, 2:32 AM"
            },
            {
              "action": "Buy",
              "amount": "$371.83",
              "mcap": "$955.5K",
              "date": "Sep 20, 11:06 PM"
            },
            {
              "action": "Buy",
              "amount": "$416.05",
              "mcap": "$970.8K",
              "date": "Sep 20, 11:01 PM"
            },
            {
              "action": "Buy",
              "amount": "$143.40",
              "mcap": "$941K",
              "date": "Sep 20, 4:25 PM"
            }
          ],
          "pages": [
            1,
            2,
            3
          ]
        }
      },
      "99816644-8210-4648-a515-d79cd41f56cc": {
        "profile": {
          "href": "/profile/RareTotalFowl",
          "name": "RareTotalFowl",
          "avatarKind": "placeholder",
          "avatarSrc": "",
          "avatarClasses": "rounded-full flex items-center justify-center shrink-0 object-cover",
          "avatarStyle": "width: 28px; height: 28px; min-width: 28px; min-height: 28px;",
          "placeholderStyle": "width: 28px; height: 28px; min-width: 28px; min-height: 28px; background-color: rgb(255, 111, 233);",
          "placeholderImgClasses": "w-[70%] h-[70%]",
          "placeholderImgSrc": "/images/nohomo-eyes.png",
          "showFollow": false
        },
        "token": {
          "href": "/tokens/robinhood/0x2e8c31162b855a2ffa90f6f8634643ad6f111e18",
          "symbol": "AI",
          "address": "0x2e8c...111e18",
          "imageSrc": "/images/nohomo-eyes.png",
          "imageStyle": "height: 48px; width: 48px;",
          "imageBadge": {
            "style": "bottom: -4px; right: -4px;"
          },
          "statusLabel": "Closed",
          "statusClasses": "text-xs py-0.5 px-1 rounded-sm flex items-center gap-1 bg-bg-tertiary text-text-secondary",
          "statusDotStyle": null,
          "network": "robinhood",
          "links": [
            "globe",
            "x",
            "telegram",
            "search"
          ],
          "marketCap": "$275.2M MC",
          "changeArrow": "▲",
          "changeArrowStyle": "color: rgb(33, 201, 94); font-weight: 400; font-size: 8px;",
          "changeValue": "8.93%",
          "changeValueStyle": "font-size: 14px; font-weight: 400; color: rgb(33, 201, 94);"
        },
        "chart": {
          "indicatorStyle": "left: calc(66.6667% - 0.666667px); width: calc(33.3333% - 1.33333px);",
          "tabs": [
            {
              "label": "7D",
              "selected": false
            },
            {
              "label": "1M",
              "selected": false
            },
            {
              "label": "ALL",
              "selected": true
            }
          ],
          "markers": [
            {
              "l": 281.484,
              "t": 123.379,
              "letter": "S",
              "tone": "bg-red"
            },
            {
              "l": 230.123,
              "t": 149.053,
              "letter": "B",
              "tone": "bg-green"
            }
          ]
        },
        "comments": null,
        "summary": {
          "layout": "closed",
          "value": null,
          "pnlSign": "+",
          "pnlValue": "$5.76",
          "pnlStyle": "font-size: 22px; font-weight: 500; color: rgb(33, 201, 94);",
          "amount": null,
          "changeArrow": "▲",
          "changeArrowStyle": "color: rgb(33, 201, 94); font-weight: 400; font-size: 12px;",
          "changeValue": "299.55%",
          "changeValueStyle": "font-size: 18px; font-weight: 500; color: rgb(247, 247, 247);",
          "stats": [
            {
              "label": "Avg. entry",
              "value": "$13.5M MC"
            },
            {
              "label": "Avg. exit",
              "value": "$54.9M MC"
            }
          ]
        },
        "transactions": {
          "count": 2,
          "popoverControls": "radix-_r_2c_",
          "investedNote": "$1.92",
          "rows": [
            {
              "action": "Sell",
              "amount": "$7.79",
              "mcap": "$54.9M",
              "date": "Aug 27, 11:52 PM"
            },
            {
              "action": "Buy",
              "amount": "$1.92",
              "mcap": "$13.5M",
              "date": "Aug 21, 2:36 AM"
            }
          ],
          "pages": []
        }
      }
    }
  };
  import TradeChart from "./trade/TradeChart.svelte";
  import TradeComments from "./trade/TradeComments.svelte";
  import TradeHeader from "./trade/TradeHeader.svelte";
  import TradePositionPanel from "./trade/TradePositionPanel.svelte";
  import TradeRangeRow from "./trade/TradeRangeRow.svelte";
  import TradeTokenRow from "./trade/TradeTokenRow.svelte";

  /** @type {import("../lib/types").TradePopupData} */
  const data = tradePopup;

  /** @type {{ tradeId: string }} */
  let { tradeId } = $props();

  /** @type {import("../lib/types").TradePopupTrade} */
  const trade = $derived(data.trades[tradeId] ?? data.trades[data.defaultTradeId]);
</script>

<!--
  Backdrop, panel, header, token summary, chart + markers, range row, comment
  thread, order buttons, position summary and the transactions list — in the
  capture's order and nesting. The modal is portalled to the end of the body by
  the original, which is why it sits outside the app shell in App.svelte too.
-->
<div data-state="open" data-slot="dialog-overlay" class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/70 z-modal" style="pointer-events: auto;" data-aria-hidden="true" aria-hidden="true"></div>
<div role="dialog" id="radix-_r_29_" aria-labelledby="radix-_r_2a_" data-state="open" data-slot="dialog-content" class="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] outline-none z-modal" tabindex="-1" style="pointer-events: auto;">
  <button type="button" data-slot="dialog-close" class="glass-round absolute -top-11 right-0 flex size-10 items-center justify-center text-white transition-opacity hover:opacity-80 focus:outline-none"><Close /><span class="sr-only">Close</span></button>
  <!-- The panel's h-[84svh] / max-h-200 / w-248 are the capture's size classes: they
       stay class strings rather than named constants, because re-deriving them
       would change the class attribute the fidelity check compares. -->
  <div class="bg-bg-primary/40 backdrop-blur-sm rounded-3xl border border-bg-tertiary data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 flex gap-3 flex-col px-0 py-4 overflow-hidden h-[84svh] max-h-200 min-h-[min(47rem,calc(100svh-5.5rem))] w-248 max-w-[calc(100vw-2rem)]">
    <h2 id="radix-_r_2a_" data-slot="dialog-title" class="text-lg leading-none font-semibold sr-only">Position</h2>
    <TradeHeader profile={trade.profile} />
    <div class="flex flex-1 min-h-0">
      <div class="min-w-0 flex flex-col gap-3 min-h-0 pl-4 flex-3">
        <div class="flex flex-col gap-1 shrink-0">
          <TradeTokenRow token={trade.token} />
          <TradeChart chart={trade.chart} />
          <TradeRangeRow chart={trade.chart} />
        </div>
        <TradeComments comments={trade.comments} profile={trade.profile} />
      </div>
      <div class="w-px mx-4"></div>
      <TradePositionPanel summary={trade.summary} transactions={trade.transactions} />
    </div>
  </div>
</div>
