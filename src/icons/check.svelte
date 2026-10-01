<!-- a plain tick: the order row's "Bought"/"Sold" mark -->
<script>
  let { class: cls = "w-4 h-4 text-green", style: sty = undefined, ...rest } = $props();
</script>

<svg class={cls} style={sty} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {...rest}><path d="M20 6 9 17l-5-5" /></svg>
