<script setup vapor>
// Previous / next controls with a position summary, as a named navigation
// landmark. The parent decides what the pages are (offsets or cursors); this
// only renders the controls and emits `previous` and `next`.
//
//   Pagination(label="History pagination" :summary="`Showing 1–25 of 80`" :can-previous="offset > 0" :can-next="more" @previous="back" @next="forward")
defineProps({
  label: { type: String, required: true },
  summary: { type: String, default: '' },
  canPrevious: { type: Boolean, default: false },
  canNext: { type: Boolean, default: false },
  previousLabel: { type: String, default: 'Previous' },
  nextLabel: { type: String, default: 'Next' }
})
const emit = defineEmits(['previous', 'next'])
</script>

<template lang="pug">
nav.repel(:aria-label="label")
  p(v-if="summary") {{ summary }}
  .cluster
    button.button.button--secondary(type="button" :disabled="!canPrevious" @click="emit('previous')") {{ previousLabel }}
    button.button.button--secondary(type="button" :disabled="!canNext" @click="emit('next')") {{ nextLabel }}
</template>
