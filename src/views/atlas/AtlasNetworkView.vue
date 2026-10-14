<script setup vapor>
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import EntityMiniCard from '../../components/kb/EntityMiniCard.vue'
import { pathwayInclude, pathwaysOnLayout } from '../../kb/atlas-model.js'
import { shortLabel, toMetabolicMap } from '../../kb/layout-map.js'
import { getEntity } from '../../knowledge/index.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'
import Panel from '../../ui/Panel.vue'
import { LAYOUTS, LAYOUT_IDS, loadLayout } from '../../viz/layouts/index.js'
import MetabolicMap from '../../viz/MetabolicMap.vue'
import AtlasNav from './AtlasNav.vue'

// /atlas/network. The hand-laid metabolic maps: pick a map (core methylation, gastric acid, bile-acid conjugation,
// TMA and TMAO, GABA and B6, glycine flux) and, optionally, one pathway of it to crop to. The map's own toggle shows
// the currency molecules (ATP, NADPH, water ...). Choosing a reaction or compound shows its card: the equation, the
// enzyme, the top quantities and a link to its page. The map and the pathway are in the URL (?map= &pathway=).
const route = useRoute()
const mapId = ref('core-methylation')
const pathway = ref('')
const layout = shallowRef(null)
const selected = ref('')
const chosen = ref('')

function load() {
  mapId.value = LAYOUT_IDS.includes(route.query.map) ? route.query.map : 'core-methylation'
  pathway.value = typeof route.query.pathway === 'string' ? route.query.pathway : ''
}
watch(() => JSON.stringify(route.query), load, { immediate: true })

watch([mapId, pathway], () => {
  const query = new URLSearchParams({ ...(mapId.value !== 'core-methylation' ? { map: mapId.value } : {}), ...(pathway.value ? { pathway: pathway.value } : {}) }).toString()
  const current = new URLSearchParams({ ...(route.query.map && route.query.map !== 'core-methylation' ? { map: route.query.map } : {}), ...(route.query.pathway ? { pathway: route.query.pathway } : {}) }).toString()
  if (query !== current) navigate(query ? `${route.path}?${query}` : route.path, { replace: true })
})

let run = 0
watch(mapId, async (id) => {
  const mine = ++run
  layout.value = null
  const loaded = await loadLayout(id)
  if (mine === run) layout.value = loaded
}, { immediate: true })

const pathways = computed(() => (layout.value ? pathwaysOnLayout(layout.value) : []))
const known = computed(() => pathways.value.some((item) => item.id === pathway.value))
const map = computed(() => {
  if (!layout.value) return null
  const include = known.value ? pathwayInclude(layout.value, pathway.value) : undefined
  return toMetabolicMap(layout.value, { include, labelOf: (id) => shortLabel(getEntity(id)?.name ?? id, id) })
})
const mapOptions = LAYOUT_IDS.map((id) => ({ value: id, label: LAYOUTS[id].title }))

watch([mapId, pathway], () => { selected.value = ''; chosen.value = '' })
// a pathway belongs to one map, so choosing another map goes back to the whole map
function chooseMap(event) {
  mapId.value = event.target.value
  pathway.value = ''
}
function onSelect(node) {
  const id = String(node.id).includes('~') ? String(node.id).split('~')[1] : node.id
  chosen.value = getEntity(id) ? id : ''
}

watchEffect(() => setPageTitle(layout.value ? `Metabolic network: ${layout.value.title}` : 'Metabolic network'))
</script>

<template lang="pug">
.stack.stack--loose
  header.stack.stack--tight
    h1 Metabolic network
    p.lede The hand-laid maps of the reactions: compounds, the reactions between them and the enzymes that run them.
  AtlasNav

  form.grid.atlas-controls(aria-label="Metabolic map controls" @submit.prevent)
    .stack.stack--tight
      label(for="network-map") Map
      select#network-map(:value="mapId" @change="chooseMap")
        option(v-for="item in mapOptions" :key="item.value" :value="item.value") {{ item.label }}
    .stack.stack--tight
      label(for="network-pathway") Pathway
      select#network-pathway(v-model="pathway")
        option(value="") The whole map
        option(v-for="item in pathways" :key="item.id" :value="item.id") {{ `${item.name} (${item.reactions.length} reactions)` }}

  Panel(v-if="map && layout" :title="layout.title" :lede="layout.summary" data-visual="metabolic-map" data-testid="atlas-network")
    MetabolicMap(id="atlas-map" :title="`${layout.title}${known ? `: ${pathways.find((item) => item.id === pathway)?.name}` : ''}`" :map="map" v-model:selected="selected" @select="onSelect")
    EntityMiniCard(v-if="chosen" :id="chosen")
    p.muted(v-else) Choose a reaction or a compound on the map to see its equation, enzyme and quantities here.
  p.muted(v-else role="status" data-loading="map") Loading the map…
</template>
