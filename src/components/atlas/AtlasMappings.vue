<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import EmptyState from '../../ui/EmptyState.vue'
import Panel from '../../ui/Panel.vue'
import { humanize } from '../../ui/format.js'

// Identity mappings of the taxon projection, plus typed isoforms that resolve
// to more than one candidate although no mapping record says so.
const props = defineProps({ workspace: { type: Object, required: true } })

const mappings = computed(() => props.workspace.network.mappings)
const structuralAmbiguities = computed(() => {
  if (mappings.value.some((mapping) => mapping.status === 'ambiguous')) return []
  const entities = props.workspace.includedEntities ?? props.workspace.network.entities
  const byProtein = new Map()
  for (const entity of entities.filter((item) => item.entityType === 'isoform')) {
    byProtein.set(entity.proteinId, [...(byProtein.get(entity.proteinId) ?? []), entity.id])
  }
  return [...byProtein.entries()]
    .filter(([, candidateIds]) => candidateIds.length > 1)
    .map(([sourceId, candidateIds]) => ({ sourceId, candidateIds: candidateIds.sort() }))
})
</script>

<template lang="pug">
Panel(title="Identity mappings and ambiguity" title-id="atlas-mappings-title" :level="3" flat)
  EmptyState(v-if="!mappings.length") No identity mapping is asserted for this taxon projection; this is not evidence that identifiers are equivalent or absent.
  Card(v-for="mapping in mappings" :key="mapping.id")
    .repel
      strong {{ mapping.status }} · {{ humanize(mapping.relation) }}
      code {{ mapping.id }}
    p {{ mapping.sourceId }} → {{ mapping.targetId ?? 'no selected target' }}
    p(v-if="mapping.candidateIds.length") Ambiguous candidates: {{ mapping.candidateIds.join(', ') }}
    small.muted {{ mapping.rationale }}
  Card(v-for="ambiguity in structuralAmbiguities" :key="ambiguity.sourceId")
    .repel
      strong unresolved · structural ambiguity
      code Typed entity structure
    p {{ ambiguity.sourceId }} → no selected isoform
    p Ambiguous candidates: {{ ambiguity.candidateIds.join(', ') }}
    small.muted Multiple typed isoforms resolve in this verified release, while the taxon network projection supplies no selected identity target. This is not presented as an asserted mapping record.
</template>
