<script>
  // A clan in the search results: logo, name, member count, the clan's PnL and the
  // stack of member avatars. Ported from the capture: the six clans matched by the
  // query "hi".
  import Members from "../../icons/members.svelte";

  /** @type {{ row: import("../../lib/types").SearchClanRow }} */
  let { row } = $props();
</script>

<a data-search-result="true" class="block rounded-lg hover:bg-bg-tertiary/60 focus:bg-bg-tertiary/60 focus:outline-none" href={row.href} data-discover="true">
  <div class="flex shrink-0 items-center gap-3 px-2 py-2">
    <img alt={row.name} class="shrink-0 rounded-lg object-cover" src={row.logo} style="width: 36px; height: 36px;" />
    <div class="flex min-w-0 flex-1 flex-col items-start gap-0.5">
      <div class="max-w-full truncate text-sm" translate="no">{row.name}</div>
      <div class="flex items-center gap-1 text-xs text-text-secondary">
        <Members class="w-3 h-3 shrink-0" />
        <div translate="no">{row.members}</div>
      </div>
    </div>
    <div class="flex flex-col items-end gap-1 shrink-0">
    <div class="flex gap-0.5 items-center tabular-nums" translate="no" style="line-height: 16px;">
      <div style="font-size: 12px; font-weight: 500; color: {row.pnlColor};">{row.pnlSign}</div>
      <div style="font-size: 12px; font-weight: 500; color: {row.pnlColor};">{row.pnlValue}</div>
    </div>
    <div class="flex shrink-0 -space-x-2">
      {#each row.avatars as avatar, index (index)}
        {#if avatar.kind === "eyes"}
          <!-- a member with no picture is still drawn: the coloured placeholder
               ring, filled with the site's eyes glyph -->
          <div
            class="flex items-center justify-center shrink-0 object-cover rounded-full border border-bg-primary"
            style="width: 18px; height: 18px; min-width: 18px; min-height: 18px;"
          >
            <img class="w-[70%] h-[70%]" src={avatar.src} alt="" />
          </div>
        {:else}
          <img
            class="flex items-center justify-center shrink-0 object-cover rounded-full border border-bg-primary"
            src={avatar.src}
            alt=""
            style="width: 18px; height: 18px; min-width: 18px; min-height: 18px;"
          />
        {/if}
      {/each}
    </div>
    </div>
  </div>
</a>
