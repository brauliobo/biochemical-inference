<script setup vapor>
import { computed, onMounted, ref } from 'vue'
import {
  completeSpatialRegistrationOffline,
  loadSpatialRegistrationChunk,
  loadSpatialRegistrationChunkInventory,
  loadSpatialRegistrationDiscovery,
  loadSpatialRegistrationStatus,
  loadSpatialRegistrationWorkspace,
  recomputeSpatialRegistrationResidualOverlap,
  syncSpatialRegistration,
  transformSpatialRegistrationPoint,
  verifySpatialRegistrationIntegrity
} from '../api.js'
import { useMirror } from '../composables/useMirror.js'
import Disclosure from '../ui/Disclosure.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Fact from '../ui/Fact.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import SyncCard from '../ui/SyncCard.vue'
import { list } from '../ui/format.js'
import { statusTone } from '../ui/tone.js'
import OverlapPanel from './registration/OverlapPanel.vue'
import RegistrationRights from './registration/RegistrationRights.vue'
import SpacesPanel from './registration/SpacesPanel.vue'
import TransformPanel from './registration/TransformPanel.vue'

const CT_SPACE = 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED'
const MR_SPACE = 'SPACE:L2R-ABDOMEN-MRCT-0001-MR-PREALIGNED'

const workspace = ref()
const inventory = ref([])
const selectedChunk = ref()
const residualOverlap = ref()
const transformed = ref()
const sourceSpaceId = ref(CT_SPACE)
const targetSpaceId = ref(MR_SPACE)
const point = ref([192, 160, 192])

const mirror = useMirror({
  api: {
    discovery: (signal) => loadSpatialRegistrationDiscovery(signal),
    status: (signal) => loadSpatialRegistrationStatus(signal),
    sync: (signal) => syncSpatialRegistration(signal),
    integrity: (signal) => verifySpatialRegistrationIntegrity(signal),
    complete: (signal) => completeSpatialRegistrationOffline(signal)
  },
  // The workspace and its chunk inventory appear together, never half loaded.
  loadLocal: async ({ signal, fresh }) => {
    const loaded = fresh(await loadSpatialRegistrationWorkspace(signal))
    inventory.value = fresh(await loadSpatialRegistrationChunkInventory('evaluation-roi', signal))
    workspace.value = loaded
  },
  reloadDiscoveryAfterSync: true,
  text: {
    load: 'The bounded spatial-registration release could not be loaded.',
    sync: 'Spatial-registration synchronization failed.',
    synced: 'The signed registration metadata and all 304 chunk descriptors were independently verified.',
    integrity: 'Local registration integrity verification failed.',
    integrityDone: (checked) => `Local registration integrity is ${checked.status}; network access was disabled.`,
    complete: 'Registration offline completion stopped on missing or corrupt content.',
    completed: 'All 304 registration chunks passed encoded and decoded verification for offline replay.'
  }
})
const { flow, discovery, status, integrity, completion, ready } = mirror
const { state, message, announcement, busy } = flow

const dataset = computed(() => workspace.value.datasets[0])
const registration = computed(() => workspace.value.registrations[0])
const roi = computed(() => registration.value.evaluation_roi)
const metrics = computed(() => residualOverlap.value?.metrics ?? workspace.value?.['residual-overlap'] ?? [])
const pins = computed(() => {
  const { pins: fixed } = discovery.value
  return [
    { label: 'Release', value: fixed.releaseId, code: fixed.releaseDigest },
    { label: 'Trust / catalog', code: [fixed.trustDigest, fixed.catalogDigest] },
    { label: 'Manifest / envelope', code: [fixed.manifestDigest, fixed.envelopeDigest] },
    { label: 'Source package', code: fixed.sourcePackageDigest }
  ]
})
const offline = computed(() => [
  { label: 'Offline', value: status.value.offlineComplete ? 'complete' : 'incomplete' },
  { label: 'Verified chunks', value: String(completion.value?.verifiedChunks ?? integrity.value?.verifiedDecodedChunks ?? 0) },
  { label: 'Network access', value: integrity.value?.networkAccess === false ? 'disabled' : 'not checked' },
  { label: 'Findings', value: list(integrity.value?.findings, 'none', ' ') }
])

function requestChunk(descriptor) {
  selectedChunk.value = undefined
  return flow.step('loading-chunk', async ({ signal, fresh }) => {
    selectedChunk.value = fresh(await loadSpatialRegistrationChunk(descriptor, signal))
    status.value = fresh(await loadSpatialRegistrationStatus(signal))
  }, { announce: `Verified evaluation-ROI chunk ${descriptor.grid_zyx.join('.')}.`, failure: 'The selected evaluation-ROI chunk failed verification.' })
}

const recomputeOverlap = () => flow.step('recomputing-overlap', async ({ signal, fresh }) => {
  residualOverlap.value = fresh(await recomputeSpatialRegistrationResidualOverlap(signal))
  status.value = fresh(await loadSpatialRegistrationStatus(signal))
}, { announce: 'Residual overlap was recomputed from 288 verified label and evaluation-ROI chunks.', failure: 'Residual-overlap recomputation failed.' })

