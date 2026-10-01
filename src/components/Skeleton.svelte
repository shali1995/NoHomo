<script>
  // A loading placeholder: a pulsing block that stands in for a value until it arrives.
  //
  // The caller passes the shape (size, radius), so a skeleton occupies the same box the
  // real value will, and nothing moves when the data lands. `inline-block` is deliberate:
  // inside a text line it sits IN the line box, so the surrounding line keeps the height
  // its own font and line-height give it, and the row does not jump on the swap.
  /** @type {{ class?: string, style?: string }} */
  let { class: cls = "", style = undefined, ...rest } = $props();
</script>

<div class="animate-pulse bg-bg-tertiary inline-block {cls}" style={style} {...rest}></div>
