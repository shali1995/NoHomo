// inlined from tokenStats.json — no data file, the strings live with the code
const tokenStats =   [
    {
      "label": "Market cap",
      "value": "$1.5M",
      "arrow": null,
      "color": null,
      "variant": "marketcap"
    },
    {
      "label": "Price",
      "value": "$0.00152",
      "arrow": null,
      "color": null,
      "variant": "span"
    },
    {
      "label": "24H change",
      "value": "▲ 28,370.70%",
      "arrow": "▲",
      "color": "rgb(33, 201, 94)",
      "variant": "change"
    },
    {
      "label": "24H Vol.",
      "value": "$38.1M",
      "arrow": null,
      "color": null,
      "variant": "plain"
    },
    {
      "label": "Liquidity",
      "value": "$163.5K",
      "arrow": null,
      "color": null,
      "variant": "plain"
    },
    {
      "label": "Holders",
      "value": "9K",
      "arrow": null,
      "color": null,
      "variant": "plain"
    },
    {
      "label": "Top 10 holding",
      "value": "12.87%",
      "arrow": null,
      "color": null,
      "variant": "plain"
    }
  ];

/**
 * The token whose page this is, read out of the capture: the name, ticker, address
 * and logo come off the rendered page and the
 * captured API responses. Nothing here is invented, and nothing lives here twice —
 * the market stats are `tokenStats.json`, the table tabs are `tableTabs.json`.
 */

export const token = {
  name: "Stamp",
  description: "Zcash Shielded Assets",
  symbol: "STAMP",
  /** The full mint, as the page's own links carry it. `address` is its display form. */
  mint: "EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc",
  address: "EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc".slice(0, 6) + "..." + "EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc".slice(-6),
  age: "20h",
  logo: "/images/nohomo-eyes.png"
};

/**
 * The token popover's contents, derived from the values above — the card shows the
 * same numbers the header does, laid out the way the capture lays them out.
 * Nothing is written twice: the stats are read out of
 * `tokenStats.json` by label, and the contract line is the identifying part of the
 * address.
 */
const stat = (label) => tokenStats.find((entry) => entry.label === label)?.value ?? "";
const change = stat("24H change").replace(/[▲▼]\s*/, "");

export const tokenHoverCard = {
  href: `/tokens/solana/${token.mint}`,
  name: token.name,
  network: "solana",
  logo: token.logo,
  marketCap: `${stat("Market cap")} MC`,
  price: stat("Price"),
  change,
  changeArrow: "▲",
  changeColor: "rgb(33, 201, 94)",
  stats: [
    { label: "Volume 24hr", value: stat("24H Vol.") },
    { label: "Holders", value: stat("Holders") },
    { label: "Top 10 holding", value: stat("Top 10 holding") },
    { label: "Contract", value: token.address, copy: true }
  ]
};
