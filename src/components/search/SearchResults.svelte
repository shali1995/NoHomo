<script>
  // The search box's open state, ported from the capture: the tab row, then the matched
  // tokens. The tabs and their classes are the capture's.
  //
  // The rows are live now: typing runs `/v2/scanner/tokens/search` through
  // src/lib/api/search.svelte.js and the hits are kept current on the `scanner:lookup`
  // socket. The capture's own result rows were a frozen list for the query "hi", and its
  // Users / Clans rows have no live source yet, so only tokens are rendered here.
  import SearchResultRow from "./SearchResultRow.svelte";
  /** @type {{ tabs: string[] }} */
  // inlined from searchPanel.json — no data file, the strings live with the code
  const searchPanel =   {
    "source": "The search panel's two recorded states: the result list for a typed query, and the Recents list.",
    "placeholder": "Search for tokens or traders...",
    "recentsTitle": "Recents",
    "clearAllLabel": "Clear all",
    "tabs": [
      "All",
      "Tokens",
      "Users",
      "Clans"
    ],
    "results": [
      {
        "href": "/tokens/base/0xb200000000000000000000cfbdf64a8706a94a01",
        "name": "BLUECHIP",
        "description": "BLUE CHIP",
        "contract": "0xb200...a94a01",
        "logo": "https://token-media.defined.fi/8453_0xb200000000000000000000cfbdf64a8706a94a01_thumb_e9a74d21ff4e.png",
        "network": "base",
        "marketCap": "$12.8M",
        "priceLead": "$0.0129",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▼",
        "changeValue": "0.26%",
        "changeColor": "rgb(255, 98, 46)",
        "volume": "$399.1K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp",
        "name": "$michi",
        "description": "michi",
        "contract": "5mbK36...BSoWdp",
        "logo": "https://token-media.defined.fi/1399811149_5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp_thumb_4c3b0fdb-00c2-4a44-afcd-bf72430ebcd4.png",
        "network": "solana",
        "marketCap": "$431K",
        "priceLead": "$0.000776",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "10.32%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$3.7K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump",
        "name": "CHILLGUY",
        "description": "Just a chill guy",
        "contract": "Df6yfr...4Jpump",
        "logo": "https://token-media.defined.fi/1399811149_Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump_thumb_aa45e5b35d48.png",
        "network": "solana",
        "marketCap": "$14.6M",
        "priceLead": "$0.0146",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "5.90%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$558.6K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/4TBi66vi32S7J8X1A6eWfaLHYmUXu7CStcEmsJQdpump",
        "name": "Ghibli",
        "description": "Ghiblification",
        "contract": "4TBi66...Qdpump",
        "logo": "https://token-media.defined.fi/1399811149_4TBi66vi32S7J8X1A6eWfaLHYmUXu7CStcEmsJQdpump_thumb_7a9add82ae9b.png",
        "network": "solana",
        "marketCap": "$130.8K",
        "priceLead": "$0.000131",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "10.94%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$1.1K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/GkyPYa7NnCFbduLknCfBfP7p8564X1VZhwZYJ6CZpump",
        "name": "CHILLHOUSE",
        "description": "Chill House",
        "contract": "GkyPYa...CZpump",
        "logo": "https://token-media.defined.fi/1399811149_GkyPYa7NnCFbduLknCfBfP7p8564X1VZhwZYJ6CZpump_thumb_3d75386f7bf6.png",
        "network": "solana",
        "marketCap": "$2.2M",
        "priceLead": "$0.00222",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "4.65%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$68.4K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/DHJVYXsikcimtcVo49FAZqYd1XPYPaXezYhbKArJbonk",
        "name": "BlueChip",
        "description": "Blue Chip",
        "contract": "DHJVYX...rJbonk",
        "logo": "https://token-media.defined.fi/1399811149_DHJVYXsikcimtcVo49FAZqYd1XPYPaXezYhbKArJbonk_thumb_7980a9b00686.png",
        "network": "solana",
        "marketCap": "$41.4K",
        "priceLead": "$0.0",
        "priceSub": "4",
        "priceRest": "4151",
        "changeArrow": "▲",
        "changeValue": "6.91%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$151",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/HaUXAdAWWUkb2WTmh8z1TdaEmZkYjnQnmC6tHUdTAHvi",
        "name": "KIMCHI",
        "description": "Kimchi",
        "contract": "HaUXAd...dTAHvi",
        "logo": "https://token-media.defined.fi/1399811149_HaUXAdAWWUkb2WTmh8z1TdaEmZkYjnQnmC6tHUdTAHvi_thumb_753c986497ac.png",
        "network": "solana",
        "marketCap": "$19.8K",
        "priceLead": "$0.0",
        "priceSub": "4",
        "priceRest": "1983",
        "changeArrow": "▲",
        "changeValue": "7.76%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$37",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/base/0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4",
        "name": "TOSHI",
        "description": "Toshi",
        "contract": "0xac1b...31b2b4",
        "logo": "https://token-media.defined.fi/8453_0xac1bd2486aaf3b5c0fc3fd868558b082a531b2b4_thumb_057118e6c880.png",
        "network": "base",
        "marketCap": "$52.3M",
        "priceLead": "$0.000125",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "6.44%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$39.7K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/base/0xf6e932ca12afa26665dc4dde7e27be02a7c02e50",
        "name": "MOCHI",
        "description": "Mochi",
        "contract": "0xf6e9...c02e50",
        "logo": "https://token-media.defined.fi/8453_0xf6e932ca12afa26665dc4dde7e27be02a7c02e50_thumb_9d5d0ac7a415.png",
        "network": "base",
        "marketCap": "$986.1K",
        "priceLead": "$0.0",
        "priceSub": "6",
        "priceRest": "9861",
        "changeArrow": "▲",
        "changeValue": "7.91%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$1.3K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/2TpMjYXnrgxoeVCq2i6EAR8vNWqe5MNvHCz3bENNpump",
        "name": "CHIBI",
        "description": "Chibification",
        "contract": "2TpMjY...NNpump",
        "logo": "https://token-media.defined.fi/1399811149_2TpMjYXnrgxoeVCq2i6EAR8vNWqe5MNvHCz3bENNpump_thumb_f05646b3866f.png",
        "network": "solana",
        "marketCap": "$36.7K",
        "priceLead": "$0.0",
        "priceSub": "4",
        "priceRest": "3679",
        "changeArrow": "▲",
        "changeValue": "6.69%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$237",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/x95HN3DWvbfCBtTjGm587z8suK3ec6cwQwgZNLbWKyp",
        "name": "$HACHIKO",
        "description": "Hachiko",
        "contract": "x95HN3...LbWKyp",
        "logo": "https://token-media.defined.fi/1399811149_x95HN3DWvbfCBtTjGm587z8suK3ec6cwQwgZNLbWKyp_thumb_8a26a3a3da26.png",
        "network": "solana",
        "marketCap": "$1M",
        "priceLead": "$0.0",
        "priceSub": "8",
        "priceRest": "1117",
        "changeArrow": "▼",
        "changeValue": "1.33%",
        "changeColor": "rgb(255, 98, 46)",
        "volume": "$85.2K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/base/0x0c1c1c109fe34733fca54b82d7b46b75cfb71f6e",
        "name": "CHIP",
        "description": "Chip",
        "contract": "0x0c1c...b71f6e",
        "logo": "https://token-media.defined.fi/8453_0x0c1c1c109fe34733fca54b82d7b46b75cfb71f6e_thumb_7a20123a3e8b.png",
        "network": "base",
        "marketCap": "$471.4M",
        "priceLead": "$0.0471",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "11.83%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$1.2M",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump",
        "name": "WhiteWhale",
        "description": "The White Whale",
        "contract": "a3W4qu...wppump",
        "logo": "https://token-media.defined.fi/1399811149_a3W4qutoEJA4232T2gwZUfgYJTetr96pU4SJMwppump_thumb_90a2dea7e409.png",
        "network": "solana",
        "marketCap": "$888.7K",
        "priceLead": "$0.000889",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "5.86%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$43.1K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/base/0x9f62b62cf8cc3aea56a3ce8808cf13503d1131e7",
        "name": "thenickshirley",
        "description": "thenickshirley",
        "contract": "0x9f62...1131e7",
        "logo": "https://token-media.defined.fi/8453_0x9f62b62cf8cc3aea56a3ce8808cf13503d1131e7_thumb_44da2a46b175.png",
        "network": "base",
        "marketCap": "$95.4K",
        "priceLead": "$0.0",
        "priceSub": "4",
        "priceRest": "9548",
        "changeArrow": "▼",
        "changeValue": "3.92%",
        "changeColor": "rgb(255, 98, 46)",
        "volume": "$14.4K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/F7pB3ZdfBnyFw2LRHydWEn9BmhEa5XihXLjhySFRpump",
        "name": "NOTHING",
        "description": "You’ll own nothing & be happy",
        "contract": "F7pB3Z...FRpump",
        "logo": "https://token-media.defined.fi/1399811149_F7pB3ZdfBnyFw2LRHydWEn9BmhEa5XihXLjhySFRpump_thumb_82b132ea3565.png",
        "network": "solana",
        "marketCap": "$297K",
        "priceLead": "$0.000297",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "13.04%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$27.6K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/chipCAT7vi5CZtbZsn9z7iMPXvFwyAnKz3QFu8XVuHm",
        "name": "CHIP",
        "description": "Chip",
        "contract": "chipCA...8XVuHm",
        "logo": "https://token-media.defined.fi/1399811149_chipCAT7vi5CZtbZsn9z7iMPXvFwyAnKz3QFu8XVuHm_thumb_fb39962dcd68.png",
        "network": "solana",
        "marketCap": "$468.8M",
        "priceLead": "$0.0469",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "10.71%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$116.7K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/ethereum/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
        "name": "SHIB",
        "description": "SHIBA INU",
        "contract": "0x95ad...64c4ce",
        "logo": "https://token-media.defined.fi/1_0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce_thumb_a0865d35876f.png",
        "network": null,
        "marketCap": "$3.5B",
        "priceLead": "$0.0",
        "priceSub": "5",
        "priceRest": "5951",
        "changeArrow": "▲",
        "changeValue": "8.20%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$234.3K",
        "hasX": false,
        "hasStar": true
      },
      {
        "href": "/tokens/solana/AywAYdNJnSLSXwKWYxDciPjqGRnwp4iZdQptuuQTpump",
        "name": "MICHI",
        "description": "michi",
        "contract": "AywAYd...QTpump",
        "logo": "https://token-media.defined.fi/1399811149_AywAYdNJnSLSXwKWYxDciPjqGRnwp4iZdQptuuQTpump_thumb_8a9b8a6c2b73.png",
        "network": "solana",
        "marketCap": "$4.3M",
        "priceLead": "$0.00435",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "1.37%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$66.4K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/ethereum/0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
        "name": "SUSHI",
        "description": "Sushi",
        "contract": "0x6b35...c90fe2",
        "logo": "https://media.thegrid.id/id1753735222-DG6ngSjeSR-RW4CtC3y07Q/7/id1753752955-PQUIdgIbQN-19VKTd5ZoGg/id1761223287-yofTwDGNQzWuWUaALp4d4Q/image-1773923801.png",
        "network": "ethereum",
        "marketCap": "$74M",
        "priceLead": "$0.254",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▲",
        "changeValue": "0.61%",
        "changeColor": "rgb(33, 201, 94)",
        "volume": "$102.3K",
        "hasX": true,
        "hasStar": true
      },
      {
        "href": "/tokens/robinhood/0x42afa2124ca5a2b83898e46b2da9a190995b1e18",
        "name": "SCHIFFY",
        "description": "SCHIFFY",
        "contract": "0x42af...5b1e18",
        "logo": "https://token-media.defined.fi/4663_0x42afa2124ca5a2b83898e46b2da9a190995b1e18_thumb_564468849f34.png",
        "network": "robinhood",
        "marketCap": "$7M",
        "priceLead": "$0.00712",
        "priceSub": null,
        "priceRest": null,
        "changeArrow": "▼",
        "changeValue": "30.50%",
        "changeColor": "rgb(255, 98, 46)",
        "volume": "$1M",
        "hasX": true,
        "hasStar": true
      }
    ],
    "recents": [
      {
        "href": "/profile/moemoney9",
        "name": "moemoney9",
        "handle": "@moemoney9",
        "avatar": "/images/nohomo-eyes.png",
        "avatarBg": "rgb(255, 111, 233)"
      },
      {
        "href": "/profile/dezenuts",
        "name": "dezenuts",
        "handle": "@dezenuts",
        "avatar": "/images/nohomo-eyes.png",
        "avatarBg": "rgb(115, 204, 255)"
      },
      {
        "href": "/profile/BACKONLINE",
        "name": "BACKONLINE",
        "handle": "@BACKONLINE",
        "avatar": "/images/nohomo-eyes.png",
        "avatarBg": "rgb(115, 204, 255)"
      },
      {
        "href": "/profile/Faaaahhhh",
        "name": "Faaaahhhh",
        "handle": "@Faaaahhhh",
        "avatar": "/images/nohomo-eyes.png",
        "avatarBg": "rgb(255, 134, 73)"
      },
      {
        "href": "/profile/elchiva",
        "name": "elchiva",
        "handle": "@elchiva",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/glgajj",
        "name": "glgajj",
        "handle": "@glgajj",
        "avatar": "/images/nohomo-eyes.png",
        "avatarBg": "rgb(255, 111, 233)"
      },
      {
        "href": "/profile/STONKOZ",
        "name": "STONKOZ",
        "handle": "@STONKOZ",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/Young_Coin8",
        "name": "Young Coin",
        "handle": "@Young_Coin8",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/cedriclyod",
        "name": "cedriclyod",
        "handle": "@cedriclyod",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      }
    ],
    "users": [
      {
        "href": "/profile/himgajria",
        "name": "Him",
        "handle": "@himgajria",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/kimchi11x",
        "name": "kimchi",
        "handle": "@kimchi11x",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/hihi33",
        "name": "hihi33",
        "handle": "@hihi33",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/ventikohi",
        "name": "Kohi",
        "handle": "@ventikohi",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/kimchiialt",
        "name": "Kimchi",
        "handle": "@kimchiialt",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/washieth",
        "name": "washi",
        "handle": "@washieth",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/hirozaki2020",
        "name": "Hirozaki 🏴",
        "handle": "@hirozaki2020",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": null
      },
      {
        "href": "/profile/kimchi",
        "name": "kimchi",
        "handle": "@kimchi",
        "avatar": null,
        "avatarBg": "rgb(69, 254, 130)"
      },
      {
        "href": "/profile/HighDizzyBat",
        "name": "HighDizzyBat",
        "handle": "@HighDizzyBat",
        "avatar": null,
        "avatarBg": "rgb(115, 204, 255)"
      },
      {
        "href": "/profile/Pedophile",
        "name": "Hi",
        "handle": "@Pedophile",
        "avatar": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "avatarBg": "rgb(67, 86, 255)"
      }
    ],
    "clans": [
      {
        "href": "/clans/37f640d4-b66a-48d6-b47c-bdae2dfe4de3",
        "name": "HILO",
        "logo": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "members": "4 members",
        "pnlSign": "-",
        "pnlValue": "$79.10",
        "pnlColor": "rgb(255, 98, 46)",
        "avatars": [
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          }
        ]
      },
      {
        "href": "/clans/9769b8df-1a28-46d7-80e4-dc64f6377831",
        "name": "HFT",
        "logo": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "members": "23 members",
        "pnlSign": "+",
        "pnlValue": "$196,932.75",
        "pnlColor": "rgb(33, 201, 94)",
        "avatars": [
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          }
        ]
      },
      {
        "href": "/clans/0c30433c-618f-441d-92ea-7c2a69c96c37",
        "name": "HYDRA",
        "logo": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "members": "6 members",
        "pnlSign": "+",
        "pnlValue": "$21,446.51",
        "pnlColor": "rgb(33, 201, 94)",
        "avatars": [
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          }
        ]
      },
      {
        "href": "/clans/80b2cce3-6a0f-47f5-a9e0-ef48baa81309",
        "name": "Heaven",
        "logo": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "members": "8 members",
        "pnlSign": "+",
        "pnlValue": "$10,343.22",
        "pnlColor": "rgb(33, 201, 94)",
        "avatars": [
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          }
        ]
      },
      {
        "href": "/clans/816fa50f-79f3-47e3-95c1-0fd9fc1d5388",
        "name": "HUNGRY",
        "logo": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "members": "6 members",
        "pnlSign": "+",
        "pnlValue": "$2,137.45",
        "pnlColor": "rgb(33, 201, 94)",
        "avatars": [
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          }
        ]
      },
      {
        "href": "/clans/bcf1e144-59ca-4dd4-92ad-dd295430a8ab",
        "name": "HNTR",
        "logo": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA",
        "members": "9 members",
        "pnlSign": "+",
        "pnlValue": "$1,640.16",
        "pnlColor": "rgb(33, 201, 94)",
        "avatars": [
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          },
          {
            "kind": "eyes",
            "src": "/images/nohomo-eyes.png"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png"
          },
          {
            "kind": "img",
            "src": "/images/nohomo-eyes.png?k=264ePPioO65IMM81POwFAM1LA"
          }
        ]
      }
    ]
  };
  import { getSearchRows } from "../../lib/api/search.svelte.js";

  /** @type {{ onPick?: () => void, selectedIndex?: number, onHover?: (index: number) => void }} */
  let { onPick, selectedIndex = -1, onHover } = $props();

  const rows = $derived(getSearchRows());

  /**
   * A result is an `<a>`, and the box closes on blur -- which used to collapse this
   * panel (`max-h-0 pointer-events-none`) on mousedown, before the click could reach the
   * link, so picking a result did nothing. Holding focus on the field until the click
   * has landed keeps the panel open that one moment; the pick then closes it.
   */
  function holdFocus(event) {
    if (event.target instanceof Element && event.target.closest("[data-search-result]")) {
      event.preventDefault();
    }
  }

  function pick(event) {
    if (event.target instanceof Element && event.target.closest("[data-search-result]")) onPick?.();
  }
</script>

<!-- Tabs and results, in the capture's nesting: the tabs row then the scrollable
     list, both inside the container the box opens. -->
<div class="flex h-9 shrink-0 gap-1 items-center">
  {#each searchPanel.tabs as tab (tab)}
    <button
      class="rounded-md border border-bg-tertiary-solid px-1.5 py-0.5 text-xs font-bold {tab ===
      searchPanel.tabs[0]
        ? 'hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:bg-bg-secondary bg-bg-tertiary text-text-primary'
        : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary focus:outline-none focus:bg-bg-secondary'}"
    >
      {tab}
    </button>
  {/each}
</div>

<div>
  <div class="flex min-h-70 max-h-110 flex-col overflow-y-auto" onmousedown={holdFocus} onclick={pick}>
    {#each rows as row, index (row.pairAddress)}
      <SearchResultRow {row} {index} selected={index === selectedIndex} {onHover} />
    {/each}
  </div>
</div>