function transformPoint() {
  transformed.value = undefined
  return flow.step('transforming', async ({ signal, fresh }) => {
    transformed.value = fresh(await transformSpatialRegistrationPoint({ sourceSpaceId: sourceSpaceId.value, targetSpaceId: targetSpaceId.value, pointXyzMm: point.value.map(Number) }, signal))
  }, { announce: () => `The identity affine was applied; evaluation-ROI membership is ${transformed.value.evaluationRoiMembership}.`, failure: 'The point is incompatible with the bounded transform.' })
}

function reverseDirection() {
  const source = sourceSpaceId.value
  sourceSpaceId.value = targetSpaceId.value
  targetSpaceId.value = source
  transformed.value = undefined
}

onMounted(mirror.initialize)
</script>

<template lang="pug">
Panel(title="Learn2Reg MR–CT prealigned pair" title-id="registration-title" eyebrow="14 · Registration evidence" :status="status?.state ?? state" :tone="statusTone(status?.state ?? state)")
  p A measured, source-preprocessed human pair used only to characterize and exercise a directed registration contract. No patient-specific, diagnostic, HRA, lobule, mouse-to-human, or DigiMouse mapping is asserted.
  Notice(tone="warning" role="note" title="Goal 14 remains active")
    p This CT-to-MR identity is valid only between Learn2Reg pair 0001’s already prealigned output grids. It does not connect the DigiMouse atlas, synthetic lobule geometry, or any other subject.
  ErrorNotice(v-if="message" title="Registration remains bounded or unavailable" :message="message")
    p No approximate transform, alternate subject, or unchecked coordinate is substituted.
  LiveMessage(:text="announcement")

  SyncCard(:status="status" :ready="ready" :busy="busy" :syncing="state === 'syncing'" ready-title="Verified local registration ready" unavailable-title="Registration verification unavailable" sync-label="Synchronize signed registration" syncing-label="Verifying metadata…" sync-testid="spatial-registration-sync" @sync="mirror.synchronize" @reload="mirror.initialize")
    p.muted {{ status?.cachedChunks ?? 0 }} / {{ status?.totalChunks ?? 304 }} chunks cached · residual overlap {{ status?.residualOverlapRecomputed ? 'recomputed' : 'pending' }} · offline {{ status?.offlineComplete ? 'complete' : 'incomplete' }}

  Disclosure(v-if="discovery" summary="Independent release, trust, manifest, and source pins" card)
    Facts(:items="pins")

  template(v-if="ready && workspace")
    Facts(data-testid="spatial-registration-summary")
      Fact(label="pair")
        strong MR T1w fixed · CT moving
        p {{ dataset.id }} · human · one paired subject · age, sex, and disease state unreported.
      Fact(label="materialized transform")
        strong Identity affine on equal sforms
        p The source supplies prealigned arrays and an upstream deeds-linear statement, not original affine parameters or a deformation field.
      Fact(label="evaluation ROI")
        strong {{ roi.voxel_count.toLocaleString() }} voxels
        p Repository-derived MR-mask ∩ CT-mask for residual metrics only · XYZ bounds {{ roi.bounds_xyz_inclusive[0].join(', ') }} through {{ roi.bounds_xyz_inclusive[1].join(', ') }}.

    SpacesPanel(:spaces="workspace.spaces" :arrays="workspace.arrays")
    OverlapPanel(:metrics="metrics" :recomputed="status.residualOverlapRecomputed" :checking="state === 'recomputing-overlap'" :busy="busy" @recompute="recomputeOverlap")
    TransformPanel(v-model:point="point" :source="sourceSpaceId" :target="targetSpaceId" :transformed="transformed" :checking="state === 'transforming'" :busy="busy" @transform="transformPoint" @reverse="reverseDirection")

    Panel(title="Evaluation-ROI chunk inventory" title-id="registration-chunk-title" eyebrow="Manifest-owned bytes" :level="3")
      p {{ inventory.length }} descriptors are visible without loading chunk bytes. Requesting one cell verifies encoded and decoded hashes plus release and rights headers.
      div
        button.button(type="button" :disabled="busy || !inventory[0]" data-testid="spatial-registration-chunk" @click="requestChunk(inventory[0])") {{ state === 'loading-chunk' ? 'Verifying chunk…' : 'Verify first evaluation-ROI chunk' }}
      p(v-if="selectedChunk") #[strong Verified:] {{ selectedChunk.descriptor.path }} · {{ selectedChunk.encodedBytes }} / {{ selectedChunk.decodedBytes }} bytes · {{ selectedChunk.cacheSource }}

    Panel(title="All 304 chunks and residual metrics" title-id="registration-offline-title" eyebrow="Artifact-offline closure" :level="3")
      p Offline completion verifies every encoded and decoded chunk and recomputes residual overlap. Integrity replay reads local storage only.
      .cluster
        button.button(type="button" :disabled="busy" data-testid="spatial-registration-complete" @click="mirror.completeOffline") {{ state === 'completing' ? 'Verifying 304 chunks…' : status.offlineComplete ? 'Reverify offline completion' : 'Complete registration offline' }}
        button.button.button--secondary(type="button" :disabled="busy" data-testid="spatial-registration-integrity" @click="mirror.checkIntegrity") {{ state === 'checking' ? 'Checking local storage…' : 'Check integrity without network' }}
      Facts(v-if="completion || integrity" rows data-testid="spatial-registration-offline-result" :items="offline")

    RegistrationRights(:attribution="workspace.attribution[0]" :acquisition="workspace.acquisitions?.[0]" :registration="registration" :limitations="workspace.limitations ?? []")
</template>
