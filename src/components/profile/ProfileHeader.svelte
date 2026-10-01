<script>
  // The header of a profile page: banner, avatar, identity, the stat row, the actions,
  // the chips and the #1–#5 top-trades strip.
  //
  // The chrome is the capture's, and comes from profileHeader.json: `RareTotalFowl` is the
  // profile of the account you are signed in as, `The__Solstice` is somebody else's. The
  // values are live, from src/lib/api/profile.svelte.js — the name, @handle, photo and
  // wallet off the wallet's own label, the chips off its positions and trade count, and
  // the strip off its five best trades.
  //
  // Three captured pieces are deliberately not drawn, because no endpoint carries them:
  // the bio (one person's own text), the clan badge (the API has no clan concept) and the
  // "Joined <month>" chip (there is no signup date). The stat row is live on your own
  // profile and the capture's on somebody else's; see `statValues` below.
  // inlined from profileHeader.json — no data file, the strings live with the code
  const headers =   {
    "other": {
      "banner": {
        "classes": "w-full h-30 rounded-xl bg-bg-secondary shrink-0 relative",
        "style": "",
        "action": null
      },
      "avatar": {
        "kind": "image",
        "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border-4 border-bg-primary bg-bg-secondary",
        "style": "width: 80px; height: 80px; min-width: 80px; min-height: 80px;",
        "imgClasses": "",
        "imgSrc": "/images/nohomo-eyes.png"
      },
      "name": {
        "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-lg leading-5 max-[1000px]:text-base",
        "innerClasses": "min-w-0 truncate",
        "text": "TheS◎Lstice"
      },
      "clan": {
        "href": "/clans/5d9783d2-28c3-4207-ab83-9a5de2474dba",
        "classes": "flex items-center justify-center hover:opacity-80",
        "label": "Control The Narrative clan",
        "src": "/images/nohomo-eyes.png",
        "imgClasses": "shrink-0 object-cover rounded-sm",
        "imgStyle": "width: 22px; height: 22px;"
      },
      "handle": {
        "classes": "leading-5 text-text-secondary max-[1000px]:text-sm",
        "text": "@The__Solstice",
        "wrapper": "flex gap-2"
      },
      "statsWrapper": {
        "classes": "flex"
      },
      "stats": [
        {
          "classes": "flex flex-col items-center py-2 px-4 max-[1000px]:px-1.5 max-[1000px]:py-1 rounded-lg focus-visible:opacity-80 hover:opacity-80 cursor-pointer",
          "valueClasses": "leading-5 max-[1000px]:text-xs max-[1000px]:leading-4",
          "value": "0",
          "labelClasses": "text-text-secondary text-xs max-[1000px]:text-[10px]",
          "label": "Mutuals"
        },
        {
          "divider": "w-px h-full bg-bg-secondary"
        },
        {
          "classes": "flex flex-col items-center py-2 px-4 max-[1000px]:px-1.5 max-[1000px]:py-1 rounded-lg focus-visible:opacity-80 hover:opacity-80 cursor-pointer",
          "valueClasses": "leading-5 max-[1000px]:text-xs max-[1000px]:leading-4",
          "value": "84",
          "labelClasses": "text-text-secondary text-xs max-[1000px]:text-[10px]",
          "label": "Following"
        },
        {
          "divider": "w-px h-full bg-bg-secondary"
        },
        {
          "classes": "flex flex-col items-center py-2 px-4 max-[1000px]:px-1.5 max-[1000px]:py-1 rounded-lg focus-visible:opacity-80 hover:opacity-80 cursor-pointer",
          "valueClasses": "leading-5 max-[1000px]:text-xs max-[1000px]:leading-4",
          "value": "273.7K",
          "labelClasses": "text-text-secondary text-xs max-[1000px]:text-[10px]",
          "label": "Followers"
        }
      ],
      "actionsWrapper": "flex gap-2 items-center ml-auto",
      "actions": [
        {
          "classes": "flex shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-accent-primary gap-2 rounded-lg border border-bg-tertiary bg-bg-secondary px-4 py-1.5 font-bold text-text-primary hover:opacity-80 max-[1000px]:px-2 max-[1000px]:py-1 max-[1000px]:text-xs",
          "text": "Share",
          "icon": "share",
          "spanClasses": null,
          "label": ""
        },
        {
          "classes": "border rounded-lg px-4 py-1.5 max-[1000px]:px-2 max-[1000px]:py-1 max-[1000px]:text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center min-w-29 max-[1000px]:min-w-16 overflow-hidden bg-accent-primary border-bg-tertiary text-white hover:opacity-80",
          "text": "Follow",
          "icon": null,
          "spanClasses": "inline-block animate-flip-up ",
          "label": ""
        }
      ],
      "bio": {
        "classes": "text-text-primary pr-4 pt-3 font-normal",
        "text": "holder in a trader’s world"
      },
      "chipsWrapper": "flex gap-4 items-center pr-4 pt-2",
      "chips": [
        {
          "classes": "flex gap-1 items-center",
          "icon": "avg-hold",
          "spanClasses": "text-xs font-normal text-text-secondary",
          "text": "4d 12h avg. hold"
        },
        {
          "classes": "flex gap-1 items-center",
          "icon": "trades",
          "spanClasses": "text-xs font-normal text-text-secondary",
          "text": "2.8K trades"
        },
        {
          "classes": "flex gap-1 items-center",
          "icon": "joined",
          "spanClasses": "text-xs font-normal text-text-secondary",
          "text": "Joined Mar 2026"
        }
      ],
      "strip": {
        "outer": "relative mt-4",
        "classes": "no-scrollbar overflow-x-auto overflow-y-hidden flex gap-2",
        "cards": [
          {
            "classes": "p-2 flex flex-col items-start gap-1.5 rounded-xl bg-bg-secondary cursor-pointer hover:opacity-80 focus-visible:opacity-80",
            "badgeClasses": "rounded-sm py-0.5 px-1 text-[10px] font-bold bg-yellow-transparent text-yellow",
            "badgeText": "#1 Trade",
            "rowClasses": "flex gap-2",
            "tokenWrapperClasses": "relative shrink-0",
            "tokenWrapperStyle": "width: 20px; height: 20px;",
            "img": "/images/nohomo-eyes.png",
            "imgClasses": "rounded-full border border-bg-tertiary",
            "imgStyle": "height: 20px; width: 20px;",
            "badgePosClasses": "absolute flex items-center justify-center",
            "badgePosStyle": "bottom: -2px; right: -2px;",
            "badgeSvgStyle": "width: 10px; height: 10px;",
            "valueClasses": "flex gap-0.5 items-center tabular-nums",
            "valueStyle": "line-height: 20px;",
            "value": [
              {
                "text": "-",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(255, 98, 46);"
              },
              {
                "text": "$141,132.26",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(255, 98, 46);"
              }
            ],
            "pctClasses": "flex items-center",
            "pct": [
              {
                "tag": "span",
                "text": "(",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              },
              {
                "tag": "div",
                "text": "▼88.40%",
                "classes": "flex gap-0.75 items-center tabular-nums",
                "style": "line-height: 16px;",
                "kids": [
                  {
                    "text": "▼",
                    "classes": "",
                    "style": "color: rgb(255, 98, 46); font-weight: 400; font-size: 6px;"
                  },
                  {
                    "text": "88.40%",
                    "classes": "",
                    "style": "font-size: 12px; font-weight: 400; color: rgb(152, 153, 163);"
                  }
                ]
              },
              {
                "tag": "span",
                "text": ")",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              }
            ]
          },
          {
            "classes": "p-2 flex flex-col items-start gap-1.5 rounded-xl bg-bg-secondary cursor-pointer hover:opacity-80 focus-visible:opacity-80",
            "badgeClasses": "rounded-sm py-0.5 px-1 text-[10px] font-bold bg-bg-tertiary text-text-secondary",
            "badgeText": "#2 Trade",
            "rowClasses": "flex gap-2",
            "tokenWrapperClasses": "relative shrink-0",
            "tokenWrapperStyle": "width: 20px; height: 20px;",
            "img": "/images/nohomo-eyes.png",
            "imgClasses": "rounded-full border border-bg-tertiary",
            "imgStyle": "height: 20px; width: 20px;",
            "badgePosClasses": "absolute flex items-center justify-center",
            "badgePosStyle": "bottom: -2px; right: -2px;",
            "badgeSvgStyle": "width: 10px; height: 10px;",
            "valueClasses": "flex gap-0.5 items-center tabular-nums",
            "valueStyle": "line-height: 20px;",
            "value": [
              {
                "text": "+",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(33, 201, 94);"
              },
              {
                "text": "$328,485.03",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(33, 201, 94);"
              }
            ],
            "pctClasses": "flex items-center",
            "pct": [
              {
                "tag": "span",
                "text": "(",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              },
              {
                "tag": "div",
                "text": "▲141.65%",
                "classes": "flex gap-0.75 items-center tabular-nums",
                "style": "line-height: 16px;",
                "kids": [
                  {
                    "text": "▲",
                    "classes": "",
                    "style": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;"
                  },
                  {
                    "text": "141.65%",
                    "classes": "",
                    "style": "font-size: 12px; font-weight: 400; color: rgb(152, 153, 163);"
                  }
                ]
              },
              {
                "tag": "span",
                "text": ")",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              }
            ]
          },
          {
            "classes": "p-2 flex flex-col items-start gap-1.5 rounded-xl bg-bg-secondary cursor-pointer hover:opacity-80 focus-visible:opacity-80",
            "badgeClasses": "rounded-sm py-0.5 px-1 text-[10px] font-bold bg-bg-tertiary text-text-secondary",
            "badgeText": "#3 Trade",
            "rowClasses": "flex gap-2",
            "tokenWrapperClasses": "relative shrink-0",
            "tokenWrapperStyle": "width: 20px; height: 20px;",
            "img": "/images/nohomo-eyes.png",
            "imgClasses": "rounded-full border border-bg-tertiary",
            "imgStyle": "height: 20px; width: 20px;",
            "badgePosClasses": "absolute flex items-center justify-center",
            "badgePosStyle": "bottom: -2px; right: -2px;",
            "badgeSvgStyle": "width: 10px; height: 10px;",
            "valueClasses": "flex gap-0.5 items-center tabular-nums",
            "valueStyle": "line-height: 20px;",
            "value": [
              {
                "text": "+",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(33, 201, 94);"
              },
              {
                "text": "$266,658.11",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(33, 201, 94);"
              }
            ],
            "pctClasses": "flex items-center",
            "pct": [
              {
                "tag": "span",
                "text": "(",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              },
              {
                "tag": "div",
                "text": "▲377.94%",
                "classes": "flex gap-0.75 items-center tabular-nums",
                "style": "line-height: 16px;",
                "kids": [
                  {
                    "text": "▲",
                    "classes": "",
                    "style": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;"
                  },
                  {
                    "text": "377.94%",
                    "classes": "",
                    "style": "font-size: 12px; font-weight: 400; color: rgb(152, 153, 163);"
                  }
                ]
              },
              {
                "tag": "span",
                "text": ")",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              }
            ]
          },
          {
            "classes": "p-2 flex flex-col items-start gap-1.5 rounded-xl bg-bg-secondary cursor-pointer hover:opacity-80 focus-visible:opacity-80",
            "badgeClasses": "rounded-sm py-0.5 px-1 text-[10px] font-bold bg-bg-tertiary text-text-secondary",
            "badgeText": "#4 Trade",
            "rowClasses": "flex gap-2",
            "tokenWrapperClasses": "relative shrink-0",
            "tokenWrapperStyle": "width: 20px; height: 20px;",
            "img": "/images/nohomo-eyes.png",
            "imgClasses": "rounded-full border border-bg-tertiary",
            "imgStyle": "height: 20px; width: 20px;",
            "badgePosClasses": "absolute flex items-center justify-center",
            "badgePosStyle": "bottom: -2px; right: -2px;",
            "badgeSvgStyle": "width: 10px; height: 10px;",
            "valueClasses": "flex gap-0.5 items-center tabular-nums",
            "valueStyle": "line-height: 20px;",
            "value": [
              {
                "text": "-",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(255, 98, 46);"
              },
              {
                "text": "$50,887.77",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(255, 98, 46);"
              }
            ],
            "pctClasses": "flex items-center",
            "pct": [
              {
                "tag": "span",
                "text": "(",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              },
              {
                "tag": "div",
                "text": "▼100.00%",
                "classes": "flex gap-0.75 items-center tabular-nums",
                "style": "line-height: 16px;",
                "kids": [
                  {
                    "text": "▼",
                    "classes": "",
                    "style": "color: rgb(255, 98, 46); font-weight: 400; font-size: 6px;"
                  },
                  {
                    "text": "100.00%",
                    "classes": "",
                    "style": "font-size: 12px; font-weight: 400; color: rgb(152, 153, 163);"
                  }
                ]
              },
              {
                "tag": "span",
                "text": ")",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              }
            ]
          },
          {
            "classes": "p-2 flex flex-col items-start gap-1.5 rounded-xl bg-bg-secondary cursor-pointer hover:opacity-80 focus-visible:opacity-80",
            "badgeClasses": "rounded-sm py-0.5 px-1 text-[10px] font-bold bg-bg-tertiary text-text-secondary",
            "badgeText": "#5 Trade",
            "rowClasses": "flex gap-2",
            "tokenWrapperClasses": "relative shrink-0",
            "tokenWrapperStyle": "width: 20px; height: 20px;",
            "img": "/images/nohomo-eyes.png",
            "imgClasses": "rounded-full border border-bg-tertiary",
            "imgStyle": "height: 20px; width: 20px;",
            "badgePosClasses": "absolute flex items-center justify-center",
            "badgePosStyle": "bottom: -2px; right: -2px;",
            "badgeSvgStyle": "width: 10px; height: 10px;",
            "valueClasses": "flex gap-0.5 items-center tabular-nums",
            "valueStyle": "line-height: 20px;",
            "value": [
              {
                "text": "+",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(33, 201, 94);"
              },
              {
                "text": "$7,624.03",
                "classes": "",
                "style": "font-size: 14px; font-weight: 500; color: rgb(33, 201, 94);"
              }
            ],
            "pctClasses": "flex items-center",
            "pct": [
              {
                "tag": "span",
                "text": "(",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              },
              {
                "tag": "div",
                "text": "▲3.80%",
                "classes": "flex gap-0.75 items-center tabular-nums",
                "style": "line-height: 16px;",
                "kids": [
                  {
                    "text": "▲",
                    "classes": "",
                    "style": "color: rgb(33, 201, 94); font-weight: 400; font-size: 6px;"
                  },
                  {
                    "text": "3.80%",
                    "classes": "",
                    "style": "font-size: 12px; font-weight: 400; color: rgb(152, 153, 163);"
                  }
                ]
              },
              {
                "tag": "span",
                "text": ")",
                "classes": "text-xs font-normal text-text-tertiary",
                "style": "",
                "kids": []
              }
            ]
          }
        ]
      }
    },
    "own": {
      "banner": {
        "classes": "w-full h-30 rounded-xl bg-bg-secondary shrink-0 relative",
        "style": "",
        "action": {
          "classes": "absolute bottom-2 right-2 bg-bg-tertiary rounded-md px-2 py-2 flex items-center gap-2 font-bold text-text-primary cursor-pointer hover:opacity-80",
          "ariaLabel": "Add a banner"
        }
      },
      "avatar": {
        "kind": "eyes",
        "classes": "rounded-full flex items-center justify-center shrink-0 object-cover border-4 border-bg-primary bg-bg-secondary",
        "style": "width: 80px; height: 80px; min-width: 80px; min-height: 80px; background-color: rgb(255, 111, 233);",
        "imgClasses": "w-[70%] h-[70%]",
        "imgSrc": "/images/nohomo-eyes.png"
      },
      "name": {
        "classes": "flex min-w-0 max-w-full shrink items-center gap-0.5 text-lg leading-5 max-[1000px]:text-base",
        "innerClasses": "min-w-0 truncate",
        "text": "RareTotalFowl"
      },
      "clan": null,
      "handle": {
        "classes": "leading-5 text-text-secondary max-[1000px]:text-sm",
        "text": "@RareTotalFowl",
        "wrapper": "flex gap-2"
      },
      "statsWrapper": {
        "classes": "flex"
      },
      "stats": [
        {
          "classes": "flex flex-col items-center py-2 px-4 max-[1000px]:px-1.5 max-[1000px]:py-1 rounded-lg focus-visible:opacity-80 hover:opacity-80 cursor-pointer",
          "valueClasses": "leading-5 max-[1000px]:text-xs max-[1000px]:leading-4",
          "value": "1",
          "labelClasses": "text-text-secondary text-xs max-[1000px]:text-[10px]",
          "label": "Following"
        },
        {
          "divider": "w-px h-full bg-bg-secondary"
        },
        {
          "classes": "flex flex-col items-center py-2 px-4 max-[1000px]:px-1.5 max-[1000px]:py-1 rounded-lg focus-visible:opacity-80 hover:opacity-80 cursor-pointer",
          "valueClasses": "leading-5 max-[1000px]:text-xs max-[1000px]:leading-4",
          "value": "0",
          "labelClasses": "text-text-secondary text-xs max-[1000px]:text-[10px]",
          "label": "Followers"
        }
      ],
      "actionsWrapper": "flex gap-2 items-center ml-auto",
      "actions": [
        {
          "classes": "flex shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-accent-primary gap-2 rounded-lg border border-bg-tertiary bg-bg-secondary px-4 py-1.5 font-bold text-text-primary hover:opacity-80 max-[1000px]:px-2 max-[1000px]:py-1 max-[1000px]:text-xs",
          "text": "Share",
          "icon": "share",
          "spanClasses": null,
          "label": ""
        },
        {
          "classes": "border border-bg-tertiary min-w-29 max-[1000px]:min-w-16 bg-bg-secondary rounded-lg px-4 py-1.5 max-[1000px]:px-2 max-[1000px]:py-1 max-[1000px]:text-xs font-bold cursor-pointer shrink-0 flex items-center justify-center text-text-primary hover:opacity-80",
          "text": "Edit profile",
          "icon": null,
          "spanClasses": null,
          "label": ""
        },
        {
          "classes": "border border-bg-tertiary bg-bg-secondary rounded-lg p-1.5 max-[1000px]:p-1 cursor-pointer shrink-0 flex items-center justify-center text-text-primary hover:opacity-80",
          "text": "",
          "icon": "transfers-history",
          "spanClasses": null,
          "label": "Transfers history"
        },
        {
          "classes": "border border-bg-tertiary bg-bg-secondary rounded-lg p-1.5 max-[1000px]:p-1 cursor-pointer shrink-0 flex items-center justify-center text-text-primary hover:opacity-80",
          "text": "",
          "icon": "earnings",
          "spanClasses": null,
          "label": "Earnings"
        }
      ],
      "bio": null,
      "chipsWrapper": "flex gap-4 items-center pr-4 pt-2",
      "chips": [
        {
          "classes": "flex gap-1 items-center",
          "icon": "avg-hold",
          "spanClasses": "text-xs font-normal text-text-secondary",
          "text": "6d 21h avg. hold"
        },
        {
          "classes": "flex gap-1 items-center",
          "icon": "trades",
          "spanClasses": "text-xs font-normal text-text-secondary",
          "text": "1 trade"
        },
        {
          "classes": "flex gap-1 items-center",
          "icon": "joined",
          "spanClasses": "text-xs font-normal text-text-secondary",
          "text": "Joined May 2026"
        }
      ],
      "strip": null
    }
  };
  import BannerAdd from "../../icons/banner-add.svelte";
  import Share from "../../icons/share.svelte";
  import TransfersHistory from "../../icons/transfers-history.svelte";
  import Earnings from "../../icons/earnings.svelte";
  import ChipAvgHold from "../../icons/chip-avg-hold.svelte";
  import ChipTrades from "../../icons/chip-trades.svelte";
  import ChipJoined from "../../icons/chip-joined.svelte";
  import ChainBadge from "../../icons/chain-badge.svelte";
  import { openTransfers } from "../../lib/api/transfers.svelte.js";
  import { accountProfile } from "../../lib/api/account.svelte.js";
  import {
    averageHold,
    getProfileError,
    hasOverview,
    profileIdentity,
    topTrades,
    tradesLabel
  } from "../../lib/api/profile.svelte.js";

  /** @type {{ variant: "own" | "other" }} */
  let { variant } = $props();

  /** @type {import("../../lib/types").ProfileHeader} */
  const chrome = $derived(headers[variant]);

  const identity = $derived(profileIdentity());

  /**
   * The wallet line copies the address it shows under. The full address is the store's — the
   * short form on screen is the capture's own trimming — and the feedback is the deposit
   * sheet's: the line reads `Copied` for a moment instead of a toast.
   */
  let copied = $state(false);
  let copyTimer = 0;

  function copyWallet() {
    const address = identity.wallet;
    if (!address) return;
    navigator.clipboard?.writeText(address).catch(() => {});
    copied = true;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => (copied = false), 1500);
  }
  const strip = $derived(topTrades());
  const hold = $derived(averageHold());
  const error = $derived(getProfileError());
  const trades = $derived(tradesLabel());

  /**
   * The stat row. On your own profile the capture's two cells are the account's own social
   * counts, and `/v2/user/profile` answers both. On somebody else's they are Mutuals,
   * Following and Followers for a *wallet*, which no endpoint answers — `GET
   * /v2/user/{idOrUsername}` takes a user id or username, not an address — so that variant
   * keeps what the capture recorded.
   */
  const statValues = $derived.by(() => {
    if (variant !== "own") return null;
    const profile = accountProfile();
    if (!profile) return null;
    return {
      Following: String(profile.followingCount ?? 0),
      Followers: String(profile.followerCount ?? 0)
    };
  });

  /** The captured stat cells with the ones we can fill replaced, dividers left alone. */
  const stats = $derived(
    chrome.stats.map((stat) => {
      if (stat.divider || !statValues) return stat;
      const live = statValues[stat.label];
      return live === undefined ? stat : { ...stat, value: live };
    })
  );

  /** The chips the capture draws, with the two we can fill answered from the wallet. */
  const chips = $derived(
    !hasOverview()
      ? []
      : chrome.chips
          .filter((chip) => chip.icon !== "joined")
          .map((chip) => ({
            ...chip,
            text: chip.icon === "avg-hold" ? (hold ? `${hold} avg. hold` : "") : trades
          }))
          .filter((chip) => chip.text)
  );

  /**
   * The strip's card chrome. The capture records it on somebody else's profile only, so
   * that is the one both variants draw with.
   */
  const stripChrome = $derived(chrome.strip ?? headers.other.strip);
  const stripCard = $derived(stripChrome?.cards?.[0] ?? null);
  const stripRow = $derived(stripChrome?.cards?.[1] ?? null);
