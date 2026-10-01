<script>
  // Profile page body: the composition root for everything below the header.
  //
  // It keeps only what the parts share: the `@container/profile` wrapper the container
  // queries fire from, the left/right column layout, the rail column and the `variant` +
  // `children` props. The panels live beside it and read their numbers from
  // src/lib/api/profile.svelte.js themselves.
  //
  // The capture holds both variants — `RareTotalFowl` is the profile of the account you
  // are signed in as, `The__Solstice` is somebody else's — and they differ in chrome
  // alone: the rail is the follow rail on your own page and the send rail on another's.
  // inlined from profileBody.json — no data file, the strings live with the code
  const body =   {
    "other": {
      "rail": {
        "classes": "flex-col shrink-0 gap-4 pr-5 flex w-75 @[1536px]/profile:w-90",
        "kind": "send",
        "user": {
          "handle": "The__Solstice",
          "img": "eb2964462438bba9a804412266799318.jpg"
        },
        "amountHint": "Enter amount",
        "cashValue": "$7.72"
      },
      "portfolio": {
        "valueInt": "$8,415,421",
        "valueFrac": ".38",
        "change": "+$1,454,633.16",
        "changeColor": "rgb(33, 201, 94)",
        "pillStyle": "left: calc(0% + 2px); width: calc(33.3333% - 1.33333px);",
        "tabs": [
          {
            "label": "24H",
            "on": true
          },
          {
            "label": "7D",
            "on": false
          },
          {
            "label": "30D",
            "on": false
          }
        ],
        "chartStyle": "height: 200px; opacity: 1;"
      },
      "cash": {
        "label": "Total cash",
        "value": "$235.57",
        "actions": []
      },
      "positions": {
        "title": "Positions",
        "count": "50",
        "sortLabel": "Show dust",
        "sortIcon": "dust",
        "openPill": {
          "classes": "flex gap-1 items-center justify-center px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors duration-150 bg-accent-primary-transparent text-accent-primary",
          "dot": "bg-accent-primary"
        },
        "closedPill": {
          "classes": "flex items-center justify-center px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors duration-150 text-text-tertiary",
          "dot": null
        },
        "headCols": [
          "Avg. entry",
          "Position"
        ],
        "headRight": {
          "spans": [
            {
              "classes": "@[600px]:hidden",
              "text": "Position"
            },
            {
              "classes": "hidden @[600px]:inline",
              "text": "PnL"
            }
          ]
        },
        "variant": "open",
        "rows": [
          {
            "img": "1399811149_6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx_thumb_075290c702ff.png",
            "verified": true,
            "ticker": "STONK",
            "sub": "20.8MSTONK",
            "mcapTag": "$317.3M",
            "mcap": "$5.7M",
            "price": {
              "prefix": "$0.00674"
            },
            "value": "$7,823,858.52",
            "amount": "20.8MSTONK",
            "up": true,
            "mobPct": "4,812.07%",
            "sign": "+",
            "pnl": "$7,682,726.25",
            "pct": "4,812.07%"
          },
          {
            "img": "8453_0x5ab000ff9b9ffe0349ce5ffa5fd86f217c3680f5_thumb_c5b09d337689.png",
            "verified": true,
            "ticker": "STONKEX",
            "sub": "21.4MSTONKEX",
            "mcapTag": "$11M",
            "mcap": "$2.3M",
            "price": {
              "prefix": "$0.00237"
            },
            "value": "$238,004.05",
            "amount": "21.4MSTONKEX",
            "up": true,
            "mobPct": "367.70%",
            "sign": "+",
            "pnl": "$187,116.29",
            "pct": "367.70%"
          },
          {
            "img": "8453_0xb2000000000000000000004c27f6523082f41d01_thumb_cac4d310bd5c.png",
            "verified": true,
            "ticker": "Basecat",
            "sub": "5.7MBasecat",
            "mcapTag": "$19.4M",
            "mcap": "$15.6M",
            "price": {
              "prefix": "$0.0157"
            },
            "value": "$111,465.10",
            "amount": "5.7MBasecat",
            "up": true,
            "mobPct": "59.28%",
            "sign": "+",
            "pnl": "$119,089.12",
            "pct": "59.28%"
          },
          {
            "img": "1399811149_4UHmZGe6X4DZ5dxYGiGXMhi3Sp34uPWtHB7qDMyvRbYB_thumb_967b51af2761.png",
            "verified": false,
            "ticker": "QUEEF",
            "sub": "14.1MQUEEF",
            "mcapTag": "$2.9M",
            "mcap": "$1.6M",
            "price": {
              "prefix": "$0.00161"
            },
            "value": "$41,294.82",
            "amount": "14.1MQUEEF",
            "up": true,
            "mobPct": "81.18%",
            "sign": "+",
            "pnl": "$18,503.23",
            "pct": "81.18%"
          },
          {
            "img": "1399811149_FFT4bgyrvzyB5TKAziLkAzBj8mboduzJeDdZ27TU4FHm_thumb_fc034e778cb1.png",
            "verified": false,
            "ticker": "DEX",
            "sub": "31.2MDEX",
            "mcapTag": "$1M",
            "mcap": "$89.5K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "928"
            },
            "value": "$33,967.15",
            "amount": "31.2MDEX",
            "up": true,
            "mobPct": "1,094.13%",
            "sign": "+",
            "pnl": "$34,595.25",
            "pct": "1,094.13%"
          },
          {
            "img": "1399811149_9h5AzEQzYu9CV5K6uLtFRMD1KcbxZSFNxZEgBTNfw5Na_thumb_82e74dfb6e07.png",
            "verified": false,
            "ticker": "STONKCATS",
            "sub": "29.7MSTONKCATS",
            "mcapTag": "$1M",
            "mcap": "$55.5K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "5552"
            },
            "value": "$32,051.82",
            "amount": "29.7MSTONKCATS",
            "up": true,
            "mobPct": "1,835.03%",
            "sign": "+",
            "pnl": "$30,409.59",
            "pct": "1,835.03%"
          },
          {
            "img": "4663_0x3ba500f1ababbcf0f0247d06d1c56fd7e6c4c09d_thumb_ca496e477826.png",
            "verified": false,
            "ticker": "WORM",
            "sub": "5.9MWORM",
            "mcapTag": "$4.9M",
            "mcap": "$5.1M",
            "price": {
              "prefix": "$0.00511"
            },
            "value": "$29,397.00",
            "amount": "5.9MWORM",
            "up": false,
            "mobPct": "3.41%",
            "sign": "-",
            "pnl": "$1,039.20",
            "pct": "3.41%"
          },
          {
            "img": "1399811149_4tkupXEGfbYPCVN37CagviJd3tgWnudT9avKZvouT3Dm_thumb_174fbdcc9a1b.png",
            "verified": false,
            "ticker": "HEV",
            "sub": "14.8MHEV",
            "mcapTag": "$1.6M",
            "mcap": "$1.4M",
            "price": {
              "prefix": "$0.00155"
            },
            "value": "$24,946.22",
            "amount": "14.8MHEV",
            "up": true,
            "mobPct": "7.26%",
            "sign": "+",
            "pnl": "$1,749.57",
            "pct": "7.26%"
          },
          {
            "img": "4663_0x73c2de14c7fa0a57cc2d9722b959ea70b881ffe4_thumb_13eef01838c0.png",
            "verified": false,
            "ticker": "BOOMER",
            "sub": "14.8MBOOMER",
            "mcapTag": "$1.4M",
            "mcap": "$2.6M",
            "price": {
              "prefix": "$0.00269"
            },
            "value": "$21,445.28",
            "amount": "14.8MBOOMER",
            "up": false,
            "mobPct": "46.44%",
            "sign": "-",
            "pnl": "$18,594.41",
            "pct": "46.44%"
          },
          {
            "img": "1399811149_7hGgx1VtNTj193fFXXuMEkp1MRV6JbWYgMBhHRYxaxu2_thumb_1a1992b09946.png",
            "verified": false,
            "ticker": "FRIES",
            "sub": "17.5MFRIES",
            "mcapTag": "$696.8K",
            "mcap": "$130.9K",
            "price": {
              "prefix": "$0.000132"
            },
            "value": "$12,334.36",
            "amount": "17.5MFRIES",
            "up": true,
            "mobPct": "432.32%",
            "sign": "+",
            "pnl": "$10,017.25",
            "pct": "432.32%"
          },
          {
            "img": "56_0xb077ada375b5e416f15e8b8f6827dadfa53a7777_thumb_8c2ed703627c.png",
            "verified": false,
            "ticker": "$牛马",
            "sub": "3.9M$牛马",
            "mcapTag": "$1.9M",
            "mcap": "$2.5M",
            "price": {
              "prefix": "$0.00255"
            },
            "value": "$7,622.86",
            "amount": "3.9M$牛马",
            "up": false,
            "mobPct": "23.48%",
            "sign": "-",
            "pnl": "$2,339.43",
            "pct": "23.48%"
          },
          {
            "img": "1399811149_F8ZreugBAokXk8wU5FUe2EbLhCHxDKMTx82pfZryHStT_thumb_1894896a9d2e.png",
            "verified": false,
            "ticker": "STABLE",
            "sub": "15.6MSTABLE",
            "mcapTag": "$475.1K",
            "mcap": "$353.4K",
            "price": {
              "prefix": "$0.000353"
            },
            "value": "$7,457.47",
            "amount": "15.6MSTABLE",
            "up": true,
            "mobPct": "34.45%",
            "sign": "+",
            "pnl": "$1,910.67",
            "pct": "34.45%"
          },
          {
            "img": "1399811149_9PSxYDFLPbSVx2PKjYRMumW14xtxViQU3Qmi7M8NQ32W_thumb_f94202e5c94c.png",
            "verified": false,
            "ticker": "INCOME",
            "sub": "11.7MINCOME",
            "mcapTag": "$430.4K",
            "mcap": "$67.1K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "6926"
            },
            "value": "$5,214.99",
            "amount": "11.7MINCOME",
            "up": true,
            "mobPct": "540.84%",
            "sign": "+",
            "pnl": "$4,401.22",
            "pct": "540.84%"
          },
          {
            "img": "1399811149_4pEw2gjX7fjKoeCGoV5MRc3QxwLTR1TBEbJDvfNzThoZ_thumb_3508496f75fc.png",
            "verified": false,
            "ticker": "ETH",
            "sub": "40.7METH",
            "mcapTag": "$106.1K",
            "mcap": "$82.3K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "8494"
            },
            "value": "$4,460.81",
            "amount": "40.7METH",
            "up": true,
            "mobPct": "28.79%",
            "sign": "+",
            "pnl": "$997.17",
            "pct": "28.79%"
          },
          {
            "img": "1399811149_DUZN7M6ezXez9UVrou4N8UEGRkwnbWmXqqZgEKiZCrnN_thumb_8ec850629437.png",
            "verified": false,
            "ticker": "MARKET",
            "sub": "26.3MMARKET",
            "mcapTag": "$159.5K",
            "mcap": "$1.3M",
            "price": {
              "prefix": "$0.00138"
            },
            "value": "$4,328.63",
            "amount": "26.3MMARKET",
            "up": false,
            "mobPct": "88.12%",
            "sign": "-",
            "pnl": "$32,102.08",
            "pct": "88.12%"
          },
          {
            "img": "1399811149_3C6sZzwq2ietUdjRaNgTwoKw6dBMkKCe5u1rricjEFAU_thumb_763dd7e02fc8.png",
            "verified": false,
            "ticker": "CHAIN",
            "sub": "27.2MCHAIN",
            "mcapTag": "$117K",
            "mcap": "$85.3K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "8533"
            },
            "value": "$3,194.56",
            "amount": "27.2MCHAIN",
            "up": true,
            "mobPct": "37.15%",
            "sign": "+",
            "pnl": "$865.26",
            "pct": "37.15%"
          },
          {
            "img": "1399811149_GBLYwo4vvqGDPkVJqwWfrvtPavEWb5zALmPphxQbJaLG_thumb_c2ce68bf4fa9.png",
            "verified": false,
            "ticker": "AGI",
            "sub": "10.8MAGI",
            "mcapTag": "$263.1K",
            "mcap": "$144.9K",
            "price": {
              "prefix": "$0.000145"
            },
            "value": "$2,852.13",
            "amount": "10.8MAGI",
            "up": true,
            "mobPct": "81.56%",
            "sign": "+",
            "pnl": "$1,281.26",
            "pct": "81.56%"
          },
          {
            "img": "1399811149_FeDrozMMWvy1MjV7Y5pcgssxiN42TR1fV3GqYmohqA6W_thumb_9e3fa7aeab8f.png",
            "verified": false,
            "ticker": "KETCHUP",
            "sub": "18.9MKETCHUP",
            "mcapTag": "$104.5K",
            "mcap": "$24.5K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "2534"
            },
            "value": "$2,039.57",
            "amount": "18.9MKETCHUP",
            "up": true,
            "mobPct": "325.72%",
            "sign": "+",
            "pnl": "$1,560.48",
            "pct": "325.72%"
          },
          {
            "img": "1399811149_AQVcP67EpMyu4cBZZjqMu91cVsWy1aX98JmcZm1FyY9_thumb_0d28649b739e.png",
            "verified": false,
            "ticker": "AQUA",
            "sub": "4.9MAQUA",
            "mcapTag": "$312.8K",
            "mcap": "$136.2K",
            "price": {
              "prefix": "$0.000140"
            },
            "value": "$1,606.59",
            "amount": "4.9MAQUA",
            "up": true,
            "mobPct": "129.66%",
            "sign": "+",
            "pnl": "$907.04",
            "pct": "129.66%"
          },
          {
            "img": "1399811149_8xH8ikqGXNTSYmmUVakCE2tVwU7aYJwz2JZkqAjW88sG_thumb_b1478328ef35.png",
            "verified": false,
            "ticker": "TREE",
            "sub": "3.9MTREE",
            "mcapTag": "$362.3K",
            "mcap": "$2.5M",
            "price": {
              "prefix": "$0.00261"
            },
            "value": "$1,465.34",
            "amount": "3.9MTREE",
            "up": false,
            "mobPct": "85.64%",
            "sign": "-",
            "pnl": "$8,738.64",
            "pct": "85.64%"
          },
          {
            "img": "1399811149_3NZRsipTAuusbz9PdTEHX6faw8Lzr9D9jzFEoYsXJ1j1_thumb_226be465dc80.png",
            "verified": false,
            "ticker": "BURP",
            "sub": "30.2MBURP",
            "mcapTag": "$43.1K",
            "mcap": "$80.2K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "8029"
            },
            "value": "$1,306.51",
            "amount": "30.2MBURP",
            "up": false,
            "mobPct": "46.27%",
            "sign": "-",
            "pnl": "$1,125.07",
            "pct": "46.27%"
          },
          {
            "img": "1399811149_7JQ3MyKXkFxcmpekTebuwJV4p7MiPFzN2MYKDqJSnhTQ_thumb_2100249facb6.png",
            "verified": false,
            "ticker": "THICC",
            "sub": "33.5MTHICC",
            "mcapTag": "$33.6K",
            "mcap": "$254.1K",
            "price": {
              "prefix": "$0.000254"
            },
            "value": "$1,130.70",
            "amount": "33.5MTHICC",
            "up": false,
            "mobPct": "86.74%",
            "sign": "-",
            "pnl": "$7,399.52",
            "pct": "86.74%"
          },
          {
            "img": "4663_0x3b4a0048a00787a644932cd648faa043410c163e_thumb_0930a6e549d3.png",
            "verified": false,
            "ticker": "SIRIUS",
            "sub": "2.7MSIRIUS",
            "mcapTag": "$382.6K",
            "mcap": "$2.5M",
            "price": {
              "prefix": "$0.00255"
            },
            "value": "$1,037.94",
            "amount": "2.7MSIRIUS",
            "up": false,
            "mobPct": "61.34%",
            "sign": "-",
            "pnl": "$7,309.54",
            "pct": "61.34%"
          },
          {
            "img": "1399811149_3taE4SdY29sa3fnwyWqfshudJ95gMb9LoFTy5Uuppump_thumb_2d548e2ee982.png",
            "verified": false,
            "ticker": "CATJAK",
            "sub": "18.5MCATJAK",
            "mcapTag": "$31K",
            "mcap": "$166.6K",
            "price": {
              "prefix": "$0.000169"
            },
            "value": "$582.99",
            "amount": "18.5MCATJAK",
            "up": false,
            "mobPct": "81.38%",
            "sign": "-",
            "pnl": "$2,547.99",
            "pct": "81.38%"
          },
          {
            "img": "1399811149_DdK58qW2ZHz7DN4VqCzw8XGm5x3hRfE9VRAdGaj3kFtJ_thumb_2d2be49312d0.png",
            "verified": false,
            "ticker": "CLRTR",
            "sub": "9.7MCLRTR",
            "mcapTag": "$33.5K",
            "mcap": "$14.4K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "1441"
            },
            "value": "$327.44",
            "amount": "9.7MCLRTR",
            "up": true,
            "mobPct": "133.21%",
            "sign": "+",
            "pnl": "$187.03",
            "pct": "133.21%"
          },
          {
            "img": "1399811149_y7ECKvPYZxrKqTopeT7ppA6KbwczAD9mKUSKVFn5gp2_thumb_c4c7353fae43.png",
            "verified": false,
            "ticker": "BITEE",
            "sub": "9.7MBITEE",
            "mcapTag": "$31.3K",
            "mcap": "$13.6K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "1361"
            },
            "value": "$305.44",
            "amount": "9.7MBITEE",
            "up": true,
            "mobPct": "130.16%",
            "sign": "+",
            "pnl": "$172.73",
            "pct": "130.16%"
          },
          {
            "img": "1399811149_7y5RFCQTjRGEuwCo4hNpy5dKgWnWFnicMuJR8Rr2CTvU_thumb_39961a64248d.png",
            "verified": false,
            "ticker": "AIRDROP",
            "sub": "8.5MAIRDROP",
            "mcapTag": "$34K",
            "mcap": "$133.9K",
            "price": {
              "prefix": "$0.000134"
            },
            "value": "$292.92",
            "amount": "8.5MAIRDROP",
            "up": false,
            "mobPct": "55.44%",
            "sign": "-",
            "pnl": "$821.78",
            "pct": "55.44%"
          },
          {
            "img": "4663_0x27a4d65bc9be35584513c43a6590551f0c414962_thumb_964c25bdc81b.png",
            "verified": false,
            "ticker": "ELFIE",
            "sub": "10.1MELFIE",
            "mcapTag": "$19.3K",
            "mcap": "$260.9K",
            "price": {
              "prefix": "$0.000261"
            },
            "value": "$195.10",
            "amount": "10.1MELFIE",
            "up": false,
            "mobPct": "92.60%",
            "sign": "-",
            "pnl": "$2,441.10",
            "pct": "92.60%"
          },
          {
            "img": "1399811149_2dJxWSJkxaGxKKW3HzHXBp79d1sd9xDUXk48vqn5KctV_thumb_a0078baa59bd.png",
            "verified": false,
            "ticker": "EMBERF",
            "sub": "6.2MEMBERF",
            "mcapTag": "$31K",
            "mcap": "$19.2K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "1926"
            },
            "value": "$193.59",
            "amount": "6.2MEMBERF",
            "up": true,
            "mobPct": "61.41%",
            "sign": "+",
            "pnl": "$73.65",
            "pct": "61.41%"
          },
          {
            "img": "4663_0x80f05aa931319e46a658f6f7d549ac9ca767c34a_thumb_6c7eca10d9f8.png",
            "verified": false,
            "ticker": "CULTURE",
            "sub": "8.8MCULTURE",
            "mcapTag": "$21.4K",
            "mcap": "$35.4K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "3548"
            },
            "value": "$190.43",
            "amount": "8.8MCULTURE",
            "up": false,
            "mobPct": "39.62%",
            "sign": "-",
            "pnl": "$124.96",
            "pct": "39.62%"
          },
          {
            "img": "1399811149_AdVcxGRdpRnRCaRoauERPiW8m9aahRH1bsJpyw72reNy_thumb_20d33715c484.png",
            "verified": false,
            "ticker": "ODRGN",
            "sub": "4.9MODRGN",
            "mcapTag": "$30.4K",
            "mcap": "$29K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "2904"
            },
            "value": "$149.94",
            "amount": "4.9MODRGN",
            "up": true,
            "mobPct": "4.87%",
            "sign": "+",
            "pnl": "$6.96",
            "pct": "4.87%"
          },
          {
            "img": "1399811149_3udmtY6WmPmd27Up3XVoyWdZYj1UVHeNpBk6mHifaqW4_thumb_f52e2b33a969.png",
            "verified": false,
            "ticker": "DGHOSTP",
            "sub": "4.6MDGHOSTP",
            "mcapTag": "$31.4K",
            "mcap": "$16.3K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "163"
            },
            "value": "$147.31",
            "amount": "4.6MDGHOSTP",
            "up": true,
            "mobPct": "93.23%",
            "sign": "+",
            "pnl": "$71.07",
            "pct": "93.23%"
          },
          {
            "img": "image-1762951031.jpg",
            "verified": false,
            "ticker": "KOX",
            "sub": "1.14KOX",
            "mcapTag": "$18.9M",
            "mcap": "$19M",
            "price": {
              "prefix": "$90.31"
            },
            "value": "$102.54",
            "amount": "1.14KOX",
            "up": false,
            "mobPct": "0.52%",
            "sign": "-",
            "pnl": "$0.53",
            "pct": "0.52%"
          },
          {
            "img": "56_0x4ef9d3062c7f6eba4aae4990c5036598c6eff4ec_thumb_8b859799b5a5.png",
            "verified": false,
            "ticker": "BABAB",
            "sub": "0.370BABAB",
            "mcapTag": "$5.4M",
            "mcap": "$5.4M",
            "price": {
              "prefix": "$114.65"
            },
            "value": "$42.09",
            "amount": "0.370BABAB",
            "up": false,
            "mobPct": "0.65%",
            "sign": "-",
            "pnl": "$0.28",
            "pct": "0.65%"
          },
          {
            "img": "1399811149_EicWvteVi2fWepEzS3FYWsnuPoP6caZfjnKqNvydLjCH_large_small_thumb_1a8942f8-4d63-47bd-8099-f97d539f6551.png",
            "verified": true,
            "ticker": "LIT",
            "sub": "6.22LIT",
            "mcapTag": "$4.9B",
            "mcap": "$4.9B",
            "price": {
              "prefix": "$5.00"
            },
            "value": "$30.89",
            "amount": "6.22LIT",
            "up": false,
            "mobPct": "0.60%",
            "sign": "-",
            "pnl": "$0.19",
            "pct": "0.60%"
          },
          {
            "img": "1399811149_GPRR2u6NS5yBQHWGauoJ9HXgjrTH8dDsrBfTV5zAYvDH_thumb_e30ea82a1da5.png",
            "verified": true,
            "ticker": "GoPro",
            "sub": "12.56GoPro",
            "mcapTag": "$242.1M",
            "mcap": "$237.9M",
            "price": {
              "prefix": "$1.32"
            },
            "value": "$16.89",
            "amount": "12.56GoPro",
            "up": false,
            "mobPct": "1.74%",
            "sign": "-",
            "pnl": "$7.64",
            "pct": "1.74%"
          },
          {
            "img": "4663_0x117cc2133c37b721f49de2a7a74833232b3b4c0c_thumb_a6883c327dc1.png",
            "verified": false,
            "ticker": "SPY",
            "sub": "0.0190SPY",
            "mcapTag": "$25.4M",
            "mcap": "$25.4M",
            "price": {
              "prefix": "$766.27"
            },
            "value": "$14.61",
            "amount": "0.0190SPY",
            "up": true,
            "mobPct": "0.21%",
            "sign": "+",
            "pnl": "$0.03",
            "pct": "0.21%"
          },
          {
            "img": "1399811149_BTYMF6FRzyppo9ZvXijUCctp8spMzDbX7Kb8D4gEfDY_thumb_35fdd808b1d4.png",
            "verified": false,
            "ticker": "UPTOBER",
            "sub": "516KUPTOBER",
            "mcapTag": "$27.4K",
            "mcap": "$17.8K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "179"
            },
            "value": "$14.18",
            "amount": "516KUPTOBER",
            "up": true,
            "mobPct": "53.59%",
            "sign": "+",
            "pnl": "$4.95",
            "pct": "53.59%"
          },
          {
            "img": "image-1762951031.jpg",
            "verified": false,
            "ticker": "MCDX",
            "sub": "0.0557MCDX",
            "mcapTag": "$13.7M",
            "mcap": "$13.7M",
            "price": {
              "prefix": "$252.47"
            },
            "value": "$14.06",
            "amount": "0.0557MCDX",
            "up": true,
            "mobPct": "0.02%",
            "sign": "+",
            "pnl": "$0",
            "pct": "0.02%",
            "dim": true
          },
          {
            "img": "1399811149_x95HN3DWvbfCBtTjGm587z8suK3ec6cwQwgZNLbWKyp_thumb_8a26a3a3da26.png",
            "verified": true,
            "ticker": "$HACHIKO",
            "sub": "7.5B$HACHIKO",
            "mcapTag": "$1.2M",
            "mcap": "$1.2M",
            "price": {
              "prefix": "$0.0",
              "sub": "8",
              "suffix": "1294"
            },
            "value": "$9.74",
            "amount": "7.5B$HACHIKO",
            "up": true,
            "mobPct": "0.07%",
            "sign": "+",
            "pnl": "$0.01",
            "pct": "0.07%"
          },
          {
            "img": "1399811149_So11111111111111111111111111111111111111112_thumb_4c51dc5c-cf3a-4cbb-96d6-a5de7c04069e.png",
            "verified": true,
            "ticker": "SOL",
            "sub": "0.0794SOL",
            "mcapTag": "$71.7B",
            "mcap": "$62B",
            "price": {
              "prefix": "$102.30"
            },
            "value": "$9.40",
            "amount": "0.0794SOL",
            "up": true,
            "mobPct": "6.80%",
            "sign": "+",
            "pnl": "$7.20",
            "pct": "6.80%"
          },
          {
            "img": "1399811149_LinkhB3afbBKb2EQQu7s7umdZceV3wcvAUJhQAfQ23L_1750988444_thumb.png",
            "verified": false,
            "ticker": "LINK",
            "sub": "0.665LINK",
            "mcapTag": "$9.7B",
            "mcap": "$9.3B",
            "price": {
              "prefix": "$12.54"
            },
            "value": "$8.68",
            "amount": "0.665LINK",
            "up": true,
            "mobPct": "4.00%",
            "sign": "+",
            "pnl": "$0.33",
            "pct": "4.00%"
          },
          {
            "img": "1399811149_Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3pump_thumb_11979a61b580.png",
            "verified": true,
            "ticker": "neet",
            "sub": "197.41neet",
            "mcapTag": "$33.4M",
            "mcap": "$28M",
            "price": {
              "prefix": "$0.0280"
            },
            "value": "$6.60",
            "amount": "197.41neet",
            "up": true,
            "mobPct": "0.94%",
            "sign": "+",
            "pnl": "$3.51",
            "pct": "0.94%"
          },
          {
            "img": "1399811149_69LjZUUzxj3Cb3Fxeo1X4QpYEQTboApkhXTysPpbpump_thumb_529852f01e3f.png",
            "verified": true,
            "ticker": "CODEC",
            "sub": "527.90CODEC",
            "mcapTag": "$10.1M",
            "mcap": "$9M",
            "price": {
              "prefix": "$0.00901"
            },
            "value": "$5.34",
            "amount": "527.90CODEC",
            "up": true,
            "mobPct": "12.34%",
            "sign": "+",
            "pnl": "$0.59",
            "pct": "12.34%"
          },
          {
            "img": "1399811149_Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh_large_small_thumb_78f93897-5b24-41e6-b07a-e4a2aafa9895.png",
            "verified": false,
            "ticker": "NVDAX",
            "sub": "0.0211NVDAX",
            "mcapTag": "$72.2M",
            "mcap": "$71.8M",
            "price": {
              "prefix": "$223.74"
            },
            "value": "$4.75",
            "amount": "0.0211NVDAX",
            "up": true,
            "mobPct": "0.49%",
            "sign": "+",
            "pnl": "$0.02",
            "pct": "0.49%"
          },
          {
            "img": "evm_5042_0x2a7a8c69a7462a2737a3b41188bc7a36d5555f2f.webp",
            "verified": false,
            "ticker": "SOLD",
            "sub": "10KSOLD",
            "mcapTag": "$353.2K",
            "mcap": "$481.5K",
            "price": {
              "prefix": "$0.000482"
            },
            "value": "$3.53",
            "amount": "10KSOLD",
            "up": false,
            "mobPct": "26.63%",
            "sign": "-",
            "pnl": "$1.28",
            "pct": "26.63%"
          },
          {
            "img": "4663_0xc48ad687af64a37b7fe85a4953a0a4da203684ed_thumb_0cd468533f70.png",
            "verified": false,
            "ticker": "CAVEHORSE",
            "sub": "24.5KCAVEHORSE",
            "mcapTag": "$131.6K",
            "mcap": "$96.8K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "9685"
            },
            "value": "$3.23",
            "amount": "24.5KCAVEHORSE",
            "up": true,
            "mobPct": "35.89%",
            "sign": "+",
            "pnl": "$0.85",
            "pct": "35.89%"
          },
          {
            "img": "4663_0x58ffe4a942d3885baa22d7520691f611ef09e7aa_thumb_ab32eff0ce30.png",
            "verified": false,
            "ticker": "TSM",
            "sub": "0.00732TSM",
            "mcapTag": "$1.7M",
            "mcap": "$1.6M",
            "price": {
              "prefix": "$430.39"
            },
            "value": "$3.22",
            "amount": "0.00732TSM",
            "up": true,
            "mobPct": "2.20%",
            "sign": "+",
            "pnl": "$0.07",
            "pct": "2.20%"
          },
          {
            "img": "4663_0xea0c3c32101af8c98b8053e5c3ab0ce1692e5a30_thumb_d0a08d425426.png",
            "verified": false,
            "ticker": "ROBDOG",
            "sub": "25KROBDOG",
            "mcapTag": "$102.7K",
            "mcap": "$149.2K",
            "price": {
              "prefix": "$0.000149"
            },
            "value": "$2.57",
            "amount": "25KROBDOG",
            "up": false,
            "mobPct": "31.16%",
            "sign": "-",
            "pnl": "$1.16",
            "pct": "31.16%"
          },
          {
            "img": "1399811149_CPh3doM9cPhgzKSEhuRGjUf1kYdby19C9JHSANwrpump_thumb_6dff7c1a80f2.png",
            "verified": false,
            "ticker": "SOLG",
            "sub": "50KSOLG",
            "mcapTag": "$42.6K",
            "mcap": "$13.1K",
            "price": {
              "prefix": "$0.0",
              "sub": "4",
              "suffix": "1313"
            },
            "value": "$2.14",
            "amount": "50KSOLG",
            "up": true,
            "mobPct": "225.46%",
            "sign": "+",
            "pnl": "$1.48",
            "pct": "225.46%"
          }
        ]
      },
      "thesis": {
        "img": "1399811149_6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx_large_9e1398fa6143.png",
        "verified": true,
        "ticker": "STONK",
        "badges": [
          {
            "classes": "rounded-sm px-1 py-0.5 bg-accent-primary-transparent text-accent-primary text-[10px] font-bold",
            "text": "Thesis"
          },
          {
            "classes": "rounded-sm px-1 py-0.5 bg-bg-tertiary text-text-secondary text-[10px] font-bold",
            "text": "Most Liked"
          }
        ],
        "text": "Without a shadow of doubt, stonkfun will win. Trust in yourselves. Trust in each other. Trust in the cool thing happening for once and we all get rich instead of pvping each other garbage.\n\nDormant solana whales and entities didn't wake up from their slumber for nothing. Zcat didn't go higher than any pumpfun coin has gone in years for nothing.\n\nYou aren't reading this for nothing.\n\nNone of this is coincidence.\n\nThe final battle remains. After that it's up only forever.\n\nThe trade that pumpfun was supposed to be but instead of grassroots they sold out and ICO'd and screwed their users \n\nStonkfun is the meme version trade of being early to hyperliquid \n\nIncentives. Alignment. Everything balanced and if it's not the dev actually adjusts and patches.\n\nUsers first. You. You've been lied to for too long. Stand up and fight or sit down forever.\n\nI waited two years for this moment. I talked about it until I gave up.\n\nAnd eventually it found me yet again.\n\nMake solana great again instead of a laughing stock and joke of a crack addicts' backwash gambling alley.\n\nAll the chips on the table. This is it. This is it or there's nothing left to go back to anyways.",
        "likes": "509",
        "newer": "7 newer"
      },
      "swaps": {
        "tabs": [
          {
            "label": "All swaps",
            "on": true
          },
          {
            "label": "Buys",
            "on": false
          },
          {
            "label": "Sells",
            "on": false
          }
        ],
        "listHeight": "1000px",
        "sentinel": true,
        "rows": [
          {
            "pos": 1,
            "setsize": 25,
            "index": 0,
            "y": "0px",
            "img": "solana_solana_4UHmZGe6X4DZ5dxYGiGXMhi3Sp34uPWtHB7qDMyvRbYB.webp",
            "verified": false,
            "ticker": "QUEEF",
            "action": "Buy",
            "up": true,
            "amount": "$1,996.33",
            "mcap": "$3M MC",
            "time": "6h",
            "timeTitle": "Sep 21, 2026, 3:36 PM"
          },
          {
            "pos": 2,
            "setsize": 25,
            "index": 1,
            "y": "40px",
            "img": "evm_8453_0xb2000000000000000000004c27f6523082f41d01.webp",
            "verified": true,
            "ticker": "Basecat",
            "action": "Sell",
            "up": false,
            "amount": "$1,996.27",
            "mcap": "$17.6M MC",
            "time": "6h",
            "timeTitle": "Sep 21, 2026, 3:36 PM"
          },
          {
            "pos": 3,
            "setsize": 25,
            "index": 2,
            "y": "80px",
            "img": "evm_4663_0x3ba500f1ababbcf0f0247d06d1c56fd7e6c4c09d.webp",
            "verified": false,
            "ticker": "WORM",
            "action": "Buy",
            "up": true,
            "amount": "$5,108.99",
            "mcap": "$5.3M MC",
            "time": "6h",
            "timeTitle": "Sep 21, 2026, 3:24 PM"
          },
          {
            "pos": 4,
            "setsize": 25,
            "index": 3,
            "y": "120px",
            "img": "5212de593ffa17b5acc04260fe702e32b3bb815f2eda4d7ca15b085967bd39f3.png",
            "verified": true,
            "ticker": "ETH",
            "action": "Sell",
            "up": false,
            "amount": "$5,071.19",
            "mcap": "$91.2M MC",
            "time": "6h",
            "timeTitle": "Sep 21, 2026, 3:24 PM"
          },
          {
            "pos": 5,
            "setsize": 25,
            "index": 4,
            "y": "160px",
            "img": "solana_solana_4UHmZGe6X4DZ5dxYGiGXMhi3Sp34uPWtHB7qDMyvRbYB.webp",
            "verified": false,
            "ticker": "QUEEF",
            "action": "Buy",
            "up": true,
            "amount": "$1,973.38",
            "mcap": "$3.4M MC",
            "time": "7h",
            "timeTitle": "Sep 21, 2026, 2:00 PM"
          },
          {
            "pos": 6,
            "setsize": 25,
            "index": 5,
            "y": "200px",
            "img": "97f8c9464ccfb1880cbd96274aa11a12b7b449ade3caa0fb83a0eac2c4e14bfd.png",
            "verified": false,
            "ticker": "SPY",
            "action": "Sell",
            "up": false,
            "amount": "$1,481.03",
            "mcap": "$24.1M MC",
            "time": "7h",
            "timeTitle": "Sep 21, 2026, 2:00 PM"
          },
          {
            "pos": 7,
            "setsize": 25,
            "index": 6,
            "y": "240px",
            "img": "f06728770291a526f59650998968b6eb6af62039293decfdfc4410a2e811dbdf.png",
            "verified": true,
            "ticker": "FARTCOIN",
            "action": "Sell",
            "up": false,
            "amount": "$51.96",
            "mcap": "$170.8M MC",
            "time": "7h",
            "timeTitle": "Sep 21, 2026, 1:59 PM"
          },
          {
            "pos": 8,
            "setsize": 25,
            "index": 7,
            "y": "280px",
            "img": "c9a9e9dc68bed51fb6ffe1e1c2ba29e02949dbb24e459cccbae157f29816ba93.png",
            "verified": false,
            "ticker": "KO",
            "action": "Sell",
            "up": false,
            "amount": "$64.44",
            "mcap": "$4.4M MC",
            "time": "7h",
            "timeTitle": "Sep 21, 2026, 1:59 PM"
          },
          {
            "pos": 9,
            "setsize": 25,
            "index": 8,
            "y": "320px",
            "img": "solana_solana_EicWvteVi2fWepEzS3FYWsnuPoP6caZfjnKqNvydLjCH.webp",
            "verified": true,
            "ticker": "LIT",
            "action": "Sell",
            "up": false,
            "amount": "$379.66",
            "mcap": "$5B MC",
            "time": "7h",
            "timeTitle": "Sep 21, 2026, 1:59 PM"
          },
          {
            "pos": 10,
            "setsize": 25,
            "index": 9,
            "y": "360px",
            "img": "evm_4663_0x73c2de14c7fa0a57cc2d9722b959ea70b881ffe4.webp",
            "verified": false,
            "ticker": "BOOMER",
            "action": "Buy",
            "up": true,
            "amount": "$100.12",
            "mcap": "$1.5M MC",
            "time": "7h",
            "timeTitle": "Sep 21, 2026, 1:59 PM"
          },
          {
            "pos": 11,
            "setsize": 25,
            "index": 10,
            "y": "400px",
            "img": "solana_solana_4UHmZGe6X4DZ5dxYGiGXMhi3Sp34uPWtHB7qDMyvRbYB.webp",
            "verified": false,
            "ticker": "QUEEF",
            "action": "Buy",
            "up": true,
            "amount": "$1,376.65",
            "mcap": "$4.1M MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:41 AM"
          },
          {
            "pos": 12,
            "setsize": 25,
            "index": 11,
            "y": "440px",
            "img": "solana_solana_H1q6vF9X2ewo7XxqJ2qb2uTdwkjDLAWF1Y3SefRAUTGZ.webp",
            "verified": false,
            "ticker": "WET",
            "action": "Sell",
            "up": false,
            "amount": "$497.63",
            "mcap": "$61.5K MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:41 AM"
          },
          {
            "pos": 13,
            "setsize": 25,
            "index": 12,
            "y": "480px",
            "img": "evm_4663_0x3ba500f1ababbcf0f0247d06d1c56fd7e6c4c09d.webp",
            "verified": false,
            "ticker": "WORM",
            "action": "Sell",
            "up": false,
            "amount": "$5.89",
            "mcap": "$3.9M MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:40 AM"
          },
          {
            "pos": 14,
            "setsize": 25,
            "index": 13,
            "y": "520px",
            "img": "solana_solana_9nXSvn8bUmboPdgA4qnmtzxQdgjXWquK6sYaCFLRgPs1.webp",
            "verified": false,
            "ticker": "onkey",
            "action": "Sell",
            "up": false,
            "amount": "$5.25",
            "mcap": "$11.1K MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:39 AM"
          },
          {
            "pos": 15,
            "setsize": 25,
            "index": 14,
            "y": "560px",
            "img": "cfa27cb56c7f8e58d12ee285a5f913ac53efd39ab9c9156e1d596b378901ee48.png",
            "verified": false,
            "ticker": "COBOT",
            "action": "Sell",
            "up": false,
            "amount": "$6.72",
            "mcap": "$36.5K MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:39 AM"
          },
          {
            "pos": 16,
            "setsize": 25,
            "index": 15,
            "y": "600px",
            "img": "solana_solana_Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump.webp",
            "verified": true,
            "ticker": "CATE",
            "action": "Sell",
            "up": false,
            "amount": "$7.42",
            "mcap": "$94.6M MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:39 AM"
          },
          {
            "pos": 17,
            "setsize": 25,
            "index": 16,
            "y": "640px",
            "img": "c9a9e9dc68bed51fb6ffe1e1c2ba29e02949dbb24e459cccbae157f29816ba93.png",
            "verified": false,
            "ticker": "KO",
            "action": "Sell",
            "up": false,
            "amount": "$10.05",
            "mcap": "$4.4M MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:39 AM"
          },
          {
            "pos": 18,
            "setsize": 25,
            "index": 17,
            "y": "680px",
            "img": "solana_solana_3HC5wu2PmpSEgXKgS2r7TDCDCg7xsotx32Ym7ubzN1NX.webp",
            "verified": false,
            "ticker": "BRAINLET",
            "action": "Sell",
            "up": false,
            "amount": "$10.56",
            "mcap": "$26.2K MC",
            "time": "10h",
            "timeTitle": "Sep 21, 2026, 11:39 AM"
          }
        ]
      }
    },
    "own": {
      "rail": {
        "classes": "flex-col shrink-0 gap-4 pr-5 hidden @[1200px]/profile:flex w-75 @[1536px]/profile:w-90",
        "kind": "follow",
        "title": "Follow top traders",
        "traders": [
          {
            "href": "/profile/pointfarmcap",
            "img": "94a0a2f625de8a39e48a26e750486a49_small.jpg",
            "color": null,
            "name": "point farm capital",
            "handle": "@pointfarmcap"
          },
          {
            "href": "/profile/The__Solstice",
            "img": "eb2964462438bba9a804412266799318_small.jpg",
            "color": null,
            "name": "TheS◎Lstice",
            "handle": "@The__Solstice"
          },
          {
            "href": "/profile/theveeman",
            "img": "a381782ec0c447deb8fb3d520631f8a0_small.jpg",
            "color": null,
            "name": "Vee",
            "handle": "@theveeman"
          },
          {
            "href": "/profile/unipcs",
            "img": "685a72bf4e0ab7095593e7618caa5c8e_small.jpg",
            "color": null,
            "name": "Unipcs",
            "handle": "@unipcs"
          },
          {
            "href": "/profile/RunningClam",
            "img": "6e0e418d627631e2a7b6e580a0042a84_small.jpg",
            "color": null,
            "name": "Clam",
            "handle": "@RunningClam"
          },
          {
            "href": "/profile/RareDualJay",
            "img": "5aa7659cb7ad6499e8a54329c22c2b61_small.jpg",
            "color": null,
            "name": "RareDualJay",
            "handle": "@RareDualJay"
          },
          {
            "href": "/profile/pricedin",
            "img": "/images/nohomo-eyes.png",
            "color": "rgb(4, 143, 92)",
            "name": "pricedin",
            "handle": "@pricedin"
          },
          {
            "href": "/profile/0xleo",
            "img": "fe6fce6f5cb604fa59c87b1d6c5aad24_small.jpg",
            "color": null,
            "name": "leo",
            "handle": "@0xleo"
          },
          {
            "href": "/profile/Salem1299534",
            "img": "3d08ecc37973844cc48b046b4efdb655_small.jpg",
            "color": null,
            "name": "Salem",
            "handle": "@Salem1299534"
          },
          {
            "href": "/profile/0xdetweiler",
            "img": "8d02df05365b0ba4abde7c083af1f6fa_small.jpg",
            "color": null,
            "name": "Theo",
            "handle": "@0xdetweiler"
          }
        ]
      },
      "portfolio": {
        "valueInt": "$7",
        "valueFrac": ".72",
        "change": "+$0.00",
        "changeColor": "rgb(33, 201, 94)",
        "pillStyle": "left: calc(0% + 2px); width: calc(25% - 1px);",
        "tabs": [
          {
            "label": "24H",
            "on": true
          },
          {
            "label": "7D",
            "on": false
          },
          {
            "label": "30D",
            "on": false
          },
          {
            "label": "ALL",
            "on": false
          }
        ],
        "chartStyle": "height: 200px; opacity: 1;"
      },
      "cash": {
        "label": "Total cash",
        "value": "$7.72",
        "actions": [
          {
            "label": "Withdraw",
            "classes": "bg-bg-secondary text-sm font-bold ring w-22 ring-bg-tertiary rounded-lg py-2 px-3 flex items-center justify-center cursor-pointer hover:opacity-80"
          },
          {
            "label": "Deposit",
            "classes": "bg-accent-primary w-22 rounded-lg px-4 py-2 flex items-center justify-center cursor-pointer hover:opacity-80 text-sm font-bold"
          }
        ]
      },
      "positions": {
        "title": "Your positions",
        "count": "1",
        "sortLabel": "Recent",
        "sortIcon": "recent",
        "openPill": {
          "classes": "flex gap-1 items-center justify-center px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors duration-150 text-text-tertiary",
          "dot": "bg-text-tertiary"
        },
        "closedPill": {
          "classes": "flex items-center justify-center px-1.5 py-0.5 rounded-md text-xs font-bold transition-colors duration-150 bg-bg-tertiary text-text-primary",
          "dot": null
        },
        "headCols": [
          "Avg. entry",
          "Avg. exit"
        ],
        "headRight": {
          "text": "PnL"
        },
        "variant": "closed",
        "rows": [
          {
            "img": "4663_0x2e8c31162b855a2ffa90f6f8634643ad6f111e18_large_ff88da525656.png",
            "verified": true,
            "ticker": "AI",
            "invested": "$1.92",
            "time": "3w",
            "timeTitle": "Aug 27, 2026, 11:52 PM",
            "entry": "$0.0137",
            "exit": "$0.0554",
            "up": true,
            "sign": "+",
            "pnl": "$5.76",
            "pct": "299.55%"
          }
        ]
      },
      "thesis": null,
      "swaps": {
        "tabs": [
          {
            "label": "All swaps",
            "on": true
          },
          {
            "label": "Buys",
            "on": false
          },
          {
            "label": "Sells",
            "on": false
          }
        ],
        "listHeight": "80px",
        "sentinel": false,
        "rows": [
          {
            "pos": 1,
            "setsize": 2,
            "index": 0,
            "y": "0px",
            "img": "evm_4663_0x2e8c31162b855a2ffa90f6f8634643ad6f111e18.webp",
            "verified": true,
            "ticker": "AI",
            "action": "Sell",
            "up": false,
            "amount": "$7.79",
            "mcap": "$54.9M MC",
            "time": "3w",
            "timeTitle": "Aug 27, 2026, 11:52 PM"
          },
          {
            "pos": 2,
            "setsize": 2,
            "index": 1,
            "y": "40px",
            "img": "evm_4663_0x2e8c31162b855a2ffa90f6f8634643ad6f111e18.webp",
            "verified": true,
            "ticker": "AI",
            "action": "Buy",
            "up": true,
            "amount": "$1.92",
            "mcap": "$13.5M MC",
            "time": "1mo",
            "timeTitle": "Aug 21, 2026, 2:36 AM"
          }
        ]
      }
    }
  };
  import CashRow from "./CashRow.svelte";
  import FollowTraders from "./FollowTraders.svelte";
  import PortfolioPanel from "./PortfolioPanel.svelte";
  import PositionsTable from "./PositionsTable.svelte";
  import SendCard from "./SendCard.svelte";
  import { isProfileLoading } from "../../lib/api/profile.svelte.js";
  import SwapsCard from "./SwapsCard.svelte";
  import ThesisCard from "./ThesisCard.svelte";
  import {
    hasMorePositions,
    hasMoreSwaps,
    loadMorePositions,
    loadMoreSwaps
  } from "../../lib/api/profile.svelte.js";

  /** @type {{ variant: "own" | "other", children?: any }} */
  let { variant, children } = $props();

  /** @type {import("../../lib/types").ProfileBodyUser} */
  const chrome = $derived(body[variant]);

  /** Both lists page themselves in as the page is scrolled to its end. */
  function onScroll(event) {
    const box = event.currentTarget;
    if (box.scrollHeight - box.scrollTop - box.clientHeight > 400) return;
    if (hasMorePositions()) void loadMorePositions();
    if (hasMoreSwaps()) void loadMoreSwaps();
  }
</script>

<div
  class="@container/profile flex items-start gap-4 flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden pb-3"
  onscroll={onScroll}
>
  <div class="flex flex-col flex-[2.5] min-w-0 px-3 gap-4">
    {@render children?.()}

    <div class="flex-1 pt-4 border-t border-bg-tertiary flex gap-6">
      <!-- left column: portfolio, cash, positions -->
      <div class="flex flex-col flex-1 min-w-0 gap-3">
        <PortfolioPanel chrome={chrome.portfolio} />

        <CashRow />

        <PositionsTable chrome={chrome.positions} />
      </div>

      <!-- right column: thesis card + swaps -->
      <div class="flex flex-col flex-1 min-w-0 gap-4">
        <ThesisCard />

        <SwapsCard chrome={chrome.swaps} />
      </div>
    </div>
  </div>

  <!-- right rail -->
  <!-- The rail is the top traders on every profile, your own and anyone else's: the send card that
       stood here is the capture's chrome, and it named a trader as the recipient. The classes and
       the title come from the follow rail's own chrome, which is hidden below the wide layout. -->
  <div class={body.own.rail.classes}>
    <FollowTraders chrome={body.own.rail} />
  </div>
</div>
