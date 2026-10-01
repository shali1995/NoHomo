<script>
  // The swaps card of a profile: the tabs, the column grid header and the rows.
  //
  // Markup and classes are the capture's, including the absolute row offsets: the capture's
  // own rows sat on a 40px stride inside a list as tall as its set size, and so do these.
  // The rows are the wallet's own swaps, from `GET /v2/traders/{chain}/{wallet}/swaps` in
  // src/lib/api/profile.svelte.js: the capture's Buys and Sells tabs filter that one list,
  // newest first, and further pages arrive as the page is scrolled.
  import ChainBadge from "../../icons/chain-badge.svelte";
  import ChevronsUpDown from "../../icons/chevrons-up-down.svelte";
  import Skeleton from "../Skeleton.svelte";
  import { ink } from "./format.js";
  import { isProfileLoading, panelFailed, swapRows } from "../../lib/api/profile.svelte.js";

  /** @type {{ chrome: import("../../lib/types").ProfileBodyUser["swaps"] }} */
  let { chrome } = $props();

  /** The capture's tab labels, mapped onto the filter the one swaps list answers. */
  const TABS = [
    { label: "All swaps", filter: "all" },
    { label: "Buys", filter: "buys" },
    { label: "Sells", filter: "sells" }
  ];

  let tab = $state("all");
  const rows = $derived(swapRows(tab));
  const loading = $derived(isProfileLoading() && rows.length === 0);
  const unavailable = $derived(panelFailed("swaps") && rows.length === 0);
  const listHeight = $derived(`${rows.length * 40}px`);

  // The swap-row avatar box and the chain badge pinned to its corner, in CSS px as
  // the capture measured them.
  const AVATAR = "24px";
  const BADGE = "11px";
  const BADGE_OFFSET = "-2px";
  const SKELETON_ROWS = Array.from({ length: 5 }, (_, i) => i);
</script>

<div class="@container flex flex-col flex-1 rounded-lg border border-bg-tertiary">
  <div class="p-2 pl-3 bg-bg-secondary flex items-center shrink-0 rounded-t-lg">
    <div class="flex gap-3 text-sm">
      {#each TABS as t (t.label)}
        <button
          class="cursor-pointer hover:text-text-secondary focus:text-text-primary focus:outline-none {t.filter === tab ? 'text-text-primary' : 'text-text-tertiary'}"
          onclick={() => (tab = t.filter)}
        >{t.label}</button>
      {/each}
    </div>
  </div>
  <div class="grid grid-cols-[minmax(0,2fr)_3rem_1fr] @sm:grid-cols-[minmax(0,2fr)_4rem_5rem_1fr] @lg:grid-cols-[minmax(0,2fr)_4rem_5rem_7rem_1fr] items-center gap-3 px-3 py-1 text-xs text-text-tertiary border-b border-bg-tertiary/60 shrink-0">
    <div>Token</div>
    <div>Action</div>
    <div>Amount</div>
    <button class="hidden @lg:flex items-center gap-1 cursor-pointer hover:text-text-secondary text-left">MCap<ChevronsUpDown /></button>
    <div class="hidden @sm:block text-right">Time</div>
  </div>
  <div class="flex-1 overflow-x-hidden min-h-0">
    {#if loading}
      {#each SKELETON_ROWS as key (key)}
        <div class="flex items-center gap-3 px-3 py-2">
          <Skeleton class="rounded-full shrink-0" style="width: {AVATAR}; height: {AVATAR};" />
          <Skeleton class="h-3.5 w-16" />
          <Skeleton class="h-3.5 w-10" />
          <Skeleton class="h-3.5 w-16" />
        </div>
      {/each}
    {:else if unavailable}
      <div class="text-center min-h-15 flex items-center justify-center text-sm text-text-tertiary">Couldn't load swaps</div>
    {:else if rows.length === 0}
      <div class="text-center min-h-15 flex items-center justify-center text-sm text-text-tertiary">No swaps</div>
    {:else}
      <div role="list" class="relative" style="height: {listHeight};">
        {#each rows as r (r.key)}
          <div role="listitem" aria-posinset={r.pos} aria-setsize={r.setsize} data-index={r.index} class="absolute top-0 left-0 w-full flex flex-col" style="transform: translateY({r.y});">
            <a href={r.href} class="grid grid-cols-[minmax(0,2fr)_3rem_1fr] @sm:grid-cols-[minmax(0,2fr)_4rem_5rem_1fr] @lg:grid-cols-[minmax(0,2fr)_4rem_5rem_7rem_1fr] items-center gap-3 px-3 py-2 hover:bg-bg-secondary cursor-pointer text-left">
              <div class="flex items-center gap-2 min-w-0">
                <div class="relative shrink-0" style="width: {AVATAR}; height: {AVATAR};">
                  <img class="rounded-full border border-bg-tertiary" src={r.img} alt="" style="height: {AVATAR}; width: {AVATAR};" />
                  {#if r.verified}
                    <div class="absolute flex items-center justify-center" style="bottom: {BADGE_OFFSET}; right: {BADGE_OFFSET};"><ChainBadge style="width: {BADGE}; height: {BADGE};" /></div>
                  {/if}
                </div>
                <div class="text-sm truncate">{r.ticker}</div>
              </div>
              <div class="justify-self-start">
                <div class="w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1" style="color: {ink(r.up)}; background-color: {r.up ? 'rgba(33, 201, 94, 0.2)' : 'rgba(255, 98, 46, 0.2)'};">{r.action}</div>
              </div>
              <div class="text-sm">{r.amount}</div>
              <div class="hidden @lg:block text-sm">{r.mcap}</div>
              <div class="hidden @sm:block text-xs text-text-tertiary text-right"><span translate="no" title={r.timeTitle}>{r.time}</span></div>
            </a>
          </div>
        {/each}
      </div>
      {#if chrome.sentinel}<div class="h-px"></div>{/if}
    {/if}
  </div>
</div>
