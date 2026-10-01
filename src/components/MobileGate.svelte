<script>
  // What a phone gets instead of the app: the desktop build is the only one that exists, so this
  // says so and offers the way in. It covers the app rather than replacing it, because the shell is
  // built for a wide window and would otherwise paint black. Hidden from 900px up by its own CSS.
  import Logo from "../icons/logo.svelte";
  import NohomoIcon from "../icons/nohomo.svelte";
  import Telegram from "../icons/telegram.svelte";
  import Volume from "../icons/volume.svelte";
  import GayAccounts from "./GayAccounts.svelte";

  const TELEGRAM = "https://t.me/USENOHOMO";

  /** Autoplay has to be muted; the icon and a tap on the video turn the sound on. */
  let muted = $state(true);
  let videoEl = $state(null);

  $effect(() => {
    if (videoEl) videoEl.muted = muted;
  });
</script>

<!-- Any tap turns the sound on: a phone user should not have to find the small control. -->
<div class="mobile-gate" onclick={() => (muted = false)}>
  <!-- `margin: auto` centres this when there is room and lets it scroll when there is not; centring
       the container itself is what clips the top of tall content on a short phone screen. -->
  <div class="flex flex-col gap-5 w-full" style="margin: auto;">
  <div class="flex flex-col items-center gap-3 self-center">
    <div class="flex items-center justify-center gap-3">
      <Logo class="h-8 w-auto" aria-hidden="true" />
      <NohomoIcon class="h-10 w-10" aria-hidden="true" />
    </div>

    <div class="relative flex">
      <video
        class="rounded-2xl border border-bg-tertiary bg-black"
        style="width: auto; height: min(302px, 36vh); object-fit: contain;"
        src="/media/gay-shorts.mp4"
        bind:this={videoEl}
        controls
        autoplay
        loop
        playsinline
        onclick={() => (muted = false)}
      ></video>
      <!-- top right, the same control the desktop popup carries -->
      <button
        type="button"
        class="absolute rounded-sm bg-black/70 text-text-primary p-1"
        style="top: 6px; right: 6px;"
        aria-label={muted ? "Unmute" : "Mute"}
        onclick={() => (muted = !muted)}
      ><Volume muted={muted} /></button>
    </div>
  </div>

  <div class="flex flex-col items-center gap-3 text-center self-center">
    <h1 class="text-base font-bold text-text-primary leading-tight">Currently mobile is gay.</h1>
    <p class="text-sm text-text-secondary leading-relaxed">
      We're working on making desktop not gay. Go to desktop. Do not be gay.
    </p>
    <p class="text-sm text-text-secondary leading-relaxed">Come back later, or join our Telegram:</p>

    <a
      class="flex items-center gap-2 rounded-2xl py-3 px-4 text-sm font-bold bg-accent-primary text-text-primary hover:opacity-80"
      href={TELEGRAM}
      target="_blank"
      rel="noreferrer"
    >
      <Telegram class="w-4 h-4 text-text-primary" />
      t.me/USENOHOMO
    </a>

    <GayAccounts />
  </div>
  </div>
</div>

<style>
  /* Only a phone sees this, and it covers everything else while it is up. */
  .mobile-gate {
    position: fixed;
    inset: 0;
    z-index: 300;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 24px;
    overflow-y: auto;
    /* Nothing in this gate may widen the page: a sideways drag on a phone must never pan the screen,
       only the rail that asks for it. */
    overflow-x: hidden;
    max-width: 100vw;
    -webkit-overflow-scrolling: touch;
    background: var(--t-bg-primary, #0b0b0f);
  }
  @media (min-width: 901px) {
    .mobile-gate {
      display: none;
    }
  }
</style>
