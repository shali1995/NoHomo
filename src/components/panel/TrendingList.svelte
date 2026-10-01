<script>
  // The Trending pill's view: the live scanner list, one token row each. The list's rows
  // and geometry come from src/lib/api/trending.svelte.js; the shell draws them.
  import { trendingRows, trendingSpacerStyle, isTrendingLoading } from "../../lib/api/trending.svelte.js";
  import ListShell from "./ListShell.svelte";
  import TokenRow from "./TokenRow.svelte";

  const rows = $derived(trendingRows());
  const spacerStyle = $derived(trendingSpacerStyle());
  // Placeholders only while the first page is genuinely in flight; an empty result is an
  // empty list, not a spinner.
  const loading = $derived(isTrendingLoading() && rows.length === 0);
</script>

<ListShell {rows} {spacerStyle} {loading}>
  {#snippet row(item)}
    <TokenRow row={item} />
  {/snippet}
</ListShell>
