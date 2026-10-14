<script setup vapor>
import Disclosure from '../../ui/Disclosure.vue'

// The one place for running text on the evidence pages: a collapsed "Notes" drawer. The default slot
// holds the text; everything above it is charts and tables.
defineProps({ summary: { type: String, default: 'Notes' } })
</script>

<template lang="pug">
Disclosure(:summary="summary" card)
  .prose
    slot
</template>
