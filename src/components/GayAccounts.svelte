<script>
  // The X accounts affiliated with FOMO, read once from the snapshot beside the app. Each one is a
  // person who says FOMO publicly, so the rail is not an opinion, it is a list. One component, used
  // by the welcome popup and by the mobile gate, so the two cannot drift apart.
  let accounts = $state([]);

  $effect(() => {
    void fetch("/data/gay-accounts.json")
      .then((response) => (response.ok ? response.json() : { accounts: [] }))
      .then((payload) => {
        accounts = payload?.accounts ?? [];
      })
      .catch(() => {
        accounts = [];
      });
  });
</script>

{#if accounts.length > 0}
  <div class="gay-accounts flex flex-col gap-2 w-full min-w-0">
    <span class="text-xs font-medium text-text-primary">And who is gay? These people, publicly:</span>
    <!-- a rail, the way the panel scrolls a list: the stamp is the joke, the names are not -->
    <div class="gay-rail flex gap-2 overflow-x-auto pb-1 w-full min-w-0">
      {#each accounts as account (account.handle)}
        <div class="gay-card relative shrink-0 rounded-lg border border-bg-tertiary bg-bg-secondary p-2">
          <div class="flex flex-col items-center gap-1">
            <img
              class="rounded-full border border-bg-tertiary"
              style="width: 48px; height: 48px;"
              src={account.avatar}
              alt=""
              onerror={(event) => {
                event.currentTarget.src = "/images/nohomo-eyes.png";
              }}
            />
            <span class="text-xs font-medium text-text-primary truncate w-full text-center">{account.name}</span>
            <span class="text-xs text-text-tertiary truncate w-full text-center">{account.handle}</span>
            <span class="text-xs text-text-tertiary truncate w-full text-center">{account.affiliated}</span>
          </div>
          <span
            class="absolute rounded-sm bg-red-transparent px-1 text-xs font-bold text-red"
            style="top: 4px; right: 4px; transform: rotate(-12deg);"
          >GAY GAY GAY</span>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* The rail is for a pointer: it scrolls sideways under a mouse. On a phone a nested horizontal
     scroller fights the page and the cards are unreadable, so small screens get a grid instead —
     the whole list is short, and the page's own scroll does the work. */
  /* air above the rail, so it does not sit against whatever came before it */
  .gay-accounts {
    margin-top: 18px;
  }
  .gay-card {
    width: 116px;
  }
  .gay-rail {
    display: flex;
    gap: 8px;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
  }
  @media (max-width: 640px) {
    .gay-rail {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      overflow: visible;
    }
    .gay-card {
      width: auto;
      min-width: 0;
    }
  }
</style>
