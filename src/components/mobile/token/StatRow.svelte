<!--
  One label-and-value line of the About tab: the label, a dashed leader that starts where the
  label ends and runs to the right edge, then the value 464 dp into the page.

  Two values carry something beside them: the launchpad prints the chain's mark (the capture's
  own pairing) and the contract address carries a copy button that copies the full mint.
-->
<script>
  import Copy from "../../../icons/copy.svelte";
  import NetworkSolana from "../../../icons/network-solana.svelte";

  let { label, value, chain = false, copy = false, address = "" } = $props();

  let copied = $state(false);
  let timer = null;

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      const el = document.createElement("textarea");
      el.value = address;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try */
      }
      document.body.removeChild(el);
    }
    copied = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      copied = false;
      timer = null;
    }, 1500);
  }
</script>

<div class="stat">
  <span class="label">{label}</span>
  <!-- The capture's leader is a 1.5 px dashed rule with a 2/4 dash, not a CSS border. -->
  <svg class="leader" height="5" aria-hidden="true">
    <line x1="0" y1="2.5" x2="100%" y2="2.5" stroke="var(--m-hairline)" stroke-width="1.5" stroke-dasharray="2,4" />
  </svg>
  <span class="value">
    {#if chain}<span class="mark"><NetworkSolana /></span>{/if}
    {#if copy}
      <button type="button" class="copy" aria-label="Copy contract address" onclick={copyAddress}>
        {#if copied}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m5 13 4.5 4.5L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        {:else}
          <Copy />
        {/if}
      </button>
    {/if}
    <span class="text m-num">{value}</span>
  </span>
</div>

<style>
  .stat {
    display: flex;
    align-items: center;
    height: 34.6px;
  }

  .label {
    flex: 0 0 auto;
    font-size: 16px;
    font-weight: 400;
    line-height: 18.7px;
    color: var(--m-muted);
  }

  .leader {
    flex: 1 1 auto;
    min-width: 16px;
    margin: 0 4px;
  }

  .value {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 3.8px;
  }

  /* The chain mark before the launchpad's name: a 16 dp Solana glyph, no disc of its own. */
  .mark {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--m-muted);
  }

  .mark :global(svg) {
    width: 16px;
    height: 16px;
  }

  .mark :global(rect) {
    fill: transparent;
  }

  .copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    color: var(--m-muted);
  }

  /* The captured copy glyph ships with an `absolute` utility class; it belongs in the row. */
  .copy :global(svg) {
    position: static;
    width: 12px;
    height: 12px;
  }

  .text {
    font-size: 16px;
    font-weight: 500;
    line-height: 18.7px;
    color: var(--m-text);
  }
</style>
