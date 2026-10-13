<script setup vapor>
import { computed, defineVaporAsyncComponent, onBeforeUnmount, ref, watch } from 'vue'
import { loadSpatialWorkspace } from '../api.js'
import { parsePointInstances, scaleValue } from '../spatial.js'
import Metric from '../ui/Metric.vue'
import Section from '../ui/Section.vue'
import Toolbar from '../ui/Toolbar.vue'
import { statusTone } from '../ui/tone.js'

const props = defineProps({
  taxonId: { type: String, required: true },
  snapshot: { type: Object, required: true },
  timeIndex: { type: Number, required: true },
  field: { type: String, required: true },
  selectedBin: { type: Number, required: true }
})
const emit = defineEmits({ selectBin: (bin) => Number.isInteger(bin) && bin >= 0 && bin < 12 })
const TissueScene = defineVaporAsyncComponent(() => import('./TissueScene.vue'))
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
Section.spatial-workbench(title="Synthetic lobule spatial view" title-id="spatial-title" eyebrow="Goal 7 · linked tissue space" :level="3" :status="state" :tone="statusTone(state)" flat)
  .notice.notice--warning.stack.stack--tight(role="note")
    strong Synthetic geometry · HRA unavailable
    p The cuboid, coordinates, cells, and registration are repository-authored algorithm fixtures, not measured tissue or human reference anatomy.
    p Mouse placement into human reference anatomy is refused. No click or pointer action creates anatomy or registration data.
  .notice.notice--danger.stack.stack--tight(v-if="state === 'failed'" role="alert")
    p {{ message }}
    button.button.button--secondary(type="button" @click="load") Retry spatial compatibility check
  p.muted(v-else-if="state === 'loading'" role="status") Verifying spatial release and content digests…
  template(v-else-if="workspace && fieldDescriptor && localSpace && lod")
    dl.metrics
      Metric(label="Spatial release" :value="workspace.detail.release.id")
      Metric(label="Trusted digest" :value="workspace.detail.release.digest" mono)
      Metric(label="Coordinates" :value="`${localSpace.coordinate_system} · ${localSpace.unit} · ${taxonLabel} only`")
      Metric(label="HRA mapping" :value="`${hra?.status ?? 'unavailable'} · no target space or transform`")
    .sidebar.sidebar--end
      .stack.stack--tight
        TissueScene(:cells="cells" :space="localSpace" :snapshot="snapshot" :field="field" :selected-bin="selectedBin" :level="lod.level" @select-bin="emit('selectBin', $event)" @unavailable="sceneFallback = $event")
        .notice.notice--warning.stack.stack--tight(v-if="sceneFallback" role="status")
          strong 3D tissue view unavailable
          p {{ sceneFallback }} The complete numeric table and controls remain active.
      aside.card.card--flat.stack.stack--tight(aria-label="Selected lobule bin details")
        p.eyebrow Shared selection
        h4 Bin {{ selectedBin + 1 }} · {{ snapshot.timeHours }} h
        p.muted Portal-to-central position {{ selectedBin + 1 }} of 12. Field {{ field }} is {{ snapshot[field][selectedBin].toFixed(4) }} model-unit.
        dl.facts
          div(v-for="(value, key) in selectedValues" :key="key")
            dt {{ key }}
            dd {{ value.toFixed(4) }}
    section.card.card--flat.stack.stack--tight(aria-labelledby="spatial-encoding-title")
      h4#spatial-encoding-title Encoding and data policy
      p.muted Color: {{ field }} scaled linearly from {{ encoding.domain[0].toFixed(4) }} to {{ encoding.domain[1].toFixed(4) }}; selected ratio {{ encoding.selected.ratio?.toFixed(3) }}.
      p.muted Portal is bin 1; central is bin 12. No spatial interpolation is applied to APAP run bins.
      p.muted Release field descriptor: {{ fieldDescriptor.interpolation }} interpolation; missing value {{ fieldDescriptor.missing_value_policy.mode }} at sentinel {{ fieldDescriptor.missing_value_policy.sentinel }}.
      p.muted LOD {{ lod.level }} · {{ lod.dimensions.join('×') }} · loaded {{ lod.content_id }} only for this viewport.
      p.muted {{ fieldDescriptor.uncertainty.kind }} means byte-exact synthetic fixture values, not zero biological uncertainty.
    Toolbar.spatial-bin-controls(label="Select portal-to-central lobule bin without WebGL")
      button.button.button--secondary(v-for="bin in 12" :key="bin" type="button" :aria-pressed="selectedBin === bin - 1" @click="emit('selectBin', bin - 1)") Bin {{ bin }}
</template>
