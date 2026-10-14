<script setup vapor>
import Badge from '../../ui/Badge.vue'
import EvidenceChips from './EvidenceChips.vue'

// The competing explanations side by side: each card names the explanation, shows the evidence grade and verdict of
// the entries behind it as chips, and one chip for what the model says. `items` is built by the page from
// gut-explanations.js and the latest run.
defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'Competing explanations for belching' }
})
</script>

<template lang="pug">
ul.dg-explanations(:aria-label="label")
  li(v-for="item in items" :key="item.id")
    span.dg-explanations__name {{ item.title }}
    EvidenceChips(:items="item.evidence" :label="`Evidence for: ${item.title}`")
    div
      Badge(:label="item.model.label" :tone="item.model.tone")
</template>
