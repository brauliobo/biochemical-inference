<script setup vapor>
import { computed, onMounted, ref } from 'vue'
import {
  discloseMeasuredEvaluation,
  freezeMeasuredCommitment,
  loadMeasuredDiscovery,
  loadMeasuredLineage,
  loadMeasuredPage,
  loadMeasuredStatus,
  runMeasuredCalibration,
  syncMeasured
} from '../api.js'
import { newCommitmentIntent } from '../commitment.js'
import { useMirror } from '../composables/useMirror.js'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Panel from '../ui/Panel.vue'
import SyncCard from '../ui/SyncCard.vue'
import { statusTone } from '../ui/tone.js'
import CalibrationPanel from './measured/CalibrationPanel.vue'
import DisclosurePanel from './measured/DisclosurePanel.vue'
import FamilyCards from './measured/FamilyCards.vue'
import RecordsPanel from './measured/RecordsPanel.vue'

const CALIBRATION_GROUPS = Object.freeze(['dose-0', 'dose-150', 'dose-1500', 'dose-2000', 'dose-50'].map((dose) => `group:cebs0004:${dose}`))
const LINEAGE_EXAMPLE = 'measurement:cebs0004:0113:h24:alt'

const families = ref([])
const partitions = ref([])
const measurements = ref()
const missingness = ref([])
const lineage = ref()
const calibration = ref()
const freezeIntent = ref()
const commitment = ref()
const disclosure = ref()
const cacheControl = ref('')

const mirror = useMirror({
  api: {
    discovery: (signal) => loadMeasuredDiscovery(signal),
    status: (signal) => loadMeasuredStatus(signal),
    sync: (signal) => syncMeasured(signal)
  },
  isReady: (status) => status?.state === 'ready',
  // Every collection appears together, never half loaded.
  loadLocal: async ({ signal, fresh }) => {
    const [familyPage, partitionPage, measurementPage, missingPage] = fresh(await Promise.all([
      loadMeasuredPage('families', { limit: 100 }, signal),
      loadMeasuredPage('partitions', { limit: 100 }, signal),
      loadMeasuredPage('measurements', { role: 'calibration', limit: 10 }, signal),
      loadMeasuredPage('missingness', { role: 'calibration', limit: 100 }, signal)
    ]))
    families.value = familyPage.items
    partitions.value = partitionPage.items
    measurements.value = measurementPage
    missingness.value = missingPage.items
  },
  text: {
    load: 'Measured commons could not be loaded.',
    sync: 'Measured synchronization failed.',
    synced: 'Measured commons synchronization completed and local integrity passed.'
  }
})
const { flow, discovery, status, ready } = mirror
const { state, message, announcement, busy } = flow

const statusWord = computed(() => (state.value === 'idle' ? status.value?.state ?? state.value : state.value))
const heldoutPartition = computed(() => partitions.value.find((item) => item.role === 'external-held-out'))
const canFreeze = computed(() => Boolean(heldoutPartition.value) && Boolean(calibration.value))
const pins = computed(() => [
  { label: 'Release digest', value: discovery.value?.pins.releaseDigest, mono: true },
  { label: 'Catalog', value: discovery.value?.pins.catalogDigest, mono: true },
  { label: 'Retired signer', value: `${discovery.value?.pins.signerKeyId} verified at signed time` }
])

const nextMeasurements = () => {
  const cursor = measurements.value?.nextCursor
  if (!cursor) return undefined
  return flow.step('paging', async ({ signal, fresh }) => fresh(await loadMeasuredPage('measurements', { role: 'calibration', limit: 10, cursor }, signal)), {
    done: (page) => {
      measurements.value = page
      return 'idle'
    },
    announce: (page) => `Loaded the next measured page beginning with ${page.items[0]?.id}.`,
    failure: 'Measured page failed.'
  })
}

const inspectLineage = () => flow.step('inspecting', async ({ signal, fresh }) => fresh(await loadMeasuredLineage(LINEAGE_EXAMPLE, signal)), {
  done: (loaded) => {
    lineage.value = loaded
    return 'idle'
  },
  announce: 'Complete selected measurement lineage loaded from the local mirror.',
  failure: 'Measured lineage failed.'
})

const calibrate = () => flow.step('calibrating', async ({ signal, fresh }) => fresh(await runMeasuredCalibration({
  familyId: 'family:cebs:study-c55801c',
  groupIds: CALIBRATION_GROUPS,
  observableId: 'observable:cebs:alt',
  partitionId: 'partition:calibration:cebs-c55801c',
  studyId: 'study:cebs:002-01586-0004-0000-6',
  timeUnit: 'h',
  timeValue: '24'
}, signal)), {
  done: (result) => {
    calibration.value = result
    return 'idle'
  },
  announce: (result) => `Calibration analysis completed as ${result.status}.`,
  failure: 'Calibration analysis failed.'
})

function freeze() {
  if (!canFreeze.value) return undefined
  freezeIntent.value ??= newCommitmentIntent({ calibrationArtifactDigest: calibration.value.artifactDigest, targetPartitionId: heldoutPartition.value.id })
  return flow.step('freezing', async ({ signal, fresh }) => fresh(await freezeMeasuredCommitment(freezeIntent.value, signal)), {
    done: (result) => {
      commitment.value = result.value
      cacheControl.value = result.cacheControl
      return 'idle'
    },
    announce: 'Consumer commitment frozen. Heldout values remain undisclosed.',
    failure: 'Commitment freeze failed.'
  })
}

const disclose = () => commitment.value && flow.step('disclosing', async ({ signal, fresh }) => fresh(await discloseMeasuredEvaluation({ commitmentDigest: commitment.value.receipt.commitment_digest }, signal)), {
  done: (result) => {
    disclosure.value = result.value
    cacheControl.value = result.cacheControl
    return 'idle'
  },
  announce: (result) => `Explicit disclosure returned ${result.value.items.length} heldout GSH values.`,
  failure: 'Heldout disclosure failed.'
})

onMounted(mirror.initialize)
</script>

<template lang="pug">
Panel.measured-workbench(title="Qualified observations and isolated evaluation" title-id="measured-title" eyebrow="10 · Measured commons" :status="statusWord" :tone="statusTone(statusWord)")
  ErrorNotice(v-if="message" title="Measured workflow stopped" :message="message")
  p.muted Measured values, derived normalizations, and fitted outputs retain separate labels. Local read routes never fall back upstream.
  SyncCard(always-sync :status="status" :ready="ready" :busy="busy" :syncing="state === 'syncing'" ready-title="Verified local mirror ready" unavailable-title="Explicit synchronization required" sync-label="Sync measured commons" syncing-label="Verifying all pages…" sync-testid="measured-sync" @sync="mirror.synchronize")
    p(v-if="status?.release") {{ status.release.id }} · {{ status.integrity }}
    p(v-else) Signed metadata and non-heldout records are absent locally.

  template(v-if="ready")
    Facts(:items="pins")
    FamilyCards(:families="families")
    RecordsPanel(:measurements="measurements" :missingness="missingness" :lineage="lineage" :busy="busy" @next="nextMeasurements" @lineage="inspectLineage")
    CalibrationPanel(:calibration="calibration" :busy="busy" @run="calibrate")
    DisclosurePanel(:calibration="calibration" :commitment="commitment" :disclosure="disclosure" :cache-control="cacheControl" :can-freeze="canFreeze" :busy="busy" @freeze="freeze" @disclose="disclose")
  LiveMessage(:text="announcement")
</template>