</script>

<div class="flex flex-col">
  <div class={chrome.banner.classes} style={chrome.banner.style}>
    {#if chrome.banner.action}
      <button class={chrome.banner.action.classes} aria-label={chrome.banner.action.ariaLabel}>
        <BannerAdd aria-hidden="true" />
      </button>
    {/if}
  </div>

  <div class="-mt-3 flex pl-1 gap-4 items-end relative">
    {#if identity.avatar}
      <button type="button" class="shrink-0 cursor-pointer" aria-label="View profile picture">
        <img class={chrome.avatar.classes} src={identity.avatar} alt="" style={chrome.avatar.style} />
      </button>
    {:else}
      <!-- No photo on the label: the capture's own placeholder, the eyes on their circle. -->
      <div class={chrome.avatar.classes} style={headers.own.avatar.style}>
        <img class={chrome.avatar.imgClasses} src={headers.own.avatar.imgSrc} alt="" />
      </div>
    {/if}

    <div class="flex gap-6 justify-between flex-1">
      <div class="flex flex-col gap-1">
        <div class="flex gap-2">
          <div translate="no" class={chrome.name.classes}>
            <div class={chrome.name.innerClasses}>{identity.name}</div>
          </div>
        </div>
        <div>
          <div class={chrome.handle.wrapper}>
            <!-- Both address lines copy the full wallet on a click: the @handle line when the
                 wallet carries no label (so it *is* the address), and the line under a labeled
                 handle. The chrome is the capture's; only the cursor, the title and the moment
                 of feedback are added. -->
            <div
              class="{chrome.handle.classes} cursor-pointer"
              translate="no"
              role="button"
              tabindex="0"
              title={identity.hasLabel ? undefined : identity.wallet}
              onclick={copyWallet}
              onkeydown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); copyWallet(); } }}
            >{copied && !identity.hasLabel ? "Copied" : identity.handle}</div>
            {#if identity.hasLabel}
              <!-- Which wallet this handle is. A bare wallet has no second line to add. -->
              <div
                class="leading-5 text-text-tertiary max-[1000px]:text-sm cursor-pointer"
                translate="no"
                role="button"
                tabindex="0"
                title={identity.wallet}
                onclick={copyWallet}
                onkeydown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); copyWallet(); } }}
              >{copied ? "Copied" : identity.walletShort}</div>
            {/if}
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <div class={chrome.statsWrapper.classes}>
          <!-- The captured stats array interleaves dividers that carry no identity of
               their own, so the index is the only stable key this list has. -->
          {#each stats as stat, i (i)}
            {#if stat.divider}
              <div class={stat.divider}></div>
            {:else}
              <button class={stat.classes}>
                <div class={stat.valueClasses} translate="no">{stat.value}</div>
                <div class={stat.labelClasses}>{stat.label}</div>
              </button>
            {/if}
          {/each}
        </div>

        <div class={chrome.actionsWrapper}>
          {#each chrome.actions as a (a.icon ?? a.text)}
            <button
              class={a.classes}
              aria-label={a.label || undefined}
              onclick={a.icon === "transfers-history" ? () => openTransfers(identity.wallet) : undefined}
            >
              <!-- The icon-only actions take their name from the captured aria-label,
                   so their svg is hidden; Share's button is named by its text. -->
              {#if a.icon === "share"}
                <Share />
              {:else if a.icon === "transfers-history"}
                <TransfersHistory aria-hidden="true" />
              {:else if a.icon === "earnings"}
                <Earnings aria-hidden="true" />
              {/if}
              {#if a.text}{#if a.spanClasses}<span class={a.spanClasses}>{a.text}</span>{:else}{a.text}{/if}{/if}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>

  {#if error}
    <!-- A wallet the API has no trading data for, or a read it did not answer. -->
    <div class="text-xs text-text-tertiary pt-2">{error}</div>
  {/if}

  {#if chips.length}
    <div class={chrome.chipsWrapper}>
      {#each chips as chip (chip.icon)}
        <div class={chip.classes}>
          {#if chip.icon === "avg-hold"}
            <ChipAvgHold />
          {:else if chip.icon === "trades"}
            <ChipTrades />
          {:else}
            <ChipJoined />
          {/if}
          <span class={chip.spanClasses}>{chip.text}</span>
        </div>
      {/each}
    </div>
  {/if}

  {#if strip.length && stripCard && stripRow}
    <div class={stripChrome.outer}>
      <div class={stripChrome.classes}>
        {#each strip as card (card.key)}
          <!-- The first card is the capture's own #1 card and the rest its #2 card: the
               only difference between them is the rank badge's ink. -->
          {@const template = card.rank === 1 ? stripCard : stripRow}
          <a class={template.classes} href={card.href}>
            <div class={template.badgeClasses}>
              {template.badgeText.replace("#1", `#${card.rank}`).replace("#2", `#${card.rank}`)}
            </div>
            <div class={template.rowClasses}>
              <div class={template.tokenWrapperClasses} style={template.tokenWrapperStyle}>
                <img class={template.imgClasses} src={card.img} alt="" style={template.imgStyle} />
                <div class={template.badgePosClasses} style={template.badgePosStyle}>
                  <ChainBadge style={template.badgeSvgStyle} />
                </div>
              </div>
              <div class={template.valueClasses} translate="no" style={template.valueStyle}>
                <div style="font-size: 14px; font-weight: 500; color: {card.color};">{card.sign}</div>
                <div style="font-size: 14px; font-weight: 500; color: {card.color};">{card.value}</div>
              </div>
              <div class={template.pctClasses}>
                <span class="text-xs font-normal text-text-tertiary">(</span>
                <div class="flex gap-0.75 items-center tabular-nums" translate="no" style="line-height: 16px;">
                  <div style="color: {card.color}; font-weight: 400; font-size: 6px;">{card.up ? "▲" : "▼"}</div>
                  <div style="font-size: 12px; font-weight: 400; color: rgb(152, 153, 163);">{card.pct}</div>
                </div>
                <span class="text-xs font-normal text-text-tertiary">)</span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/if}
</div>
