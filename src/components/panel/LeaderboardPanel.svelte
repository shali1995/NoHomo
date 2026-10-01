<script>
  // The left panel's Leaderboard view: the Clans strip, the 24H/7D/30D/ALL window
  // selector, the ALL/FOMO/PUMPFUN source selector, the pinned "Your rank" row and the
  // ranked traders. Class strings, inline styles and every rendered string come from
  // the capture; the icons live in src/icons.
  //
  // The ranked rows are live: they come from the OpenDEX trader ranking and are mapped
  // onto the capture's row shape in src/lib/api/leaderboard.svelte.js. The Clans strip
  // and the "Your rank" row are still the capture's — the ranking endpoint has no clan
  // concept, and the viewer has no rank until auth exists.
  /** @type {import("../../lib/types").LeaderboardData} */
  // inlined from leaderboard.json — no data file, the strings live with the code
  const leaderboard =   {
    "clans": {
      "title": "Clans",
      "badgeLabel": "New",
      "badgeClasses": "bg-accent-primary-transparent text-accent-primary rounded-md px-1.5 py-0.5 text-xs font-bold leading-none",
      "buttonClasses": "flex items-center gap-2 cursor-pointer",
      "chevronClasses": "lucide lucide-chevron-down size-4 text-text-tertiary transition-transform",
      "chevronOpenClasses": "lucide lucide-chevron-down size-4 text-text-tertiary transition-transform rotate-180",
      "viewAllLabel": "View all",
      "viewAllClasses": "flex items-center gap-0.5 text-xs text-text-secondary hover:text-text-primary focus-visible:text-text-primary cursor-pointer",
      "cards": [
        {
          "href": "/clans/75cefc60-e6f6-4189-8073-18e7cb37db5d?window=30d",
          "name": "Dabal",
          "img": "/images/nohomo-eyes.png",
          "medal": 1,
          "members": "27",
          "pnlColor": "rgb(33, 201, 94)",
          "pnlSign": "+",
          "pnlValue": "$11.7M"
        },
        {
          "href": "/clans/715a68a6-657e-4424-8c65-68ad3af899b1?window=30d",
          "name": "Fantom Troupe",
          "img": "/images/nohomo-eyes.png",
          "medal": 2,
          "members": "17",
          "pnlColor": "rgb(33, 201, 94)",
          "pnlSign": "+",
          "pnlValue": "$10.8M"
        },
        {
          "href": "/clans/2903d220-2087-4c67-b72a-300863517ab7?window=30d",
          "name": "chubbicorns",
          "img": "/images/nohomo-eyes.png",
          "medal": 3,
          "members": "30",
          "pnlColor": "rgb(33, 201, 94)",
          "pnlSign": "+",
          "pnlValue": "$4.1M"
        },
        {
          "href": "/clans/87c22801-d5a6-4e9e-8f18-bceadf8b1040?window=30d",
          "name": "Sparsity",
          "img": "/images/nohomo-eyes.png",
          "medal": null,
          "members": "20",
          "pnlColor": "rgb(33, 201, 94)",
          "pnlSign": "+",
          "pnlValue": "$2.8M"
        },
        {
          "href": "/clans/f4f46c96-bd5f-4c0f-baa2-4d3e1b8c1f25?window=30d",
          "name": "Troupe KZ",
          "img": "/images/nohomo-eyes.png",
          "medal": null,
          "members": "7",
          "pnlColor": "rgb(33, 201, 94)",
          "pnlSign": "+",
          "pnlValue": "$2.7M"
        },
        {
          "href": "/clans/bf125c8f-8f99-4b8e-8fa9-675d179ceb99?window=30d",
          "name": "CookHouse",
          "img": "/images/nohomo-eyes.png",
          "medal": null,
          "members": "21",
          "pnlColor": "rgb(33, 201, 94)",
          "pnlSign": "+",
          "pnlValue": "$2.7M"
        }
      ]
    },
    "windows": [
      {
        "label": "24H",
        "classes": "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-text-tertiary text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary"
      },
      {
        "label": "7D",
        "classes": "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-text-tertiary text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary"
      },
      {
        "label": "30D",
        "classes": "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary bg-bg-tertiary text-text-primary"
      },
      {
        "label": "ALL",
        "classes": "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-text-tertiary text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary"
      }
    ],
    "activeWindowClasses": "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary bg-bg-tertiary text-text-primary",
    "inactiveWindowClasses": "inline-flex h-6 min-w-8 items-center justify-center rounded-md border border-bg-tertiary-solid px-1.5 text-text-tertiary text-xs font-bold leading-none whitespace-nowrap hover:bg-bg-tertiary hover:text-text-primary focus:bg-bg-tertiary",
    "shareClasses": "flex shrink-0 cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-accent-primary size-6 rounded-md border border-bg-tertiary-solid text-text-tertiary hover:bg-bg-tertiary hover:text-text-primary ml-auto",
    "yourRank": {
      "label": "Your rank",
      "avatarStyle": "width: 36px; height: 36px; min-width: 36px; min-height: 36px; background-color: rgb(255, 111, 233);",
      "eyesSrc": "/images/nohomo-eyes.png",
      "hash": "#",
      "rank": "91,896",
      "pnlLabel": "PnL",
      "pnlColor": "rgb(33, 201, 94)",
      "pnlSign": "+",
      "pnlValue": "$5.41"
    },
    "rows": [
      {
        "href": "/profile/pointfarmcap",
        "medal": 1,
        "rankText": null,
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "point farm capital",
        "clan": null,
        "handle": "@pointfarmcap",
        "pnlSign": "+",
        "pnlValue": "$14,927,385.27",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "302+"
      },
      {
        "href": "/profile/unipcs",
        "medal": 2,
        "rankText": null,
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Unipcs",
        "clan": {
          "alt": "Fantom Troupe",
          "title": "Fantom Troupe",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@unipcs",
        "pnlSign": "+",
        "pnlValue": "$11,563,598.11",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "257+"
      },
      {
        "href": "/profile/The__Solstice",
        "medal": 3,
        "rankText": null,
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "TheS◎Lstice",
        "clan": {
          "alt": "Control The Narrative",
          "title": "Control The Narrative",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@The__Solstice",
        "pnlSign": "+",
        "pnlValue": "$7,967,111.76",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "47+"
      },
      {
        "href": "/profile/DumbCrayonEater",
        "medal": null,
        "rankText": "4.",
        "avatarImg": null,
        "avatarBg": "rgb(115, 204, 255)",
        "name": "DumbCrayonEater",
        "clan": null,
        "handle": "@DumbCrayonEater",
        "pnlSign": "+",
        "pnlValue": "$7,505,773.97",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "106+"
      },
      {
        "href": "/profile/theveeman",
        "medal": null,
        "rankText": "5.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Vee",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@theveeman",
        "pnlSign": "+",
        "pnlValue": "$6,880,383.72",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "34+"
      },
      {
        "href": "/profile/Salem1299534",
        "medal": null,
        "rankText": "6.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Salem",
        "clan": null,
        "handle": "@Salem1299534",
        "pnlSign": "+",
        "pnlValue": "$6,287,362.74",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "%253ACL/icon.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "35+"
      },
      {
        "href": "/profile/Natan_benish",
        "medal": null,
        "rankText": "7.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Nate",
        "clan": null,
        "handle": "@Natan_benish",
        "pnlSign": "+",
        "pnlValue": "$4,846,220.01",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "52+"
      },
      {
        "href": "/profile/brrrgrrrz",
        "medal": null,
        "rankText": "8.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Burgz",
        "clan": {
          "alt": "Risk On",
          "title": "Risk On",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@brrrgrrrz",
        "pnlSign": "+",
        "pnlValue": "$4,329,030.34",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "39+"
      },
      {
        "href": "/profile/AvgJoesCrypto",
        "medal": null,
        "rankText": "9.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "AJC",
        "clan": null,
        "handle": "@AvgJoesCrypto",
        "pnlSign": "+",
        "pnlValue": "$3,995,459.28",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "60+"
      },
      {
        "href": "/profile/0xdetweiler",
        "medal": null,
        "rankText": "10.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Theo",
        "clan": null,
        "handle": "@0xdetweiler",
        "pnlSign": "+",
        "pnlValue": "$3,697,831.66",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "23+"
      },
      {
        "href": "/profile/SolSwizzle",
        "medal": null,
        "rankText": "11.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Swizzle",
        "clan": {
          "alt": "Risk On",
          "title": "Risk On",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@SolSwizzle",
        "pnlSign": "+",
        "pnlValue": "$3,589,542.34",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "80+"
      },
      {
        "href": "/profile/notanicecat69",
        "medal": null,
        "rankText": "12.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Wood",
        "clan": {
          "alt": "Risk On",
          "title": "Risk On",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@notanicecat69",
        "pnlSign": "+",
        "pnlValue": "$3,465,360.25",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "18+"
      },
      {
        "href": "/profile/ogle",
        "medal": null,
        "rankText": "13.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "ogle",
        "clan": null,
        "handle": "@ogle",
        "pnlSign": "+",
        "pnlValue": "$3,155,679.10",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "53+"
      },
      {
        "href": "/profile/frogmanhaha",
        "medal": null,
        "rankText": "14.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Frogman",
        "clan": null,
        "handle": "@frogmanhaha",
        "pnlSign": "+",
        "pnlValue": "$3,107,419.39",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "35+"
      },
      {
        "href": "/profile/RugDalio",
        "medal": null,
        "rankText": "15.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "RugDalio✨",
        "clan": {
          "alt": "The Light",
          "title": "The Light",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@RugDalio",
        "pnlSign": "+",
        "pnlValue": "$2,833,889.26",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "33+"
      },
      {
        "href": "/profile/Chubbi230",
        "medal": null,
        "rankText": "16.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "230",
        "clan": {
          "alt": "chubbicorns",
          "title": "chubbicorns",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Chubbi230",
        "pnlSign": "+",
        "pnlValue": "$2,634,419.57",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "28+"
      },
      {
        "href": "/profile/motiyawerey",
        "medal": null,
        "rankText": "17.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Werey",
        "clan": null,
        "handle": "@motiyawerey",
        "pnlSign": "+",
        "pnlValue": "$2,558,433.41",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "73+"
      },
      {
        "href": "/profile/cosby",
        "medal": null,
        "rankText": "18.",
        "avatarImg": null,
        "avatarBg": "rgb(255, 78, 81)",
        "name": "cosby",
        "clan": null,
        "handle": "@cosby",
        "pnlSign": "+",
        "pnlValue": "$2,548,959.11",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "31+"
      },
      {
        "href": "/profile/soby0x",
        "medal": null,
        "rankText": "19.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "soby",
        "clan": null,
        "handle": "@soby0x",
        "pnlSign": "+",
        "pnlValue": "$2,458,859.05",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "43+"
      },
      {
        "href": "/profile/LP1111",
        "medal": null,
        "rankText": "20.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "LP 1",
        "clan": null,
        "handle": "@LP1111",
        "pnlSign": "+",
        "pnlValue": "$2,399,148.51",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "11+"
      },
      {
        "href": "/profile/CardinalSaint2",
        "medal": null,
        "rankText": "21.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Cardinal Saint",
        "clan": null,
        "handle": "@CardinalSaint2",
        "pnlSign": "+",
        "pnlValue": "$2,303,554.32",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "44+"
      },
      {
        "href": "/profile/inyourwalls",
        "medal": null,
        "rankText": "22.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "inyourwalls",
        "clan": null,
        "handle": "@inyourwalls",
        "pnlSign": "+",
        "pnlValue": "$2,297,474.95",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "37+"
      },
      {
        "href": "/profile/0xAvast",
        "medal": null,
        "rankText": "23.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Avast",
        "clan": {
          "alt": "Troupe KZ",
          "title": "Troupe KZ",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@0xAvast",
        "pnlSign": "+",
        "pnlValue": "$2,226,624.95",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "33+"
      },
      {
        "href": "/profile/lordarbiter",
        "medal": null,
        "rankText": "24.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "lordarbiter",
        "clan": null,
        "handle": "@lordarbiter",
        "pnlSign": "+",
        "pnlValue": "$2,196,640.33",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "7+"
      },
      {
        "href": "/profile/kyle",
        "medal": null,
        "rankText": "25.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "kyle",
        "clan": null,
        "handle": "@kyle",
        "pnlSign": "+",
        "pnlValue": "$2,071,528.87",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "30+"
      },
      {
        "href": "/profile/RunningClam",
        "medal": null,
        "rankText": "26.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Clam",
        "clan": null,
        "handle": "@RunningClam",
        "pnlSign": "+",
        "pnlValue": "$2,063,312.81",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "30+"
      },
      {
        "href": "/profile/zeri_term",
        "medal": null,
        "rankText": "27.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "zeri_terminal",
        "clan": null,
        "handle": "@zeri_term",
        "pnlSign": "+",
        "pnlValue": "$2,061,404.14",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "29+"
      },
      {
        "href": "/profile/TheOnlyOMP",
        "medal": null,
        "rankText": "28.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Old Man Pervert",
        "clan": null,
        "handle": "@TheOnlyOMP",
        "pnlSign": "+",
        "pnlValue": "$1,975,692.47",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "20+"
      },
      {
        "href": "/profile/ether_monk",
        "medal": null,
        "rankText": "29.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Ethermonk 📿",
        "clan": {
          "alt": "CookHouse",
          "title": "CookHouse",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@ether_monk",
        "pnlSign": "+",
        "pnlValue": "$1,944,692.37",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "95+"
      },
      {
        "href": "/profile/aki11a",
        "medal": null,
        "rankText": "30.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "aki",
        "clan": {
          "alt": "Reach",
          "title": "Reach",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@aki11a",
        "pnlSign": "+",
        "pnlValue": "$1,942,226.84",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "38+"
      },
      {
        "href": "/profile/m0f0",
        "medal": null,
        "rankText": "31.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "m0f0",
        "clan": null,
        "handle": "@m0f0",
        "pnlSign": "+",
        "pnlValue": "$1,869,082.66",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "67+"
      },
      {
        "href": "/profile/econoar",
        "medal": null,
        "rankText": "32.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "eric.eth",
        "clan": null,
        "handle": "@econoar",
        "pnlSign": "+",
        "pnlValue": "$1,867,635.61",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "33+"
      },
      {
        "href": "/profile/kv4rl",
        "medal": null,
        "rankText": "33.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "k4rl",
        "clan": null,
        "handle": "@kv4rl",
        "pnlSign": "+",
        "pnlValue": "$1,836,373.38",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": null
      },
      {
        "href": "/profile/0xnobi",
        "medal": null,
        "rankText": "34.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "nobi",
        "clan": {
          "alt": "Nobi Ventures",
          "title": "Nobi Ventures",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@0xnobi",
        "pnlSign": "+",
        "pnlValue": "$1,823,585.51",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "39+"
      },
      {
        "href": "/profile/LehmanFarters",
        "medal": null,
        "rankText": "35.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Lehman Farters",
        "clan": null,
        "handle": "@LehmanFarters",
        "pnlSign": "+",
        "pnlValue": "$1,799,535.37",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "12+"
      },
      {
        "href": "/profile/jotagezin",
        "medal": null,
        "rankText": "36.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "jg",
        "clan": {
          "alt": "Sparsity",
          "title": "Sparsity",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@jotagezin",
        "pnlSign": "+",
        "pnlValue": "$1,731,370.94",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "46+"
      },
      {
        "href": "/profile/seralberttrades",
        "medal": null,
        "rankText": "37.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Ser Albert",
        "clan": {
          "alt": "HFT",
          "title": "HFT",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@seralberttrades",
        "pnlSign": "+",
        "pnlValue": "$1,717,602.40",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "58+"
      },
      {
        "href": "/profile/TheDazzleNovak",
        "medal": null,
        "rankText": "38.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Dazzle Novak",
        "clan": null,
        "handle": "@TheDazzleNovak",
        "pnlSign": "+",
        "pnlValue": "$1,706,923.51",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "53+"
      },
      {
        "href": "/profile/0xleo",
        "medal": null,
        "rankText": "39.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "leo",
        "clan": null,
        "handle": "@0xleo",
        "pnlSign": "+",
        "pnlValue": "$1,698,438.02",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "20+"
      },
      {
        "href": "/profile/RareDualJay",
        "medal": null,
        "rankText": "40.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "RareDualJay",
        "clan": null,
        "handle": "@RareDualJay",
        "pnlSign": "+",
        "pnlValue": "$1,655,513.21",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "20+"
      },
      {
        "href": "/profile/RZDxbt",
        "medal": null,
        "rankText": "41.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "RZD",
        "clan": null,
        "handle": "@RZDxbt",
        "pnlSign": "+",
        "pnlValue": "$1,628,625.28",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "10+"
      },
      {
        "href": "/profile/frankdegods",
        "medal": null,
        "rankText": "42.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "frank 🎒",
        "clan": null,
        "handle": "@frankdegods",
        "pnlSign": "+",
        "pnlValue": "$1,603,699.10",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "247+"
      },
      {
        "href": "/profile/picadura",
        "medal": null,
        "rankText": "43.",
        "avatarImg": null,
        "avatarBg": "rgb(255, 111, 233)",
        "name": "picadura",
        "clan": {
          "alt": "Sparsity",
          "title": "Sparsity",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@picadura",
        "pnlSign": "+",
        "pnlValue": "$1,501,922.46",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "24+"
      },
      {
        "href": "/profile/pricedin",
        "medal": null,
        "rankText": "44.",
        "avatarImg": null,
        "avatarBg": "rgb(4, 143, 92)",
        "name": "pricedin",
        "clan": null,
        "handle": "@pricedin",
        "pnlSign": "+",
        "pnlValue": "$1,496,513.73",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "23+"
      },
      {
        "href": "/profile/FullPinkYak",
        "medal": null,
        "rankText": "45.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "FullPinkYak",
        "clan": {
          "alt": "Reach",
          "title": "Reach",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@FullPinkYak",
        "pnlSign": "+",
        "pnlValue": "$1,451,597.40",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "15+"
      },
      {
        "href": "/profile/Pyro",
        "medal": null,
        "rankText": "46.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Pyro",
        "clan": {
          "alt": "CookHouse",
          "title": "CookHouse",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Pyro",
        "pnlSign": "+",
        "pnlValue": "$1,325,282.47",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "21+"
      },
      {
        "href": "/profile/bluntz_capital",
        "medal": null,
        "rankText": "47.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "bluntz",
        "clan": null,
        "handle": "@bluntz_capital",
        "pnlSign": "+",
        "pnlValue": "$1,317,784.10",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "19+"
      },
      {
        "href": "/profile/justtesting",
        "medal": null,
        "rankText": "48.",
        "avatarImg": null,
        "avatarBg": "rgb(4, 143, 92)",
        "name": "Test Account",
        "clan": null,
        "handle": "@justtesting",
        "pnlSign": "+",
        "pnlValue": "$1,305,954.85",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "3+"
      },
      {
        "href": "/profile/tremendoustoad",
        "medal": null,
        "rankText": "49.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "tremendoustoad",
        "clan": null,
        "handle": "@tremendoustoad",
        "pnlSign": "+",
        "pnlValue": "$1,303,031.35",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "14+"
      },
      {
        "href": "/profile/cryptoalbus",
        "medal": null,
        "rankText": "50.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Albus",
        "clan": {
          "alt": "chubbicorns",
          "title": "chubbicorns",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@cryptoalbus",
        "pnlSign": "+",
        "pnlValue": "$1,261,835.76",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "50+"
      },
      {
        "href": "/profile/cryptochi3f_",
        "medal": null,
        "rankText": "51.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "CryptoChief",
        "clan": null,
        "handle": "@cryptochi3f_",
        "pnlSign": "+",
        "pnlValue": "$1,237,012.42",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "7+"
      },
      {
        "href": "/profile/NachSOL",
        "medal": null,
        "rankText": "52.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Nach",
        "clan": {
          "alt": "mofos",
          "title": "mofos",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@NachSOL",
        "pnlSign": "+",
        "pnlValue": "$1,223,851.91",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "54+"
      },
      {
        "href": "/profile/mrfernando88",
        "medal": null,
        "rankText": "53.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "MrFernando",
        "clan": null,
        "handle": "@mrfernando88",
        "pnlSign": "+",
        "pnlValue": "$1,172,659.04",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "1+"
      },
      {
        "href": "/profile/carlwheezor",
        "medal": null,
        "rankText": "54.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Carl Wheezor",
        "clan": null,
        "handle": "@carlwheezor",
        "pnlSign": "+",
        "pnlValue": "$1,094,871.58",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "22+"
      },
      {
        "href": "/profile/zakum",
        "medal": null,
        "rankText": "55.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "zakum",
        "clan": null,
        "handle": "@zakum",
        "pnlSign": "+",
        "pnlValue": "$1,069,774.25",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "4+"
      },
      {
        "href": "/profile/figaro",
        "medal": null,
        "rankText": "56.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "figaro",
        "clan": {
          "alt": "Sparsity",
          "title": "Sparsity",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@figaro",
        "pnlSign": "+",
        "pnlValue": "$1,059,709.25",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "120+"
      },
      {
        "href": "/profile/Samisa_btc",
        "medal": null,
        "rankText": "57.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "samisa",
        "clan": {
          "alt": "HFT",
          "title": "HFT",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Samisa_btc",
        "pnlSign": "+",
        "pnlValue": "$1,056,853.84",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "30+"
      },
      {
        "href": "/profile/dreamloaderxo",
        "medal": null,
        "rankText": "58.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "dreamloader",
        "clan": null,
        "handle": "@dreamloaderxo",
        "pnlSign": "+",
        "pnlValue": "$1,053,769.92",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "19+"
      },
      {
        "href": "/profile/NotARandomUser",
        "medal": null,
        "rankText": "59.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "User",
        "clan": {
          "alt": "Sparsity",
          "title": "Sparsity",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@NotARandomUser",
        "pnlSign": "+",
        "pnlValue": "$1,052,106.64",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "24+"
      },
      {
        "href": "/profile/ethersole",
        "medal": null,
        "rankText": "60.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "ethersole",
        "clan": null,
        "handle": "@ethersole",
        "pnlSign": "+",
        "pnlValue": "$1,025,297.25",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "3+"
      },
      {
        "href": "/profile/rasmr",
        "medal": null,
        "rankText": "61.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "rasmr",
        "clan": null,
        "handle": "@rasmr",
        "pnlSign": "+",
        "pnlValue": "$1,018,474.01",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "94+"
      },
      {
        "href": "/profile/kingofgotham",
        "medal": null,
        "rankText": "62.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "kingofgotham",
        "clan": null,
        "handle": "@kingofgotham",
        "pnlSign": "+",
        "pnlValue": "$984,278.70",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "30+"
      },
      {
        "href": "/profile/TizzWhisperer",
        "medal": null,
        "rankText": "63.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Tizz",
        "clan": null,
        "handle": "@TizzWhisperer",
        "pnlSign": "+",
        "pnlValue": "$958,847.92",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "18+"
      },
      {
        "href": "/profile/dtrainz",
        "medal": null,
        "rankText": "64.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "dtrains",
        "clan": null,
        "handle": "@dtrainz",
        "pnlSign": "+",
        "pnlValue": "$944,943.68",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "11+"
      },
      {
        "href": "/profile/Visi235",
        "medal": null,
        "rankText": "65.",
        "avatarImg": null,
        "avatarBg": "rgb(115, 204, 255)",
        "name": "Visionary",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Visi235",
        "pnlSign": "+",
        "pnlValue": "$944,549.07",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "9+"
      },
      {
        "href": "/profile/xbtDLN",
        "medal": null,
        "rankText": "66.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "DLN",
        "clan": null,
        "handle": "@xbtDLN",
        "pnlSign": "+",
        "pnlValue": "$942,897.43",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "13+"
      },
      {
        "href": "/profile/himgajria",
        "medal": null,
        "rankText": "67.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Him",
        "clan": null,
        "handle": "@himgajria",
        "pnlSign": "+",
        "pnlValue": "$939,392.04",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "29+"
      },
      {
        "href": "/profile/sebdegen",
        "medal": null,
        "rankText": "68.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "seb",
        "clan": null,
        "handle": "@sebdegen",
        "pnlSign": "+",
        "pnlValue": "$917,741.43",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "5+"
      },
      {
        "href": "/profile/pianches",
        "medal": null,
        "rankText": "69.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Joon",
        "clan": null,
        "handle": "@pianches",
        "pnlSign": "+",
        "pnlValue": "$903,925.07",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "38+"
      },
      {
        "href": "/profile/paidinfullintel",
        "medal": null,
        "rankText": "70.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "paidinfullintel",
        "clan": null,
        "handle": "@paidinfullintel",
        "pnlSign": "+",
        "pnlValue": "$901,841.29",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "102+"
      },
      {
        "href": "/profile/OmakaseOnly",
        "medal": null,
        "rankText": "71.",
        "avatarImg": null,
        "avatarBg": "rgb(4, 143, 92)",
        "name": "Omakase",
        "clan": {
          "alt": "mofos",
          "title": "mofos",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@OmakaseOnly",
        "pnlSign": "+",
        "pnlValue": "$897,213.95",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "25+"
      },
      {
        "href": "/profile/nova6",
        "medal": null,
        "rankText": "72.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "nova6",
        "clan": null,
        "handle": "@nova6",
        "pnlSign": "+",
        "pnlValue": "$875,346.74",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "26+"
      },
      {
        "href": "/profile/artthatfucks",
        "medal": null,
        "rankText": "73.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "FML",
        "clan": null,
        "handle": "@artthatfucks",
        "pnlSign": "+",
        "pnlValue": "$845,991.85",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "5+"
      },
      {
        "href": "/profile/SoftMereElk",
        "medal": null,
        "rankText": "74.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "SoftMereElk",
        "clan": null,
        "handle": "@SoftMereElk",
        "pnlSign": "+",
        "pnlValue": "$843,668.15",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "85+"
      },
      {
        "href": "/profile/ventikohi",
        "medal": null,
        "rankText": "75.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Kohi",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@ventikohi",
        "pnlSign": "+",
        "pnlValue": "$840,369.16",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "59+"
      },
      {
        "href": "/profile/TheGasChad",
        "medal": null,
        "rankText": "76.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "pbm",
        "clan": null,
        "handle": "@TheGasChad",
        "pnlSign": "+",
        "pnlValue": "$828,239.03",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "4+"
      },
      {
        "href": "/profile/0xElyy",
        "medal": null,
        "rankText": "77.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "0xEly",
        "clan": null,
        "handle": "@0xElyy",
        "pnlSign": "+",
        "pnlValue": "$823,267.26",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "6+"
      },
      {
        "href": "/profile/crocsguy",
        "medal": null,
        "rankText": "78.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "tywebb",
        "clan": null,
        "handle": "@crocsguy",
        "pnlSign": "+",
        "pnlValue": "$812,918.05",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "8+"
      },
      {
        "href": "/profile/0xLingard",
        "medal": null,
        "rankText": "79.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Lingard",
        "clan": null,
        "handle": "@0xLingard",
        "pnlSign": "+",
        "pnlValue": "$811,107.53",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "43+"
      },
      {
        "href": "/profile/buggyllama",
        "medal": null,
        "rankText": "80.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "buggyllama",
        "clan": null,
        "handle": "@buggyllama",
        "pnlSign": "+",
        "pnlValue": "$805,659.74",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "48+"
      },
      {
        "href": "/profile/attnmarkets",
        "medal": null,
        "rankText": "81.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "sir chaz p.",
        "clan": null,
        "handle": "@attnmarkets",
        "pnlSign": "+",
        "pnlValue": "$778,054.71",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "14+"
      },
      {
        "href": "/profile/retardedgains",
        "medal": null,
        "rankText": "82.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "retardedgains",
        "clan": {
          "alt": "Masons",
          "title": "Masons",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@retardedgains",
        "pnlSign": "+",
        "pnlValue": "$773,773.97",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "16+"
      },
      {
        "href": "/profile/heeshilio",
        "medal": null,
        "rankText": "83.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "heeshilio",
        "clan": null,
        "handle": "@heeshilio",
        "pnlSign": "+",
        "pnlValue": "$773,710.66",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "14+"
      },
      {
        "href": "/profile/facap",
        "medal": null,
        "rankText": "84.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "fa cap",
        "clan": null,
        "handle": "@facap",
        "pnlSign": "+",
        "pnlValue": "$771,334.02",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "23+"
      },
      {
        "href": "/profile/the_nutgod",
        "medal": null,
        "rankText": "85.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "nutgod",
        "clan": null,
        "handle": "@the_nutgod",
        "pnlSign": "+",
        "pnlValue": "$770,110.17",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "14+"
      },
      {
        "href": "/profile/CoinGurruu",
        "medal": null,
        "rankText": "86.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "💐Guru 💐",
        "clan": {
          "alt": "One Life",
          "title": "One Life",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@CoinGurruu",
        "pnlSign": "+",
        "pnlValue": "$764,096.21",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "8+"
      },
      {
        "href": "/profile/midcurver",
        "medal": null,
        "rankText": "87.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Midcurver",
        "clan": null,
        "handle": "@midcurver",
        "pnlSign": "+",
        "pnlValue": "$763,989.66",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "149+"
      },
      {
        "href": "/profile/qwerty888",
        "medal": null,
        "rankText": "88.",
        "avatarImg": null,
        "avatarBg": "rgb(115, 204, 255)",
        "name": "12345678",
        "clan": null,
        "handle": "@qwerty888",
        "pnlSign": "+",
        "pnlValue": "$760,415.13",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "6+"
      },
      {
        "href": "/profile/valueandtime",
        "medal": null,
        "rankText": "89.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Value",
        "clan": {
          "alt": "CookHouse",
          "title": "CookHouse",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@valueandtime",
        "pnlSign": "+",
        "pnlValue": "$751,416.07",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "22+"
      },
      {
        "href": "/profile/montyMole44",
        "medal": null,
        "rankText": "90.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "jb (coinsexual, bull)",
        "clan": null,
        "handle": "@montyMole44",
        "pnlSign": "+",
        "pnlValue": "$751,236.32",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "8+"
      },
      {
        "href": "/profile/QuickZippyFlea",
        "medal": null,
        "rankText": "91.",
        "avatarImg": null,
        "avatarBg": "rgb(115, 204, 255)",
        "name": "QuickZippyFlea",
        "clan": null,
        "handle": "@QuickZippyFlea",
        "pnlSign": "+",
        "pnlValue": "$749,130.82",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": null
      },
      {
        "href": "/profile/Tekkerrss",
        "medal": null,
        "rankText": "92.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Tekkerrss",
        "clan": {
          "alt": "Is This Not Insane",
          "title": "Is This Not Insane",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Tekkerrss",
        "pnlSign": "+",
        "pnlValue": "$743,252.49",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "355+"
      },
      {
        "href": "/profile/Aurelius0121",
        "medal": null,
        "rankText": "93.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Aurelius",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Aurelius0121",
        "pnlSign": "+",
        "pnlValue": "$742,397.60",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "135+"
      },
      {
        "href": "/profile/SpicyPeruvian_",
        "medal": null,
        "rankText": "94.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Spicy🌶️",
        "clan": {
          "alt": "Risk On",
          "title": "Risk On",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@SpicyPeruvian_",
        "pnlSign": "+",
        "pnlValue": "$726,937.18",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "11+"
      },
      {
        "href": "/profile/bamblewood8",
        "medal": null,
        "rankText": "95.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "bamblewood8",
        "clan": {
          "alt": "Sparsity",
          "title": "Sparsity",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@bamblewood8",
        "pnlSign": "+",
        "pnlValue": "$724,252.68",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "71+"
      },
      {
        "href": "/profile/Jols",
        "medal": null,
        "rankText": "96.",
        "avatarImg": null,
        "avatarBg": "rgb(81, 106, 246)",
        "name": "Jols",
        "clan": null,
        "handle": "@Jols",
        "pnlSign": "+",
        "pnlValue": "$721,492.51",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "14+"
      },
      {
        "href": "/profile/twaptops",
        "medal": null,
        "rankText": "97.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "twaptops",
        "clan": null,
        "handle": "@twaptops",
        "pnlSign": "+",
        "pnlValue": "$718,472.96",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "13+"
      },
      {
        "href": "/profile/397397",
        "medal": null,
        "rankText": "98.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Lasercat397",
        "clan": null,
        "handle": "@397397",
        "pnlSign": "+",
        "pnlValue": "$713,369.75",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "133+"
      },
      {
        "href": "/profile/BTCdayu",
        "medal": null,
        "rankText": "99.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "大宇",
        "clan": null,
        "handle": "@BTCdayu",
        "pnlSign": "+",
        "pnlValue": "$703,594.86",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "17+"
      },
      {
        "href": "/profile/spartee",
        "medal": null,
        "rankText": "100.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "spartee",
        "clan": null,
        "handle": "@spartee",
        "pnlSign": "+",
        "pnlValue": "$702,936.48",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "8+"
      },
      {
        "href": "/profile/CryptoCurb",
        "medal": null,
        "rankText": "101.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "curb",
        "clan": null,
        "handle": "@CryptoCurb",
        "pnlSign": "+",
        "pnlValue": "$698,386.51",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "51+"
      },
      {
        "href": "/profile/ultrapara",
        "medal": null,
        "rankText": "102.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "ultrapara",
        "clan": null,
        "handle": "@ultrapara",
        "pnlSign": "+",
        "pnlValue": "$697,099.36",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "19+"
      },
      {
        "href": "/profile/bigbabba",
        "medal": null,
        "rankText": "103.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "big babba johnson",
        "clan": {
          "alt": "Sparsity",
          "title": "Sparsity",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@bigbabba",
        "pnlSign": "+",
        "pnlValue": "$689,083.99",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "53+"
      },
      {
        "href": "/profile/AnselFang",
        "medal": null,
        "rankText": "104.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "lonewolf孤狼",
        "clan": null,
        "handle": "@AnselFang",
        "pnlSign": "+",
        "pnlValue": "$676,335.58",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          }
        ],
        "overflow": null
      },
      {
        "href": "/profile/PoorGoat_",
        "medal": null,
        "rankText": "105.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "PoorGoat💛🐈",
        "clan": {
          "alt": "Conviction Capital",
          "title": "Conviction Capital",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@PoorGoat_",
        "pnlSign": "+",
        "pnlValue": "$671,688.80",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "131+"
      },
      {
        "href": "/profile/achilles_bull",
        "medal": null,
        "rankText": "106.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "kb (achilles bull)",
        "clan": null,
        "handle": "@achilles_bull",
        "pnlSign": "+",
        "pnlValue": "$666,820.60",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "29+"
      },
      {
        "href": "/profile/yeon__",
        "medal": null,
        "rankText": "107.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Yeon",
        "clan": {
          "alt": "Troupe KZ",
          "title": "Troupe KZ",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@yeon__",
        "pnlSign": "+",
        "pnlValue": "$651,177.78",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "39+"
      },
      {
        "href": "/profile/BertLuvv",
        "medal": null,
        "rankText": "108.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Bert Luv",
        "clan": null,
        "handle": "@BertLuvv",
        "pnlSign": "+",
        "pnlValue": "$650,610.45",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "353+"
      },
      {
        "href": "/profile/sadcrissy",
        "medal": null,
        "rankText": "109.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Crissy",
        "clan": {
          "alt": "Conviction Capital",
          "title": "Conviction Capital",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@sadcrissy",
        "pnlSign": "+",
        "pnlValue": "$649,866.89",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "25+"
      },
      {
        "href": "/profile/hungryghost",
        "medal": null,
        "rankText": "110.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "hungryghost",
        "clan": {
          "alt": "Bet More",
          "title": "Bet More",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@hungryghost",
        "pnlSign": "+",
        "pnlValue": "$649,831.35",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "55+"
      },
      {
        "href": "/profile/sockzt",
        "medal": null,
        "rankText": "111.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "sockz",
        "clan": null,
        "handle": "@sockzt",
        "pnlSign": "+",
        "pnlValue": "$643,596.70",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "9+"
      },
      {
        "href": "/profile/Rowdy",
        "medal": null,
        "rankText": "112.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Rowdy",
        "clan": {
          "alt": "Fantom Troupe",
          "title": "Fantom Troupe",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Rowdy",
        "pnlSign": "+",
        "pnlValue": "$641,586.73",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "79+"
      },
      {
        "href": "/profile/starcatcher444",
        "medal": null,
        "rankText": "113.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Star Catcher 💫",
        "clan": null,
        "handle": "@starcatcher444",
        "pnlSign": "+",
        "pnlValue": "$638,836.09",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "21+"
      },
      {
        "href": "/profile/iruletrenches",
        "medal": null,
        "rankText": "114.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Miyamoto",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@iruletrenches",
        "pnlSign": "+",
        "pnlValue": "$637,759.05",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "64+"
      },
      {
        "href": "/profile/wileEcoyote",
        "medal": null,
        "rankText": "115.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "wileEcoyote",
        "clan": null,
        "handle": "@wileEcoyote",
        "pnlSign": "+",
        "pnlValue": "$631,032.82",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": null
      },
      {
        "href": "/profile/FartmanSacks",
        "medal": null,
        "rankText": "116.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Fartman Sacks",
        "clan": null,
        "handle": "@FartmanSacks",
        "pnlSign": "+",
        "pnlValue": "$628,087.08",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "32+"
      },
      {
        "href": "/profile/TheOldNite",
        "medal": null,
        "rankText": "117.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "TheOldNite",
        "clan": null,
        "handle": "@TheOldNite",
        "pnlSign": "+",
        "pnlValue": "$623,101.81",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "14+"
      },
      {
        "href": "/profile/derek518",
        "medal": null,
        "rankText": "118.",
        "avatarImg": null,
        "avatarBg": "rgb(255, 134, 73)",
        "name": "derekz",
        "clan": null,
        "handle": "@derek518",
        "pnlSign": "+",
        "pnlValue": "$620,264.50",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "16+"
      },
      {
        "href": "/profile/WashedUpWalter",
        "medal": null,
        "rankText": "119.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "WashedUpWalter",
        "clan": null,
        "handle": "@WashedUpWalter",
        "pnlSign": "+",
        "pnlValue": "$614,865.12",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "20+"
      },
      {
        "href": "/profile/Milliardi",
        "medal": null,
        "rankText": "120.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Michael Milliardi",
        "clan": null,
        "handle": "@Milliardi",
        "pnlSign": "+",
        "pnlValue": "$611,504.81",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "27+"
      },
      {
        "href": "/profile/koy",
        "medal": null,
        "rankText": "121.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Koy",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@koy",
        "pnlSign": "+",
        "pnlValue": "$605,285.83",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "28+"
      },
      {
        "href": "/profile/SolarFirmDingo",
        "medal": null,
        "rankText": "122.",
        "avatarImg": null,
        "avatarBg": "rgb(255, 134, 73)",
        "name": "SolarFirmDingo",
        "clan": null,
        "handle": "@SolarFirmDingo",
        "pnlSign": "+",
        "pnlValue": "$600,683.13",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "3+"
      },
      {
        "href": "/profile/LowRivalRat",
        "medal": null,
        "rankText": "123.",
        "avatarImg": null,
        "avatarBg": "rgb(4, 143, 92)",
        "name": "LowRivalRat",
        "clan": null,
        "handle": "@LowRivalRat",
        "pnlSign": "+",
        "pnlValue": "$599,346.72",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": null
      },
      {
        "href": "/profile/rainnen23",
        "medal": null,
        "rankText": "124.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Rain",
        "clan": {
          "alt": "Prosperity Customer Funds",
          "title": "Prosperity Customer Funds",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@rainnen23",
        "pnlSign": "+",
        "pnlValue": "$597,310.71",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "13+"
      },
      {
        "href": "/profile/corleonefnf",
        "medal": null,
        "rankText": "125.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "CORLEONE888",
        "clan": {
          "alt": "五道口金融学院",
          "title": "五道口金融学院",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@corleonefnf",
        "pnlSign": "+",
        "pnlValue": "$590,115.57",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "30+"
      },
      {
        "href": "/profile/0xSporadic",
        "medal": null,
        "rankText": "126.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Sporadic",
        "clan": {
          "alt": "Prosperity Customer Funds",
          "title": "Prosperity Customer Funds",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@0xSporadic",
        "pnlSign": "+",
        "pnlValue": "$589,306.91",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "%253AMSTR/icon.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "3+"
      },
      {
        "href": "/profile/looc",
        "medal": null,
        "rankText": "127.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "looc",
        "clan": null,
        "handle": "@looc",
        "pnlSign": "+",
        "pnlValue": "$586,850.45",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "31+"
      },
      {
        "href": "/profile/AviFelman",
        "medal": null,
        "rankText": "128.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "AviFelman",
        "clan": null,
        "handle": "@AviFelman",
        "pnlSign": "+",
        "pnlValue": "$584,399.48",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "11+"
      },
      {
        "href": "/profile/horseimnot",
        "medal": null,
        "rankText": "129.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Unicorn",
        "clan": null,
        "handle": "@horseimnot",
        "pnlSign": "+",
        "pnlValue": "$567,876.85",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "1092+"
      },
      {
        "href": "/profile/end837",
        "medal": null,
        "rankText": "130.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "end",
        "clan": null,
        "handle": "@end837",
        "pnlSign": "+",
        "pnlValue": "$550,668.75",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "2+"
      },
      {
        "href": "/profile/goosemanjones1",
        "medal": null,
        "rankText": "131.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Goosemanjones",
        "clan": null,
        "handle": "@goosemanjones1",
        "pnlSign": "+",
        "pnlValue": "$550,656.45",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "18+"
      },
      {
        "href": "/profile/enci",
        "medal": null,
        "rankText": "132.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "enci",
        "clan": null,
        "handle": "@enci",
        "pnlSign": "+",
        "pnlValue": "$549,106.82",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "24+"
      },
      {
        "href": "/profile/boosteryting",
        "medal": null,
        "rankText": "133.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Jack",
        "clan": {
          "alt": "Conviction Capital",
          "title": "Conviction Capital",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@boosteryting",
        "pnlSign": "+",
        "pnlValue": "$544,295.60",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "30+"
      },
      {
        "href": "/profile/rodotfun",
        "medal": null,
        "rankText": "134.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Roman",
        "clan": {
          "alt": "Underground",
          "title": "Underground",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@rodotfun",
        "pnlSign": "+",
        "pnlValue": "$542,478.81",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "58+"
      },
      {
        "href": "/profile/Carver___________",
        "medal": null,
        "rankText": "135.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Carver",
        "clan": null,
        "handle": "@Carver___________",
        "pnlSign": "+",
        "pnlValue": "$541,909.20",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "40+"
      },
      {
        "href": "/profile/byszzz",
        "medal": null,
        "rankText": "136.",
        "avatarImg": null,
        "avatarBg": "rgb(249, 228, 91)",
        "name": "byszzz",
        "clan": null,
        "handle": "@byszzz",
        "pnlSign": "+",
        "pnlValue": "$535,890.89",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "6+"
      },
      {
        "href": "/profile/WuKong365",
        "medal": null,
        "rankText": "137.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "WuKong",
        "clan": null,
        "handle": "@WuKong365",
        "pnlSign": "+",
        "pnlValue": "$533,248.06",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "1+"
      },
      {
        "href": "/profile/naP0Liano",
        "medal": null,
        "rankText": "138.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "SpaceHart",
        "clan": {
          "alt": "Finest",
          "title": "Finest",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@naP0Liano",
        "pnlSign": "+",
        "pnlValue": "$527,209.54",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [],
        "overflow": null
      },
      {
        "href": "/profile/roovera",
        "medal": null,
        "rankText": "139.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "roovera",
        "clan": null,
        "handle": "@roovera",
        "pnlSign": "+",
        "pnlValue": "$526,475.13",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "1+"
      },
      {
        "href": "/profile/tribeonchain",
        "medal": null,
        "rankText": "140.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "dave",
        "clan": {
          "alt": "Ounce Capital",
          "title": "Ounce Capital",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@tribeonchain",
        "pnlSign": "+",
        "pnlValue": "$521,845.89",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "16+"
      },
      {
        "href": "/profile/0xsneakky",
        "medal": null,
        "rankText": "141.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Sneaky",
        "clan": {
          "alt": "PeterGriffinFNF",
          "title": "PeterGriffinFNF",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@0xsneakky",
        "pnlSign": "+",
        "pnlValue": "$519,654.38",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "53+"
      },
      {
        "href": "/profile/JarlBalgruuf__",
        "medal": null,
        "rankText": "142.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Jarl Balgruuf",
        "clan": null,
        "handle": "@JarlBalgruuf__",
        "pnlSign": "+",
        "pnlValue": "$518,994.40",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "5+"
      },
      {
        "href": "/profile/juiceit",
        "medal": null,
        "rankText": "143.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "juice",
        "clan": null,
        "handle": "@juiceit",
        "pnlSign": "+",
        "pnlValue": "$514,161.30",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "13+"
      },
      {
        "href": "/profile/Iknowwhyy",
        "medal": null,
        "rankText": "144.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Iknowwhyy",
        "clan": {
          "alt": "Watchers",
          "title": "Watchers",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Iknowwhyy",
        "pnlSign": "+",
        "pnlValue": "$511,750.09",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "10+"
      },
      {
        "href": "/profile/gundam",
        "medal": null,
        "rankText": "145.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "gundam",
        "clan": null,
        "handle": "@gundam",
        "pnlSign": "+",
        "pnlValue": "$509,000.14",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "32+"
      },
      {
        "href": "/profile/lockelamora",
        "medal": null,
        "rankText": "146.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "locke lamora",
        "clan": null,
        "handle": "@lockelamora",
        "pnlSign": "+",
        "pnlValue": "$505,464.78",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "4+"
      },
      {
        "href": "/profile/cryptolyxe",
        "medal": null,
        "rankText": "147.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "lyxe",
        "clan": {
          "alt": "Dabal",
          "title": "Dabal",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@cryptolyxe",
        "pnlSign": "+",
        "pnlValue": "$500,739.11",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "10+"
      },
      {
        "href": "/profile/wokkrr",
        "medal": null,
        "rankText": "148.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "wokkrr",
        "clan": null,
        "handle": "@wokkrr",
        "pnlSign": "+",
        "pnlValue": "$485,484.44",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": null
      },
      {
        "href": "/profile/error",
        "medal": null,
        "rankText": "149.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "error",
        "clan": null,
        "handle": "@error",
        "pnlSign": "+",
        "pnlValue": "$485,227.18",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "18+"
      },
      {
        "href": "/profile/Tsukikage",
        "medal": null,
        "rankText": "150.",
        "avatarImg": "/images/nohomo-eyes.png",
        "avatarBg": null,
        "name": "Tsuki",
        "clan": {
          "alt": "HFT",
          "title": "HFT",
          "src": "/images/nohomo-eyes.png"
        },
        "handle": "@Tsukikage",
        "pnlSign": "+",
        "pnlValue": "$478,635.03",
        "pnlColor": "rgb(33, 201, 94)",
        "tokens": [
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "0px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          },
          {
            "src": "/images/nohomo-eyes.png",
            "marginLeft": "-5.6px"
          }
        ],
        "overflow": "17+"
      }
    ]
  };
  import Skeleton from "../Skeleton.svelte";
  import ChevronDown from "../../icons/chevron-down.svelte";
  import ChevronForward from "../../icons/chevron-forward.svelte";
  import ClanLaurelGold from "../../icons/clan-laurel-gold.svelte";
  import ClanLaurelSilver from "../../icons/clan-laurel-silver.svelte";
  import ClanLaurelBronze from "../../icons/clan-laurel-bronze.svelte";
  import Members from "../../icons/members.svelte";
  import Share from "../../icons/share.svelte";
  import MedalGold from "../../icons/medal-gold.svelte";
  import MedalSilver from "../../icons/medal-silver.svelte";
  import MedalBronze from "../../icons/medal-bronze.svelte";
  import NohomoIcon from "../../icons/nohomo.svelte";
  import PumpFunIcon from "../../icons/pumpfun.svelte";
  /** @type {{ cards: Record<string, import("../../lib/types").UserHoverCard> }} */
  // inlined from userHoverCards.json — no data file, the strings live with the code
  const userHoverCards =   {
    "source": "Four recorded trader hover cards: pointfarmcap, unipcs, theveeman and The__Solstice.",
    "cards": {
      "pointfarmcap": {
        "href": "/profile/pointfarmcap",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "point farm capital",
        "handle": "@pointfarmcap",
        "bio": "be the change you want to see onchain",
        "following": "0",
        "followers": "282K",
        "portfolio": null,
        "pnl": null
      },
      "unipcs": {
        "href": "/profile/unipcs",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "Unipcs",
        "handle": "@unipcs",
        "bio": "\"If the Lord will, we shall live, and do this, or that.\" - James 4:15",
        "following": "40",
        "followers": "679.2K",
        "portfolio": null,
        "pnl": null
      },
      "theveeman": {
        "href": "/profile/theveeman",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "Vee",
        "handle": "@theveeman",
        "bio": "",
        "following": "71",
        "followers": "243.4K",
        "portfolio": null,
        "pnl": null
      },
      "The__Solstice": {
        "href": "/profile/The__Solstice",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "name": "TheS◎Lstice",
        "handle": "@The__Solstice",
        "bio": "holder in a trader’s world",
        "following": "84",
        "followers": "278.8K",
        "portfolio": "$8,232,012.09",
        "pnl": {
          "sign": "+",
          "value": "$3,680,222.72",
          "color": "rgb(33, 201, 94)"
        }
      }
    },
    "defaultCard": "The__Solstice",
    "defaultCardNote": "Shown for a trader the capture has no card for yet: the card is one component, the numbers get filled in later."
  };
  import { openUserCard, closeHoverCard } from "../../lib/hoverCard.svelte.js";
  import {
    SOURCE_OPTIONS,
    SOURCE_BUTTON_ACTIVE_CLASSES,
    SOURCE_BUTTON_CLASSES,
    getError,
    getRows,
    getSource,
    getTimeRange,
    isLoading,
    getWindowLabel,
    selectSource,
    selectWindow,
    startLeaderboard,
    stopLeaderboard
  } from "../../lib/api/leaderboard.svelte.js";

  let clansOpen = $state(true);

  const rows = $derived(getRows());
  const range = $derived(getWindowLabel());
  const activeSource = $derived(getSource());
  const loadError = $derived(getError());
  // Placeholders only while the ranking is genuinely in flight.
  const loading = $derived(isLoading() && rows.length === 0);

  $effect(() => {
    startLeaderboard();
    return () => stopLeaderboard();
  });

  // Inline geometry read from the capture's computed styles. The class attributes
  // have no utilities for these values, so they stay as literal style strings.
  const CLAN_IMAGE_STYLE = "width: 36px; height: 36px;";
  const RANK_AVATAR_STYLE = "width: 36px; height: 36px; min-width: 36px; min-height: 36px;";
  const SKELETON_ROWS = Array.from({ length: 10 }, (_, i) => i);
  const CLAN_CHIP_STYLE = "width: 14px; height: 14px;";
  const TOKEN_SWATCH_STYLE = "width: 18px; height: 18px;";
  const OVERFLOW_BUBBLE_STYLE = "width: 23px; height: 23px; margin-left: -8px; font-size: 8px;";

  // Trader hover card. The rows already carry data-slot="hover-card-trigger" in the
  // capture, so the row is the trigger. The card is drawn by HoverCardLayer, at the root.
  //
  // It shows the trader's own numbers, for the window these rows are showing — the row's
  // PnL and the card's are the same figure, so they have to answer for the same window.
  // The capture's bio is kept only where the capture recorded that very trader.
  /** @param {MouseEvent} event @param {import("../../lib/types").LeaderboardRow} row */
  function openCard(event, row) {
    const captured = userHoverCards.cards[String(row.handle ?? "").replace("@", "")] ?? null;
    openUserCard(
      {
        href: row.href,
        chain: row.chain,
        walletAddress: row.walletAddress,
        name: row.name,
        handle: row.handle,
        avatar: row.avatarImg,
        bio: captured?.bio ?? null,
        timeRange: getTimeRange()
      },
      event
    );
  }
</script>

<div class="flex flex-col flex-1 min-h-0 gap-2">
  <!-- Clans -->
  <div class="flex flex-col gap-2 px-3 pt-2 border-b border-bg-tertiary pb-3">
    <div class="flex items-center justify-between">
      <button class={leaderboard.clans.buttonClasses} aria-expanded={clansOpen} onclick={() => (clansOpen = !clansOpen)}>
        <div class="text-sm">{leaderboard.clans.title}</div>
        <div class={leaderboard.clans.badgeClasses}>{leaderboard.clans.badgeLabel}</div>
        {#if clansOpen}
          <ChevronDown class={leaderboard.clans.chevronOpenClasses} />
        {:else}
          <ChevronDown class={leaderboard.clans.chevronClasses} />
        {/if}
      </button>
      <button class={leaderboard.clans.viewAllClasses}>
        {leaderboard.clans.viewAllLabel}<ChevronForward />
      </button>
    </div>

    {#if clansOpen}
      <div class="grid grid-cols-2 gap-2">
        {#each leaderboard.clans.cards as card (card.href)}
          <a
            class="flex items-center gap-2 rounded-lg bg-bg-secondary p-2 min-w-0 hover:bg-bg-tertiary focus-visible:bg-bg-tertiary"
            href={card.href}
            data-discover="true"
          >
            <div class="relative shrink-0">
              <img alt={card.name} class="shrink-0 object-cover rounded-md" src={card.img} style={CLAN_IMAGE_STYLE} />
              {#if card.medal}
                <div class="absolute -bottom-1 -right-1 flex rounded-sm bg-bg-secondary px-0.5">
                  {#if card.medal === 1}<ClanLaurelGold />{:else if card.medal === 2}<ClanLaurelSilver />{:else if card.medal === 3}<ClanLaurelBronze />{/if}
                </div>
              {/if}
            </div>
            <div class="flex flex-col gap-0.5 min-w-0">
              <div class="text-sm truncate" translate="no">{card.name}</div>
              <div class="flex items-center gap-1 min-w-0">
                <div class="flex items-center gap-1 max-2xl:hidden">
                  <Members />
                  <div class="text-xs text-text-secondary" translate="no">{card.members}</div>
                </div>
                <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: 16px;">
                  <div style="font-size: 12px; font-weight: 500; color: {card.pnlColor};">{card.pnlSign}</div>
                  <div style="font-size: 12px; font-weight: 500; color: {card.pnlColor};">{card.pnlValue}</div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Window selector, the source selector, and share -->
  <div class="flex items-center gap-2 px-3 pb-1">
    {#each leaderboard.windows as win (win.label)}
      <button
        aria-pressed={win.label === range}
        class={win.label === range ? leaderboard.activeWindowClasses : leaderboard.inactiveWindowClasses}
        onclick={() => selectWindow(win.label)}
      >{win.label}</button>
    {/each}

    <!-- Source filter: which labelled-wallet platform the ranking is drawn from.
         Marks only — no text, so each button carries its name in aria-label. Sits to
         the right of the window group, the way Ombra's ranking filters separate chain /
         time range / source into their own groups. -->
    {#each SOURCE_OPTIONS as option (option.value)}
      <button
        type="button"
        aria-label={option.label}
        aria-pressed={activeSource === option.value}
        title={option.label}
        class={activeSource === option.value ? SOURCE_BUTTON_ACTIVE_CLASSES : SOURCE_BUTTON_CLASSES}
        onclick={() => selectSource(option.value)}
      >
        {#if option.value === "FOMO"}
          <NohomoIcon class="h-3.5 w-3.5" />
        {:else}
          <PumpFunIcon class="h-3.5 w-3.5" />
        {/if}
      </button>
    {/each}

    <button
      type="button"
      aria-label="Share"
      aria-haspopup="dialog"
      aria-expanded="false"
      class={leaderboard.shareClasses}
    >
      <Share aria-hidden="true" />
    </button>
  </div>

  <!-- The current user, always visible above the list -->
  <div class="mx-3 border-b border-dashed border-bg-tertiary py-2 flex items-center gap-2">
    <div
      class="rounded-full flex items-center justify-center shrink-0 object-cover"
      style={leaderboard.yourRank.avatarStyle}
    >
      <img class="w-[70%] h-[70%]" src={leaderboard.yourRank.eyesSrc} alt="" />
    </div>
    <div class="flex flex-col items-start flex-1">
      <div class="text-xs text-text-secondary">{leaderboard.yourRank.label}</div>
      <div class="flex items-center gap-1">
        <span class="text-accent-primary font-bold">{leaderboard.yourRank.hash}</span>
        <span class="font-bold">{leaderboard.yourRank.rank}</span>
      </div>
    </div>
    <div class="flex flex-col items-end">
      <div class="text-xs text-text-secondary">{leaderboard.yourRank.pnlLabel}</div>
      <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: 20px;">
        <div style="font-size: 16px; font-weight: 500; color: {leaderboard.yourRank.pnlColor};">{leaderboard.yourRank.pnlSign}</div>
        <div style="font-size: 16px; font-weight: 500; color: {leaderboard.yourRank.pnlColor};">{leaderboard.yourRank.pnlValue}</div>
      </div>
    </div>
  </div>

  <!-- Ranked users -->
  <div class="relative flex flex-col min-h-0 flex-1">
    <!-- A failed load must say so: an empty list that looks identical to "still
         loading" hides the failure entirely. -->
    {#if loadError}
      <div class="px-3 py-2 text-xs text-text-secondary">{loadError}</div>
    {/if}
    <div class="flex flex-col gap-px min-h-0 overflow-y-scroll overflow-x-hidden flex-1 px-2">
      {#if loading}
        {#each SKELETON_ROWS as key (key)}
          <div class="flex gap-2.5 items-center px-2 py-1 rounded-lg min-w-0">
            <Skeleton class="h-4 w-5 shrink-0" />
            <Skeleton class="rounded-full shrink-0" style={RANK_AVATAR_STYLE} />
            <div class="flex flex-col justify-between gap-0.5 min-w-0 shrink flex-1">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-3 w-20" />
            </div>
            <div class="flex flex-col items-end h-12 gap-1 justify-center shrink-0">
              <Skeleton class="h-4 w-24" />
            </div>
          </div>
        {/each}
      {/if}
      {#each rows as row (row.traderKey)}
        <a
          class="flex gap-2.5 items-center px-2 py-1 rounded-lg min-w-0 hover:bg-bg-secondary focus-visible:bg-bg-secondary"
          data-state="closed"
          data-slot="hover-card-trigger"
          href={row.href}
          data-discover="true"
          onmouseenter={(event) => openCard(event, row)}
          onmouseleave={closeHoverCard}
          onfocusin={(event) => openCard(event, row)}
          onfocusout={closeHoverCard}
        >
          {#if row.medal === 1}
            <MedalGold />
          {:else if row.medal === 2}
            <MedalSilver />
          {:else if row.medal === 3}
            <MedalBronze />
          {:else}
            <div class="text-center text-xs text-text-secondary shrink-0 w-5" translate="no">{row.rankText}</div>
          {/if}

          {#if row.avatarImg}
            <img
              class="rounded-full flex items-center justify-center shrink-0 object-cover"
              src={row.avatarImg}
              alt=""
              style={RANK_AVATAR_STYLE}
            />
          {:else}
            <!-- No photo on this trader: the capture's placeholder tint has no source
                 on this endpoint, so the eyes mark renders untinted. -->
            <div
              class="rounded-full flex items-center justify-center shrink-0 object-cover bg-bg-tertiary"
              style={RANK_AVATAR_STYLE}
            >
              <img class="w-[70%] h-[70%]" src={leaderboard.yourRank.eyesSrc} alt="" />
            </div>
          {/if}

          <div class="flex flex-col justify-between gap-0.5 min-w-0 shrink flex-1">
            <div class="flex items-center gap-1 min-w-0">
              <div translate="no" class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm">
                <div class="min-w-0 truncate">{row.name}</div>
              </div>
              {#if row.clan}
                <img
                  alt={row.clan.alt}
                  title={row.clan.title}
                  class="shrink-0 object-cover rounded-sm"
                  src={row.clan.src}
                  style={CLAN_CHIP_STYLE}
                />
              {/if}
            </div>
            <div class="text-text-secondary text-xs truncate">
              <span translate="no">{row.handle}</span>
            </div>
          </div>

          <div class="flex flex-col items-end h-12 gap-1 justify-center shrink-0">
            <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: 20px;">
              <div style="font-size: 14px; font-weight: 500; color: {row.pnlColor};">{row.pnlSign}</div>
              <div style="font-size: 14px; font-weight: 500; color: {row.pnlColor};">{row.pnlValue}</div>
            </div>
            <div class="flex flex-row items-center">
              <!-- The ranking endpoint carries no per-token list (only a count), so the
                   capture's token swatches have no live source and are left out. What
                   sits here instead is the window's win rate: the one quality figure
                   this endpoint does carry per trader, and the same figure Ombra prints
                   on its compact ranking card. -->
              <span class="text-[10px] text-text-secondary" title="{row.trades} trades">
                Win <span class="text-text-primary font-medium">{row.winRate}</span>
              </span>
              {#if row.tokens}
                {#each row.tokens as token (token.src)}
                  <div
                    class="rounded-full border-2 border-bg-primary bg-bg-secondary overflow-hidden shrink-0"
                    style="{TOKEN_SWATCH_STYLE} margin-left: {token.marginLeft};"
                  >
                    <img class="w-full h-full rounded-full object-cover" src={token.src} alt="" />
                  </div>
                {/each}
              {/if}
              {#if row.overflow}
                <div
                  class="rounded-full border border-bg-primary bg-bg-secondary flex items-center justify-center overflow-hidden shrink-0 text-text-secondary font-medium"
                  style={OVERFLOW_BUBBLE_STYLE}
                >{row.overflow}</div>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t to-transparent from-bg-primary"></div>
  </div>
</div>
