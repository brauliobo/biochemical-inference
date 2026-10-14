<script setup vapor>
import { computed, ref, watch } from 'vue'
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import { loadLayout } from '../../viz/layouts/index.js'
import MetabolicMap from '../../viz/MetabolicMap.vue'
import { layoutToMap } from './map-binding.js'

// One of the hand-laid maps in src/viz/layouts, loaded on demand, with the given flux and levels on it and a link
// from the selected node to its knowledge-base page.
//
//   LayoutMap(layout="glycine-flux" title="Glycine sources and sinks" :flux="{ 'reaction:...': 2.5 }" flux-unit="g/day")
const props = defineProps({
  layout: { type: String, required: true },
  title: { type: String, required: true },
  id: { type: String, default: 'dash-map' },
  flux: { type: Object, default: () => ({}) },
  concentration: { type: Object, default: () => ({}) },
  concUnit: { type: String, default: '' },
  fluxUnit: { type: String, default: '' }
})
const map = ref(null)
const failed = ref(false)
const selected = ref('')
watch(() => props.layout, (id) => {
  map.value = null
  loadLayout(id).then((loaded) => { map.value = layoutToMap(loaded) }, () => { failed.value = true })
}, { immediate: true })
const picked = computed(() => map.value?.nodes.find((node) => node.id === selected.value))
</script>

<template lang="pug">
.stack
  p.muted(v-if="failed") The map could not be loaded.
  .dash-skeleton(v-else-if="!map" role="status") Loading the map.
  MetabolicMap(v-else :id="id" :title="title" :map="map" :flux="flux" :concentration="concentration" :conc-unit="concUnit" :flux-unit="fluxUnit" v-model:selected="selected")
  p.cluster(v-if="picked" role="status")
    span {{ `Selected: ${picked.label}.` }}
    RouterLink(:to="entityPath(picked.id)") Open its page
</template>
