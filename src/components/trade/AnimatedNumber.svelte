<script>
  // The odometer: number-flow's own trick — the component the capture animates every number
  // with — written by hand, because our sheet carries none of its CSS.
  //
  // A digit is a column of 0-9 with a window one line tall: changing the value moves the
  // strip, and the browser transitions the move. Everything that is not a digit (a `$`, a
  // decimal point, a `%`, a letter) is a static character beside the columns.
  //
  // The columns are keyed by position, never by their character: an element replaced when its
  // digit changes has nothing to transition from, and the number would snap.
  //
  // 350ms and that curve are the capture's own theme values (`{"dur":"350ms","ease-in-like":
  // "cubic-bezier(0.33, 0, 0.11, 1)"}` out of its bundle config).
  const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  /** @type {{ value: string | number, class?: string, style?: string }} */
  let { value, class: cls = undefined, style: sty = undefined } = $props();

  const chars = $derived(String(value).split(""));

  let root = $state(null);
  let descent = $state(0);

  /**
   * The offset, cached per font for the whole module.
   *
   * Measuring it costs a forced synchronous layout — `getComputedStyle` and a
   * `getBoundingClientRect` both flush style and layout for the entire document. Doing that
   * once per odometer meant seven of them on a token page, twice each (once on mount, once when
   * the webfont landed), which is what made switching tokens drag. One measurement per font is
   * all it takes; the numbers on a page share a handful of fonts between them.
   */
  const descents = new Map();
  let measured = false;

  /**
   * How far the baseline sits above the bottom of a one-line box, for this number's own font.
   * Measured in the element itself, never from a canvas: a canvas font string that misses the
   * weight or the fallback face reports metrics for a different face, and an offset a pixel out
   * pushes the digits past the clip edge and slices them.
   *
   * Two probes do it. A span holding a digit gives the box the text sits in — its bottom is the
   * baseline plus the descent. A zero-size inline-block gives the line's baseline itself, since
   * a box with no baseline of its own sits its bottom edge on the baseline.
   *
   * It is needed because an inline-block whose `overflow` is not `visible` has no text baseline
   * of its own: CSS aligns it by its bottom edge, which drops the number a descender above the
   * line's baseline.
   */
  function descentFor(el) {
    if (!el || typeof document === "undefined") return 0;
    const style = getComputedStyle(el);
    const key = `${style.fontSize} ${style.fontFamily} ${style.fontWeight} ${style.fontStyle}`;
    const cached = descents.get(key);
    if (cached !== undefined) return cached;

    const digit = document.createElement("span");
    digit.textContent = "0";
    digit.style.lineHeight = "1";
    const probe = document.createElement("span");
    probe.style.display = "inline-block";
    probe.style.width = "0";
    probe.style.height = "0";
    el.append(digit, probe);
    const bottom = digit.getBoundingClientRect().bottom;
    const baseline = probe.getBoundingClientRect().bottom;
    digit.remove();
    probe.remove();

    const value = Math.max(0, Math.round((bottom - baseline) * 100) / 100);
    descents.set(key, value);
    return value;
  }

  $effect(() => {
    if (!root) return;
    descent = descentFor(root);

    // Once per page, not once per number: the webfont can arrive after the first paint, and a
    // card measured against the fallback face would keep that offset for good.
    if (measured || typeof document === "undefined" || !document.fonts) return;
    measured = true;
    let dropped = false;
    document.fonts.ready.then(() => {
      descents.clear();
      if (!dropped && root) descent = descentFor(root);
    });
    return () => {
      dropped = true;
    };
  });
</script>

<span bind:this={root} class={cls} style="line-height: 1; font-variant-numeric: tabular-nums; {sty ?? ''}">
  {#each chars as ch, i (i)}
    {#if ch >= "0" && ch <= "9"}
      <span class="relative inline-block overflow-hidden" style="height: 1em; line-height: 1; width: 1ch;">
        <span class="odo-strip absolute left-0 top-0 flex flex-col" style="transform: translateY(calc({ch} * -1em + {descent}px));">
          {#each DIGITS as digit (digit)}
            <span style="height: 1em; line-height: 1;">{digit}</span>
          {/each}
        </span>
      </span>
    {:else}
      <span>{ch}</span>
    {/if}
  {/each}
</span>
