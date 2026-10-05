<script>
  // The app shell: the desktop frame (top bar, left panel, the route's page and the
  // ticker) plus the trade modal the capture portals over it.
  //
  // Structure and classes are the capture's. The route is read off the URL through
  // src/lib/router.js so token/profile paths are real, reloadable URLs — the capture's
  // own router used path routes, and `?tradeId=` was already read from the query.
  import TopBar from "./components/TopBar.svelte";
  import LeftPanel from "./components/LeftPanel.svelte";
  import Ticker from "./components/Ticker.svelte";
  import TokenPage from "./pages/TokenPage.svelte";
  import DepositSheet from "./components/deposit/DepositSheet.svelte";
  import WithdrawSheet from "./components/withdraw/WithdrawSheet.svelte";
  import { closeDeposit, closeWithdraw, isDepositOpen, isWithdrawOpen } from "./lib/sheets.svelte.js";
  import ProfilePage from "./pages/ProfilePage.svelte";
  import WelcomePopup from "./components/WelcomePopup.svelte";
  import MobileApp from "./components/mobile/MobileApp.svelte";
  import ConnectPage from "./pages/ConnectPage.svelte";
  import TradePopup from "./components/TradePopup.svelte";
  import HoverCardLayer from "./components/hover/HoverCardLayer.svelte";
  import { matchRoute, startRouter } from "./lib/router.js";
  import { startFitScale } from "./lib/utils/fit.js";
  import { initAuth, onAuthTokenChange } from "./lib/auth.svelte.js";
  import GoogleCallback from "./components/auth/GoogleCallback.svelte";
  import ToastContainer from "./components/ToastContainer.svelte";
  import Portal from "./components/Portal.svelte";
  import { authenticate } from "./lib/ws/client.js";
  import { chainSlug } from "./lib/routes.js";
  import { navigate } from "./lib/router.js";
  import { ensureEchoStream, echoQueryKey, echoVisibleRows } from "./lib/api/echo.svelte.js";
  import { isPhone, startDevice } from "./lib/device.svelte.js";

  const url = $state({ pathname: window.location.pathname, search: window.location.search });

  if (typeof window !== "undefined") {
    window.addEventListener("popstate", () => {
      url.pathname = window.location.pathname;
      url.search = window.location.search;
    });
    startRouter();
  }

  const resolved = $derived(
    matchRoute(url.pathname) ?? { name: "token", params: {} }
  );
  const page = $derived(resolved.name === "profile" ? "profile" : "token");
  /**
   * The Google return is not a screen of the app: it is a session arriving, and it belongs to
   * neither shell. It is drawn instead of them for the moment it takes to read the query and hand
   * the token to the auth store, whichever frame the reader came from.
   */
  const googleCallback = $derived(resolved.name === "google");
  const profileWallet = $derived(resolved.params.wallet ?? "");
  const chain = $derived(resolved.params.chain ?? "");
  const address = $derived(resolved.params.address ?? "");

  /**
   * `/` is nobody's token. It opens the first of ECHO's ranking instead: what actually moved is the
   * point of the app, so that is what it lands on. If ECHO has nothing to say within a few seconds
   * the fallback stands, because a blank page is worse than a default.
   */
  const HOME_FALLBACK = "CuP5Ng85HiCdHiKnc9pKe9MVEVkJDHmMsyEvbXHopump";

  $effect(() => {
    // The phone has a home of its own — the discovery list — so `/` stays `/` there.
    if (isPhone()) return;
    if (url.pathname !== "/") return;
    ensureEchoStream(echoQueryKey());
    const first = echoVisibleRows()[0];
    if (first?.address) {
      // replace, not push: `/` is not a place to come back to
      navigate(`/tokens/${chainSlug(first.chain ?? "SOL")}/${first.address}`, { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      if (!echoVisibleRows()[0]) navigate(`/tokens/solana/${HOME_FALLBACK}`, { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  });

  /** The phone end of the mobile connect pairing: a page of its own, without the shell. */
  const isConnect = $derived(resolved.name === "connect");

  // An existing session resumes on load, and a token that gets refreshed re-authenticates
  // the live socket instead of forcing a reconnect. (The account reads follow the session
  // from src/lib/api/account.svelte.js, which starts itself.)
  $effect(() => startDevice());

  $effect(() => {
    initAuth();
    return onAuthTokenChange((next) => authenticate(next));
  });
  /**
   * The app is drawn for a wider window than a laptop has, so it opens scaled to fit
   * instead of cramped. The scale goes on this wrapper and nowhere else: the ticker below
   * it and the popups after it stay outside, which is what keeps their measured
   * coordinates meaning one thing. See src/lib/utils/fit.js.
   */
  let fitWrapper = $state(null);

  $effect(() => {
    if (!fitWrapper) return;
    return startFitScale(fitWrapper);
  });

  // ?tradeId= opens the trade detail modal over whatever page is behind it.
  const tradeId = $derived(new URLSearchParams(url.search).get("tradeId"));
</script>

{#if googleCallback}
  <!-- The session arriving from Google, before either shell exists for it. -->
  <GoogleCallback />
{:else if isConnect}
  <!-- The phone scans the desktop's QR here. It is outside the shell and outside the fitted
       box on purpose: it is a page for a phone, so it wants the window's own size and the
       window's own type. -->
  <ConnectPage />
{:else if isPhone()}
  <!-- The phone shell: the same routes, the same API modules, a different frame. It is
       mounted instead of the desktop one rather than hidden beside it, so only one of
       them is ever holding a socket. -->
  <MobileApp {page} {chain} {address} wallet={profileWallet} />
{:else}
<div class="desktop-content">
  <!-- The fitted box: it is given the window's size divided by the scale and then scaled
       back down, so what is on screen is exactly the window. The shell fills it, which is
       why the shell is sized in percentages and not in `dvw`/`svh` — those would measure
       the window and ignore the scale, which is the gap this replaced. -->
  <div bind:this={fitWrapper} class="overflow-hidden" style="width: 100%; height: 100%;">
    <div class="pt-2 pl-4 w-full h-full flex flex-col gap-3 overflow-hidden pb-6">
      <TopBar />

      <div class="flex gap-3 2xl:gap-3 flex-1 min-h-0">
        <LeftPanel />
        {#if page === "profile"}
          <ProfilePage wallet={profileWallet} />
        {:else}
          <TokenPage {chain} {address} />
        {/if}
      </div>
    </div>

    <!-- The wallet's two sheets live here, not in the top bar: the cash row on your own
         profile opens the same pair, so they belong to the app. Inside the fitted box, which
         is where they were before and what keeps their size. -->
    {#if isDepositOpen()}
      <DepositSheet onclose={closeDeposit} />
    {/if}

    {#if isWithdrawOpen()}
      <WithdrawSheet onclose={closeWithdraw} />
    {/if}
  </div>

  <Ticker />
  <Portal>
    <ToastContainer />
  </Portal>
</div>

<!-- the modal is portalled to the end of the body by the original, so it sits
     outside the app shell here too. Left outside the fitted box as well: a dialog is
     meant to be read, so it keeps the window's own type size. -->
{#if tradeId}
  <TradePopup {tradeId} />
{/if}

<!-- The hover cards, portalled the way the original portals them — and outside the fitted
     box, so they keep the layering they had (a card sits above the ticker, as it does on
     the captured page). They are scaled at the anchor instead, so a card reads the same
     size as the rows it points at. See src/lib/hoverCard.svelte.js. -->
<HoverCardLayer />
{/if}

<!-- The welcome stands on both: side by side with its video on a desktop, stacked on a phone.
     One component, so the two cannot say different things. -->
<WelcomePopup />
