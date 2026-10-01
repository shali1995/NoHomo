<script>
  // A trader in the search results — the same row the recents list uses, with the
  // Follow button. Ported from the capture: the ten traders matched by the query
  // "hi".
  /** @type {{ row: import("../../lib/types").SearchUserRow }} */
  let { row } = $props();
</script>

<div class="flex shrink-0 items-center gap-3 px-2 py-2 justify-between rounded-md hover:bg-bg-tertiary/60 focus-within:bg-bg-tertiary/60">
  <a class="min-w-0 flex-1 rounded-lg focus:outline-none" data-search-result="true" href={row.href} data-discover="true">
    <div class="flex items-center gap-3 min-w-0">
      {#if row.avatarBg}
        <div
          class="rounded-full flex items-center justify-center shrink-0 object-cover"
          style="width: 36px; height: 36px; min-width: 36px; min-height: 36px; background-color: {row.avatarBg};"
        >
          <img class="w-[70%] h-[70%]" src={row.avatar} alt="" />
        </div>
      {:else}
        <img
          class="rounded-full flex items-center justify-center shrink-0 object-cover"
          src={row.avatar}
          alt=""
          style="width: 36px; height: 36px; min-width: 36px; min-height: 36px;"
        />
      {/if}
      <div class="flex flex-col gap-0 items-start min-w-0">
        <div translate="no" class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm">
          <div class="min-w-0 truncate">{row.name}</div>
        </div>
        <div class="text-xs text-text-secondary" translate="no">{row.handle}</div>
      </div>
    </div>
  </a>
  <div class="flex items-center gap-2 shrink-0">
    <button
      class="border-[0.5px] border-transparent text-center bg-accent-primary text-white hover:bg-accent-primary/90 rounded-md px-3 py-1 text-xs font-bold min-w-20 overflow-hidden"
    >
      <span class="inline-block animate-flip-up">Follow</span>
    </button>
  </div>
</div>
