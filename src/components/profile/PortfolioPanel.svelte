<script>
  // The portfolio panel of a profile: the wallet's realized PnL, the change over the
  // selected window, and the line that shows how it got there.
  //
  // The 24H / 7D / 30D (± ALL) control is the capture's, and slices the wallet's 90 daily
  // PnL points locally: every tab is answered from that one series, which is all the API
  // keeps. The capture's own chart host was a lightweight-charts canvas, so the line is
  // drawn with the same library, in the box geometry the capture measured.
  import Skeleton from "../Skeleton.svelte";
  import ProfitChart from "./ProfitChart.svelte";
  import { isProfileLoading, panelFailed, pnlForRange, signedUsd, splitUsd } from "../../lib/api/profile.svelte.js";

  /** @type {{ chrome: import("../../lib/types").ProfileBodyUser["portfolio"] }} */
  let { chrome } = $props();

  /** The capture's default tab is the one it recorded as selected. */
  let range = $state(chrome.tabs.find((tab) => tab.on)?.label ?? chrome.tabs[0].label);

  /**
   * The tab actually drawn: the chosen one, unless this variant does not have it — the
   * captured variants differ by one tab, and the page can switch between them without
   * this component being rebuilt.
   */
  const active = $derived(
    chrome.tabs.some((tab) => tab.label === range)
      ? range
      : (chrome.tabs.find((tab) => tab.on)?.label ?? chrome.tabs[0].label)
  );

  const points = $derived(pnlForRange(active).points);
  const total = $derived(splitUsd(pnlForRange(active).total));
  const change = $derived(signedUsd(pnlForRange(active).change));
  const loading = $derived(isProfileLoading() && points.length === 0);
  const unavailable = $derived(panelFailed("overview") && points.length === 0);

  /** The capture's own label: an uppercase tab reads lowercase under the figure. */
  const changeLabel = $derived(active.toLowerCase());

  /**
   * The moving pill, placed the way the capture placed it: the track is inset by its own
   * 2px padding, so a segment is `100%/n - 4px/n` wide and starts at
   * `i*100%/n + 2px - i*4px/n`. Both captured variants come out of this exactly.
   */
  const pillStyle = $derived.by(() => {
    const n = chrome.tabs.length;
    const i = Math.max(0, chrome.tabs.findIndex((tab) => tab.label === active));
    return `left: calc(${(i * 100) / n}% + ${2 - (i * 4) / n}px); width: calc(${100 / n}% - ${4 / n}px);`;
  });
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-start justify-between">
    <div class="flex flex-col gap-1">
      <span class="text-[28px] font-medium tracking-[0.56px] leading-none">
        {#if loading}
          <Skeleton class="h-7 w-40" />
        {:else}
          <span class="text-text-primary">{total.int}</span>
          <span class="text-text-secondary">{total.frac}</span>
        {/if}
      </span>
      <div class="h-4.25">
        <div class="flex gap-2 items-center">
          <span class="text-sm" style="color: {change.color};">{change.text}</span>
          <span class="text-[14px] font-medium text-text-secondary">{changeLabel}</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <div role="tablist" aria-label="Time range" class="relative inline-grid grid-flow-col auto-cols-fr items-center rounded-lg p-0.5 border border-bg-tertiary">
        <div class="absolute top-0.5 bottom-0.5 rounded-md bg-bg-tertiary-solid transition-all duration-200" style={pillStyle}></div>
        {#each chrome.tabs as t (t.label)}
          <button
            type="button"
            role="tab"
            aria-selected={t.label === active}
            class="relative z-10 flex items-center justify-center px-1.5 py-1 text-xs font-bold whitespace-nowrap transition-colors {t.label === active ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'}"
            style="min-width: 36px;"
            onclick={() => (range = t.label)}
          >{t.label}</button>
        {/each}
      </div>
    </div>
  </div>

  {#if unavailable}
    <div class="flex items-center justify-center text-sm text-text-tertiary" style={chrome.chartStyle}>Couldn't load the PnL history</div>
  {:else}
    <ProfitChart {points} style={chrome.chartStyle} />
  {/if}
</div>
