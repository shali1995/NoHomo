<!--
  The Holders tab: the wallets holding the token, biggest first.

  The capture opens this tab with a "Friends" switch and a "Team holdings" card above the
  list. This build has no source for either — the holders endpoint resolves no wallet
  labels, no curator relationship and no project posts — so the list is the tab, and the
  two blocks are left out rather than drawn empty.

  A holder's row picks up its thesis for this token when the wallet has posted one, so the
  row's own line is the author's own words rather than a blank.
-->
<script>
  import HolderRow from "./HolderRow.svelte";

  let { rows = [], theses = [], loading = false } = $props();

  const byWallet = $derived.by(() => {
    const map = new Map();
    for (const thesis of theses) {
      if (thesis?.walletAddress && !map.has(thesis.walletAddress)) map.set(thesis.walletAddress, thesis);
    }
    return map;
  });
</script>

<div class="holders">
  {#if rows.length === 0 && loading}
    {#each Array.from({ length: 6 }) as _, index (index)}
      <div class="ghost">
        <span class="ghost-disc"></span>
        <span class="ghost-line"></span>
      </div>
    {/each}
  {:else}
    {#each rows as row (row.key)}
      <HolderRow {row} thesis={byWallet.get(row.walletAddress) ?? null} />
    {/each}
  {/if}
</div>

<style>
  .holders {
    display: flex;
    flex-direction: column;
    padding-top: 15.9px;
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 14.9px;
    padding: 14.4px 16px;
  }

  .ghost-disc {
    width: 32px;
    height: 32px;
    border-radius: 16px;
    background: var(--m-card);
  }

  .ghost-line {
    width: 120px;
    height: 16px;
    border-radius: 6px;
    background: var(--m-card);
  }
</style>
