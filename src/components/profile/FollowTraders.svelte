<script>
  // The follow rail of your own profile: the panel header with its collapse control and
  // the top-trader rows — avatar, name, handle and Follow button.
  //
  // The chrome is the capture's; the rows are the top labeled traders on this chain, from
  // the ranking in src/lib/api/profile.svelte.js. The ranking carries a trader's label only
  // when a platform is asked for (`sources=FOMO`), which is why the rail asks for one. The
  // Follow button stays as the capture's chrome.
  import CollapsePanel from "../../icons/collapse-panel.svelte";
  import UserPlus from "../../icons/user-plus.svelte";
  import Skeleton from "../Skeleton.svelte";
  import { getRailTraders, isProfileLoading } from "../../lib/api/profile.svelte.js";

  /** @type {{ chrome: import("../../lib/types").ProfileRailFollow }} */
  let { chrome } = $props();

  const traders = $derived(getRailTraders());
  // the rail's own list decides: it is cached by the leaderboard, so it can paint while the rest of
  // the profile is still being read
  const loading = $derived(traders.length === 0);

  // The rail avatar box, measured in the capture: 36px square. One captured trader
  // has no photo, only a colour, so its image sits inset at 70% inside that box.
  const AVATAR = "36px";
  const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => i);
</script>

<div class="flex flex-col gap-2">
  <div class="flex gap-2 items-center justify-between px-2">
    <div class="flex gap-2 items-center">
      <UserPlus />
      <span class="font-medium text-text-primary">{chrome.title}</span>
    </div>
    <button class="text-text-tertiary hover:text-text-primary focus-visible:text-text-primary focus:outline-none p-1" aria-label="Collapse panel"><CollapsePanel class="w-3 h-3 rotate-180" aria-hidden="true" /></button>
  </div>
  <div class="flex flex-col gap-1">
    {#if loading}
      {#each SKELETON_ROWS as key (key)}
        <div class="flex gap-3 items-center p-2">
          <Skeleton class="rounded-full shrink-0" style="width: {AVATAR}; height: {AVATAR};" />
          <div class="flex flex-col gap-1 flex-1 min-w-0">
            <Skeleton class="h-3.5 w-24" />
            <Skeleton class="h-3 w-16" />
          </div>
        </div>
      {/each}
    {:else}
      {#each traders as t (t.href)}
        <div class="flex gap-3 items-center p-2">
          <a class="flex gap-3 items-center flex-1 min-w-0" href={t.href}>
            {#if t.color}
              <div class="rounded-full flex items-center justify-center shrink-0 object-cover" style="width: {AVATAR}; height: {AVATAR}; min-width: {AVATAR}; min-height: {AVATAR}; background-color: {t.color};">
                <img class="w-[70%] h-[70%]" src={t.img} alt="" />
              </div>
            {:else}
              <img class="rounded-full flex items-center justify-center shrink-0 object-cover" src={t.img} alt="" style="width: {AVATAR}; height: {AVATAR}; min-width: {AVATAR}; min-height: {AVATAR};" />
            {/if}
            <div class="flex flex-col gap-1 min-w-0">
              <div translate="no" class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-sm font-medium leading-[1.2] text-text-primary">
                <div class="min-w-0 truncate">{t.name}</div>
              </div>
              <span class="text-xs font-medium text-text-secondary truncate leading-[1.2]" translate="no">{t.handle}</span>
            </div>
          </a>
          <button class="shrink-0 px-2 py-1.5 rounded-md text-xs font-bold cursor-pointer min-w-18 text-center overflow-hidden bg-accent-primary text-text-primary hover:opacity-80"><span class="inline-block animate-flip-up">Follow</span></button>
        </div>
      {/each}
    {/if}
  </div>
</div>
