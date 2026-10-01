<script>
  // The scroll box every discovery list sits in: the capture's container nesting, the
  // spacer its virtualizer sized, and the placeholder rows shown while the first page is
  // in flight. A view hands in its rows, a row snippet and (on the trench views) a
  // caution banner; nothing else about the box changes between them.
  //
  // Rows are absolutely positioned inside the spacer, because that is how the capture
  // placed them: each one's offset comes from its row's `absStyle`.
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
  import TokenRowSkeleton from "./TokenRowSkeleton.svelte";

  /** Rows the placeholder stands in for: enough to fill the panel's visible height. */
  const SKELETON_ROWS = Array.from({ length: 12 }, (_, i) => i);

  /**
   * @type {{
   *   rows?: any[],
   *   spacerStyle?: string,
   *   loading?: boolean,
   *   banner?: import("svelte").Snippet | null,
   *   row: import("svelte").Snippet<[any]>
   * }}
   */
  let { rows = [], spacerStyle = "", loading = false, banner = null, row } = $props();
</script>

<div class="flex-1 min-h-0 px-2 pt-1">
  <div class="relative h-full">
    <div class="h-full overflow-y-auto overflow-x-hidden">
      <div class="legend-list-content-container" style={panelList.containerStyle}>
        {#if banner}
          <div>{@render banner()}</div>
        {/if}
        {#if loading}
          <!-- Nothing has landed yet: hold the panel open with rows the shape of a
               token row, so it never renders as an empty box. -->
          <div class="flex flex-col">
            {#each SKELETON_ROWS as key (key)}
              <TokenRowSkeleton />
            {/each}
          </div>
        {/if}
        <div style={spacerStyle}>
          {#each rows as item (item.pairAddress)}
            <div style={item.absStyle}>
              <div>
                <div class="grid transition-[grid-template-rows,opacity] duration-150 ease-out grid-rows-[1fr] opacity-100">
                  <div class="overflow-hidden">
                    {@render row(item)}
                  </div>
                </div>
                <div class="h-px"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t to-transparent from-bg-primary"></div>
  </div>
</div>
