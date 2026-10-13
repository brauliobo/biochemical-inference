<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
import DataTable from '../ui/DataTable.vue'
import Field from '../ui/Field.vue'
import Panel from '../ui/Panel.vue'

const TONES = { ready: 'success', failed: 'danger' }
const statusTone = (value) => TONES[value] ?? ''

const CT_SPACE = 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED'
const MR_SPACE = 'SPACE:L2R-ABDOMEN-MRCT-0001-MR-PREALIGNED'

const discovery = ref()
const status = ref()
const workspace = ref()
const inventory = ref([])
const selectedChunk = ref()
const residualOverlap = ref()
const transformed = ref()
const completion = ref()
const integrity = ref()
const sourceSpaceId = ref(CT_SPACE)
const targetSpaceId = ref(MR_SPACE)
const point = ref([192, 160, 192])
const state = ref('loading')
const message = ref('')
const announcement = ref('')
let controller

const busy = computed(() => !['idle', 'failed'].includes(state.value))
const ready = computed(() => status.value?.state === 'ready' && status.value?.integrity === 'valid')
const dataset = computed(() => workspace.value?.datasets?.[0])
const spaces = computed(() => workspace.value?.spaces ?? [])
const arrays = computed(() => workspace.value?.arrays ?? [])
const registration = computed(() => workspace.value?.registrations?.[0])
const metrics = computed(() => residualOverlap.value?.metrics ?? workspace.value?.['residual-overlap'] ?? [])
const acquisition = computed(() => workspace.value?.acquisitions?.[0])
const attribution = computed(() => workspace.value?.attribution?.[0])
const limitations = computed(() => workspace.value?.limitations ?? [])

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function fail(error, fallback) {
  if (isAbort(error)) return
  state.value = 'failed'
  message.value = error instanceof Error ? error.message : fallback
}

function shape(values) {
  return values?.join(' × ') ?? 'unavailable'
}

function shortSpace(value) {
  return value?.includes('-CT-') ? 'CT prealigned' : value?.includes('-MR-') ? 'MR prealigned' : value
}

async function loadLocal(signal = controller.signal) {
  workspace.value = await loadSpatialRegistrationWorkspace(signal)
  inventory.value = await loadSpatialRegistrationChunkInventory('evaluation-roi', signal)
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    const [loadedDiscovery, loadedStatus] = await Promise.all([
      loadSpatialRegistrationDiscovery(controller.signal),
      loadSpatialRegistrationStatus(controller.signal)
    ])
    discovery.value = loadedDiscovery
    status.value = loadedStatus
    if (loadedStatus.state === 'ready' && loadedStatus.integrity === 'valid') await loadLocal(controller.signal)
    state.value = 'idle'
  } catch (error) {
    fail(error, 'The bounded spatial-registration release could not be loaded.')
  }
}

async function synchronize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'syncing'
  message.value = ''
  try {
    status.value = await syncSpatialRegistration(controller.signal)
    await loadLocal(controller.signal)
    discovery.value = await loadSpatialRegistrationDiscovery(controller.signal)
    state.value = 'idle'
    announcement.value = 'The signed registration metadata and all 304 chunk descriptors were independently verified.'
  } catch (error) {
    fail(error, 'Spatial-registration synchronization failed.')
  }
}

async function requestChunk(descriptor) {
  state.value = 'loading-chunk'
  message.value = ''
  selectedChunk.value = undefined
  try {
    selectedChunk.value = await loadSpatialRegistrationChunk(descriptor, controller.signal)
    status.value = await loadSpatialRegistrationStatus(controller.signal)
    state.value = 'idle'
    announcement.value = `Verified evaluation-ROI chunk ${descriptor.grid_zyx.join('.')}.`
  } catch (error) {
    fail(error, 'The selected evaluation-ROI chunk failed verification.')
  }
}

async function recomputeResidualOverlap() {
  state.value = 'recomputing-overlap'
  message.value = ''
  try {
    residualOverlap.value = await recomputeSpatialRegistrationResidualOverlap(controller.signal)
    status.value = await loadSpatialRegistrationStatus(controller.signal)
    state.value = 'idle'
    announcement.value = 'Residual overlap was recomputed from 288 verified label and evaluation-ROI chunks.'
  } catch (error) {
    fail(error, 'Residual-overlap recomputation failed.')
  }
}

