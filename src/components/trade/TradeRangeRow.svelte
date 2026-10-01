<script>
  // The row under the chart: the time-range tablist, the Swaps / Thesis overlay
  // checkboxes, the bars/line chart-type switch and the chart expand button.
  //
  // Markup, classes and the pill offsets are the capture's; the tab labels and the
  // selected tab come from
  // tradePopup.json.
  import ChartBars from "../../icons/chart-bars.svelte";
  import ChartLine from "../../icons/chart-line.svelte";
  import Expand from "../../icons/expand.svelte";
  import OverlayBoxChecked from "../../icons/overlay-box-checked.svelte";

  // The capture's range tabs are at least 36px wide, which is what the selected
  // pill's percentage offsets are measured against.
  const TAB_MIN_W = "36px";
  // The two overlay checkboxes are 16px icon boxes drawn in the capture's accent
  // blue, and the chart-type switch's pill sits 2px in (its p-0.5 inset).
  const CHECKBOX = "16px";
  const ACCENT = "rgb(81, 106, 246)";
  const PILL_LEFT = "2px";
  const PILL_BG = "rgb(22, 21, 34)";

  /** @type {{ chart: Pick<import("../../lib/types").TradePopupChart, "indicatorStyle" | "tabs"> }} */
  let { chart } = $props();
</script>

<div class="flex items-center justify-between py-1 shrink-0 gap-3">
  <div role="tablist" aria-label="Time range" class="relative inline-grid grid-flow-col auto-cols-fr items-center rounded-lg p-0.5 border border-bg-tertiary">
    <div class="absolute top-0.5 bottom-0.5 rounded-md bg-bg-tertiary-solid transition-all duration-200" style={chart.indicatorStyle}></div>
    {#each chart.tabs as tab (tab.label)}
      <button type="button" role="tab" aria-selected={tab.selected ? "true" : "false"} class="relative z-10 flex items-center justify-center px-1.5 py-1 text-xs font-bold whitespace-nowrap transition-colors {tab.selected ? 'text-text-primary' : 'text-text-tertiary hover:text-text-primary'}" style="min-width: {TAB_MIN_W};">{tab.label}</button>
    {/each}
  </div>
  <div class="flex items-center gap-3">
    <label class="flex items-center gap-1 text-xs hover:opacity-80 cursor-pointer">
      <button type="button" class="inline-flex items-center justify-center" style="color: {ACCENT}; width: {CHECKBOX}; height: {CHECKBOX};"><OverlayBoxChecked /></button>
      <div class="text-text-secondary">Swaps</div>
    </label>
    <label class="flex items-center gap-1 text-xs hover:opacity-80 cursor-pointer">
      <button type="button" class="inline-flex items-center justify-center" style="color: {ACCENT}; width: {CHECKBOX}; height: {CHECKBOX};"><OverlayBoxChecked /></button>
      <div class="text-text-secondary">Thesis</div>
    </label>
    <button type="button" class="relative flex items-center rounded-lg p-0.5 border border-bg-tertiary gap-0.5">
      <div class="absolute top-0.5 bottom-0.5 rounded-md transition-all duration-200 w-9" style="left: {PILL_LEFT}; background-color: {PILL_BG};"></div>
      <div class="z-10 py-0.5 px-2"><ChartBars /></div>
      <div class="z-10 py-0.5 px-2"><ChartLine /></div>
    </button>
    <button type="button" aria-label="Expand chart" aria-pressed="false" class="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors -ml-2"><Expand /></button>
  </div>
</div>
