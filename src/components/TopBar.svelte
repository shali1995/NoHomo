<script>
  // The app shell's top bar: the fomo wordmark, the search box with its collapsed
  // Recents dropdown, and the wallet widget (cash balance and the profile chip).
  //
  // Structure, classes and inline styles are the capture's; the dropdown rows and the
  // wallet chrome are
  // values in walletWidget.json.
  import Logo from "../icons/logo.svelte";
  import NohomoIcon from "../icons/nohomo.svelte";
  import Search from "../icons/search.svelte";
  import SearchResults from "./search/SearchResults.svelte";
  import { getSearchRows, searchTokens, stopSearch } from "../lib/api/search.svelte.js";
  import { navigate } from "../lib/router.js";
  import WalletMenu from "./wallet/WalletMenu.svelte";
  import ProfileMenu from "./profile/ProfileMenu.svelte";
  import ConnectSheet from "./auth/ConnectSheet.svelte";
  import { openDeposit, openWithdraw } from "../lib/sheets.svelte.js";
  import { getAuthWallet, getConnectRequests, getIsLoggedIn } from "../lib/auth.svelte.js";
  import {
    accountAvatar,
    accountCashText,
    accountLoaded,
    accountPnl24h,
    accountTotalText,
    accountWallet
  } from "../lib/api/account.svelte.js";
  import WalletDeposit from "../icons/wallet-deposit.svelte";
  import Skeleton from "./Skeleton.svelte";
  /** @type {import("../lib/types").WalletSummary} */
  import { railTraders } from "../lib/api/leaderboard.svelte.js";
  // inlined from walletWidget.json — no data file, the strings live with the code
  const walletWidgetJson =   {
    "nav": "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
    "ul": "group flex-1 list-none justify-center flex gap-2 items-stretch",
    "items": [
      {
        "li": "relative flex shrink-0 flex-col items-start justify-center h-12 rounded-xl border border-bg-tertiary px-2",
        "button": "group inline-flex items-center justify-center outline-none disabled:pointer-events-none disabled:opacity-50 group focus:opacity-80 text-sm",
        "anchor": null,
        "href": null,
        "img": null,
        "imgHolder": null,
        "imgHolderStyle": null,
        "depositButton": "text-accent-primary text-xs font-bold hover:opacity-80"
      },
      {
        "li": "relative flex shrink-0 rounded-xl h-12 hover:bg-bg-secondary px-2 py-1 border border-bg-tertiary bg-bg-primary",
        "button": "group inline-flex items-center justify-center outline-none disabled:pointer-events-none disabled:opacity-50 group",
        "anchor": "flex gap-2 items-center min-w-26",
        "href": "/profile/RareTotalFowl",
        "img": "/images/nohomo-eyes.png",
        "imgHolder": "rounded-full flex items-center justify-center shrink-0 object-cover",
        "imgHolderStyle": "width: 32px; height: 32px; min-width: 32px; min-height: 32px; background-color: rgb(255, 111, 233);",
        "changeParts": [
          {
            "tag": "div",
            "classes": "flex gap-0.5 items-center tabular-nums",
            "style": "line-height: 16px;",
            "text": "+$0",
            "inner": [
              {
                "tag": "div",
                "classes": "",
                "style": "font-size: 12px; font-weight: 500; color: rgb(152, 153, 163);",
                "text": "+"
              },
              {
                "tag": "div",
                "classes": "",
                "style": "font-size: 12px; font-weight: 500; color: rgb(152, 153, 163);",
                "text": "$0"
              }
            ]
          },
          {
            "tag": "div",
            "classes": "text-text-tertiary text-xs",
            "style": "",
            "text": "24h",
            "inner": []
          }
        ],
        "changeLine": "flex gap-1 items-center tabular-nums",
        "changeLineStyle": ""
      }
    ]
  };

  /** @type {import("../lib/types").AlertRow[]} */
  /** @type {import("../lib/types").WalletWidgetData} */
  const walletWidget = walletWidgetJson;

  /**
   * The wallet chip's 24h line. The rows and their classes are the capture's own two parts;
   * only the sign, the value and the tone come from the account. The zero spelling (`+$0`)
   * and the idle tertiary tone are what the capture recorded, and the green and red are the
   * page's own two inks (the same pair the profile's P&L uses).
   */
  const changeTone = walletWidget.items[1].changeParts[0];
  const changeLabel = walletWidget.items[1].changeParts[1];
  const IDLE_INK = "rgb(152, 153, 163)";
  const UP_INK = "rgb(33, 201, 94)";
  const DOWN_INK = "rgb(255, 98, 46)";

  const pnl = $derived.by(() => {
    const live = accountPnl24h();
    if (!live) return { sign: changeTone.inner[0].text, text: changeTone.inner[1].text, ink: IDLE_INK };
    return { sign: live.value < 0 ? "-" : "+", text: live.text, ink: live.value === 0 ? IDLE_INK : live.up ? UP_INK : DOWN_INK };
  });

  /** The capture's own cell dressing (`font-size: 12px; font-weight: 500`), toned by the day. */
  const pnlCellStyle = $derived(`font-size: 12px; font-weight: 500; color: ${pnl.ink};`);

  /**
   * The profile the wallet chip opens: the wallet the app holds for the reader (the one the
   * figures beside it come from), else the wallet they signed in with, else the capture's.
   */
  function ownProfileHref() {
    const wallet = accountWallet()?.address ?? getAuthWallet();
    return wallet ? `/profile/${wallet}` : walletWidget.items[1].href;
  }

  let query = $state("");
  // In the capture the wallet's hover panel is the door to the two sheets; they are the
  // app's own now (src/lib/sheets.svelte.js), because the profile's cash row opens them too.
  let walletMenuOpen = $state(false);
  let profileMenuOpen = $state(false);
  // The connect flow: which of its two doors the sheet opens on. The wallet menu's
  // Connect Mobile goes straight to the QR, the top bar's Connect Wallet to the choice.
  let connectOpen = $state(false);
  let connectView = $state("choose");

  /** @param {"choose" | "qr"} view */
  function openConnect(view) {
    connectView = view;
    connectOpen = true;
  }
  /**
   * The sheet's other door: a buy or a sell while signed out asks for it rather than
   * pretending to trade (src/lib/auth.svelte.js). The request is a count, so one ask is
   * answered once — a reader who closes the sheet and presses again gets it back.
   */
  let answeredConnectRequests = 0;
  $effect(() => {
    const asked = getConnectRequests();
    if (asked === answeredConnectRequests) return;
    answeredConnectRequests = asked;
    openConnect("choose");
  });
  // The search box's own states, read off the capture: closed by default (0005.30 —
  // the suggestions sit inside a max-h-0, pointer-events-none wrapper), open on
  // focus showing Recents (0024.94 with an empty field, 0027.89 with "h" typed —
  // results are not in yet), results once a real query is in (0028.37), and closed
  // again on blur with the query still in the field (0030.90).
  let searchOpen = $state(false);
  /** The field, so clicking anywhere in the box can put the caret in it. */
  let searchInput = $state(null);
  /** Which result Enter would open. Ombra keeps the same index. */
  let selectedIdx = $state(-1);

  /**
   * The search box's Recents list: the top traders over 30 days. It reads the snapshot the
   * leaderboard already stored and only fetches when nothing is stored, so opening the search
   * never costs a request of its own.
   */
  let topTraders = $state([]);
  $effect(() => {
    void railTraders(9).then((rows) => {
      topTraders = rows.map((row) => ({
        href: row.href,
        name: row.name,
        handle: row.handle,
        // the ranking's rows call it `avatarImg`
        avatar: row.avatarImg,
        avatarBg: row.avatarBg,
        avatarEyes: !row.avatarImg
      }));
    });
  });

  const rows = $derived(getSearchRows());
  const searchResults = $derived(query.trim().length >= 2);

  // Two characters is where the list stops being Recents, and it is the endpoint's own
  // minimum. Closing the box drops the rows and the live lookup room with them.
  $effect(() => {
    if (!searchOpen) {
      stopSearch();
      return;
    }
    searchTokens(query);
    // A new query is a new list: start again at the top. Live frames patch the rows in
    // place without touching this, so the highlight does not jump while arrowing.
    selectedIdx = 0;
  });

  function focusSearch() {
    searchOpen = true;
    searchInput?.focus();
  }

  function closeSearch() {
    searchOpen = false;
    query = "";
    searchInput?.blur();
  }

  /** Enter opens the highlighted result, and the box closes behind it. */
  function openSelected() {
    const row = rows[selectedIdx];
    if (!row) return;
    closeSearch();
    navigate(row.href);
  }

  function onSearchKeydown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, Math.max(0, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openSelected();
    } else if (event.key === "Escape") {
      closeSearch();
    }
  }

  // The `/` badge in the box is a shortcut: it opens the search and puts the caret in
  // the field, as long as the key is not already going into a field of its own.
  $effect(() => {
    const onKeydown = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (typing) return;
      event.preventDefault();
      focusSearch();
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  });
</script>

