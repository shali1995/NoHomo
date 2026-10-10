<script>
  // The fixed bottom strip: four tracked tokens with price and 24h change, the
  // chain-status pill, the Privacy / Terms / Help links and the two social links.
  // Structure, class strings and values are the capture's; ticker.json holds the four
  // rows, including the alt text the capture recorded for each logo.
  /** @type {import("../lib/types").TickerItem[]} */
  // inlined from ticker.json — no data file, the strings live with the code
  /**
   * The capture points its SOL row at wSOL, and OpenDEX carries no SOL market — that page answers
   * nothing. A row with nowhere to go renders without an href, so it is not a link.
   */
  const NO_MARKET = "So11111111111111111111111111111111111111112";
  const deadHref = (item) => String(item.href ?? "").includes(NO_MARKET);

  /**
   * A row with nowhere to go must not look like a link: no hover fade, and a plain cursor. The
   * capture's class string carries the hover, so it is dropped for those rows rather than added to
   * every other one.
   */
  function rowClasses(item) {
    return deadHref(item) ? `${item.classes} cursor-default`.replace("hover:opacity-80 ", "") : item.classes;
  }

  const ticker =   [
    {
      "href": "/tokens/solana/cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij",
      "img": "/images/ticker-btc.webp",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "BTC",
      "price": "$85,960.48",
      "hiddenColor": "var(--color-green)",
      "dir": "▲",
      "change": "6.40%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
    },
    {
      "href": "/tokens/solana/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
      "img": "/images/ticker-eth.webp",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "ETH",
      "price": "$2,742.37",
      "hiddenColor": "var(--color-red)",
      "dir": "▲",
      "change": "6.00%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
    },
    {
      "href": "/tokens/solana/So11111111111111111111111111111111111111112",
      "img": "/images/ticker-sol.webp",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "SOL",
      "price": "$118.27",
      "hiddenColor": "var(--color-red)",
      "dir": "▲",
      "change": "8.98%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80",
      "hiddenText": "$118.27"
    },
    {
      "href": "/tokens/solana/98sMhvDwXj1RQi5c5Mndm3vPe9cBqPrbLaufMXFNMh5g",
      "img": "/images/ticker-hype.webp",
      "imgClass": "size-4 rounded-full border border-bg-tertiary",
      "alt": "HYPE",
      "price": "$94.24",
      "hiddenColor": "var(--color-red)",
      "dir": "▲",
      "change": "3.29%",
      "color": "rgb(33, 201, 94)",
      "classes": "flex items-center gap-1 shrink-0 transition-opacity hover:opacity-80"
    }
  ];
  import { openWelcome } from "../lib/welcome.svelte.js";
  import Telegram from "../icons/telegram.svelte";
  import XLogo from "../icons/x-logo.svelte";
  import DiscordIcon from "../icons/discord.svelte";
  import Skeleton from "./Skeleton.svelte";
  import { getHlPrices, isHlLoading, startHlTicker, stopHlTicker } from "../lib/api/hyperliquid.svelte.js";

  const prices = $derived(getHlPrices());
  const loading = $derived(isHlLoading());

  $effect(() => {
    startHlTicker();
    return () => stopHlTicker();
  });
</script>

<footer class="fixed inset-x-0 bottom-0 z-50 border-t border-bg-tertiary bg-bg-primary flex py-1.5 items-center justify-between gap-4 px-3 text-xs">
  <div class="flex items-center gap-4 shrink-0">
    {#each ticker as item (item.href)}
      {@const live = prices[item.alt]}
      <!-- BTC, ETH and HYPE open their token page. The SOL row keeps no href: the capture points it
           at wSOL, and OpenDEX carries no SOL market. -->
      <a class={rowClasses(item)} href={deadHref(item) ? undefined : item.href}>
        {#if item.img}
          <img class={item.imgClass} src={item.img} alt={item.alt} />
        {/if}
        <span class="leading-none tabular-nums">
          <!-- The capture keeps a second, invisible copy of the price: the layer the
               original animates on a price change. -->
          <span class="relative inline-block">
            <span><span class="tabular-nums">
              {#if live}{live.price}{:else if loading}<Skeleton class="h-3 w-16" />{:else}—{/if}
            </span></span>
            <span class="pointer-events-none absolute inset-0 select-none opacity-0" style="color: {item.hiddenColor ?? 'inherit'};">{#if item.hiddenText}<span>{item.hiddenText}</span>{/if}</span>
          </span>
        </span>
        {#if live?.change}
          <div class="flex gap-0.75 items-center tabular-nums" style="line-height: 16px;">
            <div style="color: {live.color}; font-weight: 400; font-size: 6px;">{live.dir}</div>
            <div style="font-size: 12px; font-weight: 500; color: {live.color};">{live.change}</div>
          </div>
        {:else if loading}
          <Skeleton class="h-3 w-10" />
        {/if}
      </a>
    {/each}
  </div>

  <div class="flex items-center gap-3 shrink-0 ml-auto">
    <div class="flex items-center gap-1 cursor-default">
      <div class="relative flex size-1.5 items-center justify-center">
        <div class="relative size-full rounded-full bg-green"></div>
      </div>
      <span class="text-xs font-bold text-green">Stable</span>
    </div>
    <div class="h-3 w-px bg-bg-tertiary"></div>
    <!-- The capture's three doors, replaced: no policy pages to point at yet, so the repo (the
         Telegram until it exists), the terms in three words, and the line every crypto app owes you. -->
    <a
      class="text-text-primary hover:text-text-primary transition-colors"
      href="https://opendex.ws/"
      target="_blank"
      rel="noreferrer"
    >Powered by opendex.ws</a>
    <a
      class="text-text-primary hover:text-text-primary transition-colors"
      href="https://github.com/shali1995/NoHomo"
      target="_blank"
      rel="noreferrer"
    >Open source</a>
    <button
      type="button"
      class="text-text-primary  hover:text-text-primary transition-colors"
      onclick={openWelcome}
    >Don't be gay</button>
    <!-- Not ours yet: the marks stay, but there is nowhere to send anyone, so they are not links. -->
    <span class="text-text-primary cursor-default" title="Not ours yet"><XLogo class="h-3.5 w-3.5" /></span>
    <span class="text-text-primary cursor-default" title="Not ours yet"><DiscordIcon /></span>

      <a
        href="https://t.me/USENOHOMO"
        target="_blank"
        rel="noreferrer"
        class="group text-text-primary transition-opacity hover:text-text-primary"
      >
        <Telegram class="h-3.5 w-3.5 transition-opacity group-hover:opacity-80" />
      </a>
  </div>
</footer>
