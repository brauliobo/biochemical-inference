<script setup vapor>
import { computed } from 'vue'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'

// Four counters (entries, reactions, quantities, claims) as small tiles. The knowledge data loads lazily, after the
// page has drawn; until then the tiles show a dash, so the layout does not move.
loadKnowledge()
const stats = computed(() => {
  const module = knowledgeModule.value
  const types = module ? module.home().types : []
  const count = (type) => types.find((entry) => entry.type === type)?.count
  const entities = module ? module.home().totals.entities : null
  return [
    { id: 'entities', label: 'Entries', value: entities },
    { id: 'reactions', label: 'Reactions', value: count('reaction') },
    { id: 'quantities', label: 'Quantities', value: module ? module.quant.length : null },
    { id: 'claims', label: 'Claims audited', value: count('claim') }
  ]
})
</script>

<template lang="pug">
ul.home-stats(aria-label="What is in the knowledge base")
  li.home-stat(v-for="stat in stats" :key="stat.id")
    span.home-stat__value {{ stat.value ?? '–' }}
    span.home-stat__label {{ stat.label }}
</template>
