<script setup vapor>
import { computed } from 'vue'
import { evidenceInfo } from '../../knowledge/evidence.js'

// An evidence grade as a small lettered dot plus its word (E established, P plausible, S speculative,
// C conversation only). The letter and the word carry the meaning; colour only reinforces. `bare`
// drops the word for dense tables (the word stays for screen readers).
const LETTER = { established: 'E', plausible: 'P', speculative: 'S', 'conversation-only': 'C' }
const props = defineProps({
  grade: { type: String, required: true },
  bare: { type: Boolean, default: false }
})
const info = computed(() => evidenceInfo(props.grade))
</script>

<template lang="pug">
span.grade-dot(:class="`grade-dot--${grade}`" :title="info.description")
  span.grade-dot__mark(aria-hidden="true") {{ LETTER[grade] ?? '?' }}
  span(:class="{ 'visually-hidden': bare }") {{ info.label }}
</template>