<div class="pr-4">
  <div class="flex items-center justify-between px-1">
    <div class="flex gap-6 items-center min-w-0 flex-1">
      <a
        href="/"
        aria-label="nohomo"
        class="flex items-center gap-2"
        onclick={(event) => {
          // the same door as the root: `/` is where the app picks ECHO's first token
          event.preventDefault();
          navigate("/", { replace: true });
        }}
      >
        <!-- the wordmark, then the mark on its right: the same head the app falls back to -->
        <Logo aria-hidden="true" />
        <NohomoIcon class="h-12 w-12" aria-hidden="true" />
      </a>
    </div>

    <div class="relative search-shell min-w-80 h-12 mt-1">
      <div class="absolute top-0 left-1/2 z-modal flex search-shell search-panel -translate-x-1/2 flex-col">
        <div class="relative">
        {#if searchOpen}
          <div class="pointer-events-none absolute -inset-2 rounded-2xl border border-bg-tertiary/80 bg-bg-secondary/40 backdrop-blur-sm"></div>
        {/if}
        <div class="relative z-10 flex flex-col">
          <!-- `cursor-text` promised a caret that only the input itself granted: a click
               on the padding, the icon or the badge did nothing. Anywhere in the box now
               puts the caret in the field (the Paste button excepted). -->
          <div
            class="flex h-12 items-center gap-2 rounded-xl border px-3 cursor-text border-bg-tertiary {searchOpen
              ? 'hover:bg-bg-secondary bg-bg-secondary'
              : 'bg-bg-primary hover:bg-bg-secondary'}"
            onclick={(event) => {
              if (event.target instanceof Element && event.target.closest("button")) return;
              focusSearch();
            }}
          >
            <div class="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <Search />
                <input
                  bind:this={searchInput}
                  class="h-full min-w-0 flex-1 bg-transparent text-sm font-normal leading-none text-text-primary outline-none"
                  placeholder="Search for tokens or traders..."
                  bind:value={query}
                  onfocusin={() => (searchOpen = true)}
                  onfocusout={() => (searchOpen = false)}
                  onkeydown={onSearchKeydown}
                />
              </div>
            </div>
            <div class="ml-auto flex shrink-0 items-center gap-2">
              <button type="button" class="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-bg-tertiary text-text-secondary hover:text-text-primary cursor-pointer">
                Paste
              </button>
              <div class="text-[10px] font-bold min-w-5 text-center px-1.5 py-0.5 rounded-sm bg-bg-tertiary text-text-secondary">
                {searchOpen ? "ESC" : "/"}
              </div>
            </div>
          </div>

          <!-- Suggestions. The wrapper is always there -- the capture has it in every
               state (collapsed at 0005.30 and 0031.47, open at 0024.94/0027.89/0028.37)
               and only its classes change with focus, read straight off those
               snapshots:
                 collapsed: overflow-hidden transition-[max-height,opacity] duration-150 ease-out pointer-events-none max-h-0 opacity-0
                 open:      overflow-hidden transition-[max-height,opacity] duration-150 ease-out opacity-100
               What sits inside follows the query instead: Recents until a real query is
               in (0027.89 still shows Recents with "h"), then the tabs and the rows. -->
          <div
            class="overflow-hidden transition-[max-height,opacity] duration-150 ease-out {searchOpen
              ? 'opacity-100'
              : 'pointer-events-none max-h-0 opacity-0'}"
          >
            {#if searchResults}
              <SearchResults
                onPick={closeSearch}
                selectedIndex={selectedIdx}
                onHover={(index) => (selectedIdx = index)}
              />
            {:else}
            <div>
                <div class="flex min-h-70 max-h-110 flex-col overflow-y-auto">
                  <div class="flex h-9 shrink-0 items-center text-sm text-text-secondary justify-between px-2">
                    <span>Recents</span>
                    <button type="button" class="text-xs text-accent-primary font-bold hover:opacity-80">Clear all</button>
                  </div>

                  {#each topTraders as row (row.href)}
                    <div class="flex shrink-0 items-center gap-3 px-2 py-2 justify-between rounded-md hover:bg-bg-tertiary/60 focus-within:bg-bg-tertiary/60">
                      <a class="min-w-0 flex-1 rounded-lg focus:outline-none" href={row.href}>
                        <div class="flex items-center gap-3 min-w-0">
                          {#if row.avatarEyes === false}
                            <img
                              class="rounded-full flex items-center justify-center shrink-0 object-cover"
                              src={row.avatar}
                              alt=""
                              style="width: 36px; height: 36px; min-width: 36px; min-height: 36px;"
                            />
                          {:else}
                            <div
                              class="rounded-full flex items-center justify-center shrink-0 object-cover"
                              style="width: 36px; height: 36px; min-width: 36px; min-height: 36px; background-color: {row.avatarBg};"
                            >
                              <img class="w-[70%] h-[70%]" src={row.avatar} alt="" />
                            </div>
                          {/if}
                          <div class="flex flex-col gap-0 items-start min-w-0">
                            <div class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm">
                              <div class="min-w-0 truncate">{row.name}</div>
                            </div>
                            <div class="text-xs text-text-secondary">{row.handle}</div>
                          </div>
                        </div>
                      </a>
                      <div class="flex items-center gap-2 shrink-0">
                        <button class={row.buttonClass}><span class="inline-block animate-flip-up">{row.buttonText}</span></button>
                      </div>
                    </div>
                  {/each}
                </div>
            </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
    </div>

    <div class="flex min-w-0 flex-1 justify-end">
      <!-- Both number-flow-react hosts render with no props and no inline size: the
           `number-flow-react` rule in src/app.css supplies their box, because the
           element's real styling lives in its own shadow root. They carry the account's
           own numbers, and until the first read lands they carry a placeholder the size of
           the number: showing the capture's `$7.72` for a moment on every refresh read as
           somebody else's money. -->
      <nav class={walletWidget.nav}>
        <div>
        {#if getIsLoggedIn()}
        <ul class={walletWidget.ul}>
          <li
            data-slot="navigation-menu-item"
            class={walletWidget.items[0].li}
            onmouseenter={() => (walletMenuOpen = true)}
            onmouseleave={() => (walletMenuOpen = false)}
          >
            <button class={walletWidget.items[0].button}>
              <div class="flex gap-1 items-baseline tabular-nums">
                <span><number-flow-react>{#if accountLoaded()}{accountCashText() ?? "$0.00"}{:else}<Skeleton class="h-4 w-10 rounded-sm" />{/if}</number-flow-react></span>
                <div class="text-text-tertiary">cash</div>
              </div>
            </button>
            <button type="button" class={walletWidget.items[0].depositButton} onclick={openDeposit}>Deposit more</button>
            {#if walletMenuOpen}
              <WalletMenu
                onDeposit={openDeposit}
                onWithdraw={openWithdraw}
                onConnectMobile={() => openConnect("qr")}
              />
            {/if}
          </li>

          <li
            data-slot="navigation-menu-item"
            class={walletWidget.items[1].li}
            onmouseenter={() => (profileMenuOpen = true)}
            onmouseleave={() => (profileMenuOpen = false)}
          >
            <button class={walletWidget.items[1].button}>
              <!-- The profile the chip opens is the reader's own wallet, not the wallet the
                   capture happened to be signed in with. -->
              <a class={walletWidget.items[1].anchor} href={ownProfileHref()}>
                <div class="flex flex-col flex-1">
                  <div class="text-sm tabular-nums text-left">
                    <span><number-flow-react>{#if accountLoaded()}{accountTotalText() ?? "$0.00"}{:else}<Skeleton class="h-4 w-12 rounded-sm" />{/if}</number-flow-react></span>
                  </div>
                  <div class={walletWidget.items[1].changeLine} style={walletWidget.items[1].changeLineStyle ?? ""}>
                    <!-- The capture's own two cells and classes, with the account's 24h P&L:
                         `+$0` in the tertiary tone when nothing moved, green or red when it
                         did. The `$0` spelling at zero is the capture's. -->
                    <div class={changeTone.classes} style={changeTone.style}>
                      {#if accountLoaded()}
                        <div style={pnlCellStyle}>{pnl.sign}</div>
                        <div style={pnlCellStyle}>{pnl.text}</div>
                      {:else}
                        <Skeleton class="h-3 w-10 rounded-sm" />
                      {/if}
                    </div>
                    <div class={changeLabel.classes} style={changeLabel.style}>{changeLabel.text}</div>
                  </div>
                </div>
                <div class={walletWidget.items[1].imgHolder} style={walletWidget.items[1].imgHolderStyle}>
                  <img class="w-[70%] h-[70%]" src={accountAvatar() ?? walletWidget.items[1].img} alt="" />
                </div>
              </a>
            </button>
          {#if profileMenuOpen}
              <ProfileMenu onLogout={() => (profileMenuOpen = false)} />
            {/if}
            </li>
        </ul>
        {:else}
          <!-- Nothing is signed in, so the wallet widget has nothing to show: the capture's
               two items are the session's own (cash, and the wallet's 24h), which is why the
               logged-out state is this one control instead. It keeps the item's height and
               corner so the bar does not shift when the session arrives. -->
          <button
            type="button"
            class="flex h-12 shrink-0 items-center gap-2 rounded-xl border border-bg-tertiary bg-accent-primary px-4 text-sm font-bold text-white hover:opacity-80"
            onclick={() => openConnect("choose")}
          >
            <WalletDeposit class="w-4 h-4 text-white" />
            Connect Wallet
          </button>
        {/if}
        </div>
      </nav>
    </div>
  </div>
</div>

{#if connectOpen}
  <ConnectSheet view={connectView} onclose={() => (connectOpen = false)} />
{/if}
