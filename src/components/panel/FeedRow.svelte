<script>
  // One activity-feed row. The three captured row types are the fomo announcement,
  // a swap (Buy / Sell) and a thesis. Markup and classes are the capture's; the row
  // object carries values, classes and inline styles only.
  import ChainBadge from "../../icons/chain-badge.svelte";
  import Heart from "../../icons/heart.svelte";
  import VerifiedBadge from "../../icons/verified-badge.svelte";
  import Pinned from "../../icons/pinned.svelte";
  import ChevronRight from "../../icons/chevron-right.svelte";
  import { openTokenCard, openUserCard, closeHoverCard, userCardIdentity } from "../../lib/hoverCard.svelte.js";
  import { followLink, followLinkKey } from "../../lib/router.js";

  /**
   * `placement` is where the cards hang: the default beside the row, and `"above"` when
   * the row is one of the token page's table rows, which ask for the card to clear the
   * row rather than cover it.
   * @type {{ row: import("../../lib/types").FeedRow, placement?: "side" | "above" }}
   */
  let { row, placement = "side" } = $props();

  // Where the cards belong is not a guess: in the capture the feed row itself is a
  // `data-slot="hover-card-trigger"` (the token card opens beside it — 441px wide in
  // the layout), and the avatar and the name inside it are triggers too (the trader
  // card).
  //
  // The token card is the row's own token: its chain + address are what the card fetches
  // by, and the ticker and logo the row already draws paint the header before that lands.
  // This is why a row that just arrived over the socket works the same as a seeded one.
  /** @param {import("../../lib/types").FeedRow} row */
  const tokenCardFor = (row) => ({
    href: row.href,
    chain: row.chain,
    address: row.address,
    symbol: row.type === "swap" ? row.line?.[0]?.text : row.ticker?.text,
    logo: row.tokenLogo?.img?.src,
    network: row.href?.split("/")[2]
  });

  /**
   * The trader's own card: the wallet identifies them, and the row supplies the name and
   * avatar it already draws. The feed has no window of its own, so the card answers for
   * the last day. The capture's bio is kept only where the capture recorded that very
   * trader.
   *
   * @param {import("../../lib/types").FeedRow} row
   */
  const userCardFor = (row) =>
    userCardIdentity({
      chain: row.chain,
      walletAddress: row.walletAddress,
      name: row.name?.text,
      avatar: row.avatar?.imgSrc
    });

  /**
   * A swap row is an `<a href>`, so the router's delegated click handler navigates it.
   * A thesis row is a `div role="link"` — the capture's markup, which stood for a React
   * onClick — so it needs the same navigation by hand, or it renders clickable and does
   * nothing. Modified clicks are left to the browser, exactly as the router does.
   * @param {string | undefined} href
   * @param {MouseEvent | KeyboardEvent} event
   */
  function openRow(href, event) {
    followLink(event, href);
  }

  /** @param {KeyboardEvent} event */
  function openRowKey(href, event) {
    followLinkKey(event, href);
  }

  /**
   * A thesis author is a wallet, so a click on their avatar or their name goes to their
   * profile — and stops there: the row behind it navigates to the token.
   * @param {import("../../lib/types").FeedRow} row
   * @param {MouseEvent | KeyboardEvent} event
   */
  function openAuthor(row, event) {
    event.stopPropagation();
    followLink(event, `/profile/${row.walletAddress}`);
  }
</script>

