<!--
  The Feed tab: the token's theses and its swaps in one list, newest first — which is what the
  capture's feed is (a thesis row sits between two trade rows).

  Both sources are the API's own: `getTheses` for posts about this token and `getSwaps` for its
  trades. The switch above the list is the capture's "Thesis only" and it is real — it filters
  the merged list down to the posts. The capture also draws a filter button on the right, which
  has nothing to open here, so it is not drawn.
-->
<script>
  import FeedRow from "./FeedRow.svelte";
  import { avatarUrl } from "../../../lib/api/config.js";
  import { ageFromSeconds, shortAddress } from "../../../lib/api/token.svelte.js";

  let { swaps = [], theses = [], loading = false } = $props();

  let thesisOnly = $state(false);

  const THESIS_CHIP = { label: "Thesis", color: "var(--m-blue)", background: "rgba(81, 106, 246, 0.2)" };

  /** A thesis, in the same shape a swap row has, so one row component draws both. */
  function fromThesis(thesis) {
    const photo = avatarUrl(thesis.labels?.[0]?.photoId);
    return {
      key: `thesis:${thesis.id}`,
      kind: "thesis",
      timestamp: thesis.createdAtTimestamp ?? 0,
      avatar: photo ?? "/images/nohomo-eyes.png",
      handle: thesis.username ?? thesis.labels?.[0]?.label ?? shortAddress(thesis.walletAddress),
      chip: THESIS_CHIP,
      age: ageFromSeconds(thesis.createdAtAgeSeconds),
      line: thesis.text ?? ""
    };
  }

  /** A swap, keyed off the row `getSwaps` already shapes for us. */
  function fromSwap(swap) {
    const isBuy = swap.action === "Buy";
    return {
      key: `swap:${swap.id}`,
      kind: "swap",
      timestamp: swap.timestamp ?? 0,
      avatar: swap.avatar,
      handle: swap.name,
      chip: {
        label: swap.action,
        color: isBuy ? "var(--m-green)" : "var(--m-red)",
        background: isBuy ? "rgba(33, 201, 94, 0.2)" : "rgba(255, 98, 46, 0.2)"
      },
      age: swap.time,
      line: swap.mcap ? `${swap.amount} at ${swap.mcap} MC` : swap.amount
    };
  }

  const rows = $derived.by(() => {
    const merged = [...swaps.map(fromSwap), ...theses.map(fromThesis)];
    merged.sort((a, b) => b.timestamp - a.timestamp);
    return thesisOnly ? merged.filter((row) => row.kind === "thesis") : merged;
  });
</script>

<div class="feed">
  <div class="filter-row">
    <span class="filter-label">Thesis only</span>
    <button
      type="button"
      class="switch"
      class:switch--on={thesisOnly}
      role="switch"
      aria-checked={thesisOnly}
      aria-label="Thesis only"
      onclick={() => (thesisOnly = !thesisOnly)}
    >
      <span class="knob"></span>
    </button>
  </div>

  <div class="list">
    {#if rows.length === 0 && loading}
      {#each Array.from({ length: 6 }) as _, index (index)}
        <div class="ghost">
          <span class="ghost-disc"></span>
          <span class="ghost-line"></span>
        </div>
      {/each}
    {:else}
      {#each rows as row (row.key)}
        <FeedRow {row} />
      {/each}
    {/if}
  </div>
</div>

<style>
  .feed {
    padding-top: 15.9px;
  }

  .filter-row {
    display: flex;
    align-items: center;
    height: 24px;
    padding: 0 16px;
  }

  .filter-label {
    font-size: 14px;
    font-weight: 500;
    line-height: 16.5px;
    color: var(--m-muted);
  }

  /* 42.1 x 24 track, a 16.5 x 17.1 knob inset 3.8 dp; off is the knob on the left. */
  .switch {
    position: relative;
    width: 42.1px;
    height: 24px;
    margin-left: 7.6px;
    border-radius: 16px;
    background: var(--m-card);
  }

  .knob {
    position: absolute;
    top: 3.4px;
    left: 3.8px;
    width: 16.5px;
    height: 17.1px;
    border-radius: 16px;
    background: var(--m-text);
    transition: transform 160ms ease-out;
  }

  .switch--on .knob {
    transform: translateX(18px);
  }

  .list {
    display: flex;
    flex-direction: column;
  }

  .ghost {
    display: flex;
    align-items: center;
    gap: 11.7px;
    height: 75.2px;
    padding: 16px 12px 0 12.3px;
    border-bottom: 0.5px solid var(--m-card-2);
  }

  .ghost-disc {
    width: 32px;
    height: 32px;
    border-radius: 16px;
    background: var(--m-card);
  }

  .ghost-line {
    width: 140px;
    height: 16px;
    border-radius: 6px;
    background: var(--m-card);
  }
</style>
