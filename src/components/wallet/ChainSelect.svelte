<!-- The chain picker the deposit and withdraw sheets share. The trigger, the listbox
     and the popper wrapper are copied from the capture while the list is open — the
     same layer in the deposit sheet and in the withdraw sheet — and the trigger is the
     one the closed state shows.

     Two things the capture does that are reproduced here on purpose:
     · Radix renders the list in a popper wrapper appended to the end of <body>, not
       inside the dialog — the dialog only carries the trigger. So the wrapper is
       moved to <body> as soon as it opens.
     · While the list is open Radix also puts aria-hidden and pointer-events: none on
       the dialog. That belongs to the sheet, which is why `open` is bindable.

     The ids are the capture's own Radix-generated ones, passed in per sheet so the
     two read against it unchanged. Radix's injected scrollbar <style> is runtime
     cruft rather than the site's markup, so it is left out. -->
<script>
  import ChevronDown from "../../icons/chevron-down-lucide.svelte";
  import NetworkSolana from "../../icons/network-solana.svelte";
  import NetworkBase from "../../icons/network-base.svelte";
  import NetworkBnb from "../../icons/network-bnb.svelte";
  import NetworkMonad from "../../icons/network-monad.svelte";
  import NetworkRobinhood from "../../icons/network-robinhood.svelte";
  import NetworkArc from "../../icons/network-arc.svelte";
  import NetworkEthereumFilled from "../../icons/network-ethereum-filled.svelte";

  /**
   * @type {{
   *   chains: { key: string, label: string, icon: string }[],
   *   value: string,
   *   contentId: string,
   *   optionIds: string[],
   *   open: boolean
   * }}
   */
  let { chains, value = $bindable(), contentId, optionIds, open = $bindable(false) } = $props();

  const icons = {
    solana: NetworkSolana,
    base: NetworkBase,
    bnb: NetworkBnb,
    monad: NetworkMonad,
    robinhood: NetworkRobinhood,
    arc: NetworkArc,
    "ethereum-filled": NetworkEthereumFilled
  };

  /** @param {string} key */
  const iconFor = (key) => icons[key] ?? NetworkSolana;

  const entry = $derived(chains.find((chain) => chain.key === value));
  const ChainIcon = $derived(iconFor(entry?.icon));

  // Where the list is pinned, and the space Radix says it has: its popper wrapper
  // carries these as CSS vars in the inline style. The three geometry numbers come
  // from the trigger the moment it opens; the two "available" ones are the viewport,
  // which is what they are in the capture too (the list is far shorter than either,
  // so they only feed a max-height that never bites).
  let triggerEl = $state(null);
  let wrapperEl = $state(null);
  let box = $state({ x: 0, y: 0, width: 0, height: 0 });
  let viewport = $state({ width: 0, height: 0 });
  /** which option the pointer is over — the capture marks it data-highlighted */
  let highlighted = $state(null);

  function toggle() {
    // One chain for now: the trigger keeps its normal look but the list stays shut.
    return;
    if (!open && triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      box = { x: rect.left, y: rect.bottom, width: rect.width, height: rect.height };
      viewport = { width: window.innerWidth, height: window.innerHeight };
    }

    open = !open;
  }

  // Radix portals the wrapper to <body>; so does this, once the block has rendered it.
  $effect(() => {
    if (open && wrapperEl) document.body.appendChild(wrapperEl);
  });
</script>

<button
  type="button"
  role="combobox"
  aria-controls={contentId}
  aria-expanded={open}
  aria-autocomplete="none"
  dir="ltr"
  data-state={open ? "open" : "closed"}
  data-slot="select-trigger"
  data-size="default"
  class="flex items-center justify-between gap-2 text-sm whitespace-nowrap shadow-xs outline-none cursor-default aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground border border-bg-tertiary px-2 py-2.5 rounded-xl bg-bg-secondary font-medium w-full"
  bind:this={triggerEl}
  aria-disabled="true"
  onclick={toggle}
>
  <span data-slot="select-value" style="pointer-events: none;">
    <ChainIcon class="w-5 h-5" />
    <div>{entry?.label}</div>
  </span>
  <!-- the chevron goes with the listbox: hidden while there is only one chain -->
  {#if false}
    <ChevronDown />
  {/if}
</button>

{#if open}
  <div
    data-radix-popper-content-wrapper=""
    dir="ltr"
    style="position: fixed; left: 0px; top: 0px; transform: translate({box.x}px, {box.y}px); min-width: max-content; --radix-popper-transform-origin: 50% 0px; z-index: 50; --radix-popper-available-width: {viewport.width}px; --radix-popper-available-height: {viewport.height}px; --radix-popper-anchor-width: {box.width}px; --radix-popper-anchor-height: {box.height}px;"
    bind:this={wrapperEl}
  >
    <div
      data-side="bottom"
      data-align="center"
      role="listbox"
      id={contentId}
      data-state="open"
      dir="ltr"
      data-slot="select-content"
      class="relative z-popover max-h-(--radix-select-content-available-height) w-[var(--radix-select-trigger-width)] min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto no-scrollbar bg-popover text-popover-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:translate-y-2 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 flex flex-col gap-1 rounded-xl border border-bg-tertiary"
      tabindex="-1"
      style="box-sizing: border-box; pointer-events: auto; display: flex; flex-direction: column; outline: none; --radix-select-content-transform-origin: var(--radix-popper-transform-origin); --radix-select-content-available-width: var(--radix-popper-available-width); --radix-select-content-available-height: var(--radix-popper-available-height); --radix-select-trigger-width: var(--radix-popper-anchor-width); --radix-select-trigger-height: var(--radix-popper-anchor-height);"
    >
      <div
        data-radix-select-viewport=""
        role="presentation"
        class="p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
        style="position: relative; flex: 1 1 0%; overflow: hidden auto;"
      >
        {#each chains as option, index (option.key)}
          {@const OptionIcon = iconFor(option.icon)}
          <div
            role="option"
            aria-labelledby={optionIds[index]}
            aria-selected="false"
            data-state={option.key === value ? "checked" : "unchecked"}
            tabindex="-1"
            data-slot="select-item"
            class="relative w-full cursor-default text-sm outline-hidden select-none focus:bg-bg-tertiary focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 flex items-center gap-2 px-2 py-2.5 {option.key === value
              ? 'hover:bg-bg-tertiary '
              : ''}rounded-md"
            data-radix-collection-item=""
            data-highlighted={highlighted === option.key ? "" : undefined}
            onmouseenter={() => (highlighted = option.key)}
            onclick={() => {
              value = option.key;
              open = false;
            }}
          >
            <span id={optionIds[index]}>
              <OptionIcon class="w-5 h-5" />
              <div>{option.label}</div>
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}
