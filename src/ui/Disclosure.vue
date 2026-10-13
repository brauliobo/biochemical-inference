<script setup vapor>
// A native <details> disclosure. The summary is the `summary` prop, or the
// `summary` slot for rich content; `card` / `flat` frame it as a box.
//
//   Disclosure(summary="Verified release and protocol closure" card)
//     Facts(:items="pins")
defineProps({
  summary: { type: String, default: '' },
  open: { type: Boolean, default: false },
  card: { type: Boolean, default: false },
  flat: { type: Boolean, default: false }
})
</script>

<template lang="pug">
details.stack.stack--tight(:open="open" :class="{ card: card || flat, 'card--flat': flat }")
  summary
    slot(name="summary") {{ summary }}
  slot
</template>
