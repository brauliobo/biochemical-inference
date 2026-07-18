<script setup>
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

<template>
  <section class="registration-workbench" aria-labelledby="registration-title">
    <header class="registration-header">
      <div>
        <p class="kicker">14 · Registration evidence</p>
        <h2 id="registration-title">Learn2Reg MR–CT prealigned pair</h2>
        <p>A measured, source-preprocessed human pair used only to characterize and exercise a directed registration contract. No patient-specific, diagnostic, HRA, lobule, mouse-to-human, or DigiMouse mapping is asserted.</p>
      </div>
      <span class="status-chip" :class="status?.state === 'ready' ? 'ready' : status?.state ?? state" aria-live="polite">{{ status?.state ?? state }}</span>
    </header>

    <div class="scope-warning" role="note">
      <strong>Goal 14 remains active</strong>
      <p>This CT-to-MR identity is valid only between Learn2Reg pair 0001’s already prealigned output grids. It does not connect the DigiMouse atlas, synthetic lobule geometry, or any other subject.</p>
    </div>

    <div v-if="message" class="alert error" role="alert">
      <strong>Registration remains bounded or unavailable</strong>
      <p>{{ message }}</p>
      <p>No approximate transform, alternate subject, or unchecked coordinate is substituted.</p>
    </div>

    <div class="registration-state">
      <div>
        <strong>{{ ready ? 'Verified local registration ready' : status?.state === 'empty' ? 'Explicit synchronization required' : 'Registration verification unavailable' }}</strong>
        <span>{{ status?.cachedChunks ?? 0 }} / {{ status?.totalChunks ?? 304 }} chunks cached · residual overlap {{ status?.residualOverlapRecomputed ? 'recomputed' : 'pending' }} · offline {{ status?.offlineComplete ? 'complete' : 'incomplete' }}</span>
      </div>
      <button v-if="status?.state === 'empty'" type="button" :disabled="busy" data-testid="spatial-registration-sync" @click="synchronize">{{ state === 'syncing' ? 'Verifying metadata…' : 'Synchronize signed registration' }}</button>
      <button v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="initialize">Reload failed status</button>
    </div>

    <details v-if="discovery" class="registration-pins">
      <summary>Independent release, trust, manifest, and source pins</summary>
      <dl>
        <div><dt>Release</dt><dd>{{ discovery.pins.releaseId }}<code>{{ discovery.pins.releaseDigest }}</code></dd></div>
        <div><dt>Trust / catalog</dt><dd><code>{{ discovery.pins.trustDigest }}</code><code>{{ discovery.pins.catalogDigest }}</code></dd></div>
        <div><dt>Manifest / envelope</dt><dd><code>{{ discovery.pins.manifestDigest }}</code><code>{{ discovery.pins.envelopeDigest }}</code></dd></div>
        <div><dt>Source package</dt><dd><code>{{ discovery.pins.sourcePackageDigest }}</code></dd></div>
      </dl>
    </details>

    <template v-if="ready && workspace">
      <div class="registration-facts" data-testid="spatial-registration-summary">
        <article><span>pair</span><strong>MR T1w fixed · CT moving</strong><p>{{ dataset.id }} · human · one paired subject · age, sex, and disease state unreported.</p></article>
        <article><span>materialized transform</span><strong>Identity affine on equal sforms</strong><p>The source supplies prealigned arrays and an upstream deeds-linear statement, not original affine parameters or a deformation field.</p></article>
        <article><span>evaluation ROI</span><strong>{{ registration.evaluation_roi.voxel_count.toLocaleString() }} voxels</strong><p>Repository-derived MR-mask ∩ CT-mask for residual metrics only · XYZ bounds {{ registration.evaluation_roi.bounds_xyz_inclusive[0].join(', ') }} through {{ registration.evaluation_roi.bounds_xyz_inclusive[1].join(', ') }}.</p></article>
      </div>

      <section class="registration-panel" aria-labelledby="spaces-title">
        <div class="panel-heading"><div><p class="kicker">Directed spaces</p><h3 id="spaces-title">Exact post-prealignment coordinate contract</h3></div><span>XYZ millimeters · 2 mm isotropic</span></div>
        <div class="table-scroll">
          <table>
            <caption>Source and target spaces and all five release arrays</caption>
            <thead><tr><th scope="col">Identity</th><th scope="col">Role / modality</th><th scope="col">Shape</th><th scope="col">Spacing</th><th scope="col">Bound space / index transform</th></tr></thead>
            <tbody>
              <tr v-for="space in spaces" :key="space.id"><th scope="row"><code>{{ space.id }}</code></th><td>coordinate space · {{ space.modality }}</td><td>{{ shape(space.shape_xyz) }} XYZ</td><td>{{ shape(space.spacing_xyz) }} mm</td><td>XYZ index matrix declared</td></tr>
              <tr v-for="array in arrays" :key="array.id"><th scope="row"><code>{{ array.id }}</code></th><td>{{ array.kind }} · {{ array.modality }}</td><td>{{ shape(array.shape_zyx) }} ZYX</td><td>{{ shape(array.spacing_mm_zyx) }} mm</td><td><code>{{ array.space_id }}</code><br>{{ array.index_axis_order.join('') }} → XYZ · translation {{ array.index_zyx_to_space_xyz_mm.slice(0, 3).map(row => row[3]).join(', ') }} mm</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="evidence-layout">
        <section class="registration-panel" aria-labelledby="overlap-title">
          <div class="panel-heading"><div><p class="kicker">Recomputed residual overlap</p><h3 id="overlap-title">Evaluation-ROI source-label comparison</h3></div><button type="button" :disabled="busy" data-testid="spatial-registration-residual-overlap" @click="recomputeResidualOverlap">{{ state === 'recomputing-overlap' ? 'Checking 288 chunks…' : status.residualOverlapRecomputed ? 'Recompute again' : 'Recompute residual overlap' }}</button></div>
          <p>Dice and centroid distance are recomputed inside the repository-derived evaluation ROI. They describe residual label overlap and are not independent registration-quality validation or ground truth.</p>
          <div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Anatomy</th><th scope="col">Status</th><th scope="col">Dice</th><th scope="col">Centroid mm</th><th scope="col">MR / CT voxels</th></tr></thead>
              <tbody><tr v-for="metric in metrics" :key="metric.label"><th scope="row">{{ metric.anatomy }}</th><td>{{ metric.status }}</td><td>{{ metric.dice == null ? 'not evaluable' : metric.dice.toFixed(6) }}</td><td>{{ metric.centroid_distance_mm == null ? 'not evaluable' : metric.centroid_distance_mm.toFixed(3) }}</td><td>{{ metric.fixed_mr_voxels.toLocaleString() }} / {{ metric.moving_ct_voxels.toLocaleString() }}</td></tr></tbody>
            </table>
          </div>
        </section>

        <section class="registration-panel transform-panel" aria-labelledby="transform-title">
          <div class="panel-heading"><div><p class="kicker">Bounded transform intent</p><h3 id="transform-title">Verify one grid coordinate</h3></div><button type="button" :disabled="busy" data-testid="spatial-registration-reverse" @click="reverseDirection">Reverse</button></div>
          <p>Any coordinate inside the selected source-space extent can be transformed. Evaluation-ROI membership is reported separately and never determines transform validity. The inverse is exact because the materialized affine is identity.</p>
          <form @submit.prevent="transformPoint">
            <label>Source<input :value="shortSpace(sourceSpaceId)" readonly></label>
            <label>Target<input :value="shortSpace(targetSpaceId)" readonly></label>
            <label v-for="(value, axis) in point" :key="axis">{{ ['X', 'Y', 'Z'][axis] }} mm<input v-model.number="point[axis]" type="number" min="0" :max="axis === 1 ? 318 : 382" step="any"></label>
            <button type="submit" :disabled="busy" data-testid="spatial-registration-transform">{{ state === 'transforming' ? 'Applying affine…' : 'Apply bounded transform' }}</button>
          </form>
          <dl v-if="transformed" class="transform-result" data-testid="spatial-registration-transform-result">
            <div><dt>Direction</dt><dd>{{ transformed.direction }}</dd></div>
            <div><dt>Input XYZ mm</dt><dd>{{ transformed.inputPointXyzMm.join(', ') }}</dd></div>
            <div><dt>Output XYZ mm</dt><dd>{{ transformed.outputPointXyzMm.join(', ') }}</dd></div>
            <div><dt>Evaluation ROI</dt><dd>{{ transformed.evaluationRoiMembership }} (metric scope only)</dd></div>
          </dl>
        </section>
      </div>

      <section class="registration-panel chunk-panel" aria-labelledby="registration-chunk-title">
        <div><p class="kicker">Manifest-owned bytes</p><h3 id="registration-chunk-title">Evaluation-ROI chunk inventory</h3><p>{{ inventory.length }} descriptors are visible without loading chunk bytes. Requesting one cell verifies encoded and decoded hashes plus release and rights headers.</p></div>
        <div class="chunk-actions">
          <button type="button" :disabled="busy || !inventory[0]" data-testid="spatial-registration-chunk" @click="requestChunk(inventory[0])">{{ state === 'loading-chunk' ? 'Verifying chunk…' : 'Verify first evaluation-ROI chunk' }}</button>
          <p v-if="selectedChunk"><strong>Verified:</strong> {{ selectedChunk.descriptor.path }} · {{ selectedChunk.encodedBytes }} / {{ selectedChunk.decodedBytes }} bytes · {{ selectedChunk.cacheSource }}</p>
        </div>
      </section>

      <section class="registration-panel offline-panel" aria-labelledby="registration-offline-title">
        <div><p class="kicker">Artifact-offline closure</p><h3 id="registration-offline-title">All 304 chunks and residual metrics</h3><p>Offline completion verifies every encoded and decoded chunk and recomputes residual overlap. Integrity replay reads local storage only.</p></div>
        <div class="offline-actions"><button type="button" :disabled="busy" data-testid="spatial-registration-complete" @click="completeOffline">{{ state === 'completing' ? 'Verifying 304 chunks…' : status.offlineComplete ? 'Reverify offline completion' : 'Complete registration offline' }}</button><button type="button" :disabled="busy" data-testid="spatial-registration-integrity" @click="checkIntegrity">{{ state === 'checking' ? 'Checking local storage…' : 'Check integrity without network' }}</button></div>
        <dl v-if="completion || integrity" class="offline-result" data-testid="spatial-registration-offline-result"><div><dt>Offline</dt><dd>{{ status.offlineComplete ? 'complete' : 'incomplete' }}</dd></div><div><dt>Verified chunks</dt><dd>{{ completion?.verifiedChunks ?? integrity?.verifiedDecodedChunks ?? 0 }}</dd></div><div><dt>Network access</dt><dd>{{ integrity?.networkAccess === false ? 'disabled' : 'not checked' }}</dd></div><div><dt>Findings</dt><dd>{{ integrity?.findings.join(' ') || 'none' }}</dd></div></dl>
      </section>

      <div class="provenance-layout">
        <section aria-labelledby="registration-rights-title">
          <p class="kicker">Rights and required attribution</p><h3 id="registration-rights-title">{{ attribution.title }}</h3>
          <p><a :href="attribution.license.url" target="_blank" rel="noreferrer">{{ attribution.license.name }}</a> permits redistribution and adaptations with attribution. <a :href="attribution.license.tcia_policy_url" target="_blank" rel="noreferrer">TCIA terms</a> prohibit identification and require downstream attribution and policy linking.</p>
          <p>{{ attribution.license.downstream_notice }}</p><p>{{ attribution.acknowledgement }}</p><p>{{ attribution.no_endorsement }}</p>
          <h4>Modification notices</h4>
          <ul data-testid="spatial-registration-modifications"><li v-for="notice in attribution.modifications" :key="notice">{{ notice }}</li></ul>
          <p data-testid="spatial-registration-software-license"><strong>Software license boundary:</strong> {{ attribution.software_license_boundary }}</p>
          <p><strong>Source package:</strong> <a :href="attribution.source.package_url" target="_blank" rel="noreferrer">{{ attribution.source.package_name }}</a> · {{ attribution.source.package_bytes.toLocaleString() }} bytes · retrieved {{ attribution.source.retrieved_at }} · report <code>{{ attribution.source.acquisition_report_sha256 }}</code></p>
          <p v-if="acquisition"><strong>Full acquisition:</strong> {{ acquisition.package_verification.observed_bytes.toLocaleString() }} bytes hashed · {{ acquisition.members.length }} range-extracted members matched.</p>
          <ul><li v-for="citation in attribution.citations" :key="citation.doi"><a :href="citation.doi_url" target="_blank" rel="noreferrer">{{ citation.citation }}</a></li></ul>
        </section>
        <section aria-labelledby="registration-limits-title">
          <p class="kicker">Derivation and limitations</p><h3 id="registration-limits-title">Source-prealigned, not recovered affine</h3>
          <p>{{ registration.derivation.source_statement }} This release derives identity only because all six selected NIfTI inputs have exactly equal dimensions, spacing, and sforms.</p>
          <ul><li v-for="item in limitations" :key="item.id">{{ item.statement }}</li></ul>
        </section>
      </div>
    </template>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<style scoped>
