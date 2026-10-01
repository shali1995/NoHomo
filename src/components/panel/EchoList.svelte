<script>
  // The Echo pill's view: live token rankings from the Echo service.
  //
  // The stream is owned here, because this component only exists while Echo is the selected
  // pill: mounting opens the one stream for the current kind/period/limit, a filter change
  // closes that stream and opens the new one, and leaving the pill closes it. The rows it
  // sends are the table; the client-side Newest / Age / 24h-change controls are applied on
  // top by the store, which also owns the batched OpenDEX market cache they read.
  //
  // The box is the same nesting the other panel lists draw in (ListShell's scroll box and
  // container style). These rows are not the capture's virtualized 53px rows — they carry
  // the ranking's own numbers and a live snapshot replaces them every couple of seconds —
  // so they flow in order instead of being placed at a fixed stride.
  // inlined from panelList.json — no data file, the strings live with the code
  const panelList =   {
    "containerStyle": "display: block; min-height: 100%; box-sizing: border-box;",
    "spacerStyle": "height: 3922px; opacity: 1; position: relative;",
    "rows": [
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 0px;",
        "href": "/tokens/robinhood/0xddd4947010496b500abe96ab0965c38584413ba3"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 53px;",
        "href": "/tokens/solana/EKtmPPLaCbEEKiwoHHtV7TsRsmPXs5CMGtQtZFSiinsc"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 106px;",
        "href": "/tokens/bnb/0xb077ada375b5e416f15e8b8f6827dadfa53a7777"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 159px;",
        "href": "/tokens/bnb/0x14f6a94909c407854390aa2d2462a3095d317777"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 212px;",
        "href": "/tokens/robinhood/0x0d4ed27a906a0774474b200cc5392019facd2a47"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 265px;",
        "href": "/tokens/bnb/0x422adcec9b05b2473f1b4fe5a72689f4cc9b7777"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 318px;",
        "href": "/tokens/solana/FiXDsziPrJvEg8CVsFsHa6rykx6Sk7rckZi39nfVtDwj"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 371px;",
        "href": "/tokens/solana/FvMLDEUDKUr9C34e8Nynz5Aqfdk34a2RBKQxygLpfomo"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 424px;",
        "href": "/tokens/solana/9DdHxVe1BSPaTy3iGEwvWsooRchNLK61XFAvzot59FwD"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 477px;",
        "href": "/tokens/robinhood/0x0a574aae41da077713ba32aa05ca151c8759e2f6"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 530px;",
        "href": "/tokens/solana/Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 583px;",
        "href": "/tokens/robinhood/0x1249a3544fbdb3a81763550d3191dc3724f1d3ec"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 636px;",
        "href": "/tokens/robinhood/0x3ba500f1ababbcf0f0247d06d1c56fd7e6c4c09d"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 689px;",
        "href": "/tokens/solana/91ryaCo5yGpYZM3bs6GUPs97VWJQj7RozBmqPULgpump"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 742px;",
        "href": "/tokens/solana/FPPGF5RNgCvNzqrRqWrkgkL4YQhzqKMNVtD1kWk1ooqg"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 795px;",
        "href": "/tokens/solana/GTBxUiw6wJdmmkCGZgRHLyYxqu1vG4KtRpeox6yDpump"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 848px;",
        "href": "/tokens/robinhood/0x685dfd386968b58d895f934485820c479c79a8bb"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 901px;",
        "href": "/tokens/robinhood/0x812486eaea648819853f8e372dc9f1516c7868bd"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 954px;",
        "href": "/tokens/bnb/0x108876c3df3d893350e9b780563b3697aa3e7777"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 1007px;",
        "href": "/tokens/robinhood/0x22eb9f1c5385ed74257da42d8021916c2d837135"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 1060px;",
        "href": "/tokens/solana/8k4sBtEeK4pf26noKqApv8NBTnuSJcbdwpKYknk5PbAA"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 1113px;",
        "href": "/tokens/solana/HcRLc9VDgjLeK154xDawfb1dmVJ98DoSqcwTHGqiDeJR"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 1166px;",
        "href": "/tokens/solana/98kfF7rmsg1QDUEoCqNE7g7M1FdrTt92TEp2CLzypump"
      },
      {
        "absStyle": "contain: layout style paint; left: 0px; position: absolute; right: 0px; top: 1219px;",
        "href": "/tokens/solana/4sWNB8zGWHkh6UnmwiEtzNxL4XrN7uK9tosbESbJFfVs"
      }
    ]
  };
  import { untrack } from "svelte";
  import {
    echo,
    echoFilters,
    echoMetaTitle,
    echoQueryKey,
    echoRowView,
    echoStatusLabel,
    echoVisibleRows,
    ensureEchoStream,
    retryEchoStream,
    stopEchoMarkets,
    stopEchoStream,
    syncEchoMarkets
  } from "../../lib/api/echo.svelte.js";
  import EchoRow from "./EchoRow.svelte";
  import TokenRowSkeleton from "./TokenRowSkeleton.svelte";

  /** Placeholder rows: enough to hold the panel open while the first snapshot is in flight. */
  const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => i);

  // Re-runs exactly when the server-side filter set changes: the old stream is closed by the
  // cleanup and the new filter set is streamed. One stream, always.
  $effect(() => {
    const key = echoQueryKey();
    ensureEchoStream(key);
    return () => stopEchoStream();
  });

  const rows = $derived(echoVisibleRows());
  const views = $derived(rows.map((row) => echoRowView(row)));

  // The 24h change and token age are OpenDEX's, read in batches and cached per address, so a
  // snapshot every couple of seconds costs nothing for a row already resolved. The sweep
  // reads the cache it may extend, so it runs untracked: the effect depends on the snapshot
  // alone, and an arriving socket frame does not re-run it.
  $effect(() => {
    const addresses = echo.rows.map((row) => row.address);
    untrack(() => syncEchoMarkets(addresses));
  });

  // Unmount only: the market sockets and the stale-entry timer go with the view, the cache
  // stays so a return to Echo does not re-read every token.
  $effect(() => () => stopEchoMarkets());

  /**
   * The status strip's clock, so "Live · 12s ago" keeps counting when nothing arrives, plus
   * a watchdog for a stream that has gone quiet without erroring (a half-open connection).
   * The watchdog only ever fires after a snapshot has landed: the slower windows take
   * seconds to answer at all, and a first load that is merely still running is left alone.
   * Both live in the interval callback, which effect tracking does not see.
   */
  let nowMs = $state(Date.now());
  $effect(() => {
    const timer = setInterval(() => {
      nowMs = Date.now();
      if (echo.loaded && echo.streamState === "open" && nowMs - echo.lastSnapshotAt > 90_000) retryEchoStream();
    }, 5_000);
    return () => clearInterval(timer);
  });

  const loading = $derived(echo.loading && rows.length === 0);
  const filtered = $derived(rows.length !== echo.rows.length);
  const countLabel = $derived(
    echo.rows.length === 0 ? "" : filtered ? `${rows.length} of ${echo.rows.length}` : `${echo.rows.length} tokens`
  );
  const emptyMessage = $derived(
    echo.error
      ? echo.error
      : echo.loaded
        ? echoFilters.maxAgeSeconds || echoFilters.change !== "all"
          ? "No tokens match the age and 24h-change filters."
          : "No tokens in this window."
        : "Waiting for the first snapshot…"
  );
  const dotColor = $derived(echo.streamState === "open" ? "rgb(33, 201, 94)" : echo.streamState === "closed" ? "rgb(71, 75, 82)" : "rgb(255, 194, 46)");
