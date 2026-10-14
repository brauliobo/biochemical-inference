<script setup vapor>
import { computed, ref } from 'vue'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import Badge from '../../ui/Badge.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LayeredGraph from '../../viz/LayeredGraph.vue'
import { entityPath } from '../../kb/paths.js'
import { causalView, claimPath, describeView, rowsAt } from './causal-view.js'

// A layered causal map of the signed links among the entries a dashboard names (map-sets.js), with the verdict of
// the claim behind every hypothesis link listed under it. Choose a node (click, or Enter in the graph) to see the
// links at that node, hypotheses first; otherwise every hypothesis link is listed.
//
//   CausalMap(id="gut-causal" title="From glycine powder to throat burning" :include="GUT_ACID_MAP.include" :labels="GUT_ACID_MAP.labels")
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  include: { type: Array, required: true },
  labels: { type: Object, default: () => ({}) }
})
loadKnowledge()
const selected = ref('')
const view = computed(() => (knowledgeModule.value ? causalView(knowledgeModule.value, { include: props.include, labels: props.labels }) : null))
const shown = computed(() => {
  if (!view.value) return []
  return selected.value ? rowsAt(view.value, selected.value) : view.value.hypothesisRows
})
const heading = computed(() => {
  const node = view.value?.nodes.find((item) => item.id === selected.value)
  return node ? `Links at "${node.label}"` : 'Hypothesis links and the verdict of their claims'
})
</script>

<template lang="pug">
.stack
  p.muted(v-if="!view" role="status") Loading the causal map.
  template(v-else)
    LayeredGraph(:id="id" :title="title" :nodes="view.nodes" :edges="view.edges" :tier-names="view.tierNames" :summary="describeView(view)" direction="LR" v-model:selected="selected")
    Panel(:title="heading" :title-id="`${id}-verdicts`" :level="3" flat)
      p.muted(v-if="!shown.length") No hypothesis link at this entry.
      ul.dg-edges(v-else :aria-label="heading")
        li(v-for="row in shown" :key="row.key")
          span.dg-edge__ends {{ `${row.fromName} → ${row.toName}` }}
          Badge(:label="row.signWord" tone="info")
          Badge(v-if="row.hypothesis" label="Hypothesis" tone="warning")
          Badge(v-if="row.claimId" :label="row.status.word" :tone="row.status.tone")
          span.muted(v-if="row.strength") {{ `${row.strength} effect` }}
          RouterLink(v-if="row.claimId" :to="claimPath(row.claimId)" :aria-label="`See the claim: ${row.fromName} to ${row.toName}`") See the claim
          RouterLink(v-else :to="entityPath(row.to)" :aria-label="`Open the entry: ${row.toName}`") Open the entry
</template>
