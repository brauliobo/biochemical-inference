<script setup vapor>
import { computed, ref, shallowRef } from 'vue'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import Disclosure from '../../ui/Disclosure.vue'
import MetabolicMap from '../../viz/MetabolicMap.vue'
import { loadLayout } from '../../viz/layouts/index.js'
import { shortName } from './causal-view.js'
import { layoutToMap, linkRows } from './layout-map.js'

// A hand-laid metabolic map (src/viz/layouts) loaded lazily, with model values drawn on it: `flux` (reaction id ->
// number, edge width and colour) and `concentration` (compound id -> number, node fill). The layout's signed
// regulation links (which MetabolicMap does not draw) are listed under the map.
//
//   LayoutMap(layout-id="gastric-acid" id="gut-map" title="Acid, bicarbonate and CO2" :flux="run.flux" flux-unit="mmol/h")
const props = defineProps({
  layoutId: { type: String, required: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  flux: { type: Object, default: () => ({}) },
  concentration: { type: Object, default: () => ({}) },
  concUnit: { type: String, default: '' },
  fluxUnit: { type: String, default: '' },
  suffix: { type: Object, default: () => ({}) },
  labels: { type: Object, default: () => ({}) },
  hide: { type: Array, default: () => [] },
  summary: { type: String, default: '' }
})
const layout = shallowRef(null)
const failed = ref(false)
loadLayout(props.layoutId).then((loaded) => { layout.value = loaded }).catch(() => { failed.value = true })
loadKnowledge()
const selected = ref('')
const names = (id) => {
  const entity = knowledgeModule.value?.getEntity(id)
  return entity ? shortName(entity.name) : undefined
}
const map = computed(() => (layout.value ? layoutToMap(layout.value, { suffix: props.suffix, labels: props.labels, hide: props.hide, names: knowledgeModule.value ? names : undefined }) : null))
const links = computed(() => (layout.value ? linkRows(layout.value) : []))
</script>

<template lang="pug">
.stack
  p.muted(v-if="failed" role="alert") The map could not be loaded.
  p.muted(v-else-if="!map" role="status") Loading the map.
  template(v-else)
    MetabolicMap(:id="id" :title="title" :map="map" :flux="flux" :concentration="concentration" :conc-unit="concUnit" :flux-unit="fluxUnit" :summary="summary" v-model:selected="selected")
    Disclosure(v-if="links.length" :summary="`Regulation links on this map (${links.length})`")
      ul.plain-list.stack.stack--tight
        li(v-for="row in links" :key="`${row.from}|${row.to}`") {{ `${row.fromName} ${row.sign === 'decrease' ? 'lowers' : 'raises'} ${row.toName}${row.label ? ` (${row.label})` : ''}` }}
</template>
