<script>
  // The caution banner the Graduated and Bonding views carry above their rows: the
  // headline and the warning triangle are the capture's, the sentence is the one that
  // view shows, and ✕ takes it down.
  import Close from "../../icons/close.svelte";

  /** @type {{ text: string, onDismiss: () => void }} */
  let { text, onDismiss } = $props();
</script>

<div class="flex items-start gap-2 p-2.5 mb-1 rounded-lg bg-warning-transparent text-xs text-text-primary/60">
  <!-- The capture's triangle with its exclamation; the glyph is cut out of the shape. -->
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 13" fill="currentColor" class="w-4 mt-0.5 h-4 text-warning shrink-0" aria-hidden="true">
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M7 1.1 13.3 11.9H0.7L7 1.1Zm-0.7 4.1h1.4v3.2H6.3V5.2Zm0.7 3.85a0.85 0.85 0 1 0 0 1.7 0.85 0.85 0 1 0 0-1.7Z"
    />
  </svg>
  <span class="flex-1"><span class="text-warning text-sm font-bold flex">Trade with caution</span>{text}</span>
  <button class="shrink-0 mt-0.5 hover:opacity-80" onclick={onDismiss}>
    <Close class="lucide lucide-x w-3.5 h-3.5 text-text-tertiary" />
  </button>
</div>
