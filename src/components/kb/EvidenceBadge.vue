<script setup vapor>
import { computed } from 'vue'
import { evidenceInfo } from '../../knowledge/evidence.js'
import Badge from './Badge.vue'

// Evidence grade as a badge. `explain` adds the plain-language meaning underneath.
const props = defineProps({
  grade: { type: String, required: true },
  explain: { type: Boolean, default: false }
})
const info = computed(() => evidenceInfo(props.grade))
const label = computed(() => `Evidence: ${info.value.label}`)
</script>

<template lang="pug">
Badge(v-if="!explain" :label="label" :tone="info.tone")
.stack.stack--tight(v-else)
  Badge(:label="label" :tone="info.tone")
  p.muted {{ info.description }}
</template>
