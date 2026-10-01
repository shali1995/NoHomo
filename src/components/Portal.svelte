<script>
  // Renders its children at the end of the body.
  //
  // The shell is one CSS-transformed wrapper (that is how the app fits itself to the window),
  // and a transformed ancestor becomes the containing block for anything `fixed` inside it — so
  // a notice mounted in the shell would be scaled and offset with it. Moving it out is the same
  // thing the token header and the About card's menus already do.
  import { onMount } from "svelte";

  /** @type {{ children?: import("svelte").Snippet }} */
  let { children } = $props();

  let host = $state(null);

  onMount(() => {
    document.body.appendChild(host);
    return () => host?.remove();
  });
</script>

<div bind:this={host}>
  {@render children?.()}
</div>
