<script>
  // The profile chip's hover panel. The same shell as the wallet's, with one door: leaving.
  //
  // The capture has no signed-in chrome of its own, so this is built from fomo's vocabulary —
  // the wallet panel's positioning classes and row — rather than copied from a recording.
  import Logout from "../../icons/logout.svelte";
  import { disconnect } from "../../lib/auth.svelte.js";

  /** @type {{ onLogout?: () => void }} */
  let { onLogout } = $props();

  function logOut() {
    disconnect();
    onLogout?.();
  }
</script>

<div
  data-orientation="horizontal"
  data-state="open"
  data-slot="navigation-menu-content"
  class="md:absolute md:w-auto md:top-full z-popover left-1/2 -translate-x-1/2"
  dir="ltr"
>
  <div class="p-1 mt-1 rounded-xl border border-bg-tertiary bg-bg-secondary">
    <button
      class="flex items-center gap-3 w-36 py-2 px-2 hover:bg-bg-tertiary focus:opacity-50 focus:outline-none rounded-lg"
      onclick={logOut}
    >
      <Logout />
      <div class="text-sm font-medium">Log out</div>
    </button>
  </div>
</div>
