<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import { loadSpatialWorkspace } from '../api.js'
import { parsePointInstances, scaleValue } from '../spatial.js'

const props = defineProps({
  taxonId: { type: String, required: true },
  snapshot: { type: Object, required: true },
  timeIndex: { type: Number, required: true },
  field: { type: String, required: true },
  selectedBin: { type: Number, required: true }
})
const emit = defineEmits({ selectBin: (bin) => Number.isInteger(bin) && bin >= 0 && bin < 12 })
const TissueScene = defineAsyncComponent(() => import('./TissueScene.vue'))
const workspace = ref()
const cells = ref([])
const state = ref('loading')
const message = ref('')
const sceneFallback = ref('')
let generation = 0
let controller

const fieldDescriptor = computed(() => workspace.value?.descriptors.find((descriptor) => descriptor.data_kind === 'scalar-grid' && workspace.value.assets.some((asset) => asset.id === descriptor.asset_id)))
const localSpace = computed(() => workspace.value?.spaces.find((space) => space.id.endsWith('-LOCAL')))
const selectedValues = computed(() => Object.fromEntries(['apap', 'napqi', 'gsh', 'adduct', 'oxygen', 'healthy', 'stressed', 'injured', 'recovering'].map((field) => [field, props.snapshot[field][props.selectedBin]])))
const encoding = computed(() => {
  const values = props.snapshot[props.field]
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const domain = minimum === maximum ? [0, maximum || 1] : [minimum, maximum]
  return { domain, selected: scaleValue(values[props.selectedBin], domain, fieldDescriptor.value?.missing_value_policy ?? { mode: 'forbidden', sentinel: null }) }
})
const lod = computed(() => workspace.value?.fieldLevel)
const hra = computed(() => workspace.value?.mappings.find((mapping) => mapping.target_system === 'HRA'))
const taxonLabel = computed(() => props.taxonId === 'NCBITaxon:9606' ? 'human' : 'mouse')

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function load() {
  const requestGeneration = ++generation
  const requestedTaxon = props.taxonId
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  sceneFallback.value = ''
  workspace.value = undefined
  cells.value = []
  try {
    const loaded = await loadSpatialWorkspace(requestedTaxon, controller.signal, window.innerWidth < 600 ? 0.8 : 5)
    if (requestGeneration !== generation || requestedTaxon !== props.taxonId) return
    workspace.value = loaded
    cells.value = parsePointInstances(loaded.instanceContent)
    state.value = 'ready'
  } catch (error) {
    if (requestGeneration !== generation || isAbort(error)) return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The pinned spatial release could not be verified.'
  }
}

watch(() => props.taxonId, load, { immediate: true })
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
section.spatial-workbench(aria-labelledby="spatial-title")
  .section-heading
    div
      p.kicker Goal 7 · linked tissue space
      h3#spatial-title Synthetic lobule spatial view
    span.status-chip(:class="state" aria-live="polite") {{ state }}
  .spatial-boundary(role="note")
    strong Synthetic geometry · HRA unavailable
    p The cuboid, coordinates, cells, and registration are repository-authored algorithm fixtures, not measured tissue or human reference anatomy.
    p Mouse placement into human reference anatomy is refused. No click or pointer action creates anatomy or registration data.
  .alert.error(v-if="state === 'failed'" role="alert")
    p {{ message }}
    button.secondary(type="button" @click="load") Retry spatial compatibility check
  .loading(v-else-if="state === 'loading'" aria-live="polite") Verifying spatial release and content digests…
  template(v-else-if="workspace && fieldDescriptor && localSpace && lod")
    dl.spatial-provenance
      div
        dt Spatial release
        dd {{ workspace.detail.release.id }}
      div
        dt Trusted digest
        dd.digest {{ workspace.detail.release.digest }}
      div
        dt Coordinates
        dd {{ localSpace.coordinate_system }} · {{ localSpace.unit }} · {{ taxonLabel }} only
      div
        dt HRA mapping
        dd {{ hra?.status ?? 'unavailable' }} · no target space or transform
    .spatial-layout
      .scene-column
        TissueScene(:cells="cells" :space="localSpace" :snapshot="snapshot" :field="field" :selected-bin="selectedBin" :level="lod.level" @select-bin="emit('selectBin', $event)" @unavailable="sceneFallback = $event")
        .fallback(v-if="sceneFallback" role="status")
          strong 3D tissue view unavailable
          p {{ sceneFallback }} The complete numeric table and controls remain active.
      aside.spatial-inspector(aria-label="Selected lobule bin details")
        span.assumption-label Shared selection
        h4 Bin {{ selectedBin + 1 }} · {{ snapshot.timeHours }} h
        p Portal-to-central position {{ selectedBin + 1 }} of 12. Field {{ field }} is {{ snapshot[field][selectedBin].toFixed(4) }} model-unit.
        dl.compact-list
          div(v-for="(value, key) in selectedValues" :key="key")
            dt {{ key }}
            dd {{ value.toFixed(4) }}
    .encoding-legend(aria-label="Spatial encoding legend")
      strong Encoding and data policy
      span Color: {{ field }} scaled linearly from {{ encoding.domain[0].toFixed(4) }} to {{ encoding.domain[1].toFixed(4) }}; selected ratio {{ encoding.selected.ratio?.toFixed(3) }}.
      span Portal is bin 1; central is bin 12. No spatial interpolation is applied to APAP run bins.
      span Release field descriptor: {{ fieldDescriptor.interpolation }} interpolation; missing value {{ fieldDescriptor.missing_value_policy.mode }} at sentinel {{ fieldDescriptor.missing_value_policy.sentinel }}.
      span LOD {{ lod.level }} · {{ lod.dimensions.join('×') }} · loaded {{ lod.content_id }} only for this viewport.
      span {{ fieldDescriptor.uncertainty.kind }} means byte-exact synthetic fixture values, not zero biological uncertainty.
    .spatial-bin-controls(role="group" aria-label="Select portal-to-central lobule bin without WebGL")
      button(v-for="bin in 12" :key="bin" type="button" :class="{ selected: selectedBin === bin - 1 }" :aria-pressed="selectedBin === bin - 1" @click="emit('selectBin', bin - 1)") Bin {{ bin }}
</template>
