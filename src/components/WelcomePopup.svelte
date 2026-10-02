<script>
  // The first visit's screen, in two steps: the joke, then the reason.
  //
  // Storage gates it — a reader sees it once, and only after the second step, so the flag means the
  // argument was actually read. There is one way out, the button, on each step.
  import Logo from "../icons/logo.svelte";
  import NohomoIcon from "../icons/nohomo.svelte";
  import Volume from "../icons/volume.svelte";
  import GayAccounts from "./GayAccounts.svelte";
  import { getWelcomeRequests } from "../lib/welcome.svelte.js";

  const SEEN_KEY = "nohomo_welcome_seen";

  function alreadySeen() {
    if (typeof localStorage === "undefined") return true;
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true;
    }
  }

  let open = $state(!alreadySeen());
  /** Asked for again from the footer: it opens at the first step, however far in it was left. */
  $effect(() => {
    if (getWelcomeRequests() > 0) {
      step = 1;
      open = true;
    }
  });
  /** 1 is the joke, 2 is the reason. */
  let step = $state(1);
  /** Autoplay is muted by policy; the icon and any click turn the sound on. */
  let muted = $state(true);
  let videoEl = $state(null);

  // `muted` is a property on the element, not an attribute: setting it here is what actually
  // changes the sound, whether the click came from the icon, the video, or the button.
  $effect(() => {
    if (videoEl) videoEl.muted = muted;
  });

  function close() {
    open = false;
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // a private window forgets it; the popup then shows again, which is harmless
    }
  }

  /** Chips, in the app's own chip language: what is missing, and what is here instead. */
  const FOMO_LACKS = ["no targets", "no stop loss", "no dip", "no custom gas", "no anti-MEV", "slow", "FOMO calls only"];
  const NOHOMO_HAS = ["targets", "stop loss", "dip orders", "custom gas", "anti-MEV", "fast execution", "pump.fun + FOMO", "ECHO ranking"];

</script>

