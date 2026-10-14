<script setup vapor>
import { computed, ref } from 'vue'
import { getEntity } from '../../knowledge/index.js'
import { atlasPath } from '../../kb/paths.js'
import { TIER_LABELS, causalFor } from '../../kb/causal-view.js'
import LayeredGraph from '../../viz/LayeredGraph.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import EntityMiniCard from './EntityMiniCard.vue'

// What an entity increases, decreases, causes, mitigates or aggravates, and what does that to it, as a
// small layered causal graph (tiers: interventions, molecules, systems, states, diseases, outcomes).
// Signed edges, hypothesis edges dashed with the status of the claim behind them. An entity with no
// signed edges falls back to its unsigned links (if `fallback`); with none at all, nothing is drawn.
// Choosing a node shows its card; the link continues in the causal atlas.
//
//   CausalMini(entity-id="state:undermethylation" :depth="2" direction="both")
const props = defineProps({
  entityId: { type: String, required: true },
  title: { type: String, default: 'Cause and effect' },
  depth: { type: Number, default: 2 },
  direction: { type: String, default: 'both' },
  limit: { type: Number, default: 24 },
  fallback: { type: Boolean, default: true }
})

const selected = ref('')
const data = computed(() => causalFor(props.entityId, { depth: props.depth, direction: props.direction, limit: props.limit, unsignedFallback: props.fallback }))
const name = computed(() => getEntity(props.entityId)?.name ?? props.entityId)
const chosen = computed(() => (selected.value && selected.value !== props.entityId && getEntity(selected.value) ? selected.value : ''))
const heading = computed(() => (data.value?.unsigned ? 'Connections' : props.title))
const lede = computed(() => (data.value?.unsigned
  ? `No signed effect is recorded for ${name.value}; these are its other links (${data.value.counts.nodes} entries).`
  : `${data.value?.counts.nodes} entries and ${data.value?.counts.edges} signed links around ${name.value}. Dashed links are hypotheses; the label says how far the claim behind them is supported.`))
</script>

<template lang="pug">
Panel.causal-mini(v-if="data" :title="heading" :lede="lede" data-visual="causal-graph" data-testid="causal-mini")
  LayeredGraph(:title="`${name}: ${data.unsigned ? 'connections' : 'cause and effect'}`" :nodes="data.nodes" :edges="data.edges" :tier-names="TIER_LABELS" direction="LR" v-model:selected="selected")
  EntityMiniCard(v-if="chosen" :id="chosen")
  p
    RouterLink(:to="atlasPath('causal', { focus: entityId })") {{ `Open ${name} in the causal atlas` }}
</template>
