<script>
  // The trade modal's header row: the trader link (avatar, handle, chevron) and
  // the Expand, Share and Follow buttons.
  //
  // Markup and every class are the capture's; the
  // avatar source, handle and whether Follow shows are values in tradePopup.json.
  import ChevronRight from "../../icons/chevron-right.svelte";
  import Expand from "../../icons/expand.svelte";
  import Share from "../../icons/share.svelte";

  /** @type {{ profile: import("../../lib/types").TradePopupProfile }} */
  let { profile } = $props();
</script>

<div class="flex items-center justify-between px-4 h-8">
  <a class="flex items-center gap-2 animate-flip-up" data-state="closed" data-slot="hover-card-trigger" href={profile.href} data-discover="true">
    {#if profile.avatarKind === "image"}<img class={profile.avatarClasses} src={profile.avatarSrc} alt="" style={profile.avatarStyle} />{:else}<div class={profile.avatarClasses} style={profile.placeholderStyle}><img class={profile.placeholderImgClasses} src={profile.placeholderImgSrc} alt="" /></div>{/if}
    <div class="flex items-center gap-0.5">
      <div translate="no" class="flex min-w-0 max-w-full shrink items-center gap-0.5">
        <div class="min-w-0 truncate">{profile.name}</div>
      </div>
      <ChevronRight class="w-5 h-5 rotate-180 text-text-tertiary" />
    </div>
  </a>
  <div class="flex items-center gap-2">
    <button type="button" aria-label="Expand" aria-pressed="false" class="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"><Expand /></button>
    <button type="button" aria-label="Share" class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-bold bg-bg-secondary ring-bg-tertiary ring border-bg-tertiary hover:bg-bg-tertiary transition-colors"><Share class="w-4 h-4" aria-hidden="true" /><div>Share</div></button>
    {#if profile.showFollow}<button class="border-[0.5px] border-transparent text-center bg-accent-primary text-white hover:bg-accent-primary/90 rounded-lg px-3 min-w-22 py-1.5 text-sm font-bold"><span class="inline-block animate-flip-up">Follow</span></button>{/if}
  </div>
</div>
