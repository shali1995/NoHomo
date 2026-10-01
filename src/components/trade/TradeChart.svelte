<script>
  // The trade modal's chart block: the lightweight-charts host markup the capture
  // recorded, plus the buy/sell marker pins drawn over the plot.
  //
  // Markup, classes and geometry are the capture's and
  // the marker positions come from tradePopup.json. The plot itself is blank: the
  // original draws it at runtime and the capture has no rendered bitmap.
  //
  // The chart host geometry the capture measured, in CSS px: the container, its
  // plot cell (a quarter-pixel taller than the host), the 72px price axis beside
  // it and the 28px time axis under it. The canvas width/height attributes are the
  // backing store Chrome allocated at the capture's device pixel ratio
  // (482 x 1.333 = 643, 212.25 x 1.333 = 283).
  const HOST_W = "554px";
  const HOST_H = "240px";
  const PLOT_W = "482px";
  const PLOT_H = "212.25px";
  const AXIS_W = "72px";
  const TIME_H = "28px";
  const PLOT_CANVAS_W = 643;
  const PLOT_CANVAS_H = 283;
  const AXIS_CANVAS_W = 96;
  const TIME_CANVAS_H = 38;
  // The marker layer is the plot box rounded down to whole pixels, and a pin is
  // either a 22px avatar or a 24px button around a 20px ring and an 18px letter.
  const MARKER_LAYER_W = "482px";
  const MARKER_LAYER_H = "212px";
  const MARKER_AVATAR = "22px";
  const MARKER_BUTTON = "24px";
  const MARKER_RING = "20px";
  const MARKER_LETTER = "18px";

  /**
   * `markers` is widened here: the capture has avatar pins as well as the letter
   * pins src/lib/types.d.ts declares for TradePopupChart.
   * @type {{
   *   chart: Omit<import("../../lib/types").TradePopupChart, "markers"> & {
   *     markers: (
   *       | { l: number; t: number; letter: string; tone: string }
   *       | { l: number; t: number; avatar: string }
   *     )[];
   *   };
   * }}
   */
  let { chart } = $props();
</script>

<div class="overflow-hidden shrink-0 h-[min(24vh,15rem)]">
  <div class="relative w-full h-full isolate">
    <div class="w-full h-full">
      <div class="tv-lightweight-charts" style="overflow: hidden; direction: ltr; width: {HOST_W}; height: {HOST_H}; user-select: none; -webkit-tap-highlight-color: transparent;">
        <!-- The capture's chart table is table > tr > td with no <tbody>: lightweight-charts
             builds it with createElement, so the HTML parser never repaired it. Markup written
             as <table><tr> would be re-parsed into <table><tbody><tr> (Svelte rejects that
             structure outright), so the rows and cells are created as real dynamic elements
             to keep the captured hierarchy. -->
        <table cellspacing="0" style="height: {HOST_H}; width: {HOST_W};">
          <svelte:element this={'tr'}>
            <svelte:element this={'td'} style="padding: 0px;"></svelte:element>
            <svelte:element this={'td'} style="padding: 0px; position: relative; width: {PLOT_W}; height: {PLOT_H};">
              <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
                <canvas style="width: {PLOT_W}; height: {PLOT_H}; position: absolute; z-index: 1; left: 0px; top: 0px;" width={PLOT_CANVAS_W} height={PLOT_CANVAS_H}></canvas>
                <canvas style="width: {PLOT_W}; height: {PLOT_H}; position: absolute; z-index: 2; left: 0px; top: 0px;" width={PLOT_CANVAS_W} height={PLOT_CANVAS_H}></canvas>
              </div>
            </svelte:element>
            <svelte:element this={'td'} style="padding: 0px;">
              <div style="height: {PLOT_H}; overflow: hidden; width: {AXIS_W}; left: 0px; position: relative;">
                <canvas style="width: {AXIS_W}; height: {PLOT_H}; position: absolute; z-index: 1; left: 0px; top: 0px;" width={AXIS_CANVAS_W} height={PLOT_CANVAS_H}></canvas>
                <canvas style="width: {AXIS_W}; height: {PLOT_H}; position: absolute; z-index: 2; left: 0px; top: 0px;" width={AXIS_CANVAS_W} height={PLOT_CANVAS_H}></canvas>
              </div>
            </svelte:element>
          </svelte:element>
          <svelte:element this={'tr'}>
            <svelte:element this={'td'} style="padding: 0px;"></svelte:element>
            <svelte:element this={'td'} style="height: {TIME_H}; padding: 0px; width: {PLOT_W};">
              <div style="width: 100%; height: 100%; position: relative; overflow: hidden;">
                <canvas style="width: {PLOT_W}; height: {TIME_H}; position: absolute; z-index: 1; left: 0px; top: 0px;" width={PLOT_CANVAS_W} height={TIME_CANVAS_H}></canvas>
                <canvas style="width: {PLOT_W}; height: {TIME_H}; position: absolute; z-index: 2; left: 0px; top: 0px;" width={PLOT_CANVAS_W} height={TIME_CANVAS_H}></canvas>
              </div>
            </svelte:element>
            <svelte:element this={'td'} style="padding: 0px;">
              <div style="width: {AXIS_W}; height: {TIME_H}; overflow: hidden;">
                <canvas style="width: {AXIS_W}; height: {TIME_H};" width={AXIS_CANVAS_W} height={TIME_CANVAS_H}></canvas>
              </div>
            </svelte:element>
          </svelte:element>
        </table>
      </div>
    </div>
    <div class="absolute top-0 left-0 z-[2] overflow-hidden pointer-events-none" style="width: {MARKER_LAYER_W}; height: {MARKER_LAYER_H};">
      <!-- The markers are absolutely positioned pins with no id of their own, and
           several share the same left/top pair (the capture stacks avatars on one
           candle), so the index is the only key that stays unique. -->
      {#each chart.markers as m, i (i)}
        <div class="absolute pointer-events-auto" style="left: {m.l}px; top: {m.t}px; transform: translateX(-50%); z-index: 20;">
          {#if m.avatar}
            <!-- the captured class ends in a space; a literal class="..." would be trimmed -->
            <div class={'relative rounded-full border border-bg-primary transition-[transform,box-shadow] duration-150 hover:scale-110 active:scale-95 cursor-pointer '}>
              <img class="rounded-full flex items-center justify-center shrink-0 object-cover" src={m.avatar} alt="" style="width: {MARKER_AVATAR}; height: {MARKER_AVATAR}; min-width: {MARKER_AVATAR}; min-height: {MARKER_AVATAR};" />
            </div>
          {:else}
            <div class="cursor-pointer">
              <div class="relative flex items-center justify-center transition-transform duration-150 hover:scale-110" style="width: {MARKER_BUTTON}; height: {MARKER_BUTTON};">
                <div class="flex items-center justify-center rounded-full bg-bg-primary transition-[box-shadow] duration-150" style="width: {MARKER_RING}; height: {MARKER_RING}; box-shadow: none;">
                  <div class="flex items-center justify-center rounded-full text-[10px] font-bold text-text-primary {m.tone}" translate="no" style="width: {MARKER_LETTER}; height: {MARKER_LETTER};">{m.letter}</div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
