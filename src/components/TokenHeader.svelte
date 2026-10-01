<script>
  import NetworkSolana from "../icons/network-solana.svelte";
  import TokenMenu from "../icons/token-menu.svelte";
  import Globe from "../icons/globe.svelte";
  import XLogo from "../icons/x-logo.svelte";
  import SocialSearch from "../icons/social-search.svelte";
  import CheckCircle from "../icons/check-circle.svelte";
  import Copy from "../icons/copy.svelte";
  import Skeleton from "./Skeleton.svelte";
  /** @type {import("../lib/types").TokenIdentityData} */
  // inlined from tokenIdentity.json — no data file, the strings live with the code
  const identity =   {
    "chainImg": "/images/nohomo-eyes.png",
    "chainImgClass": "rounded-full",
    "chainWidth": "16",
    "chainHeight": "16",
    "socials": [
      {
        "href": "https://www.zcashstamp.com/",
        "classes": "flex items-center justify-center rounded-sm bg-bg-tertiary overflow-hidden p-0.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer",
        "svgClass": "",
        "width": "16",
        "height": "16",
        "icon": "site"
      },
      {
        "href": "https://x.com/Zip227",
        "classes": "flex items-center justify-center rounded-sm bg-bg-tertiary overflow-hidden p-0.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer",
        "svgClass": "",
        "width": "16",
        "height": "16",
        "icon": "x"
      },
      {
        "href": "https://x.com/search?q=EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc%20OR%20%24Stamp",
        "classes": "flex items-center justify-center rounded-sm bg-bg-tertiary overflow-hidden p-0.5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer",
        "svgClass": "lucide lucide-search",
        "width": "16",
        "height": "16",
        "icon": "search"
      }
    ]
  };
  /** @type {import("../lib/types").BadgesData} */
  // inlined from badges.json — no data file, the strings live with the code
  const badges =   {
    "wrapperClasses": "w-4 h-4 shrink-0 relative flex items-center justify-center",
    "wrapperClasses2": "w-4 h-4 shrink-0 relative flex items-center justify-center",
    "headerButton": "flex items-center gap-1 hover:opacity-70 transition-opacity"
  };
  import { chainSlug } from "../lib/routes.js";
  import { openTokenCard, closeHoverCard } from "../lib/hoverCard.svelte.js";
  import { ageFromSeconds, getToken, getTokenStats } from "../lib/api/token.svelte.js";
  import { tokenImage } from "../lib/api/config.js";
  import { safeUrl, searchOnXHref } from "../lib/utils/urls.js";

  // Live identity and market stats. The strip renders the capture's five pills; their
  // labels and variants are the capture's, the values are the token's own.
  const live = $derived(getToken());
  const stats = $derived(getTokenStats());

  const identityValues = $derived(
    live
      ? {
          name: live.tokenName ?? "",
          description: live.tokenSymbol ?? "",
          address: `${String(live.tokenAddress).slice(0, 6)}...${String(live.tokenAddress).slice(-6)}`,
          logo: tokenImage(live.chain, live.tokenAddress, 80),
          age: ageFromSeconds(live.createdAtAgeSeconds)
        }
      : null
  );

  /**
   * The icon row's links, from the token itself: its website and its X account when it
   * has them, and always the X search built from its address. The captured row drew three
   * fixed links for the token it was recorded on, which is why every token used to point
   * at that one's site and account.
   */
  const socialLinks = $derived.by(() => {
    if (!live) return [];
    const links = live.socials?.links ?? null;
    return [
      { icon: "site", href: safeUrl(links?.website) },
      { icon: "x", href: safeUrl(links?.twitter?.url) },
      { icon: "search", href: searchOnXHref(live) }
    ].filter((link) => link.href);
  });

  /** The link chrome is the capture's; all three of its links carry the same classes. */
  const SOCIAL_LINK_CLASSES = identity.socials[0].classes;

  const STAT_SHAPE = [
    { label: "Market cap", variant: "marketcap" },
    { label: "Price", variant: "span" },
    { label: "24H change", variant: "change" },
    { label: "24H Vol.", variant: "plain" },
    { label: "Liquidity", variant: "plain" },
    { label: "Holders", variant: "plain" },
    { label: "Top 10 holding", variant: "plain" }
  ];

  /**
   * The strip's seven boxes, always. Before the token lands each one carries `loading`
   * instead of a value, so the header is already its final shape -- same boxes, same
   * order, same places -- and only the numbers fill in.
   */
  const statRows = $derived(
    STAT_SHAPE.map((shape) => {
      if (!stats) return { ...shape, loading: true, value: "" };
      if (shape.variant === "marketcap") return { ...shape, value: stats.marketCap };
      if (shape.variant === "span") return { ...shape, value: stats.price };
      if (shape.variant === "change") {
        const up = stats.changePct >= 0;
        const arrow = up ? "\u25B2" : "\u25BC";
        return {
          ...shape,
          arrow,
          color: up ? "rgb(33, 201, 94)" : "rgb(255, 98, 46)",
          value: `${arrow} ${Math.abs(stats.changePct).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
        };
      }
      if (shape.label === "24H Vol.") return { ...shape, value: stats.volume };
      if (shape.label === "Liquidity") return { ...shape, value: stats.liquidity };
      if (shape.label === "Holders") return { ...shape, value: stats.holders };
      return { ...shape, value: `${stats.top10Pct.toFixed(2)}%` };
    })
  );

  // The token popover opens when the pointer rests on the token. The handlers sit on
  // elements that already exist in the captured markup -- adding a wrapper there
  // would change the parent every child sees, and the fidelity check compares
  // exactly that. The card itself is drawn by HoverCardLayer, at the root.
  // The header's own token, so its card is the page token's values rather than a capture.
  const openCard = (event) =>
    openTokenCard(
      {
        href: live ? `/tokens/${chainSlug(live.chain)}/${live.tokenAddress}` : "/",
        chain: live?.chain,
        address: live?.tokenAddress,
        symbol: live?.tokenSymbol,
        logo: identityValues?.logo,
        network: live ? chainSlug(live.chain) : undefined
      },
      event
    );

  // The capture ships both glyphs stacked and swaps them with opacity/scale/rotate, so
  // copying only toggles which one is visible.
  const COPY_SHOWN = "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-100 scale-100 rotate-0";
  const COPY_HIDDEN = "w-4 h-4 text-text-tertiary absolute transition-all duration-200 opacity-0 scale-0 rotate-90";
  const CHECK_SHOWN = "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-100 scale-100 rotate-0";
  const CHECK_HIDDEN = "lucide lucide-circle-check w-4 h-4 text-green absolute transition-all duration-200 opacity-0 scale-0 -rotate-90";

  let copied = $state(false);
  let copyTimer = null;

  async function copyAddress() {
    const address = live?.tokenAddress;
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Clipboard API needs a secure context; fall back to a temporary selection.
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
</script>

<!--
  Token header strip: identity on the left, market stats and the trade buttons
  on the right. Classes come from the captured markup.
-->
<div class="flex gap-3 items-center w-full">
  <button
    type="button"
    aria-label="View token image"
    onmouseenter={openCard}
    onmouseleave={closeHoverCard}
    onfocusin={openCard}
    onfocusout={closeHoverCard}
  >
    <div class="relative shrink-0" style="width: 40px; height: 40px;">
      {#if identityValues}
        <img
          class="rounded-full border border-bg-tertiary"
          src={identityValues.logo}
          alt=""
          style="height: 40px; width: 40px;"
        />
      {:else}
        <Skeleton class="rounded-full" style="height: 40px; width: 40px;" />
      {/if}
    </div>
  </button>

  <div class="flex flex-col gap-1 min-w-52 max-w-80 shrink-0">
    <div class="flex gap-1 items-center min-w-0">
      <div class="leading-tight truncate">
        {#if identityValues}{identityValues.name}{:else}<Skeleton class="h-4 w-28" />{/if}
      </div>

      <!-- identity mark, chain badge, divider, socials, menu — as captured -->
      <NetworkSolana width="20" height="20" data-state="closed" data-slot="tooltip-trigger" />

      <div class="rounded-full bg-bg-primary flex items-center justify-center overflow-hidden shrink-0" style="width: 20px; height: 20px;">
        <img width={identity.chainWidth} height={identity.chainHeight} class={identity.chainImgClass} src={identity.chainImg} alt="" />
      </div>

      <div class="w-px h-4 shrink-0 bg-bg-tertiary mx-0.5"></div>

      <div class="flex gap-1 items-center shrink-0">
        {#each socialLinks as link (link.icon)}
          <a class={SOCIAL_LINK_CLASSES} href={link.href} target="_blank" rel="noopener">
            {#if link.icon === "site"}
              <Globe />
            {:else if link.icon === "x"}
              <XLogo />
            {:else}
              <SocialSearch />
            {/if}
          </a>
        {/each}
      </div>

      <button>
        <TokenMenu />
      </button>
    </div>

    <div class="flex gap-2 items-center">
      {#if identityValues}
        <div class="text-xs text-text-secondary truncate max-w-32">{identityValues.description}</div>
        <div class="w-px h-3 bg-bg-tertiary"></div>
        <span class="text-xs text-text-secondary shrink-0">{identityValues.age}</span>
        <div class="w-px h-3 bg-bg-tertiary"></div>
        <button
          type="button"
          class={badges.headerButton}
          aria-label="Copy address"
          title={live?.tokenAddress ?? ""}
          onclick={copyAddress}
        >
          <div class="text-text-tertiary text-xs">{identityValues.address}</div>
          <div class={badges.wrapperClasses}>
            <Copy aria-hidden="true" class={copied ? COPY_HIDDEN : COPY_SHOWN} />
            <CheckCircle class={copied ? CHECK_SHOWN : CHECK_HIDDEN} />
          </div>
        </button>
      {:else}
        <Skeleton class="h-3 w-24" />
        <div class="w-px h-3 bg-bg-tertiary"></div>
        <Skeleton class="h-3 w-8" />
        <div class="w-px h-3 bg-bg-tertiary"></div>
        <Skeleton class="h-3 w-20" />
      {/if}
    </div>
  </div>

  <div class="relative ml-auto flex-1 min-w-0">
    <div class="no-scrollbar overflow-x-auto overflow-y-hidden">
      <div class="flex w-full">
        <div class="ml-auto">
          <div class="flex w-max shrink-0 items-center gap-2 tabular-nums">
            {#each statRows as stat (stat.label)}
              {#if stat.variant === "marketcap"}
                <!-- the market cap block is text, not a pill -->
                <div class="flex flex-col items-center w-26 cursor-default py-2">
                  <div class="text-xs text-text-secondary">{stat.label}</div>
                  <div class="text-lg font-medium leading-tight tabular-nums">
                    {#if stat.loading}<Skeleton class="h-5 w-20" />{:else}{stat.value}{/if}
                  </div>
                </div>
              {:else}
                <div class="bg-bg-secondary rounded-lg flex flex-col items-center min-w-22 px-2 py-1.5">
                  <div class="text-xs text-text-secondary whitespace-nowrap">{stat.label}</div>
                  <div class="text-sm whitespace-nowrap min-h-5 flex items-center">
                    {#if stat.loading}
                      <Skeleton class={stat.variant === "change" ? "h-4 w-16" : "h-4 w-12"} />
                    {:else if stat.variant === "change"}
                      <div class="flex gap-0.75 items-center tabular-nums" style="line-height: 20px;">
                        <div style="color: {stat.color}; font-weight: 400; font-size: 8px;">{stat.arrow}</div>
                        <div style="font-size: 14px; font-weight: 500; color: {stat.color};">{stat.value.replace(stat.arrow, "").trim()}</div>
                      </div>
                    {:else if stat.variant === "span"}
                      <span class="tabular-nums">{stat.value}</span>
                    {:else}{stat.value}{/if}
                  </div>
                </div>
              {/if}
            {/each}

          </div>
        </div>
        <div class="w-4 shrink-0"></div>
      </div>
    </div>
  </div>
</div>
