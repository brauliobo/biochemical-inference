<script setup vapor>
import { computed } from 'vue'

// The one badge. Tone is a colour hint only; the label always carries the meaning.
const props = defineProps({
  label: { type: String, required: true },
  tone: { type: String, default: 'muted' }
})
const toneClass = computed(() => (props.tone === 'muted' ? '' : `badge--${props.tone}`))
</script>

<template lang="pug">
span.badge(:class="toneClass") {{ label }}
</template>
