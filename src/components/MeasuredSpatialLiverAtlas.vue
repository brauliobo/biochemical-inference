<script setup vapor>
import { computed, onMounted, ref, watch } from 'vue'
import {
  completeMeasuredSpatialOffline,
  loadMeasuredSpatialChunk,
  loadMeasuredSpatialChunkInventory,
  loadMeasuredSpatialDiscovery,
  loadMeasuredSpatialStatus,
  loadMeasuredSpatialWorkspace,
  syncMeasuredSpatial,
  verifyMeasuredSpatialIntegrity
} from '../api.js'
import { useMirror } from '../composables/useMirror.js'
import Disclosure from '../ui/Disclosure.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import SyncCard from '../ui/SyncCard.vue'
import { statusTone } from '../ui/tone.js'
import AtlasRights from './measured-spatial/AtlasRights.vue'
import AtlasSummary from './measured-spatial/AtlasSummary.vue'
import ChunkBrowser from './measured-spatial/ChunkBrowser.vue'
import OfflinePanel from './measured-spatial/OfflinePanel.vue'

const records = ref()
const inventory = ref([])
const arrayId = ref('liver-mask')
const level = ref(1)
const zGrid = ref(0)
const selectedChunk = ref()

async function loadInventory({ signal, fresh }) {
  selectedChunk.value = undefined
  const loaded = fresh(await loadMeasuredSpatialChunkInventory(arrayId.value, Number(level.value), signal))
  inventory.value = loaded
  zGrid.value = loaded[0]?.grid_zyx[0] ?? 0
}

const mirror = useMirror({
  api: {
    discovery: (signal) => loadMeasuredSpatialDiscovery(signal),
    status: (signal) => loadMeasuredSpatialStatus(signal),
    sync: (signal) => syncMeasuredSpatial(signal),
    integrity: (signal) => verifyMeasuredSpatialIntegrity(signal),
    complete: (signal) => completeMeasuredSpatialOffline(signal)
  },
  // The records and their chunk inventory appear together, never half loaded.
  loadLocal: async (task) => {
    const loaded = task.fresh(await loadMeasuredSpatialWorkspace(task.signal))
    await loadInventory(task)
    records.value = loaded
  },
  reloadDiscoveryAfterSync: true,
  text: {
    load: 'The measured liver atlas could not be loaded.',
    sync: 'Measured-spatial synchronization failed.',
    synced: 'The signed measured-spatial metadata and complete 400-chunk inventory were independently verified and persisted locally.',
    integrity: 'Local measured-spatial integrity verification failed.',
    integrityDone: (checked) => `Local measured-spatial integrity is ${checked.status}; network access was disabled for this check.`,
    complete: 'Offline completion stopped because a chunk was missing, corrupt, or unavailable.',
    completed: 'All 400 manifest-owned chunks passed encoded and decoded verification for offline use.'
  }
})
const { flow, discovery, status, integrity, completion, ready } = mirror
const { state, message, announcement, busy } = flow

const statusWord = computed(() => status.value?.state ?? state.value)
const pins = computed(() => {
  const { pins: fixed } = discovery.value
  return [
    { label: 'Release', value: fixed.releaseId, code: fixed.releaseDigest },
    { label: 'Trust / catalog', code: [fixed.trustDigest, fixed.catalogDigest] },
    { label: 'Manifest / envelope', code: [fixed.manifestDigest, fixed.envelopeDigest] },
    { label: 'Metadata / inventory', code: [fixed.metadataDigest, fixed.inventoryDigest] },
    { label: 'Retired signer', value: fixed.signerKeyId, code: fixed.signerPublicKey }
  ]
})

const selectArray = () => flow.step('loading-inventory', (task) => loadInventory(task), {
  announce: () => `Selected ${arrayId.value}, level ${level.value}; no chunk bytes were requested.`,
  failure: 'The selected chunk inventory could not be loaded.'
})

const requestChunk = (descriptor) => {
  selectedChunk.value = undefined
  return flow.step('loading-chunk', async ({ signal, fresh }) => {
    selectedChunk.value = fresh(await loadMeasuredSpatialChunk(descriptor, signal))
    status.value = fresh(await loadMeasuredSpatialStatus(signal))
  }, { announce: `Verified selected chunk ${descriptor.grid_zyx.join('.')}; no other viewport chunk was requested.`, failure: 'The selected measured chunk is missing, corrupt, or unavailable from the network.' })
}

watch([arrayId, level], () => {
  if (records.value) selectArray()
})
onMounted(mirror.initialize)
</script>

<template lang="pug">
Panel.measured-atlas(title="DigiMouse liver label atlas" title-id="measured-atlas-title" eyebrow="14 · Measured spatial atlas" lede="A bounded measured-derived whole-body label volume and exact binary liver segmentation. Semantic and tabular access works without WebGL." :status="statusWord" :tone="statusTone(statusWord)")
  Notice(tone="warning" role="note" aria-label="Measured atlas registration boundary" title="Whole-body atlas to lobule registration unavailable")
    p No transform, inverse, landmarks, quality metrics, uncertainty, or valid region exists for #[code SPACE:MOUSE-LOBULE-LOCAL]. Goal 7 geometry is never substituted.

  ErrorNotice(v-if="message" title="Measured atlas remains unavailable" :message="message")
    p No synthetic geometry, alternate level, or generated preview is shown in its place.

  SyncCard(:status="status" :ready="ready" :busy="busy" :syncing="state === 'syncing'" ready-title="Verified local metadata ready" empty-title="Explicit metadata synchronization required" unavailable-title="Measured atlas verification unavailable" sync-label="Synchronize signed atlas" syncing-label="Verifying metadata…" sync-testid="measured-spatial-sync" @sync="mirror.synchronize" @reload="mirror.initialize")
    p.muted {{ status?.cachedChunks ?? 0 }} / {{ status?.totalChunks ?? 400 }} chunks cached · offline {{ status?.offlineComplete ? 'complete' : 'incomplete' }}

  Disclosure(v-if="discovery" summary="Independent publication pins")
    Facts(size="wide" :items="pins")

  template(v-if="ready && records")
    AtlasSummary(:records="records")
    ChunkBrowser(v-model:arrayId="arrayId" v-model:level="level" v-model:zGrid="zGrid" :inventory="inventory" :selected-chunk="selectedChunk" :busy="busy" @request="requestChunk")
    OfflinePanel(:status="status" :completion="completion" :integrity="integrity" :state="state" :busy="busy" @complete="mirror.completeOffline" @check="mirror.checkIntegrity")
    AtlasRights(:records="records")
  LiveMessage(:text="announcement")
</template>
