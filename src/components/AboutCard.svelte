<script>
  // Right rail info card: title, timeframe chips, buy/sell pressure bars, links,
  // collapsed details. Every box and every class is the capture's; this file only puts
  // live numbers in them.
  //
  // The values come off `getToken()`, which the token sockets keep current. One box
  // keeps its captured text, because the API carries no field for it and guessing would
  // be worse than a placeholder: the buyers/sellers bar (a timeframe reports `traders`,
  // the distinct wallet count, with no buy/sell split).
  // inlined from about.json — no data file, the strings live with the code
  const about =   {
    "title": "Stamp",
    "description": "No description found",
    "stats": [
      {
        "label": "5M",
        "value": "▲ 20.80%",
        "classes": "flex-1 flex flex-col items-center rounded-md py-1.5 transition-colors border border-bg-tertiary-solid hover:bg-bg-tertiary",
        "arrow": null,
        "color": null,
        "valueChildren": [
          {
            "tag": "div",
            "classes": "",
            "style": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;",
            "text": "▲"
          },
          {
            "tag": "div",
            "classes": "",
            "style": "font-size: 12px; font-weight: 500; color: rgb(33, 201, 94);",
            "text": "20.80%"
          }
        ],
        "valueLine": "flex gap-0.75 items-center tabular-nums",
        "valueLineStyle": "line-height: 16px;"
      },
      {
        "label": "1H",
        "value": "▼ 54.58%",
        "classes": "flex-1 flex flex-col items-center rounded-md py-1.5 transition-colors border bg-bg-tertiary border-transparent",
        "arrow": null,
        "color": null,
        "valueChildren": [
          {
            "tag": "div",
            "classes": "",
            "style": "color: rgb(255, 98, 46); font-weight: 400; font-size: 6px;",
            "text": "▼"
          },
          {
            "tag": "div",
            "classes": "",
            "style": "font-size: 12px; font-weight: 500; color: rgb(255, 98, 46);",
            "text": "54.58%"
          }
        ],
        "valueLine": "flex gap-0.75 items-center tabular-nums",
        "valueLineStyle": "line-height: 16px;"
      },
      {
        "label": "4H",
        "value": "▼ 64.27%",
        "classes": "flex-1 flex flex-col items-center rounded-md py-1.5 transition-colors border border-bg-tertiary-solid hover:bg-bg-tertiary",
        "arrow": null,
        "color": null,
        "valueChildren": [
          {
            "tag": "div",
            "classes": "",
            "style": "color: rgb(255, 98, 46); font-weight: 400; font-size: 6px;",
            "text": "▼"
          },
          {
            "tag": "div",
            "classes": "",
            "style": "font-size: 12px; font-weight: 500; color: rgb(255, 98, 46);",
            "text": "64.27%"
          }
        ],
        "valueLine": "flex gap-0.75 items-center tabular-nums",
        "valueLineStyle": "line-height: 16px;"
      },
      {
        "label": "1D",
        "value": "▲ 28,370.70%",
        "classes": "flex-1 flex flex-col items-center rounded-md py-1.5 transition-colors border border-bg-tertiary-solid hover:bg-bg-tertiary",
        "arrow": null,
        "color": null,
        "valueChildren": [
          {
            "tag": "div",
            "classes": "",
            "style": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;",
            "text": "▲"
          },
          {
            "tag": "div",
            "classes": "",
            "style": "font-size: 12px; font-weight: 500; color: rgb(33, 201, 94);",
            "text": "28,370.70%"
          }
        ],
        "valueLine": "flex gap-0.75 items-center tabular-nums",
        "valueLineStyle": "line-height: 16px;"
      }
    ],
    "bars": [
      {
        "label": "3,820 buys 2,642 sells",
        "bar": [
          {
            "classes": "bg-green rounded-[1.5px] transition-[width] duration-150 ease-out",
            "style": "width: 59.1148%;"
          },
          {
            "classes": "flex-1 bg-red rounded-[1.5px]",
            "style": ""
          }
        ],
        "parts": [
          {
            "text": "3,820 buys",
            "classes": "text-sm",
            "style": ""
          },
          {
            "text": "2,642 sells",
            "classes": "text-sm",
            "style": ""
          }
        ],
        "labels": [
          {
            "value": "3,820",
            "unit": "buys"
          },
          {
            "value": "2,642",
            "unit": "sells"
          }
        ]
      },
      {
        "label": "$468.4K vol. $667.6K vol.",
        "bar": [
          {
            "classes": "bg-green rounded-[1.5px] transition-[width] duration-150 ease-out",
            "style": "width: 41.2347%;"
          },
          {
            "classes": "flex-1 bg-red rounded-[1.5px]",
            "style": ""
          }
        ],
        "parts": [
          {
            "text": "$468.4K vol.",
            "classes": "text-sm",
            "style": ""
          },
          {
            "text": "$667.6K vol.",
            "classes": "text-sm",
            "style": ""
          }
        ],
        "labels": [
          {
            "value": "$468.4K",
            "unit": "vol."
          },
          {
            "value": "$667.6K",
            "unit": "vol."
          }
        ]
      },
      {
        "label": "1,436 buyers 1,303 sellers",
        "bar": [
          {
            "classes": "bg-green rounded-[1.5px] transition-[width] duration-150 ease-out",
            "style": "width: 52.4279%;"
          },
          {
            "classes": "flex-1 bg-red rounded-[1.5px]",
            "style": ""
          }
        ],
        "parts": [
          {
            "text": "1,436 buyers",
            "classes": "text-sm",
            "style": ""
          },
          {
            "text": "1,303 sellers",
            "classes": "text-sm",
            "style": ""
          }
        ],
        "labels": [
          {
            "value": "1,436",
            "unit": "buyers"
          },
          {
            "value": "1,303",
            "unit": "sellers"
          }
        ]
      }
    ],
    "links": [
      {
        "href": "https://www.zcashstamp.com/",
        "text": "Website",
        "classes": "flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary border border-bg-tertiary text-xs hover:opacity-80 transition-opacity",
        "svg": "w-4 h-4"
      },
      {
        "href": "https://x.com/Zip227",
        "text": "Twitter",
        "classes": "flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary border border-bg-tertiary text-xs hover:opacity-80 transition-opacity",
        "svg": "w-4 h-4"
      },
      {
        "href": "https://x.com/search?q=EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc%20OR%20%24Stamp",
        "text": "Search on",
        "classes": "flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary border border-bg-tertiary text-xs hover:opacity-80 transition-opacity",
        "svg": "w-3 h-3"
      }
    ],
    "details": [
      {
        "classes": "flex items-center gap-2 py-1",
        "parts": [
          {
            "tag": "span",
            "classes": "text-xs text-text-secondary whitespace-nowrap shrink-0",
            "text": "Launchpad",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px",
            "text": "",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex items-center gap-1 shrink-0 ",
            "text": "Pump.fun",
            "badge": "rounded-full bg-bg-primary flex items-center justify-center overflow-hidden shrink-0",
            "badgeImg": "/images/nohomo-eyes.png",
            "svg": null,
            "svgClass": null,
            "spanClasses": "text-xs text-text-primary font-medium whitespace-nowrap",
            "spanText": "Pump.fun",
            "badgeStyle": "width: 18px; height: 18px;",
            "badgeImgWidth": "14",
            "badgeImgHeight": "14",
            "badgeImgClass": "rounded-full"
          }
        ]
      },
      {
        "classes": "flex items-center gap-2 py-1",
        "parts": [
          {
            "tag": "span",
            "classes": "text-xs text-text-secondary whitespace-nowrap shrink-0",
            "text": "Supply",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px",
            "text": "",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex items-center gap-1 shrink-0 ",
            "text": "990.5M",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": "text-xs text-text-primary font-medium whitespace-nowrap",
            "spanText": "990.5M"
          }
        ]
      },
      {
        "classes": "flex items-center gap-2 py-1",
        "parts": [
          {
            "tag": "span",
            "classes": "text-xs text-text-secondary whitespace-nowrap shrink-0",
            "text": "Network",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px",
            "text": "",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex items-center gap-1 shrink-0 ",
            "text": "Solana",
            "badge": null,
            "badgeImg": null,
            "svgClass": "text-text-secondary",
            "spanClasses": "text-xs text-text-primary font-medium whitespace-nowrap",
            "spanText": "Solana",
            "icon": "solana"
          }
        ]
      },
      {
        "classes": "flex items-center gap-2 py-1",
        "parts": [
          {
            "tag": "span",
            "classes": "text-xs text-text-secondary whitespace-nowrap shrink-0",
            "text": "Created",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px",
            "text": "",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex items-center gap-1 shrink-0 ",
            "text": "20 hrs ago",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": "text-xs text-text-primary font-medium whitespace-nowrap",
            "spanText": "20 hrs ago"
          }
        ]
      },
      {
        "classes": "flex items-center gap-2 py-1",
        "parts": [
          {
            "tag": "span",
            "classes": "text-xs text-text-secondary whitespace-nowrap shrink-0",
            "text": "Contract address",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px",
            "text": "",
            "badge": null,
            "badgeImg": null,
            "svg": null,
            "svgClass": null,
            "spanClasses": null,
            "spanText": ""
          },
          {
            "tag": "div",
            "classes": "flex items-center gap-1 shrink-0 cursor-pointer hover:opacity-70 transition-opacity",
            "text": "EKtmPP...Siinsc",
            "badge": null,
            "badgeImg": null,
            "svgClass": "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-100 scale-100 rotate-0",
            "spanClasses": "text-xs text-text-primary font-medium whitespace-nowrap",
            "spanText": "EKtmPP...Siinsc",
            "icon": "address"
          }
        ]
      }
    ],
    "viewMore": {
      "classes": "absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 z-10 flex items-center gap-1 px-2 py-1 bg-bg-tertiary-solid rounded-md text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
    }
  };
  // inlined from badges.json — no data file, the strings live with the code
  const badges =   {
    "wrapperClasses": "w-4 h-4 shrink-0 relative flex items-center justify-center",
    "wrapperClasses2": "w-4 h-4 shrink-0 relative flex items-center justify-center",
    "headerButton": "flex items-center gap-1 hover:opacity-70 transition-opacity"
  };
  import { formatCompact, getChain, getToken } from "../lib/api/token.svelte.js";
  import { platformName } from "../lib/platforms.js";
  import { safeUrl, searchOnXHref } from "../lib/utils/urls.js";
  import Globe from "../icons/globe.svelte";
  import XLogo from "../icons/x-logo.svelte";
  import LinkSearch from "../icons/link-search.svelte";
  import NetworkSolana from "../icons/network-solana.svelte";
  import Copy from "../icons/copy.svelte";
  import Skeleton from "./Skeleton.svelte";
  import CheckCircle from "../icons/check-circle.svelte";

  const token = $derived(getToken());
  const chain = $derived(getChain());
  const quote = $derived(token?.quote ?? null);
  const timeframes = $derived(token?.stats?.timeframes ?? null);

  /**
   * The card's description line is the token's AI narrative — `socials.aiNarrative`,
   * the string behind Ombra's "AI summary" button. `about.description` is the capture's
   * own placeholder for a token that has none, so it doubles as the fallback.
   */
  const description = $derived(token?.socials?.aiNarrative?.trim() || about.description);

  // Placeholders while the token is on its way. The card's boxes are all the capture's,
  // so they render immediately and only their values wait.
  const loading = $derived(!token);

  /**
   * The API's rolling windows are `5m`, `1h`, `6h` and `24h`. The capture's chips read
   * `5M 1H 4H 1D`, but there is no 4h or 1d window to read from, so the chips carry the
   * windows the API actually has.
   */
  const WINDOWS = ["5m", "1h", "6h", "24h"];

  /** The capture has the 1H chip selected. */
  let window_ = $state("1h");
  let expanded = $state(false);
  /** The timeframe chips and the buy/sell bars hide on their own, without touching the details. */
  let hideStats = $state(false);

  const UP = "rgb(33, 201, 94)";
  const DOWN = "rgb(255, 98, 46)";

  const CHIP = "flex-1 flex flex-col items-center rounded-md py-1.5 transition-colors border";
  const CHIP_IDLE = `${CHIP} border-bg-tertiary-solid hover:bg-bg-tertiary`;
  /**
   * The captured pill class string, minus its positioning. `left-1/2` is not in this stylesheet
   * at all, and two absolutely-positioned pills can only be laid out by guessing a gap — so the
   * row below owns the position and these keep only the look.
   */
  const PILL_LOOK = about.viewMore.classes
    .split(" ")
    .filter((name) => !["absolute", "left-1/2", "-translate-x-1/2", "bottom-0", "translate-y-1/2", "z-10"].includes(name))
    .join(" ");

  const CHIP_ACTIVE = `${CHIP} bg-bg-tertiary border-transparent`;
  const CHIP_LINE = "flex gap-0.75 items-center tabular-nums";
  const ARROW = "font-weight: 400; font-size: 6px;";
  const VALUE = "font-size: 12px; font-weight: 500;";
  const ROW_LINE = "flex gap-1 h-1.5";
  const BAR_ON = "bg-green rounded-[1.5px] transition-[width] duration-150 ease-out";
  const BAR_OFF = "flex-1 bg-red rounded-[1.5px]";
  const LINK = "flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-secondary border border-bg-tertiary text-xs hover:opacity-80 transition-opacity";
  const DETAIL_ROW = "flex items-center gap-2 py-1";
  const DETAIL_LABEL = "text-xs text-text-secondary whitespace-nowrap shrink-0";
  const DETAIL_LINE = "flex-1 border-b border-dashed border-bg-tertiary min-w-4 -translate-y-px";
  const DETAIL_VALUE = "flex items-center gap-1 shrink-0 ";
  const DETAIL_TEXT = "text-xs text-text-primary font-medium whitespace-nowrap";
  const BADGE = "rounded-full bg-bg-primary flex items-center justify-center overflow-hidden shrink-0";

  // The capture ships both glyphs stacked and swaps them with opacity/scale/rotate, so
  // copying only toggles which one is visible.
  const COPY_SHOWN = "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-100 scale-100 rotate-0";
  const COPY_HIDDEN = "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-0 scale-0 rotate-90";
  const CHECK_SHOWN = "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-100 scale-100 rotate-0";
  const CHECK_HIDDEN = "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-0 scale-0 -rotate-90";

  const stats = $derived(timeframes?.[window_] ?? null);

  const grouped = (value) => Number(value ?? 0).toLocaleString("en-US");

  /** `20.8` -> `20.80%`, `28370.7` -> `28,370.70%` — the capture's own precision. */
  function percentText(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return "";
    return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
  }

  function chip(tf) {
    const pct = timeframes?.[tf]?.priceChangePct;
    const known = typeof pct === "number" && Number.isFinite(pct);
    return {
      label: tf.toUpperCase(),
      arrow: known ? (pct >= 0 ? "▲" : "▼") : "",
      text: percentText(pct),
      color: known && pct < 0 ? DOWN : UP
    };
  }

  /** A bar row: the pair of numbers above it and the green share of the bar. */
  function row(leftValue, leftUnit, rightValue, rightUnit, pct) {
    const share = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0;
    return {
      labels: [
        { value: leftValue, unit: leftUnit },
        { value: rightValue, unit: rightUnit }
      ],
      bar: [
        { classes: BAR_ON, style: `width: ${share.toFixed(4)}%;` },
        { classes: BAR_OFF, style: "" }
      ]
    };
  }

  const rows = $derived.by(() => {
    const s = stats;
    const buys = Number(s?.buys ?? 0);
    const sells = Number(s?.sells ?? 0);
    const trades = buys + sells;
    return [
      row(
        s ? grouped(buys) : "",
        "buys",
        s ? grouped(sells) : "",
        "sells",
        trades > 0 ? (buys / trades) * 100 : 0
      ),
      row(
        s ? `$${formatCompact(s.buyVolumeStr)}` : "",
        "vol.",
        s ? `$${formatCompact(s.sellVolumeStr)}` : "",
        "vol.",
        s?.buyVolumePct ?? 0
      ),
      // No buy/sell split on the API, so this row stays exactly as captured.
      about.bars[2]
    ];
  });

  // --- links ---------------------------------------------------------------------
  //
  // `safeUrl` and the X-search query live in src/lib/utils/urls.js: the token header's
  // icon row draws the same links, and one build of them cannot drift from the other.

  const socials = $derived(token?.socials?.links ?? null);
  const website = $derived(safeUrl(socials?.website));
  const twitter = $derived(safeUrl(socials?.twitter?.url));
  const searchOnX = $derived(searchOnXHref(token));

  // --- details -------------------------------------------------------------------

  const launchpadName = $derived(platformName(token?.platformType));
  const launchpadLogo = $derived(token?.platformAddress ? `/images/nohomo-eyes.png` : "");
  const supply = $derived(quote?.totalSupplyStr ? formatCompact(quote.totalSupplyStr) : "");
  const networkName = $derived(chain === "SOL" ? "Solana" : chain);

  /**
   * `20 hrs ago`. The capture only ever shows the hours form; the smaller and larger
   * units follow the same shape because an age that reads "20 hrs ago" cannot fall back
   * to the header's short `20h` without looking like a different field.
   */
  function createdAgo(seconds) {
    if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds < 0) return "";
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const created = $derived(createdAgo(token?.createdAtAgeSeconds));

  /** The capture elides the mint to six characters on both ends. */
  const contract = $derived.by(() => {
    const address = token?.tokenAddress ?? "";
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  });

  let copied = $state(false);
  let copyTimer = null;

  async function copyContract() {
    const address = token?.tokenAddress;
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // The Clipboard API needs a secure context; fall back to a temporary selection.
      const el = document.createElement("textarea");
      el.value = address;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      document.body.removeChild(el);
    }
    copied = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      copied = false;
      copyTimer = null;
    }, 1500);
  }

  // A platform with no bundled mark would otherwise paint a broken-image glyph.
  const hideMissingLogo = (event) => {
    event.currentTarget.parentElement.style.display = "none";
  };
