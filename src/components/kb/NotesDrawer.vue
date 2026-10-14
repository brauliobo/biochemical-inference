<script setup vapor>
import { computed } from 'vue'
import BodyText from './BodyText.vue'
import EntityPaths from './EntityPaths.vue'
import FactsTable from './FactsTable.vue'
import ItemList from './ItemList.vue'
import PathFinder from './PathFinder.vue'
import ReferenceList from './ReferenceList.vue'
import RelationGroups from './RelationGroups.vue'

// The foot of an entity page. The guided paths the entry belongs to and the "How is this connected to...?"
// control stay visible (they are navigation, not prose). Everything that is prose or a long list sits in one
// collapsed "Notes & sources" drawer: the body text, facts and identifiers, every connection grouped by relation,
// the sources, where the entry is mentioned and related entries.
const props = defineProps({
  model: { type: Object, required: true },
  open: { type: Boolean, default: false },
  // identifiers already shown elsewhere on the page (a reaction's EC and Rhea ids) are not repeated
  hideFacts: { type: Array, default: () => [] }
})

const facts = computed(() => (props.model.facts ?? []).filter((fact) => !props.hideFacts.includes(fact.key)))
const seeAlso = computed(() => (props.model.seeAlso ?? []).map((item) => ({ ...item, note: `Shares links with ${item.via.map((via) => via.name).join(', ')}` })))
const counts = computed(() => [
  props.model.body?.length ? `${props.model.body.length} paragraphs` : '',
  props.model.relationGroups?.length ? `${props.model.relationGroups.reduce((sum, group) => sum + group.items.length, 0)} connections` : '',
  props.model.references?.length ? `${props.model.references.length} sources` : ''
].filter(Boolean).join(', '))
</script>

<template lang="pug">
.stack.stack--loose
  EntityPaths(:id="model.id")
  PathFinder(:from="model.id")
  details.card.notes-drawer(:open="open")
    summary
      h2.notes-drawer__title Notes &amp; sources
      span.muted(v-if="counts") {{ counts }}
    .stack.stack--loose
      section.stack(v-if="model.body.length" aria-labelledby="notes-details")
        h3#notes-details Details
        BodyText(:paragraphs="model.body")
      section.stack(v-if="facts.length" aria-labelledby="notes-facts")
        h3#notes-facts Facts and identifiers
        FactsTable(:facts="facts")
      section.stack(v-if="model.relationGroups.length" aria-labelledby="notes-connections")
        h3#notes-connections Connections
        RelationGroups(:groups="model.relationGroups")
      section.stack(v-if="model.references.length" aria-labelledby="notes-sources")
        h3#notes-sources Sources
        ReferenceList(:references="model.references")
      section.stack(v-if="model.mentionedBy.length" aria-labelledby="notes-mentioned")
        h3#notes-mentioned Mentioned in
        ItemList(:items="model.mentionedBy")
      section.stack(v-if="seeAlso.length" aria-labelledby="notes-see-also")
        h3#notes-see-also See also
        ItemList(:items="seeAlso")
</template>
