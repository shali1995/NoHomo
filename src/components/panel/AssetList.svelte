<script>
  // A curated list — crypto majors, or tokenised stocks.
  //
  // The box is the same nesting the other panel lists draw in: the panel's scroll container, then
  // `legend-list-content-container` with ListShell's container style. Without a box of its own a
  // view spills over the panel's other views.
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
  import { isListLoading, listError, listRows, loadList, startListLive, stopListLive } from "../../lib/api/lists.svelte.js";
  import AssetRow from "./AssetRow.svelte";
  import TokenRowSkeleton from "./TokenRowSkeleton.svelte";

  /** @type {{ kind: "majors" | "stocks" }} */
  let { kind } = $props();

  /** The stocks list is 401 assets; the rail draws a page and says how many it is holding. */
  const PAGE = 120;
  const SKELETON_ROWS = Array.from({ length: 8 }, (_, i) => i);

  const rows = $derived(listRows(kind));
  const shown = $derived(rows.slice(0, PAGE));
  const error = $derived(listError(kind));
  const waiting = $derived(isListLoading(kind) && rows.length === 0);

  // read the list when its pill opens, keep it answering while it is on screen, stop when it leaves
  $effect(() => {
    void loadList(kind);
    startListLive(kind);
    return () => stopListLive(kind);
  });
</script>

<div class="flex flex-col flex-1 min-h-0">
  <div class="flex-1 min-h-0 px-2 pt-1">
    <div class="relative h-full">
      <div class="h-full overflow-y-auto overflow-x-hidden">
        <div class="legend-list-content-container" style={panelList.containerStyle}>
          {#if waiting}
            <div class="flex flex-col">
              {#each SKELETON_ROWS as key (key)}
                <TokenRowSkeleton />
              {/each}
            </div>
          {:else if rows.length === 0}
            <div class="flex flex-col items-center gap-2 px-4 pt-6 text-center">
              <p class="text-xs text-text-tertiary leading-5">{error || "Nothing here yet"}</p>
            </div>
          {:else}
            <div class="flex flex-col">
              {#each shown as row (row.key)}
                <AssetRow {row} />
              {/each}
              {#if rows.length > shown.length}
                <div class="px-2 py-2 text-xs text-text-tertiary">Showing {shown.length} of {rows.length}</div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      <div class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t to-transparent from-bg-primary"></div>
    </div>
  </div>
</div>
