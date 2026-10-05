<!--
  Where the auth backend lands after Google has answered.

  It carries the session in the query — `?token=…&wallet=…`, or `?error=…` — so this screen's whole
  job is to take it and get out of the way. The token goes into the same store every other sign-in
  uses, which is what re-authenticates the live socket (the app already listens for token changes),
  and the wallet the backend made for this account goes in beside it.
-->
<script>
  import { onMount } from "svelte";
  import { setAuthToken, setAuthWallet } from "../../lib/auth.svelte.js";
  import { navigate } from "../../lib/router.js";

  let message = $state("Signing in…");

  onMount(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    const wallet = query.get("wallet");
    const failure = query.get("error");

    if (failure || !token) {
      message = "Google sign-in failed.";
      return;
    }

    setAuthToken(token);
    setAuthWallet(wallet);
    // Replace, so Back from the app does not land on this screen with the token in the URL.
    navigate("/", { replace: true });
  });
</script>

<div class="callback">
  <p class="callback-text">{message}</p>
</div>

<style>
  .callback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--color-bg-primary, #060510);
  }

  .callback-text {
    font-size: 14px;
    color: var(--color-text-secondary, #9899a3);
  }
</style>