</script>

<div class="flex flex-col flex-1 min-h-0">
  <div class="flex items-center gap-1.5 px-3 pb-1 shrink-0 text-[10px] text-text-tertiary">
    <span class="h-1.5 w-1.5 rounded-full shrink-0" style="background-color: {dotColor};"></span>
    <span class="truncate" title={echoMetaTitle()}>{echoStatusLabel(nowMs)}</span>
    <span class="ml-auto shrink-0">{countLabel}</span>
  </div>

  {#if echo.error && rows.length > 0}
    <div class="mx-2 mb-1 flex items-start gap-2 rounded-md bg-warning-transparent p-2 text-[10px] text-text-primary/60">
      <span class="flex-1">{echo.error}</span>
      <button class="shrink-0 text-text-secondary hover:text-text-primary outline-none" onclick={retryEchoStream}>Retry</button>
    </div>
  {/if}

  <div class="flex-1 min-h-0 px-2 pt-1">
    <div class="relative h-full">
      <div class="h-full overflow-y-auto overflow-x-hidden">
        <div class="legend-list-content-container" style={panelList.containerStyle}>
          {#if loading}
            <div class="flex flex-col">
              {#each SKELETON_ROWS as key (key)}
                <TokenRowSkeleton />
              {/each}
            </div>
          {:else if views.length === 0}
            <div class="flex flex-col items-center gap-2 px-4 pt-6 text-center">
              <p class="text-xs text-text-tertiary leading-5">{emptyMessage}</p>
              {#if echo.error || echo.loaded}
                <button
                  class="text-xs text-text-secondary hover:text-text-primary outline-none"
                  onclick={retryEchoStream}
                >Retry</button>
              {/if}
            </div>
          {:else}
            <div class="flex flex-col">
              {#each views as view (view.key)}
                <EchoRow row={view} />
              {/each}
            </div>
          {/if}
        </div>
      </div>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t to-transparent from-bg-primary"></div>
    </div>
  </div>
</div>