</script>

<div class="relative border border-bg-tertiary rounded-xl p-2 pb-4 mb-6">
  <div class="flex flex-col gap-3">
    <div class="px-1 flex flex-col gap-1">
      <div class="text-text-primary truncate">
        {"About "}{#if loading}<Skeleton class="h-4 w-24" />{:else}<span>{token.tokenSymbol ?? ""}</span>{/if}
      </div>
      <div class="max-w-[900px] flex items-baseline gap-0">
        <span class="text-xs leading-tight min-w-0 text-text-secondary">
          {#if loading}<Skeleton class="h-3 w-40" />{:else}{description}{/if}
        </span>
      </div>
    </div>

    <!-- the same collapse the details use: the row goes to 0fr over 200ms instead of vanishing -->
    <div
      class="grid transition-[grid-template-rows] duration-200 ease-out"
      style="grid-template-rows: {hideStats ? '0fr' : '1fr'};"
    >
      <!-- the card's own column gap no longer reaches in here, so the wrapper carries it -->
      <div class="overflow-hidden flex flex-col gap-3">
    <div class="flex gap-1.5">
      {#each WINDOWS as tf (tf)}
        {@const c = chip(tf)}
        <button type="button" class={window_ === tf ? CHIP_ACTIVE : CHIP_IDLE} onclick={() => (window_ = tf)}>
          <span class="text-xs text-text-secondary">{c.label}</span>
          <div class={CHIP_LINE} style="line-height: 16px;">
            {#if loading}
              <Skeleton class="h-3 w-12" />
            {:else}
              <div style="color: {c.color}; {ARROW}">{c.arrow}</div>
              <div style="color: {c.color}; {VALUE}">{c.text}</div>
            {/if}
          </div>
        </button>
      {/each}
    </div>

    <div class="flex flex-col gap-3 px-2">
      {#each rows as r, index (index)}
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            {#each r.labels as label, labelIndex (labelIndex)}
              <span class="text-sm">
                {#if label.value}<span class="text-text-primary font-medium">{label.value}</span>{:else}<Skeleton class="h-4 w-12" />{/if}
                <span class="text-text-secondary">{label.unit}</span>
              </span>
            {/each}
          </div>
          <div class={ROW_LINE}>
            {#each r.bar as segment (segment.classes)}
              <div class={segment.classes} style={segment.style}></div>
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="flex gap-2 flex-wrap px-2">
      {#if loading}
        {#each [0, 1, 2] as key (key)}
          <div class={LINK}><Skeleton class="h-3 w-12" /></div>
        {/each}
      {/if}
      {#if website}
        <a class={LINK} href={website} target="_blank" rel="noopener">
          <Globe class="w-4 h-4" />
          Website
        </a>
      {/if}
      {#if twitter}
        <a class={LINK} href={twitter} target="_blank" rel="noopener">
          <XLogo class="w-4 h-4" />
          Twitter
        </a>
      {/if}
      {#if searchOnX}
        <a class={LINK} href={searchOnX} target="_blank" rel="noopener">
          <LinkSearch />
          Search on
        </a>
      {/if}
    </div>
      </div>
    </div>
    <div class="grid transition-[grid-template-rows] duration-200 ease-out px-2" style="grid-template-rows: {expanded ? '1fr' : '0fr'};">
      <div class="overflow-hidden">
        <div class="flex flex-col gap-1 pt-1">
          <div class={DETAIL_ROW}>
            <span class={DETAIL_LABEL}>Launchpad</span>
            <div class={DETAIL_LINE}></div>
            <div class={DETAIL_VALUE}>
              {#if loading}
                <Skeleton class="h-3 w-20" />
              {:else}
                {#if launchpadLogo}
                  <div class={BADGE} style="width: 18px; height: 18px;">
                    <img alt="" src={launchpadLogo} width="14" height="14" class="rounded-full" onerror={hideMissingLogo} />
                  </div>
                {/if}
                <span class={DETAIL_TEXT}>{launchpadName}</span>
              {/if}
            </div>
          </div>

          <div class={DETAIL_ROW}>
            <span class={DETAIL_LABEL}>Supply</span>
            <div class={DETAIL_LINE}></div>
            <div class={DETAIL_VALUE}>
              {#if loading}<Skeleton class="h-3 w-14" />{:else}<span class={DETAIL_TEXT}>{supply}</span>{/if}
            </div>
          </div>

          <div class={DETAIL_ROW}>
            <span class={DETAIL_LABEL}>Network</span>
            <div class={DETAIL_LINE}></div>
            <div class={DETAIL_VALUE}>
              {#if loading}
                <Skeleton class="h-3 w-16" />
              {:else}
                {#if chain === "SOL"}
                  <NetworkSolana class="text-text-secondary" width="14" height="14" />
                {/if}
                <span class={DETAIL_TEXT}>{networkName}</span>
              {/if}
            </div>
          </div>

          <div class={DETAIL_ROW}>
            <span class={DETAIL_LABEL}>Created</span>
            <div class={DETAIL_LINE}></div>
            <div class={DETAIL_VALUE}>
              {#if loading}<Skeleton class="h-3 w-20" />{:else}<span class={DETAIL_TEXT}>{created}</span>{/if}
            </div>
          </div>

          <div class={DETAIL_ROW}>
            <span class={DETAIL_LABEL}>Contract address</span>
            <div class={DETAIL_LINE}></div>
            {#if loading}
              <div class={DETAIL_VALUE}><Skeleton class="h-3 w-24" /></div>
            {:else}
              <div class="flex items-center gap-1 shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
                <div class={badges.wrapperClasses2}>
                  <Copy aria-hidden="true" class={copied ? COPY_HIDDEN : COPY_SHOWN} />
                  <CheckCircle class={copied ? CHECK_SHOWN : CHECK_HIDDEN} />
                </div>
                <span class={DETAIL_TEXT}>{contract}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    class="flex items-center gap-1"
    style="position: absolute; left: 50%; bottom: 0; transform: translate(-50%, 50%); z-index: 10;"
  >
    <button type="button" class={PILL_LOOK} onclick={() => (expanded = !expanded)}>
      {expanded ? "Hide pool" : "View pool"}
    </button>
    <button type="button" class={PILL_LOOK} onclick={() => (hideStats = !hideStats)}>
      {hideStats ? "View stats" : "Hide stats"}
    </button>
  </div>
</div>
