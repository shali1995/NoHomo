<script>
  // Where the hover cards are drawn. The original portals them to the end of the
  // body; this is the app's equivalent — the last thing in the shell, so a card is
  // never underneath the chart or a panel. See lib/hoverCard.svelte.js.
  import TokenHoverCard from "./TokenHoverCard.svelte";
  import UserHoverCard from "./UserHoverCard.svelte";
  import { hoverCard, closeHoverCard, keepHoverCard } from "../../lib/hoverCard.svelte.js";
</script>

{#if hoverCard.anchor}
  <!-- the wrapper has no class on purpose: the capture's popper wrapper carries
       none either, and the fidelity check compares parent classes -->
  <div
    role="presentation"
    style="display: contents"
    onmouseenter={keepHoverCard}
    onmouseleave={closeHoverCard}
  >
    {#if hoverCard.token}
      <TokenHoverCard card={hoverCard.token} anchor={hoverCard.anchor} />
    {:else if hoverCard.user}
      <UserHoverCard card={hoverCard.user} anchor={hoverCard.anchor} />
    {/if}
  </div>
{/if}
