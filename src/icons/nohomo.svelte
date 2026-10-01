<script>
  // The app's mark, replaced by the supplied avatar artwork. It is a raster inside an SVG
  // wrapper, so it is served from `public/` and drawn as an image — inlining it would put the
  // whole 650KB payload in the JavaScript bundle, and a picture cannot take `currentColor`.
  let { class: cls = "h-3.5 w-3.5", ...rest } = $props();
</script>

<img src="/avatar.png" class="shrink-0 {cls}" alt="" aria-hidden="true" {...rest} />
