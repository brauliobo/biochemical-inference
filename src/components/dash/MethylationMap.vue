<script setup vapor>
import { computed, ref } from 'vue'
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import { loadLayout } from '../../viz/layouts/index.js'
import MetabolicMap from '../../viz/MetabolicMap.vue'
import ScenarioPicker from '../../viz/ScenarioPicker.vue'
import ChangeBars from './ChangeBars.vue'
import { layoutToMap } from './map-binding.js'
import { mapConcentration, topChanges } from './methylation-view.js'

// The core methylation network coloured by the scenario: edge width is the flux at the hour of the largest change,
// compound fill is either the level or the change against the reference state. Click or Enter selects a node.
//
//   MethylationMap(:map-data="result.map" title="..." )
const props = defineProps({
  mapData: { type: Object, required: true },
  title: { type: String, default: 'Core methylation network in this scenario' }
})
const layout = ref(null)
const failed = ref(false)
const mode = ref('change')
const selected = ref('')
loadLayout('core-methylation').then((loaded) => { layout.value = layoutToMap(loaded) }, () => { failed.value = true })

const modes = [{ value: 'change', label: 'Change vs reference' }, { value: 'level', label: 'Level (µM)' }]
const concentration = computed(() => mapConcentration(props.mapData, mode.value))
const changes = computed(() => (layout.value ? topChanges(props.mapData, layout.value.nodes) : []))
const picked = computed(() => layout.value?.nodes.find((node) => node.id === selected.value))
</script>

<template lang="pug">
.stack
  .repel
    ScenarioPicker(label="Colour compounds by" :options="modes" v-model="mode")
  p.muted(v-if="failed") The map could not be loaded.
  .dash-skeleton(v-else-if="!layout" role="status") Loading the map.
  MetabolicMap(v-else id="dash-map" :title="title" :map="layout" :flux="mapData.flux" :concentration="concentration.values" :conc-unit="concentration.unit" flux-unit="uM/h" v-model:selected="selected")
  p.cluster(v-if="picked" role="status")
    span {{ `Selected: ${picked.label}.` }}
    RouterLink(:to="entityPath(picked.id)") Open its page
  ChangeBars(v-if="layout" :items="changes")
</template>