{#if open}
  <div
    class="fixed inset-0 bg-black/70 z-modal flex items-center justify-center p-3"
    role="presentation"
    onclick={() => (muted = false)}
  >
    <div
      class="welcome-panel bg-bg-primary rounded-3xl border border-bg-tertiary p-4 overflow-y-auto"
      style="width: min(600px, calc(100vw - 1.5rem)); max-height: calc(100vh - 1.5rem);"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to NOHOMO"
    >
      <div class="welcome-body">
        <div class="relative shrink-0 self-stretch flex">
          <video
            class="welcome-video rounded-2xl border border-bg-tertiary bg-black"
            src="/media/gay-shorts.mp4"
            bind:this={videoEl}
            controls
            autoplay
            loop
            muted
            playsinline
            webkit-playsinline
            preload="metadata"
            onclick={() => (muted = false)}
          ></video>
          <!-- top right: it says which way the sound is, and it is the way to change it -->
          <button
            type="button"
            class="welcome-mute absolute rounded-sm bg-black/70 text-text-primary p-1"
            style="top: 6px; right: 6px;"
            aria-label={muted ? "Unmute" : "Mute"}
            onclick={() => (muted = !muted)}
          ><Volume muted={muted} /></button>
        </div>

        {#if step === 1}
          <div class="flex flex-col gap-3 min-w-0 flex-1">
            <div class="flex items-center justify-center gap-3 pb-1">
              <Logo class="h-8 w-auto" aria-hidden="true" />
              <NohomoIcon class="h-10 w-10" aria-hidden="true" />
            </div>

            <h2 class="text-base font-bold text-text-primary leading-tight text-center">
              FOMO is gay. This is NOHOMO.
            </h2>

            <div class="flex flex-col gap-2">
              <span class="text-xs text-text-secondary">What FOMO doesn't have</span>
              <div class="flex flex-wrap gap-1">
                {#each FOMO_LACKS as line (line)}
                  <span class="rounded-sm bg-red-transparent px-1 text-xs font-medium text-red">{line}</span>
                {/each}
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <span class="text-xs font-medium text-text-primary">What NOHOMO has</span>
              <div class="flex flex-wrap gap-1">
                {#each NOHOMO_HAS as line (line)}
                  <span class="rounded-sm bg-green-transparent px-1 text-xs font-medium text-green">{line}</span>
                {/each}
              </div>
            </div>

            <p class="text-sm font-medium text-text-primary leading-relaxed">
              FOMO is HOMO — whoever uses it is gay. Use NOHOMO and dont be gay.
            </p>
          </div>
        {:else}
          <div class="flex flex-col gap-3 min-w-0 flex-1">
            <div class="flex items-center justify-center gap-3 pb-1">
              <Logo class="h-8 w-auto" aria-hidden="true" />
              <NohomoIcon class="h-10 w-10" aria-hidden="true" />
            </div>

            <h2 class="text-base font-bold text-text-primary leading-tight text-center">Now, seriously.</h2>

            <p class="text-sm text-text-primary leading-relaxed">
              FOMO pretends to be Apple. It pays KOLs to shill — people I personally can't stand. It
              takes fees, and it extracts.
            </p>
            <p class="text-sm text-text-primary leading-relaxed">
              Everyone on Twitter cries that it's shit, every single day, and nobody does anything
              about it. So we built the thing instead of crying.
            </p>

            <div class="flex flex-col gap-1">
              {#each ["Open source — fork it, modify it, build on top of it.", "Ask for a feature and it gets built, fast.", "Platform fees go back to the users. No extraction.", "And we hire trolls to bury the FOMO app."] as line (line)}
                <span class="text-sm text-text-primary leading-relaxed">— {line}</span>
              {/each}
            </div>

            <!-- the last thing read before the button, so it gets a box of its own -->
            <div class="flex items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-secondary p-3">
              <span class="text-lg leading-none" aria-hidden="true">💩</span>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-bold text-text-primary leading-tight">SHITCOIN</span>
                <span class="text-xs text-text-secondary leading-tight">will be launched soon. Get ready.</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <GayAccounts />

      <button
        type="button"
        class="welcome-go w-full rounded-2xl py-4 text-base font-bold bg-accent-primary text-text-primary hover:opacity-90 mt-4"
        onclick={() => {
          muted = false;
          if (step === 1) step = 2;
          else close();
        }}
      >{step === 1 ? "I'm not gay — let me in" : "I understand FOMO is HOMO. I'm not gay."}</button>
    </div>
  </div>
{/if}

<style>
  /* Scoped: the video and the copy side by side, and the stack they fall back to. */
  .welcome-body {
    display: flex;
    gap: 14px;
    align-items: stretch;
  }
  .welcome-video {
    flex: 0 0 auto;
    width: 170px;
    object-fit: contain;
  }
  @media (max-width: 620px) {
    .welcome-body {
      flex-direction: column;
      align-items: center;
    }
    /* The clip is 9:16, so it keeps that shape instead of a letterboxed box, and it gives way to
       the copy: the reader must be able to reach the button without hunting for it. */
    .welcome-video {
      width: 100%;
      max-height: 42vh;
      aspect-ratio: 9 / 16;
      object-fit: cover;
    }
  }

  /* The phone's own screen: full height inside the status bar, and its own scroll. */
  @media (max-width: 900px) {
    .welcome-panel {
      width: 100%;
      max-height: calc(100dvh - 1rem);
      padding: 14px;
      border-radius: 22px;
      overscroll-behavior: contain;
    }
    .welcome-mute {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
    }
    /* Within a thumb's reach however far the copy is scrolled. It keeps the accent blue: the
       rule used to paint the page's own background over it, which is why it read as a black bar. */
    .welcome-go {
      position: sticky;
      bottom: 0;
      padding-bottom: 10px;
      box-shadow: 0 -14px 22px rgba(6, 5, 16, 0.92);
    }
  }
</style>
