<script>
  // A discovery row that has not arrived yet: the logo box, the symbol and its second
  // line, then market cap and a second line on the right. Same wrappers and classes as
  // `TokenRow` and `TrenchRow`, so the placeholder comes out at the row's own 53px stride
  // and the list does not move when the real rows land.
  import Skeleton from "../Skeleton.svelte";

  const LOGO_BOX_STYLE = "width: 36px; height: 36px;";
</script>

<div class="flex items-center gap-3 p-2 py-2 min-w-0">
  <Skeleton class="rounded-full shrink-0" style={LOGO_BOX_STYLE} />
  <div class="flex flex-col flex-1 min-w-0 gap-1">
    <Skeleton class="h-3.5 w-24" />
    <Skeleton class="h-3 w-16" />
  </div>
  <div class="flex flex-col gap-0.5 items-end shrink-0">
    <Skeleton class="h-3.5 w-16" />
    <Skeleton class="h-3 w-12" />
  </div>
</div>
