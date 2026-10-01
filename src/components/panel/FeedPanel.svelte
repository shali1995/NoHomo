<script>
  // The left panel's Feed view: the Filter control and the activity rows.
  //
  // The rows are live: labelled-wallet swaps and wallet theses, merged newest-first by
  // timestamp, from src/lib/api/feed.svelte.js. The layout classes and the Filter
  // control's chrome are still the capture's.
  //
  // The capture positioned its rows absolutely because its virtualizer knew each one's
  // measured height — its own steps are 217, 82, 82, 165, 82, 123…, so the rows are not
  // a fixed stride. Thesis cards are text-height too (one card's thesis is just "."),
  // so a fixed offset cannot place them and they overlap. These rows flow instead, which
  // is the same box model minus the absolute positioning.
  //
  // The capture's pinned `announce` post has no endpoint, so it no longer appears.
  /** @type {import("../../lib/types").FeedPanelData} */
  // inlined from feed.json — no data file, the strings live with the code
  const feed =   {
    "container": {
      "outerClasses": "flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-1",
      "outerStyle": "overflow: auto; overflow-anchor: none;",
      "legendClasses": "legend-list-content-container",
      "legendStyle": "display: block; min-height: 100%; box-sizing: border-box; overflow-anchor: none;",
      "spacerStyle": "height: 4992px; opacity: 1; position: relative;",
      "spacerClasses": ""
    },
    "rows": [
      {
        "type": "announce",
        "classes": "flex flex-col gap-2 px-2 py-2 ",
        "avatar": {
          "wrapperClasses": "flex items-center justify-center shrink-0 rounded-full bg-accent-primary",
          "wrapperStyle": "width: 24px; height: 24px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "w-[70%] h-[70%]",
            "style": ""
          }
        },
        "buttonClasses": "flex items-center gap-2 text-left rounded-lg -mx-2 px-2 py-1",
        "nameClasses": "text-sm text-text-primary",
        "name": "fomo",
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "20h",
          "title": "Sep 21, 2026, 1:05 AM"
        },
        "pinned": {
          "classes": "flex items-center gap-1 text-text-secondary hover:opacity-80",
          "text": "Pinned"
        },
        "chevron": {
          "classes": "flex items-center justify-center text-text-tertiary"
        },
        "cardClasses": "ml-8 rounded-lg ring ring-bg-tertiary overflow-hidden",
        "titleClasses": "bg-bg-secondary px-2 py-1.5",
        "titleInner": "text-xs font-bold text-text-primary",
        "title": "Recap: September 19th, 2026",
        "bodyClasses": "text-xs font-normal text-text-primary leading-4 whitespace-pre-line",
        "body": [
          {
            "tag": "span",
            "classes": "",
            "href": "",
            "text": "• "
          },
          {
            "tag": "a",
            "classes": "text-accent-primary underline hover:opacity-80",
            "href": "/tokens/base/0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
            "text": "$Bitcoin"
          },
          {
            "tag": "span",
            "classes": "",
            "href": "",
            "text": " is back above the key $80,000 level, fueling a positive tone across the broader market.\n\n• ..."
          }
        ],
        "showMore": {
          "classes": "text-xs font-bold text-text-tertiary hover:opacity-80 mt-1",
          "text": "Show more"
        },
        "reaction": {
          "wrapperClasses": "ml-8 flex items-center",
          "classes": "inline-flex items-center gap-1 rounded-full bg-bg-secondary px-1.5 py-1 cursor-pointer ring-1 hover:opacity-80 ring-bg-tertiary",
          "svgClasses": "text-text-secondary",
          "spanClasses": "text-xs min-w-2 text-text-secondary",
          "count": "118"
        },
        "top": 0.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/solana/EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc?tradeId=00dad938-71c8-44d9-bad4-28ef784b7f1e",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "VarientCircle67"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
          "text": "Sell"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "now",
          "title": "Sep 21, 2026, 9:49 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "Stamp"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$6.8K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$1.3M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 217.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/robinhood/0x22eb9f1c5385ed74257da42d8021916c2d837135?tradeId=276f2ebe-449c-431a-8ffd-72e7bcc29322",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "leftcurvemaxing"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
          "text": "Buy"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "13s",
          "title": "Sep 21, 2026, 9:49 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "SHIT"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$3K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$1.1M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 299.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "thesis",
        "classes": "py-2.5 px-3 flex items-start gap-2 min-w-0 hover:bg-bg-secondary cursor-pointer",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "sauceycrypto"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(81, 106, 246); background-color: rgba(81, 106, 246, 0.2);",
          "text": "Thesis"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "28s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "ticker": {
          "classes": "truncate min-w-0 border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
          "text": "LOOM",
          "attrs": {
            "role": "link",
            "tabindex": "0"
          }
        },
        "tickerCell": {
          "classes": "flex items-center gap-0.5 min-w-0",
          "badge": null
        },
        "amount": [
          {
            "kind": "text",
            "tag": "span",
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$15,788.37"
          },
          {
            "kind": "dot",
            "tag": "div",
            "classes": "shrink-0 rounded-full bg-accent-primary",
            "style": "height: 6px; width: 6px; animation: 1.5s ease-in-out 0s infinite normal none running dot-glow-pulse;",
            "text": ""
          },
          {
            "kind": "pct",
            "tag": "div",
            "classes": "flex items-center gap-0.5 text-xs text-text-tertiary",
            "style": "",
            "openSpanClasses": "",
            "openText": "(",
            "innerClasses": "flex gap-0.75 items-center tabular-nums",
            "innerStyle": "line-height: 16px;",
            "arrow": "▼",
            "arrowClasses": "",
            "arrowStyle": "color: rgb(255, 98, 46); font-weight: 400; font-size: 6px;",
            "value": "48.31%",
            "valueClasses": "",
            "valueStyle": "font-size: 12px; font-weight: 400; color: rgb(255, 98, 46);",
            "closeSpanClasses": "",
            "closeText": ")"
          }
        ],
        "quoteText": "STONK at 300 million , SOL at an ATH in a year. Loom will hit over 100 million sooner than later.",
        "quote": {
          "classes": "relative mt-1 text-sm font-normal leading-normal self-start text-left whitespace-pre-line wrap-break-word min-w-0 max-w-full",
          "bar": {
            "classes": "absolute pointer-events-none border-l-2 border-b-2 border-bg-tertiary rounded-bl-lg",
            "style": "left: -20px; top: -22px; width: 16px; height: 32px;"
          },
          "bodyClasses": "line-clamp-6"
        },
        "likes": {
          "wrapperClasses": "flex items-center cursor-pointer h-4 min-w-4 w-auto gap-1",
          "innerClasses": "p-2 -m-2 active:scale-75 transition-transform duration-150",
          "spanClasses": "text-xs min-w-2 transition-all text-text-tertiary",
          "count": "0"
        },
        "top": 381.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/solana/6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx?tradeId=78b64280-6281-4744-95e0-ebb0688f4198",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "Imdonethatwasfunpeace"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
          "text": "Buy"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "38s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": {
            "classes": "absolute flex items-center justify-center",
            "style": "bottom: -2px; right: -2px;",
            "svgStyle": "width: 10px; height: 10px;"
          }
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "STONK"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$8.2K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$320.7M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 546.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "thesis",
        "classes": "py-2.5 px-3 flex items-start gap-2 min-w-0 hover:bg-bg-secondary cursor-pointer",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "penguinxbt"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(81, 106, 246); background-color: rgba(81, 106, 246, 0.2);",
          "text": "Thesis"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "43s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "ticker": {
          "classes": "truncate min-w-0 border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
          "text": "GP",
          "attrs": {
            "role": "link",
            "tabindex": "0"
          }
        },
        "tickerCell": {
          "classes": "flex items-center gap-0.5 min-w-0",
          "badge": {
            "classes": "shrink-0",
            "style": "",
            "width": "14",
            "height": "14"
          }
        },
        "amount": [
          {
            "kind": "text",
            "tag": "span",
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$39,508.18"
          },
          {
            "kind": "dot",
            "tag": "div",
            "classes": "shrink-0 rounded-full bg-accent-primary",
            "style": "height: 6px; width: 6px; animation: 1.5s ease-in-out 0s infinite normal none running dot-glow-pulse;",
            "text": ""
          },
          {
            "kind": "pct",
            "tag": "div",
            "classes": "flex items-center gap-0.5 text-xs text-text-tertiary",
            "style": "",
            "openSpanClasses": "",
            "openText": "(",
            "innerClasses": "flex gap-0.75 items-center tabular-nums",
            "innerStyle": "line-height: 16px;",
            "arrow": "▲",
            "arrowClasses": "",
            "arrowStyle": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;",
            "value": "5,601.12%",
            "valueClasses": "",
            "valueStyle": "font-size: 12px; font-weight: 400; color: rgb(33, 201, 94);",
            "closeSpanClasses": "",
            "closeText": ")"
          }
        ],
        "quoteText": "someone make yew log pair pls",
        "quote": {
          "classes": "relative mt-1 text-sm font-normal leading-normal self-start text-left whitespace-pre-line wrap-break-word min-w-0 max-w-full",
          "bar": {
            "classes": "absolute pointer-events-none border-l-2 border-b-2 border-bg-tertiary rounded-bl-lg",
            "style": "left: -20px; top: -22px; width: 16px; height: 32px;"
          },
          "bodyClasses": "line-clamp-6"
        },
        "likes": {
          "wrapperClasses": "flex items-center cursor-pointer h-4 min-w-4 w-auto gap-1",
          "innerClasses": "p-2 -m-2 active:scale-75 transition-transform duration-150",
          "spanClasses": "text-xs min-w-2 transition-all text-text-tertiary",
          "count": "0"
        },
        "top": 628.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/robinhood/0x812486eaea648819853f8e372dc9f1516c7868bd?tradeId=942b42ca-0d2a-4f66-8315-c8149b60e2e6",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "Jerrycapita"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
          "text": "Buy"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "43s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": {
            "classes": "absolute flex items-center justify-center",
            "style": "bottom: -2px; right: -2px;",
            "svgStyle": "width: 10px; height: 10px;"
          }
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "UBIK"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$5.8K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$23.6M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 751.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/solana/FiXDsziPrJvEg8CVsFsHa6rykx6Sk7rckZi39nfVtDwj?tradeId=b4276648-96b1-498e-972c-1fbcc7f0bffe",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "MetaHunter168"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
          "text": "Buy"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "43s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "DONK"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$4K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$1M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 833.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "thesis",
        "classes": "py-2.5 px-3 flex items-start gap-2 min-w-0 hover:bg-bg-secondary cursor-pointer",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "kovaskims"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(81, 106, 246); background-color: rgba(81, 106, 246, 0.2);",
          "text": "Thesis"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "43s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "ticker": {
          "classes": "truncate min-w-0 border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
          "text": "CATE",
          "attrs": {
            "role": "link",
            "tabindex": "0"
          }
        },
        "tickerCell": {
          "classes": "flex items-center gap-0.5 min-w-0",
          "badge": {
            "classes": "shrink-0",
            "style": "",
            "width": "14",
            "height": "14"
          }
        },
        "amount": [
          {
            "kind": "text",
            "tag": "span",
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$15,892.63"
          },
          {
            "kind": "dot",
            "tag": "div",
            "classes": "shrink-0 rounded-full bg-accent-primary",
            "style": "height: 6px; width: 6px; animation: 1.5s ease-in-out 0s infinite normal none running dot-glow-pulse;",
            "text": ""
          },
          {
            "kind": "pct",
            "tag": "div",
            "classes": "flex items-center gap-0.5 text-xs text-text-tertiary",
            "style": "",
            "openSpanClasses": "",
            "openText": "(",
            "innerClasses": "flex gap-0.75 items-center tabular-nums",
            "innerStyle": "line-height: 16px;",
            "arrow": "▲",
            "arrowClasses": "",
            "arrowStyle": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;",
            "value": "114.27%",
            "valueClasses": "",
            "valueStyle": "font-size: 12px; font-weight: 400; color: rgb(33, 201, 94);",
            "closeSpanClasses": "",
            "closeText": ")"
          }
        ],
        "quoteText": "i’m not going anywhere",
        "quote": {
          "classes": "relative mt-1 text-sm font-normal leading-normal self-start text-left whitespace-pre-line wrap-break-word min-w-0 max-w-full",
          "bar": {
            "classes": "absolute pointer-events-none border-l-2 border-b-2 border-bg-tertiary rounded-bl-lg",
            "style": "left: -20px; top: -22px; width: 16px; height: 32px;"
          },
          "bodyClasses": "line-clamp-6"
        },
        "likes": {
          "wrapperClasses": "flex items-center cursor-pointer h-4 min-w-4 w-auto gap-1",
          "innerClasses": "p-2 -m-2 active:scale-75 transition-transform duration-150",
          "spanClasses": "text-xs min-w-2 transition-all text-text-tertiary",
          "count": "0"
        },
        "top": 915.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/robinhood/0x020bfc650a365f8bb26819deaabf3e21291018b4?tradeId=c8f09bc5-5456-4cd2-b3cb-0a17e6a0907f",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "Chiffre"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
          "text": "Buy"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "48s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": {
            "classes": "absolute flex items-center justify-center",
            "style": "bottom: -2px; right: -2px;",
            "svgStyle": "width: 10px; height: 10px;"
          }
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "CASHCAT"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$10K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$194.1M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 1038.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/robinhood/0x15d36b6a28d8327abc7afabf0f106ae2c9af5c4d?tradeId=6a9ace39-bb2a-4f49-bdd6-22f506633f9e",
        "avatar": {
          "eyes": true,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px; background-color: rgb(115, 204, 255);",
          "imgClasses": "w-[70%] h-[70%]",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "iddqd"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(33, 201, 94); background-color: rgba(33, 201, 94, 0.2);",
          "text": "Buy"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "58s",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "PARE"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$5K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$6.9M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 1120.0,
        "wrapperClasses": "border-b border-bg-secondary"
      },
      {
        "type": "swap",
        "href": "/tokens/robinhood/0x07ebb29a38fbcb41563817e5e19f2cec619c90d2?tradeId=1148b4b9-0a3a-4ded-9f4c-c24d6ed70d95",
        "avatar": {
          "eyes": false,
          "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border border-bg-tertiary",
          "style": "width: 24px; height: 24px; min-width: 24px; min-height: 24px;",
          "imgClasses": "",
          "imgSrc": "/images/nohomo-eyes.png"
        },
        "name": {
          "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm text-text-primary",
          "innerClasses": "min-w-0 truncate",
          "text": "brkevncap"
        },
        "badge": {
          "classes": "w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1",
          "style": "color: rgb(255, 98, 46); background-color: rgba(255, 98, 46, 0.2);",
          "text": "Sell"
        },
        "time": {
          "classes": "text-xs text-text-tertiary shrink-0",
          "text": "1m",
          "title": "Sep 21, 2026, 9:48 PM"
        },
        "tokenLogo": {
          "wrapperClasses": "relative shrink-0",
          "wrapperStyle": "width: 20px; height: 20px;",
          "img": {
            "src": "/images/nohomo-eyes.png",
            "classes": "rounded-full border border-bg-tertiary",
            "style": "height: 20px; width: 20px;"
          },
          "badge": null
        },
        "line": [
          {
            "classes": "border-b border-dotted-underline pt-0.5 pb-px text-sm text-text-primary hover:opacity-80 cursor-pointer",
            "style": "",
            "text": "BUN"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$12.2K"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "at"
          },
          {
            "classes": "text-sm text-text-primary",
            "style": "",
            "text": "$35.1M"
          },
          {
            "classes": "text-sm text-text-tertiary",
            "style": "",
            "text": "MC"
          }
        ],
        "top": 1202.0,
        "wrapperClasses": "border-b border-bg-secondary"
      }
    ],
    "sort": {
      "navClasses": "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
      "innerClasses": "",
      "ulClasses": "group flex flex-1 list-none items-center justify-center gap-1",
      "liClasses": "relative",
      "buttonClasses": "group justify-center outline-none disabled:pointer-events-none disabled:opacity-50 group flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary",
      "spanText": "Filter"
    },
    "sortRowClasses": "flex items-center gap-3 px-3 pt-2 pb-1 shrink-0",
    "bodyWrapper": {
      "classes": "flex flex-col flex-1 min-h-0",
      "relativeClasses": "relative flex flex-1 flex-col min-h-0",
      "fadeClasses": "pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t to-transparent from-bg-primary"
    }
  };
  import FeedRow from "./FeedRow.svelte";
  import FeedRowSkeleton from "./FeedRowSkeleton.svelte";
  import FilterIcon from "../../icons/filter.svelte";
  import { getError, getFeedRows, isLoading, startFeed, stopFeed } from "../../lib/api/feed.svelte.js";

  const { container, sort } = feed;

  const PLACEHOLDER_TYPES = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? "swap" : "thesis"));

  const rows = $derived(getFeedRows());
  const loadError = $derived(getError());
  // Placeholders only while the first page is genuinely in flight.
  const loading = $derived(isLoading() && rows.length === 0);

  $effect(() => {
    startFeed();
    return () => stopFeed();
  });
</script>

<div class={feed.sortRowClasses}>
  <nav class={sort.navClasses}>
    <div class={sort.innerClasses}>
      <ul class={sort.ulClasses}>
        <li class={sort.liClasses}>
          <button class={sort.buttonClasses}>
            <FilterIcon />
            <span>{sort.spanText}</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</div>

<div class={feed.bodyWrapper.classes}>
  <div class={feed.bodyWrapper.relativeClasses}>
    <div class={container.outerClasses} style={container.outerStyle}>
      <div class={container.legendClasses} style={container.legendStyle}>
        {#if loadError}
          <div class="px-3 py-2 text-xs text-text-secondary">{loadError}</div>
        {/if}
        {#if loading}
          <!-- The feed mixes swaps and theses, so the placeholders do too. -->
          {#each PLACEHOLDER_TYPES as type, i (i)}
            <div class="border-b border-bg-secondary">
              <FeedRowSkeleton {type} />
            </div>
          {/each}
        {/if}
        {#each rows as row (row.id)}
          <div class={row.wrapperClasses}>
            <FeedRow {row} />
          </div>
        {/each}
      </div>
    </div>
    <div class={feed.bodyWrapper.fadeClasses}></div>
  </div>
</div>
