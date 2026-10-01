<script>
  // A feed row that has not arrived yet, in the two shapes the feed actually renders: a
  // labelled-wallet swap and a thesis. Same wrappers and classes as `FeedRow`, so the
  // placeholder rows come out the same height and the list does not move when the real
  // ones land.
  import Skeleton from "../Skeleton.svelte";

  /** @type {{ type?: "swap" | "thesis" }} */
  let { type = "swap" } = $props();

  const AVATAR_STYLE = "width: 24px; height: 24px; min-width: 24px; min-height: 24px;";
  const TOKEN_STYLE = "width: 20px; height: 20px;";
</script>

{#if type === "thesis"}
  <div class="py-2.5 px-3 flex items-start gap-2 min-w-0">
    <div class="shrink-0 pt-0.5">
      <Skeleton class="rounded-full" style={AVATAR_STYLE} />
    </div>
    <div class="flex flex-col gap-1.5 flex-1 min-w-0">
      <div class="flex items-center gap-1">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-12" />
        <Skeleton class="h-3 w-8" />
      </div>
      <div class="flex items-center gap-2 min-w-0">
        <Skeleton class="rounded-full shrink-0" style={TOKEN_STYLE} />
        <Skeleton class="h-4 w-20" />
        <Skeleton class="h-4 w-16" />
      </div>
      <Skeleton class="h-4 w-40" />
      <div class="flex items-center gap-3">
        <Skeleton class="h-3 w-6" />
      </div>
    </div>
  </div>
{:else}
  <div class="flex items-start gap-2 rounded-lg px-2 py-4">
    <Skeleton class="rounded-full shrink-0" style={AVATAR_STYLE} />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <div class="flex items-center gap-1">
        <Skeleton class="h-4 w-24" />
        <Skeleton class="h-4 w-12" />
        <Skeleton class="h-3 w-8" />
      </div>
      <div class="flex items-center gap-1">
        <Skeleton class="rounded-full shrink-0" style={TOKEN_STYLE} />
        <Skeleton class="h-4 w-16" />
        <Skeleton class="h-4 w-14" />
      </div>
    </div>
  </div>
{/if}
