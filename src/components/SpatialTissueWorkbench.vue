<script setup vapor>
import { computed, defineVaporAsyncComponent, ref, watch } from 'vue'
import { loadSpatialWorkspace } from '../api.js'
import { errorMessage, useTask } from '../composables/useTask.js'
import { parsePointInstances, scaleValue } from '../spatial.js'
import Card from '../ui/Card.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import Toolbar from '../ui/Toolbar.vue'
import { fixed } from '../ui/format.js'
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

const VALUE_FIELDS = ['apap', 'napqi', 'gsh', 'adduct', 'oxygen', 'healthy', 'stressed', 'injured', 'recovering']
const workspace = ref()
const cells = ref([])
const state = ref('loading')
const message = ref('')
const sceneFallback = ref('')
const task = useTask()

const fieldDescriptor = computed(() => workspace.value?.descriptors.find((descriptor) => descriptor.data_kind === 'scalar-grid' && workspace.value.assets.some((asset) => asset.id === descriptor.asset_id)))
const localSpace = computed(() => workspace.value?.spaces.find((space) => space.id.endsWith('-LOCAL')))
const lod = computed(() => workspace.value?.fieldLevel)
const hra = computed(() => workspace.value?.mappings.find((mapping) => mapping.target_system === 'HRA'))
const taxonLabel = computed(() => (props.taxonId === 'NCBITaxon:9606' ? 'human' : 'mouse'))
const selectedValues = computed(() => VALUE_FIELDS.map((name) => ({ label: name, value: fixed(props.snapshot[name][props.selectedBin], 4) })))
const encoding = computed(() => {
  const values = props.snapshot[props.field]
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const domain = minimum === maximum ? [0, maximum || 1] : [minimum, maximum]
  return { domain, selected: scaleValue(values[props.selectedBin], domain, fieldDescriptor.value?.missing_value_policy ?? { mode: 'forbidden', sentinel: null }) }
})
const release = computed(() => [
  { label: 'Spatial release', value: workspace.value.detail.release.id },
  { label: 'Trusted digest', value: workspace.value.detail.release.digest, mono: true },
  { label: 'Coordinates', value: `${localSpace.value.coordinate_system} · ${localSpace.value.unit} · ${taxonLabel.value} only` },
  { label: 'HRA mapping', value: `${hra.value?.status ?? 'unavailable'} · no target space or transform` }
])

function load() {
  const requestedTaxon = props.taxonId
  state.value = 'loading'
  message.value = ''
  sceneFallback.value = ''
  workspace.value = undefined
  cells.value = []
  return task.run(async ({ signal, fresh }) => {
    const loaded = fresh(await loadSpatialWorkspace(requestedTaxon, signal, window.innerWidth < 600 ? 0.8 : 5))
    if (requestedTaxon !== props.taxonId) return
    workspace.value = loaded
    cells.value = parsePointInstances(loaded.instanceContent)
    state.value = 'ready'
  }, {
    fail: (error) => {
      state.value = 'failed'
      message.value = errorMessage(error, 'The pinned spatial release could not be verified.')
    }
  })
}

watch(() => props.taxonId, load, { immediate: true })
</script>

<template lang="pug">
Panel.spatial-workbench(title="Synthetic lobule spatial view" title-id="spatial-title" eyebrow="Goal 7 · linked tissue space" :level="3" :status="state" :tone="statusTone(state)" flat)
  Notice(tone="warning" role="note" title="Synthetic geometry · HRA unavailable")
    p The cuboid, coordinates, cells, and registration are repository-authored algorithm fixtures, not measured tissue or human reference anatomy.
    p Mouse placement into human reference anatomy is refused. No click or pointer action creates anatomy or registration data.
  ErrorNotice(v-if="state === 'failed'" :message="message" retry-label="Retry spatial compatibility check" @retry="load")
  LiveMessage(v-else-if="state === 'loading'" visible text="Verifying spatial release and content digests…")
  template(v-else-if="workspace && fieldDescriptor && localSpace && lod")
    Facts(:items="release")
    .sidebar.sidebar--end
      .stack.stack--tight
        TissueScene(:cells="cells" :space="localSpace" :snapshot="snapshot" :field="field" :selected-bin="selectedBin" :level="lod.level" @select-bin="emit('selectBin', $event)" @unavailable="sceneFallback = $event")
        Notice(v-if="sceneFallback" tone="warning" role="status" title="3D tissue view unavailable")
          p {{ sceneFallback }} The complete numeric table and controls remain active.
      Card(flat aria-label="Selected lobule bin details")
        p.eyebrow Shared selection
        h4 Bin {{ selectedBin + 1 }} · {{ snapshot.timeHours }} h
        p.muted Portal-to-central position {{ selectedBin + 1 }} of 12. Field {{ field }} is {{ fixed(snapshot[field][selectedBin], 4) }} model-unit.
        Facts(:items="selectedValues")
    Card(flat aria-labelledby="spatial-encoding-title")
      h4#spatial-encoding-title Encoding and data policy
      p.muted Color: {{ field }} scaled linearly from {{ fixed(encoding.domain[0], 4) }} to {{ fixed(encoding.domain[1], 4) }}; selected ratio {{ fixed(encoding.selected.ratio, 3, '') }}.
      p.muted Portal is bin 1; central is bin 12. No spatial interpolation is applied to APAP run bins.
      p.muted Release field descriptor: {{ fieldDescriptor.interpolation }} interpolation; missing value {{ fieldDescriptor.missing_value_policy.mode }} at sentinel {{ fieldDescriptor.missing_value_policy.sentinel }}.
      p.muted LOD {{ lod.level }} · {{ lod.dimensions.join('×') }} · loaded {{ lod.content_id }} only for this viewport.
      p.muted {{ fieldDescriptor.uncertainty.kind }} means byte-exact synthetic fixture values, not zero biological uncertainty.
    Toolbar.spatial-bin-controls(label="Select portal-to-central lobule bin without WebGL")
      button.button.button--secondary(v-for="bin in 12" :key="bin" type="button" :aria-pressed="selectedBin === bin - 1" @click="emit('selectBin', bin - 1)") Bin {{ bin }}
</template>
