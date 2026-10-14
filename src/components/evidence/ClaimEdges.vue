<script setup vapor>
import { computed } from 'vue'
import { entityPath } from '../../kb/paths.js'
import EmptyState from '../../ui/EmptyState.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LayeredGraph from '../../viz/LayeredGraph.vue'
import { SIGNS } from '../../viz/shapes.js'
import Badge from '../../ui/Badge.vue'

// The causal edges this claim underpins, as a small layered graph (an edge that is only a hypothesis
// is dashed) and a list that links every entry. `graph` comes from claimGraph() in kb/evidence-graph.js.
const props = defineProps({
  graph: { type: Object, required: true },
  id: { type: String, default: 'ev-claim-graph' }
})
const hasEdges = computed(() => props.graph.edges.length > 0)
const word = (sign) => SIGNS[sign]?.label ?? sign
</script>

<template lang="pug">
EmptyState(v-if="!hasEdges" title="No causal edge") No link in the causal map is asserted by this claim.
.stack(v-else)
  LayeredGraph(:id="id" title="Causal edges asserted by this claim" :nodes="graph.nodes" :edges="graph.edges" :tier-names="graph.tierNames" direction="LR")
  ul.plain-list.stack.stack--tight
    li.cluster(v-for="(row, index) in graph.rows" :key="index")
      RouterLink(:to="entityPath(row.from)") {{ row.fromName }}
      Badge(:label="word(row.sign)" tone="info")
      RouterLink(:to="entityPath(row.to)") {{ row.toName }}
      Badge(v-if="row.hypothesis" label="Hypothesis" tone="warning")
      span.muted(v-if="row.strength") {{ `${row.strength} effect` }}
</template>
