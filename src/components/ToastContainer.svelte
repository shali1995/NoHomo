<script>
  // The notices themselves. Ombra's placement and stack: bottom centre, five at most, the
  // oldest behind the newest. A notice with an action is clickable and lingers longer.
  import { getToasts, removeToast } from "../lib/toast.svelte.js";

  const MAX_VISIBLE = 5;

  const toasts = $derived(getToasts().slice(-MAX_VISIBLE));

  /** The one colour a notice carries, taken from its kind. */
  function ink(type) {
    if (type === "success") return "text-green";
    if (type === "error") return "text-red";
    if (type === "warning") return "text-yellow";
    return "text-accent-primary";
  }

  function icon(type) {
    if (type === "success") return "✓";
    if (type === "error") return "!";
    if (type === "warning") return "!";
    return "i";
  }
</script>

<div class="pointer-events-none fixed bottom-16 left-1/2 z-[200] flex w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
  {#each toasts as toast (toast.id)}
    <div
      class="pointer-events-auto animate-toast-in rounded-xl border border-bg-tertiary bg-bg-secondary p-3 shadow-xl"
      role="status"
    >
      <div class="flex items-start gap-3">
        {#if toast.iconUrl}
          <img class="size-8 shrink-0 rounded-full border border-bg-tertiary" src={toast.iconUrl} alt="" />
        {:else}
          <div class="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-bold {ink(toast.type)}">
            {icon(toast.type)}
          </div>
        {/if}

        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          onclick={() => {
            toast.onClick?.();
            removeToast(toast.id);
          }}
        >
          <div class="truncate text-sm font-bold">{toast.title}</div>
          {#if toast.message}
            <div class="text-xs text-text-secondary">{toast.message}</div>
          {/if}
          {#if toast.details?.length}
            <div class="mt-1 flex flex-col gap-0.5">
              {#each toast.details as detail, i (i)}
                <div class="flex justify-between gap-2 text-xs text-text-tertiary">
                  <span>{detail.label}</span>
                  <span style={detail.color ? `color: ${detail.color}` : undefined}>{detail.value}</span>
                </div>
              {/each}
            </div>
          {/if}
        </button>

        <button
          type="button"
          class="shrink-0 text-text-tertiary transition-colors hover:text-text-secondary"
          aria-label="Dismiss"
          onclick={() => removeToast(toast.id)}
        >×</button>
      </div>
    </div>
  {/each}
</div>