.registration-workbench { grid-column: 1 / -1; min-width: 0; overflow: hidden; border: 1px solid #594a68; background: #130f19; box-shadow: 0 28px 80px rgba(0, 0, 0, .34); }
.registration-header, .panel-heading, .registration-state, .chunk-panel, .offline-panel { display: flex; justify-content: space-between; align-items: flex-start; gap: 1.4rem; }
.registration-header { padding: clamp(1.3rem, 3vw, 2.6rem); border-bottom: 1px solid #43354f; background: radial-gradient(circle at 82% 12%, rgba(194, 133, 230, .17), transparent 36%), linear-gradient(130deg, #17101f, #11131d); }
.registration-header h2 { max-width: 18ch; margin: .2rem 0 .7rem; color: #f6effa; font-size: clamp(1.8rem, 4vw, 3.25rem); line-height: .98; letter-spacing: -.04em; }
.registration-header p, .registration-panel p, .provenance-layout p, .scope-warning p { max-width: 72ch; color: #c1b5c8; line-height: 1.6; }
.scope-warning { display: grid; grid-template-columns: minmax(180px, .45fr) minmax(0, 1.55fr); gap: 1rem; padding: 1rem clamp(1.3rem, 3vw, 2.6rem); border-bottom: 1px solid #6a5634; background: #241d13; color: #edd19c; }
.scope-warning p { margin: 0; color: #d1bd96; }
.registration-state { margin: 1.25rem clamp(1.3rem, 3vw, 2.6rem); padding: 1rem; border: 1px solid #4a3b57; background: #0d0b12; }
.registration-state div { display: grid; gap: .3rem; }
.registration-state span, .panel-heading span { color: #9f91a8; font-size: .78rem; }
.registration-pins { margin: 0 clamp(1.3rem, 3vw, 2.6rem) 1.5rem; border-block: 1px solid #43354f; }
.registration-pins summary { padding: .9rem 0; cursor: pointer; color: #d4b9e2; }
.registration-pins dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; background: #43354f; }
.registration-pins dl > div { min-width: 0; padding: .8rem; background: #100d15; }
.registration-pins dt { color: #a997b3; font-size: .7rem; text-transform: uppercase; letter-spacing: .08em; }
.registration-pins dd { display: grid; gap: .25rem; margin: .3rem 0 0; }
code { overflow-wrap: anywhere; color: #d5a8eb; font-size: .72rem; }
.registration-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin: 0 clamp(1.3rem, 3vw, 2.6rem) 1.5rem; background: #594a68; }
.registration-facts article { padding: 1.15rem; background: #15101b; }
.registration-facts span { color: #c899df; font: .68rem ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; }
.registration-facts strong { display: block; margin: .4rem 0; color: #fbf7fc; }
.registration-facts p { color: #bcaec4; font-size: .84rem; line-height: 1.5; }
.registration-panel, .provenance-layout { margin: 1rem clamp(1.3rem, 3vw, 2.6rem); }
.registration-panel { min-width: 0; padding: clamp(1rem, 2vw, 1.5rem); border: 1px solid #43354f; background: #100d15; }
.panel-heading h3, .registration-panel h3, .provenance-layout h3 { margin: .2rem 0 .6rem; color: #eee5f2; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 700px; border-collapse: collapse; }
caption { padding: .8rem 0; color: #9f91a8; text-align: left; }
th, td { padding: .72rem; border-top: 1px solid #3b3045; text-align: left; vertical-align: top; }
thead th { color: #c7a6d7; font-size: .7rem; text-transform: uppercase; letter-spacing: .06em; }
.evidence-layout, .provenance-layout { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.evidence-layout .registration-panel { margin-inline: 0; }
.evidence-layout { margin-inline: clamp(1.3rem, 3vw, 2.6rem); }
.transform-panel form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .7rem; }
.transform-panel label { display: grid; gap: .35rem; color: #bfaeca; font-size: .75rem; }
.transform-panel label:first-child, .transform-panel label:nth-child(2), .transform-panel button { grid-column: span 3; }
.transform-result, .offline-result { display: grid; gap: .45rem; margin-top: 1rem; }
.transform-result > div, .offline-result > div { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #3b3045; }
.transform-result dd, .offline-result dd { margin: 0; text-align: right; }
.chunk-panel, .offline-panel { align-items: center; }
.chunk-actions, .offline-actions { display: grid; gap: .6rem; min-width: 250px; }
.chunk-actions p { margin: 0; }
.offline-result { flex-basis: 100%; }
.provenance-layout section { min-width: 0; padding: 1.25rem; border-top: 3px solid #b98ad0; background: #121019; }
.provenance-layout a { color: #d6aae9; }
.provenance-layout li { margin-bottom: .55rem; color: #bcaec4; line-height: 1.45; }
button { min-height: 42px; }
@media (max-width: 900px) { .registration-facts, .evidence-layout, .provenance-layout { grid-template-columns: minmax(0, 1fr); } .chunk-panel, .offline-panel { align-items: stretch; flex-wrap: wrap; } }
@media (max-width: 560px) { .registration-header, .registration-state, .panel-heading, .chunk-panel, .offline-panel { display: grid; } .scope-warning { grid-template-columns: minmax(0, 1fr); } .registration-pins dl { grid-template-columns: minmax(0, 1fr); } .transform-panel form { grid-template-columns: minmax(0, 1fr); } .transform-panel label:first-child, .transform-panel label:nth-child(2), .transform-panel button { grid-column: auto; } .registration-state button, .chunk-actions, .chunk-actions button, .offline-actions, .offline-actions button { width: 100%; } .transform-result > div, .offline-result > div { grid-template-columns: minmax(0, 1fr); } .transform-result dd, .offline-result dd { text-align: left; } }
</style>
