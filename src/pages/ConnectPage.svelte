<script>
  // The phone end of the mobile connect flow: the desktop shows a QR (the wallet menu's
  // Connect Mobile), the phone scans it here and takes the session over. Ported from
  // Ombra's `/connect` route — the same five states and the same claim call — laid out in
  // fomo's own tokens.
  //
  // It is a page of its own, outside the app shell and outside the fitted box (see
  // App.svelte): it is read on a phone, so it wants the window's own size and type.
  import Logo from "../icons/logo.svelte";
  import RotateCcw from "../icons/rotate-ccw.svelte";
  import CheckCircle from "../icons/check-circle.svelte";
  import Warning from "../icons/warning.svelte";
  import { apiUrl } from "../lib/api/config.js";
  import { navigate } from "../lib/router.js";
  import { setAuthToken } from "../lib/auth.svelte.js";
  import { authenticate } from "../lib/ws/client.js";

  let state = $state("requesting");
  let message = $state("");
  let video = $state(null);
  let canvas = $state(null);
  let stream = null;
  let frame = null;
  let scanned = false;

  function stopCamera() {
    if (frame) {
      cancelAnimationFrame(frame);
      frame = null;
    }
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      stream = null;
    }
  }

  async function startCamera() {
    stopCamera();
    scanned = false;
    state = "requesting";
    message = "";
    try {
      const media = await navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { exact: "environment" } } })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));
      stream = media;
      if (video) {
        video.srcObject = media;
        await video.play().catch(() => {});
      }
      state = "scanning";
      frame = requestAnimationFrame(scanLoop);
    } catch (e) {
      message = e instanceof Error ? e.message : "Camera access denied";
      state = "error";
    }
  }

  async function claim(pairingId, pairingSecret) {
    stopCamera();
    state = "claiming";
    try {
      const response = await fetch(apiUrl("/v2/auth/mobile-connect/claim"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pairingId, pairingSecret })
      });
      if (response.status === 404) {
        message = "Code expired or already used. Ask the desktop to show a new one.";
        state = "error";
        return;
      }
      if (!response.ok) {
        message = "Could not connect. Try again.";
        state = "error";
        return;
      }
      const data = await response.json();
      if (!data?.token) {
        message = "No session came back from the desktop.";
        state = "error";
        return;
      }
      setAuthToken(data.token);
      authenticate(data.token);
      state = "success";
    } catch (e) {
      message = e instanceof Error ? e.message : "Connection failed";
      state = "error";
    }
  }

  async function scanLoop() {
    if (state !== "scanning" || !video || !canvas) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA && !scanned) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const jsQR = (await import("jsqr")).default;
      const code = jsQR(image.data, image.width, image.height, { inversionAttempts: "attemptBoth" });
      if (code?.data) {
        try {
          const parsed = JSON.parse(code.data);
          if (parsed.v === 1 && parsed.id && parsed.s) {
            scanned = true;
            claim(parsed.id, parsed.s);
            return;
          }
        } catch {
          /* not one of our codes — keep looking */
        }
      }
    }
    frame = requestAnimationFrame(scanLoop);
  }

  $effect(() => {
    startCamera();
    return stopCamera;
  });
</script>

<div class="min-h-svh flex flex-col items-center justify-center gap-6 p-6 bg-bg-primary text-text-primary">
  <canvas bind:this={canvas} class="hidden"></canvas>

  <div class="flex items-center gap-2">
    <Logo />
  </div>

  {#if state === "requesting"}
    <div class="flex flex-col items-center gap-4">
      <div class="size-6 animate-spin rounded-full border-2 border-bg-tertiary" style="border-top-color: var(--color-text-primary)"></div>
      <div class="text-sm text-text-secondary">Requesting camera access…</div>
    </div>
  {:else if state === "scanning"}
    <div class="flex w-full max-w-sm flex-col items-center gap-4">
      <div class="relative w-full overflow-hidden rounded-2xl border-2 border-bg-tertiary bg-bg-secondary">
        <video bind:this={video} class="h-auto w-full" autoplay playsinline muted></video>
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="h-48 w-48 rounded-2xl border-2 border-accent-primary"></div>
        </div>
      </div>
      <div class="text-center">
        <div class="text-sm font-medium">Scan the QR code</div>
        <div class="mt-1 text-xs text-text-tertiary">
          Point your camera at the QR code shown on your desktop
        </div>
      </div>
    </div>
  {:else if state === "claiming"}
    <div class="flex flex-col items-center gap-4">
      <div class="size-6 animate-spin rounded-full border-2 border-bg-tertiary" style="border-top-color: var(--color-text-primary)"></div>
      <div class="text-sm text-text-secondary">Connecting…</div>
    </div>
  {:else if state === "success"}
    <div class="flex flex-col items-center gap-4">
      <div class="flex h-14 w-14 items-center justify-center rounded-full border border-bg-tertiary">
        <CheckCircle class="w-6 h-6 text-green" />
      </div>
      <div class="text-center">
        <div class="text-lg font-semibold">Connected</div>
        <div class="mt-1 text-sm text-text-secondary">This phone is now signed in</div>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-secondary px-4 py-2 text-sm font-medium hover:bg-bg-tertiary"
        onclick={() => navigate("/")}
      >
        Continue
      </button>
    </div>
  {:else}
    <div class="flex flex-col items-center gap-4">
      <div class="flex h-14 w-14 items-center justify-center rounded-full border border-bg-tertiary">
        <Warning class="w-6 h-6 text-red" />
      </div>
      <div class="text-center">
        <div class="text-base font-semibold">Connection failed</div>
        <div class="mt-2 max-w-xs text-sm text-text-secondary">{message}</div>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-xl border border-bg-tertiary bg-bg-secondary px-4 py-2 text-sm font-medium hover:bg-bg-tertiary"
        onclick={startCamera}
      >
        <RotateCcw class="w-4 h-4" />
        Try again
      </button>
    </div>
  {/if}
</div>
