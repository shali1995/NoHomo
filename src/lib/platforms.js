/**
 * DEX platform display names, ported verbatim from Ombra's `src/lib/utils/routers.ts`
 * (`getRouterName`) so a launchpad reads the same in both terminals — the API's own
 * `platformName` is the enum-ish label (`Pumpfun`), the map is the brand (`Pump.fun`).
 *
 * Names only: the icon is not carried over, because the About card draws the
 * launchpad badge with the capture's own asset.
 */
const PLATFORM_NAMES = {
  PUMPFUN: "Pump.fun",
  PUMPSWAP: "PumpSwap",
  METEORA_BONDING_CURVE: "Meteora DBC",
  METEORA_DYN: "Meteora Dyn",
  METEORA_DYN_V2: "Meteora DAMM V2",
  METEORA_DLMM: "Meteora DLMM",
  RAYDIUM: "Raydium",
  RAYDIUM_CP: "Raydium CP",
  RAYDIUM_CLMM: "Raydium CLMM",
  WHIRLPOOL: "Orca Whirlpool",
  RAYDIUM_LAUNCH: "Raydium Launchlab",
  UNISWAP_V2: "Uniswap V2",
  UNISWAP_V3: "Uniswap V3",
  UNISWAP_V4: "Uniswap V4",
  PONS: "Pons",
  AERODROME_V2: "Aerodrome",
  MOONSHOT: "Moonshot",
  HEAVEN: "Heaven",
  FOURMEME_V2: "4Meme",
  BELIEVE: "Believe",
  LETS_BONK: "Let's Bonk",
  BAGS: "Bags",
  PRINTR: "Printr",
  STONKFUN: "Stonk.fun",
  OTCDESKS: "OTC Desks",
  PURPS: "Purps",
  EMBERCURVE: "Embercurve"
};

/** Ombra falls back to the raw enum and to an em dash, in that order. */
export function platformName(platform) {
  if (!platform) return "—";
  return PLATFORM_NAMES[platform] ?? platform;
}
