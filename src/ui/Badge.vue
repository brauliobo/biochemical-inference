<script setup vapor>
import { computed } from 'vue'
import { statusTone } from './tone.js'

// The one badge. Colour only reinforces the text, which always carries the
// meaning. Give it a `label` (or the default slot) and an explicit `tone`
// ('success' | 'warning' | 'danger' | 'info', '' or 'muted' for neutral), or a
// `status` word whose tone comes from tone.js and which is also its text.
//
//   Badge(status="failed")            Badge(label="Supports" tone="success")
const props = defineProps({
  label: { type: String, default: '' },
  status: { type: String, default: '' },
  tone: { type: String, default: undefined }
})

const text = computed(() => props.label || props.status)
const tone = computed(() => props.tone ?? statusTone(props.status))
const toneClass = computed(() => (tone.value && tone.value !== 'muted' ? `badge--${tone.value}` : ''))
</script>

<template lang="pug">
span.badge(:class="toneClass")
  slot {{ text }}
</template>
