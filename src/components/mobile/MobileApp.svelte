<!--
  The phone shell: one screen at a time, a floating bar under the tab roots, and the
  sheets they open. It is mounted instead of the desktop frame when the window is narrow
  (src/lib/device.svelte.js) and reads the same routes and the same API modules.
-->
<script>
  import MobileNav from "./MobileNav.svelte";
  import ToastContainer from "../ToastContainer.svelte";
  import Portal from "../Portal.svelte";
  import HomeScreen from "./screens/HomeScreen.svelte";
  import SearchScreen from "./screens/SearchScreen.svelte";
  import FeedScreen from "./screens/FeedScreen.svelte";
  import LeaderboardScreen from "./screens/LeaderboardScreen.svelte";
  import ProfileScreen from "./screens/ProfileScreen.svelte";
  import TokenScreen from "./screens/TokenScreen.svelte";
  import DepositSheet from "./sheets/DepositSheet.svelte";
  import BuyScreen from "./sheets/BuyScreen.svelte";
  import WithdrawScreen from "./sheets/WithdrawScreen.svelte";
  import { navigate } from "../../lib/router.js";
  import {
    closeMobileDeposit,
    closeMobileTrade,
    closeMobileWithdraw,
    isMobileDepositOpen,
    isMobileWithdrawOpen,
    mobileTradeSide,
    openMobileTrade
  } from "../../lib/mobile-sheets.svelte.js";
  import { accountWallets } from "../../lib/api/account.svelte.js";
  import { getAuthWallet } from "../../lib/auth.svelte.js";

  /** Same props the desktop pages get, from App.svelte's route match. */
  let { page, chain, address, wallet } = $props();

  let tab = $state("home");

  /** A token or a trader's profile is pushed over the tabs: no bar under it, an arrow on top. */
  const pushed = $derived(page === "profile" ? "profile" : address ? "token" : null);

  /**
   * The profile tab is the session's own wallet — the account the app is signed into —
   * falling back to a pushed wallet so a shared link still opens the right page.
   */
  const ownWallet = $derived(
    getAuthWallet() || accountWallets()[0]?.address || wallet
  );

  function openRow(row) {
    if (row?.href) navigate(row.href);
  }

  function openTrader(trader) {
    if (trader?.walletAddress) navigate(`/profile/${trader.walletAddress}`);
  }

  function back() {
    navigate("/");
  }
</script>

<div class="m-phone">
  {#if pushed === "token"}
    <TokenScreen
      {chain}
      {address}
      onback={back}
      onopenbuy={() => openMobileTrade("buy")}
      onopensell={() => openMobileTrade("sell")}
    />
  {:else if pushed === "profile"}
    <ProfileScreen wallet={wallet} pushed onback={back} onopen={openRow} />
  {:else}
    <section class="stage">
      {#if tab === "home"}
        <HomeScreen onopen={openRow} onopentrader={openTrader} />
      {:else if tab === "search"}
        <SearchScreen onopen={openRow} onopentrader={openTrader} />
      {:else if tab === "feed"}
        <FeedScreen onopen={openRow} onopentrader={openTrader} />
      {:else if tab === "leaderboard"}
        <LeaderboardScreen onopen={openRow} onopentrader={openTrader} />
      {:else}
        <ProfileScreen wallet={ownWallet} onopen={openRow} />
      {/if}
    </section>
    <MobileNav {tab} onselect={(id) => (tab = id)} />
  {/if}

  {#if isMobileDepositOpen()}
    <DepositSheet onclose={closeMobileDeposit} />
  {/if}

  {#if mobileTradeSide()}
    <div class="overlay">
      <BuyScreen side={mobileTradeSide()} onclose={closeMobileTrade} />
    </div>
  {/if}

  {#if isMobileWithdrawOpen()}
    <div class="overlay">
      <WithdrawScreen onback={closeMobileWithdraw} onclose={closeMobileWithdraw} />
    </div>
  {/if}

  <!-- The notices are the desktop pair's own component: an order that fails on a phone has
       to say so somewhere, and its placement (bottom centre, above the bar) already reads
       on a phone. -->
  <Portal>
    <ToastContainer />
  </Portal>
</div>

<style>
  /* The buy screen is pushed over whatever is behind it: the capture never shows the page
     under it, because the route it pushes is opaque edge to edge. */
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 40;
  }

  .stage {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
  }
</style>