{#if row.type === "swap"}
  <a
    class="flex items-start gap-2 rounded-lg px-2 py-4"
    data-state="closed"
    data-slot="hover-card-trigger"
    href={row.href}
    data-discover="true"
    onmouseenter={(event) => openTokenCard(tokenCardFor(row), event, { placement })}
    onmouseleave={closeHoverCard}
    onfocusin={(event) => openTokenCard(tokenCardFor(row), event, { placement })}
    onfocusout={closeHoverCard}
  >
    <div
      role="link"
      tabindex="0"
      class="shrink-0 cursor-pointer"
      data-state="closed"
      data-slot="hover-card-trigger"
      onmouseenter={(event) => openUserCard(userCardFor(row), event, { placement })}
      onmouseleave={closeHoverCard}
      onclick={(event) => openAuthor(row, event)}
      onkeydown={(event) => openAuthor(row, event)}
    >
      {#if row.avatar.eyes}
        <div class={row.avatar.classes} style={row.avatar.style}>
          <img class={row.avatar.imgClasses} src={row.avatar.imgSrc} alt="" />
        </div>
      {:else}
        <img class={row.avatar.classes} src={row.avatar.imgSrc} alt="" style={row.avatar.style} />
      {/if}
    </div>
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex items-center gap-1">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <div
            role="link"
            tabindex="0"
            class="hover:opacity-80 cursor-pointer"
            data-state="closed"
            data-slot="hover-card-trigger"
            onmouseenter={(event) => openUserCard(userCardFor(row), event, { placement })}
            onmouseleave={closeHoverCard}
            onclick={(event) => openAuthor(row, event)}
            onkeydown={(event) => openAuthor(row, event)}
          >
            <div class={row.name.classes} translate="no">
              <div class={row.name.innerClasses}>{row.name.text}</div>
            </div>
          </div>
          <div class={row.badge.classes} style={row.badge.style}>{row.badge.text}</div>
        </div>
        <div class={row.time.classes} translate="no">
          <span title={row.time.title}>{row.time.text}</span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <div class={row.tokenLogo.wrapperClasses} style={row.tokenLogo.wrapperStyle}>
          <img
            class={row.tokenLogo.img.classes}
            src={row.tokenLogo.img.src}
            alt=""
            style={row.tokenLogo.img.style}
          />
          {#if row.tokenLogo.badge}
            <div class={row.tokenLogo.badge.classes} style={row.tokenLogo.badge.style}>
              <ChainBadge style={row.tokenLogo.badge.svgStyle} />
            </div>
          {/if}
        </div>
        {#each row.line as cell (cell.text)}
          <div class={cell.classes} style={cell.style} translate="no">{cell.text}</div>
        {/each}
      </div>
    </div>
  </a>
{:else if row.type === "thesis"}
  <!-- The row itself is not a trigger: the card belongs to the token block and to the
       author, and hovering the thesis text should open nothing. It still navigates, and
       it still closes whatever the pointer leaves behind. -->
  <div
    role="link"
    tabindex="0"
    class={row.classes}
    onclick={(event) => openRow(row.href, event)}
    onkeydown={(event) => openRowKey(row.href, event)}
    onmouseleave={closeHoverCard}
  >
    <!-- The author is a trigger of their own, the way the avatar and the name are on a
         swap row: the capture never opened the Thesis tab, so its rows were not recorded,
         and this is the same trigger the rows it did record carry. -->
    <div
      role="link"
      tabindex="0"
      class="shrink-0 cursor-pointer pt-0.5"
      data-state="closed"
      data-slot="hover-card-trigger"
      onmouseenter={(event) => openUserCard(userCardFor(row), event, { placement })}
      onmouseleave={closeHoverCard}
      onclick={(event) => openAuthor(row, event)}
      onkeydown={(event) => openAuthor(row, event)}
    >
      {#if row.avatar.eyes}
        <div class={row.avatar.classes} style={row.avatar.style}>
          <img class={row.avatar.imgClasses} src={row.avatar.imgSrc} alt="" />
        </div>
      {:else}
        <img class={row.avatar.classes} src={row.avatar.imgSrc} alt="" style={row.avatar.style} />
      {/if}
    </div>
    <div class="flex flex-col gap-1.5 flex-1 min-w-0">
      <div class="flex items-center gap-1">
        <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <div
            role="link"
            tabindex="0"
            class="hover:opacity-80 cursor-pointer"
            data-state="closed"
            data-slot="hover-card-trigger"
            onmouseenter={(event) => openUserCard(userCardFor(row), event, { placement })}
            onmouseleave={closeHoverCard}
            onclick={(event) => openAuthor(row, event)}
            onkeydown={(event) => openAuthor(row, event)}
          >
            <div class={row.name.classes} translate="no">
              <div class={row.name.innerClasses}>{row.name.text}</div>
            </div>
          </div>
          <div class={row.badge.classes} style={row.badge.style}>{row.badge.text}</div>
        </div>
        <div class={row.time.classes} translate="no">
          <span title={row.time.title}>{row.time.text}</span>
        </div>
      </div>
      <div class="flex items-center gap-2 min-w-0">
        <!-- The token's card opens on the token's own block: its logo and its ticker. -->
        <div
          class="flex items-center gap-1.5 min-w-0"
          data-state="closed"
          data-slot="hover-card-trigger"
          onmouseenter={(event) => openTokenCard(tokenCardFor(row), event, { placement })}
          onmouseleave={closeHoverCard}
        >
          <div class={row.tokenLogo.wrapperClasses} style={row.tokenLogo.wrapperStyle}>
            <img
              class={row.tokenLogo.img.classes}
              src={row.tokenLogo.img.src}
              alt=""
              style={row.tokenLogo.img.style}
            />
            {#if row.tokenLogo.badge}
              <div class={row.tokenLogo.badge.classes} style={row.tokenLogo.badge.style}>
                <ChainBadge style="width: 10px; height: 10px;" />
              </div>
            {/if}
          </div>
          <div class={row.tickerCell.classes}>
            <div class={row.ticker.classes} role={row.ticker.attrs.role} tabindex={row.ticker.attrs.tabindex} translate="no">
              {row.ticker.text}
            </div>
            {#if row.tickerCell.badge}
              <ChainBadge
                class={row.tickerCell.badge.classes}
                style={row.tickerCell.badge.style}
                width={row.tickerCell.badge.width}
                height={row.tickerCell.badge.height}
              />
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          {#each row.amount as cell (`${cell.kind}-${cell.text ?? cell.value ?? ""}`)}
            {#if cell.kind === "pct"}
              <div class={cell.classes} translate="no">
                <span class={cell.openSpanClasses}>{cell.openText}</span>
                <div class={cell.innerClasses} translate="no" style={cell.innerStyle}>
                  <div class={cell.arrowClasses} style={cell.arrowStyle}>{cell.arrow}</div>
                  <div class={cell.valueClasses} style={cell.valueStyle}>{cell.value}</div>
                </div>
                <span class={cell.closeSpanClasses}>{cell.closeText}</span>
              </div>
            {:else if cell.kind === "dot"}
              <div class={cell.classes} style={cell.style}></div>
            {:else if cell.tag === "span"}
              <span class={cell.classes} style={cell.style} translate="no">{cell.text}</span>
            {:else}
              <div class={cell.classes} style={cell.style} translate="no">{cell.text}</div>
            {/if}
          {/each}
        </div>
      </div>
      <div class={row.quote.classes}>
        <div class={row.quote.bar.classes} style={row.quote.bar.style}></div>
        <div class={row.quote.bodyClasses}>{row.quoteText}</div>
      </div>
      <div class="flex items-center gap-3">
        <div class={row.likes.wrapperClasses}>
          <div class={row.likes.innerClasses}>
            <Heart />
          </div>
          <span class={row.likes.spanClasses}>{row.likes.count}</span>
        </div>
      </div>
    </div>
  </div>
{:else if row.type === "announce"}
  <div class={row.classes}>
    <button type="button" aria-label="Collapse" aria-expanded="true" class={row.buttonClasses}>
      <div class={row.avatar.wrapperClasses} style={row.avatar.wrapperStyle}>
        <img class={row.avatar.img.classes} src={row.avatar.img.src} alt="" />
      </div>
      <div class="flex items-center gap-1 flex-1 min-w-0">
        <div class={row.nameClasses} translate="no">{row.name}</div>
        <VerifiedBadge aria-hidden="true" />
      </div>
      <div class={row.time.classes} translate="no">
        <span title={row.time.title}>{row.time.text}</span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <div class={row.pinned.classes}>
          <Pinned aria-hidden="true" />
          <div class="text-xs">{row.pinned.text}</div>
        </div>
        <div class={row.chevron.classes}>
          <ChevronRight aria-hidden="true" />
        </div>
      </div>
    </button>
    <div class={row.cardClasses}>
      <div class={row.titleClasses}>
        <p class={row.titleInner}>{row.title}</p>
      </div>
      <div class="bg-bg-primary p-2 pb-1">
        <p class={row.bodyClasses}>
          {#each row.body as seg (seg.text)}
            {#if seg.tag === "a"}
              <a class={seg.classes} translate="no" href={seg.href}>{seg.text}</a>
            {:else}
              <span class={seg.classes}>{seg.text}</span>
            {/if}
          {/each}
        </p>
        {#if row.showMore}
          <button class={row.showMore.classes}>{row.showMore.text}</button>
        {/if}
      </div>
    </div>
    <div class={row.reaction.wrapperClasses}>
      <div class={row.reaction.classes}>
        <Heart class={row.reaction.svgClasses} width="16" height="16" />
        <span class={row.reaction.spanClasses} translate="no">{row.reaction.count}</span>
      </div>
    </div>
  </div>
{/if}
