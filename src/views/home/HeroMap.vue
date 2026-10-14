<script setup vapor>
import { computed, ref } from 'vue'
import baseline from '../../sim/data/baseline-fluxes.json'
import { layoutToMap } from '../../components/dash/map-binding.js'
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import { loadLayout } from '../../viz/layouts/index.js'
import MetabolicMap from '../../viz/MetabolicMap.vue'
import HeroPlaceholder from './HeroPlaceholder.vue'

// The hero of the home page: the core methylation network at the reference steady state (edge width = flux, node fill
// = level; both precomputed, so this loads no simulator). Hover or focus lights up a pathway; selecting a node offers its
// page and the simulator. Loaded after the page is idle.
const map = ref(null)
const failed = ref(false)
const selected = ref('')
loadLayout('core-methylation').then((layout) => { map.value = layoutToMap(layout) }, () => { failed.value = true })
const picked = computed(() => map.value?.nodes.find((node) => node.id === selected.value))
</script>

<template lang="pug">
.stack
  p.muted(v-if="failed") The map could not be loaded.
  HeroPlaceholder(v-else-if="!map")
  MetabolicMap(v-else id="home-map" title="Core methylation network at the reference state" :map="map" :flux="baseline.fluxes" :concentration="baseline.concentrations" conc-unit="uM" flux-unit="uM/h" v-model:selected="selected")
  p.cluster(role="status")
    template(v-if="picked")
      span {{ `Selected: ${picked.label}.` }}
      RouterLink(:to="entityPath(picked.id)") Open its page
    RouterLink.button(to="/dash/methylation") Simulate it: methylation balance
</template>
