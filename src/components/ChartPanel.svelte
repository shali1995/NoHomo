<script>
  // The chart frame and toolbar are the capture's; the plot area is now the live chart
  // (src/components/token/TokenChart.svelte), which replaces the TradingView placeholder
  // the capture mounted and never drew.
  import TokenChart from "./token/TokenChart.svelte";
  /** @type {import("../lib/types").ChartToolbarData} */
  // inlined from chartToolbar.json — no data file, the strings live with the code
  const toolbar =   {
    "classes": "flex flex-wrap items-center gap-3 px-1 py-1 text-xs",
    "title": {
      "classes": "text-text-primary",
      "text": "Chart overlays"
    },
    "divider": "h-4 w-px bg-bg-tertiary",
    "toggles": [
      {
        "key": "user",
        "label": "My swaps",
        "labelClasses": "flex items-center gap-1 hover:opacity-80 cursor-pointer",
        "buttonClasses": "inline-flex items-center justify-center",
        "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;"
      },
      {
        "key": "calls",
        "label": "Calls",
        "labelClasses": "flex items-center gap-1 hover:opacity-80 cursor-pointer",
        "buttonClasses": "inline-flex items-center justify-center",
        "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;"
      },
      {
        "key": "kols",
        "label": "KOLs",
        "labelClasses": "flex items-center gap-1 hover:opacity-80 cursor-pointer",
        "buttonClasses": "inline-flex items-center justify-center",
        "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;"
      },
      {
        "key": "theses",
        "label": "Thesis",
        "labelClasses": "flex items-center gap-1 hover:opacity-80 cursor-pointer",
        "buttonClasses": "inline-flex items-center justify-center",
        "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;"
      },
      {
        "key": "tweets",
        "label": "Tweets",
        "labelClasses": "flex items-center gap-1 hover:opacity-80 cursor-pointer",
        "buttonClasses": "inline-flex items-center justify-center",
        "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;"
      },
      {
        "key": "curated",
        "label": "Friends only",
        "labelClasses": "flex items-center gap-1 hover:opacity-80 cursor-pointer",
        "buttonClasses": "inline-flex items-center justify-center",
        "buttonStyle": "color: var(--color-text-tertiary); width: 16px; height: 16px;"
      }
    ],
    "minSize": {
      "classes": "flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary outline-none"
    }
  };
  import OverlayBox from "../icons/overlay-box.svelte";
  import OverlayBoxChecked from "../icons/overlay-box-checked.svelte";
  import Filter from "../icons/filter.svelte";

  import { getChain, getAddress } from "../lib/api/token.svelte.js";
  import { reloadMarkers } from "../lib/api/chart.svelte.js";
  import { getMarkerPrefs, toggleMarker } from "../lib/api/markerPrefs.svelte.js";

  // The six toggles are the capture's chrome driving the chart's markers: `curated`
  // ("Friends only") is a filter the backend applies, so it re-reads the marker window;
  // the kinds are filtered in the chart itself.
  const prefs = $derived(getMarkerPrefs());
  const ACTIVE_STYLE = "color: var(--color-accent-primary); width: 16px; height: 16px;";

  async function onToggle(key) {
    toggleMarker(key);
    if (key === "curated") await reloadMarkers();
  }

  const chain = $derived(getChain());
  const address = $derived(getAddress());

  // The original mounts TradingView's Charting Library into this element
  // (class "tv-chart-mount", served from /charting_library). The capture has
  // all 100 library files, so a live chart is a wiring job, not a missing piece:
  // it needs a datafeed reading the captured candles.
  const timeframes = ["1m", "5m", "15m", "1h", "4h", "1d"];
  let timeframe = $state("1h");
</script>

<!-- Frame and toolbar are as captured; the plot area is where the library mounts. -->
<div class="relative isolate flex flex-col w-full rounded-sm min-h-75 flex-1">
  <div class="relative flex-1 min-h-0 w-full h-full">
    <div class="absolute inset-0 bg-bg-secondary flex">
      <TokenChart {chain} {address} />
    </div>
  </div>

  <div class={toolbar.classes}>
    <span class={toolbar.title.classes}>{toolbar.title.text}</span>
    <div class={toolbar.divider}></div>

    {#each toolbar.toggles as toggle (toggle.key)}
      <label class={toggle.labelClasses}>
        <button
          class={toggle.buttonClasses}
          style={prefs[toggle.key] ? ACTIVE_STYLE : toggle.buttonStyle}
          aria-pressed={prefs[toggle.key]}
          aria-label={toggle.label}
          onclick={() => onToggle(toggle.key)}
        >
          {#if prefs[toggle.key]}
            <OverlayBoxChecked />
          {:else}
            <OverlayBox />
          {/if}
        </button>
        <span class="text-text-secondary">{toggle.label}</span>
      </label>
    {/each}

    {#if toolbar.minSize}
      <button class={toolbar.minSize.classes}>
        <Filter />
        <span>Min size</span>
      </button>
    {/if}
  </div>
</div>
