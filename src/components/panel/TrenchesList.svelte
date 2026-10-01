<script>
  // The Graduated and Bonding pills' view. Both are the same list in two phases, so they
  // share this file and differ only in the phase they read and the caution they show:
  // Bonding's rows carry their bonding progress, Graduated's rows their change.
  import {
    BONDING_PHASE,
    GRADUATED_PHASE,
    bondingRows,
    dismissTrenchesCaution,
    graduatedRows,
    isTrenchesLoading,
    trenchesCaution,
    trenchesSpacerStyle
  } from "../../lib/api/trenches.svelte.js";
  import CautionBanner from "./CautionBanner.svelte";
  import ListShell from "./ListShell.svelte";
  import TrenchRow from "./TrenchRow.svelte";

  /** @type {{ phase: string }} */
  let { phase } = $props();

  /** The capture's own warning, per pill. */
  const CAUTION = {
    [BONDING_PHASE]:
      "Bonding tokens are highly volatile and may never graduate. Tokens can be launched by anyone, including bad actors.",
    [GRADUATED_PHASE]:
      "Newly graduated tokens are highly volatile. Tokens can be launched by anyone, including bad actors."
  };

  const rows = $derived(phase === BONDING_PHASE ? bondingRows() : graduatedRows());
  const spacerStyle = $derived(trenchesSpacerStyle(phase));
  const loading = $derived(isTrenchesLoading(phase) && rows.length === 0);
  const caution = $derived(trenchesCaution(phase));
</script>

<ListShell {rows} {spacerStyle} {loading}>
  {#snippet banner()}
    {#if caution}
      <CautionBanner text={CAUTION[phase]} onDismiss={() => dismissTrenchesCaution(phase)} />
    {/if}
  {/snippet}
  {#snippet row(item)}
    <TrenchRow row={item} />
  {/snippet}
</ListShell>
