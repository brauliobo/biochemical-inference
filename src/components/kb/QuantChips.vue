<script setup vapor>
import ProvenancePopover from './ProvenancePopover.vue'

// A row of quantities as chips. Each opens to its provenance (authority, population, basis, sources),
// so no number appears without a way to see where it comes from. Nothing is drawn for an empty list.
defineProps({
  chips: { type: Array, required: true },
  label: { type: String, default: 'Quantities' }
})
</script>

<template lang="pug">
ul.chip-list.chip-list--spread(v-if="chips.length" :aria-label="label")
  li(v-for="chip in chips" :key="chip.id")
    ProvenancePopover(:chip="chip")
</template>
