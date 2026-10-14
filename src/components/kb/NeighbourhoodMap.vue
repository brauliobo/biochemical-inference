<script setup vapor>
import { computed, ref, shallowRef, watch } from 'vue'
import { getEntity } from '../../knowledge/index.js'
import { reactionNetwork, reactionsOfCompound, reactionsOfEnzyme, pathwayModel } from '../../kb/entity-model.js'
import { loadAllLayouts, neighbourhoodIn, pathwayIn, shortLabel, toMetabolicMap } from '../../kb/layout-map.js'
import LayeredGraph from '../../viz/LayeredGraph.vue'
import MetabolicMap from '../../viz/MetabolicMap.vue'
import Panel from '../../ui/Panel.vue'
import EntityMiniCard from './EntityMiniCard.vue'

// Where an entity sits in metabolism, as a picture. The hand-laid metabolic maps (src/viz/layouts) are
// searched for the entity: a compound shows its reactions and the compounds they touch, a reaction and
// an enzyme the pathway around them, a pathway its member reactions. The focus is selected, so the
// reactions that produce or consume it stay bright and the rest dims. An entity no layout places gets a
// small layered reaction network instead; one with no reactions gets nothing (no empty frame).
//
//   NeighbourhoodMap(entity-id="compound:glycine" kind="compound")
const props = defineProps({
  entityId: { type: String, required: true },
  kind: { type: String, required: true },
  title: { type: String, default: 'Where it sits in metabolism' }
})

const view = shallowRef(null)
const ready = ref(false)
const selected = ref('')
const chosen = ref('')
let run = 0

const LIMIT = { compound: 10, enzyme: 6, pathway: 14, reaction: 1 }
const radius = (kind) => (kind === 'reaction' || kind === 'enzyme' ? 170 : 0)

function reactionIdsFor(id, kind) {
  if (kind === 'compound') return reactionsOfCompound(id).map((item) => item.id)
  if (kind === 'enzyme') return reactionsOfEnzyme(id).map((item) => item.id)
  if (kind === 'pathway') return pathwayModel(id).reactions.map((item) => item.id)
  return [id]
}

async function build(id, kind) {
  const mine = ++run
  ready.value = false
  view.value = null
  const layouts = await loadAllLayouts()
  if (mine !== run) return
  const reactionIds = reactionIdsFor(id, kind)
  const found = kind === 'pathway' ? pathwayIn(layouts, reactionIds) : neighbourhoodIn(layouts, { id, reactionIds: kind === 'enzyme' ? reactionIds : [], radius: radius(kind) })
  const labelOf = (compound) => shortLabel(getEntity(compound)?.name ?? compound, compound)
  if (found) {
    const map = toMetabolicMap(found.layout, { include: found.include, labelOf })
    view.value = { type: 'map', map, layout: found.layout.title, focus: found.focus, text: `${found.layout.title}` }
    selected.value = found.focus
  } else {
    const network = reactionNetwork(reactionIds.slice(0, LIMIT[kind] ?? 8))
    view.value = network.edges.length ? { type: 'graph', ...network } : null
    selected.value = ''
  }
  chosen.value = ''
  ready.value = true
}

watch(() => [props.entityId, props.kind], ([id, kind]) => build(id, kind), { immediate: true })

const idOf = (nodeId) => (String(nodeId).includes('~') ? String(nodeId).split('~')[1] : nodeId)
function onPick(node) {
  const id = idOf(node.id)
  chosen.value = getEntity(id) ? id : ''
}
function onGraphPick(node) {
  chosen.value = getEntity(node.id) ? node.id : ''
}

const heading = computed(() => (view.value?.type === 'map' ? `${props.title}` : `${props.title}`))
</script>

<template lang="pug">
Panel.neighbourhood(v-if="view" :title="heading" :lede="view.type === 'map' ? `From the ${view.layout.toLowerCase()} map. Click a reaction or compound to inspect it; the focus and its reactions stay bright.` : 'No hand-laid map places this entry, so this is a small network of its reactions.'" :data-visual="view.type === 'map' ? 'metabolic-map' : 'reaction-network'" data-testid="neighbourhood")
  MetabolicMap(v-if="view.type === 'map'" :title="`${getEntity(entityId)?.name ?? entityId}: metabolic neighbourhood`" :map="view.map" v-model:selected="selected" @select="onPick")
  LayeredGraph(v-else :title="`${getEntity(entityId)?.name ?? entityId}: reaction network`" :nodes="view.nodes" :edges="view.edges" direction="LR" :show-edge-labels="false" @select="onGraphPick")
  EntityMiniCard(v-if="chosen" :id="chosen")
p.muted(v-else-if="!ready" role="status" data-loading="map") Loading the map…
</template>
