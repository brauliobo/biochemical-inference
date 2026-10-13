<script setup vapor>
import { computed } from 'vue'

// An inline message box. `tone` is 'info' (default), 'success', 'warning' or
// 'danger'; `title` is its bold first line. Give it the matching ARIA role as
// an attribute: role="alert" for errors, role="status" for progress and results,
// role="note" (with aria-label) for standing caveats.
//
//   Notice(tone="warning" role="note" title="Synthetic") Not a prediction.
const props = defineProps({
  tone: { type: String, default: 'info' },
  title: { type: String, default: '' }
})

const toneClass = computed(() => (props.tone === 'info' ? '' : `notice--${props.tone}`))
</script>

<template lang="pug">
.notice.stack.stack--tight(:class="toneClass")
  strong(v-if="title") {{ title }}
  slot
</template>
