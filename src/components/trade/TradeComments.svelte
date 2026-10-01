<script>
  // The trade modal's comment thread: each comment is the trader's avatar on a
  // rail, the handle, an optional Thesis chip, the relative time (with the
  // captured timestamp as its title), the text or link, and the like count.
  //
  // Markup and every class are the capture's; the
  // comments themselves come from tradePopup.json (null on the closed trade, which
  // renders nothing).
  import Heart from "../../icons/heart.svelte";

  // The comment avatar is a 20px box, and the like icon a 16px one; the header's
  // trader avatar is the 28px the JSON carries.
  const AVATAR = "20px";
  const LIKE_ICON = "16px";

  /** @type {{ comments: import("../../lib/types").TradePopupComment[] | null, profile: import("../../lib/types").TradePopupProfile }} */
  let { comments, profile } = $props();
</script>

{#if comments}
  <div class="flex flex-col flex-1 min-h-0 rounded-xl p-3 overflow-hidden">
    <div class="flex flex-col overflow-y-auto flex-1 min-h-0 pb-8 mask-[linear-gradient(to_bottom,black_calc(100%-4rem),transparent)]">
      <!-- A comment has no id in the capture; its timestamp to the minute is the
           only per-comment identity, and it is unique across the captured thread. -->
      {#each comments as c (c.title)}
        <div class="flex gap-2 pr-4">
          <div class="flex flex-col items-center gap-1">
            {#if !c.first}<div class="w-0.5 h-2 rounded bg-bg-tertiary"></div>{/if}
            <img class="rounded-full flex items-center justify-center shrink-0 object-cover" src={profile.avatarKind === "image" ? profile.avatarSrc : profile.placeholderImgSrc} alt="" style="width: {AVATAR}; height: {AVATAR}; min-width: {AVATAR}; min-height: {AVATAR};" />
            {#if !c.last}<div class="w-0.5 flex-1 rounded bg-bg-tertiary"></div>{/if}
          </div>
          <div class="flex-1 min-w-0 {c.first ? 'pb-2 pt-0' : c.last ? 'pt-3 pb-5' : 'pb-2 pt-3'}">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-1.5 shrink-0">
                <div translate="no" class="flex min-w-0 max-w-full shrink items-center gap-0.5 text-xs">
                  <div class="min-w-0 truncate">{profile.name}</div>
                </div>
                {#if c.thesis}<div class="w-fit shrink-0 rounded-sm py-px px-1 text-xs font-bold flex items-center gap-1" style="color: rgb(81, 106, 246); background-color: rgba(81, 106, 246, 0.2); font-size: 10px;">Thesis</div>{/if}
                <div class="text-[10px] text-text-tertiary" translate="no"><span translate="no" title={c.title}>{c.ago}</span></div>
              </div>
              <div class="text-sm font-normal leading-5 whitespace-pre-line wrap-break-word">{c.text}{#if c.link}<a href={c.link} target="_blank" rel="noopener noreferrer" class="text-accent-primary underline hover:opacity-80" translate="no">{c.link}</a>{/if}</div>
              <div class="flex items-center py-1 pr-2 justify-between">
                <div class="flex items-center gap-3">
                  <div role="button" tabindex="0" class="flex items-center cursor-pointer h-4 min-w-4 w-auto gap-1">
                    <div class="p-2 -m-2 active:scale-75 transition-transform duration-150"><Heart style="height: {LIKE_ICON}; width: {LIKE_ICON};" /></div>
                    <span class="text-xs min-w-2 transition-all text-text-tertiary">{c.likes}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