async function transformPoint() {
  state.value = 'transforming'
  message.value = ''
  transformed.value = undefined
  try {
    transformed.value = await transformSpatialRegistrationPoint({ sourceSpaceId: sourceSpaceId.value, targetSpaceId: targetSpaceId.value, pointXyzMm: point.value.map(Number) }, controller.signal)
    state.value = 'idle'
    announcement.value = `The identity affine was applied; evaluation-ROI membership is ${transformed.value.evaluationRoiMembership}.`
  } catch (error) {
    fail(error, 'The point is incompatible with the bounded transform.')
  }
}

function reverseDirection() {
  const source = sourceSpaceId.value
  sourceSpaceId.value = targetSpaceId.value
  targetSpaceId.value = source
  transformed.value = undefined
}

async function completeOffline() {
  state.value = 'completing'
  message.value = ''
  try {
    completion.value = await completeSpatialRegistrationOffline(controller.signal)
    status.value = await loadSpatialRegistrationStatus(controller.signal)
    state.value = 'idle'
    announcement.value = 'All 304 registration chunks passed encoded and decoded verification for offline replay.'
  } catch (error) {
    fail(error, 'Registration offline completion stopped on missing or corrupt content.')
  }
}

async function checkIntegrity() {
  state.value = 'checking'
  message.value = ''
  try {
    integrity.value = await verifySpatialRegistrationIntegrity(controller.signal)
    status.value = await loadSpatialRegistrationStatus(controller.signal)
    state.value = integrity.value.status === 'failed' ? 'failed' : 'idle'
    if (integrity.value.status === 'failed') message.value = integrity.value.findings.join(' ')
    announcement.value = `Local registration integrity is ${integrity.value.status}; network access was disabled.`
  } catch (error) {
    fail(error, 'Local registration integrity verification failed.')
  }
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
Panel(title-id="registration-title" title="Learn2Reg MR–CT prealigned pair" eyebrow="14 · Registration evidence" :status="status?.state ?? state" :tone="statusTone(status?.state ?? state)")
  p A measured, source-preprocessed human pair used only to characterize and exercise a directed registration contract. No patient-specific, diagnostic, HRA, lobule, mouse-to-human, or DigiMouse mapping is asserted.
  .notice.notice--warning.stack.stack--tight(role="note")
    strong Goal 14 remains active
    p This CT-to-MR identity is valid only between Learn2Reg pair 0001’s already prealigned output grids. It does not connect the DigiMouse atlas, synthetic lobule geometry, or any other subject.
  .notice.notice--danger.stack.stack--tight(v-if="message" role="alert")
    strong Registration remains bounded or unavailable
    p {{ message }}
    p No approximate transform, alternate subject, or unchecked coordinate is substituted.
  p.visually-hidden(role="status") {{ announcement }}

  .card.repel
    .stack.stack--tight
      strong {{ ready ? 'Verified local registration ready' : status?.state === 'empty' ? 'Explicit synchronization required' : 'Registration verification unavailable' }}
      p.muted {{ status?.cachedChunks ?? 0 }} / {{ status?.totalChunks ?? 304 }} chunks cached · residual overlap {{ status?.residualOverlapRecomputed ? 'recomputed' : 'pending' }} · offline {{ status?.offlineComplete ? 'complete' : 'incomplete' }}
    button.button(v-if="status?.state === 'empty'" type="button" :disabled="busy" data-testid="spatial-registration-sync" @click="synchronize") {{ state === 'syncing' ? 'Verifying metadata…' : 'Synchronize signed registration' }}
    button.button.button--secondary(v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="initialize") Reload failed status

  details.card.stack(v-if="discovery")
    summary Independent release, trust, manifest, and source pins
    dl.facts
      div
        dt Release
        dd
          | {{ discovery.pins.releaseId }}
          code {{ discovery.pins.releaseDigest }}
      div
        dt Trust / catalog
        dd
          code {{ discovery.pins.trustDigest }}
          code {{ discovery.pins.catalogDigest }}
      div
        dt Manifest / envelope
        dd
          code {{ discovery.pins.manifestDigest }}
          code {{ discovery.pins.envelopeDigest }}
      div
        dt Source package
        dd
          code {{ discovery.pins.sourcePackageDigest }}

  template(v-if="ready && workspace")
    dl.facts(data-testid="spatial-registration-summary")
      div
        dt pair
        dd
          strong MR T1w fixed · CT moving
          p {{ dataset.id }} · human · one paired subject · age, sex, and disease state unreported.
      div
        dt materialized transform
        dd
          strong Identity affine on equal sforms
          p The source supplies prealigned arrays and an upstream deeds-linear statement, not original affine parameters or a deformation field.
      div
        dt evaluation ROI
        dd
          strong {{ registration.evaluation_roi.voxel_count.toLocaleString() }} voxels
          p Repository-derived MR-mask ∩ CT-mask for residual metrics only · XYZ bounds {{ registration.evaluation_roi.bounds_xyz_inclusive[0].join(', ') }} through {{ registration.evaluation_roi.bounds_xyz_inclusive[1].join(', ') }}.

    Panel(title-id="spaces-title" title="Exact post-prealignment coordinate contract" eyebrow="Directed spaces" :level="3")
      template(v-slot:actions)
        span.muted XYZ millimeters · 2 mm isotropic
      DataTable(caption="Source and target spaces and all five release arrays" :columns="['Identity', 'Role / modality', 'Shape', 'Spacing', 'Bound space / index transform']")
        tr(v-for="space in spaces" :key="space.id")
          th(scope="row")
            code {{ space.id }}
          td coordinate space · {{ space.modality }}
          td {{ shape(space.shape_xyz) }} XYZ
          td {{ shape(space.spacing_xyz) }} mm
          td XYZ index matrix declared
        tr(v-for="array in arrays" :key="array.id")
          th(scope="row")
            code {{ array.id }}
          td {{ array.kind }} · {{ array.modality }}
          td {{ shape(array.shape_zyx) }} ZYX
          td {{ shape(array.spacing_mm_zyx) }} mm
          td
            code {{ array.space_id }}
            p {{ array.index_axis_order.join('') }} → XYZ · translation {{ array.index_zyx_to_space_xyz_mm.slice(0, 3).map(row => row[3]).join(', ') }} mm

    Panel(title-id="overlap-title" title="Evaluation-ROI source-label comparison" eyebrow="Recomputed residual overlap" :level="3")
      template(v-slot:actions)
        button.button(type="button" :disabled="busy" data-testid="spatial-registration-residual-overlap" @click="recomputeResidualOverlap") {{ state === 'recomputing-overlap' ? 'Checking 288 chunks…' : status.residualOverlapRecomputed ? 'Recompute again' : 'Recompute residual overlap' }}
      p Dice and centroid distance are recomputed inside the repository-derived evaluation ROI. They describe residual label overlap and are not independent registration-quality validation or ground truth.
      DataTable(caption="Residual label overlap per anatomy" :columns="['Anatomy', 'Status', 'Dice', 'Centroid mm', 'MR / CT voxels']")
        tr(v-for="metric in metrics" :key="metric.label")
          th(scope="row") {{ metric.anatomy }}
          td {{ metric.status }}
          td {{ metric.dice == null ? 'not evaluable' : metric.dice.toFixed(6) }}
          td {{ metric.centroid_distance_mm == null ? 'not evaluable' : metric.centroid_distance_mm.toFixed(3) }}
          td {{ metric.fixed_mr_voxels.toLocaleString() }} / {{ metric.moving_ct_voxels.toLocaleString() }}

    Panel(title-id="transform-title" title="Verify one grid coordinate" eyebrow="Bounded transform intent" :level="3")
      template(v-slot:actions)
        button.button.button--secondary(type="button" :disabled="busy" data-testid="spatial-registration-reverse" @click="reverseDirection") Reverse
      p Any coordinate inside the selected source-space extent can be transformed. Evaluation-ROI membership is reported separately and never determines transform validity. The inverse is exact because the materialized affine is identity.
      form.stack(@submit.prevent="transformPoint")
        .grid
          Field(id="registration-source" label="Source")
            input#registration-source(:value="shortSpace(sourceSpaceId)" readonly)
          Field(id="registration-target" label="Target")
            input#registration-target(:value="shortSpace(targetSpaceId)" readonly)
        .grid
          Field(id="registration-x" label="X mm")
            input#registration-x(v-model.number="point[0]" type="number" min="0" max="382" step="any")
          Field(id="registration-y" label="Y mm")
            input#registration-y(v-model.number="point[1]" type="number" min="0" max="318" step="any")
          Field(id="registration-z" label="Z mm")
            input#registration-z(v-model.number="point[2]" type="number" min="0" max="382" step="any")
        div
          button.button(type="submit" :disabled="busy" data-testid="spatial-registration-transform") {{ state === 'transforming' ? 'Applying affine…' : 'Apply bounded transform' }}
      dl.facts.facts--rows(v-if="transformed" data-testid="spatial-registration-transform-result")
        div
          dt Direction
          dd {{ transformed.direction }}
        div
          dt Input XYZ mm
          dd {{ transformed.inputPointXyzMm.join(', ') }}
        div
          dt Output XYZ mm
          dd {{ transformed.outputPointXyzMm.join(', ') }}
        div
          dt Evaluation ROI
          dd {{ transformed.evaluationRoiMembership }} (metric scope only)

    Panel(title-id="registration-chunk-title" title="Evaluation-ROI chunk inventory" eyebrow="Manifest-owned bytes" :level="3")
      p {{ inventory.length }} descriptors are visible without loading chunk bytes. Requesting one cell verifies encoded and decoded hashes plus release and rights headers.
      div
        button.button(type="button" :disabled="busy || !inventory[0]" data-testid="spatial-registration-chunk" @click="requestChunk(inventory[0])") {{ state === 'loading-chunk' ? 'Verifying chunk…' : 'Verify first evaluation-ROI chunk' }}
      p(v-if="selectedChunk") #[strong Verified:] {{ selectedChunk.descriptor.path }} · {{ selectedChunk.encodedBytes }} / {{ selectedChunk.decodedBytes }} bytes · {{ selectedChunk.cacheSource }}

    Panel(title-id="registration-offline-title" title="All 304 chunks and residual metrics" eyebrow="Artifact-offline closure" :level="3")
      p Offline completion verifies every encoded and decoded chunk and recomputes residual overlap. Integrity replay reads local storage only.
      .cluster
        button.button(type="button" :disabled="busy" data-testid="spatial-registration-complete" @click="completeOffline") {{ state === 'completing' ? 'Verifying 304 chunks…' : status.offlineComplete ? 'Reverify offline completion' : 'Complete registration offline' }}
        button.button.button--secondary(type="button" :disabled="busy" data-testid="spatial-registration-integrity" @click="checkIntegrity") {{ state === 'checking' ? 'Checking local storage…' : 'Check integrity without network' }}
      dl.facts.facts--rows(v-if="completion || integrity" data-testid="spatial-registration-offline-result")
        div
          dt Offline
          dd {{ status.offlineComplete ? 'complete' : 'incomplete' }}
        div
          dt Verified chunks
          dd {{ completion?.verifiedChunks ?? integrity?.verifiedDecodedChunks ?? 0 }}
        div
          dt Network access
          dd {{ integrity?.networkAccess === false ? 'disabled' : 'not checked' }}
        div
          dt Findings
          dd {{ integrity?.findings.join(' ') || 'none' }}

    .grid
      Panel(title-id="registration-rights-title" :title="attribution.title" eyebrow="Rights and required attribution" :level="3")
        p #[a(:href="attribution.license.url" target="_blank" rel="noreferrer") {{ attribution.license.name }}] permits redistribution and adaptations with attribution. #[a(:href="attribution.license.tcia_policy_url" target="_blank" rel="noreferrer") TCIA terms] prohibit identification and require downstream attribution and policy linking.
        p {{ attribution.license.downstream_notice }}
        p {{ attribution.acknowledgement }}
        p {{ attribution.no_endorsement }}
        h4 Modification notices
        ul(data-testid="spatial-registration-modifications")
          li(v-for="notice in attribution.modifications" :key="notice") {{ notice }}
        p(data-testid="spatial-registration-software-license") #[strong Software license boundary:] {{ attribution.software_license_boundary }}
        p #[strong Source package:] #[a(:href="attribution.source.package_url" target="_blank" rel="noreferrer") {{ attribution.source.package_name }}] · {{ attribution.source.package_bytes.toLocaleString() }} bytes · retrieved {{ attribution.source.retrieved_at }} · report #[code {{ attribution.source.acquisition_report_sha256 }}]
        p(v-if="acquisition") #[strong Full acquisition:] {{ acquisition.package_verification.observed_bytes.toLocaleString() }} bytes hashed · {{ acquisition.members.length }} range-extracted members matched.
        ul
          li(v-for="citation in attribution.citations" :key="citation.doi")
            a(:href="citation.doi_url" target="_blank" rel="noreferrer") {{ citation.citation }}
      Panel(title-id="registration-limits-title" title="Source-prealigned, not recovered affine" eyebrow="Derivation and limitations" :level="3")
        p {{ registration.derivation.source_statement }} This release derives identity only because all six selected NIfTI inputs have exactly equal dimensions, spacing, and sforms.
        ul
          li(v-for="item in limitations" :key="item.id") {{ item.statement }}
</template>
