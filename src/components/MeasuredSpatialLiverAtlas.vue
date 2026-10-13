<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import Metric from './ui/Metric.vue'
import Section from './ui/Section.vue'
import Toolbar from './ui/Toolbar.vue'
import { statusTone } from './ui/tone.js'

const discovery = ref()
const status = ref()
const records = ref()
const inventory = ref([])
const arrayId = ref('liver-mask')
const level = ref(1)
const zGrid = ref(0)
const selectedChunk = ref()
const integrity = ref()
const completion = ref()
const state = ref('loading')
const message = ref('')
const announcement = ref('')
let controller
let inventoryGeneration = 0

const busy = computed(() => ['loading', 'syncing', 'loading-inventory', 'loading-chunk', 'completing', 'checking'].includes(state.value))
const ready = computed(() => status.value?.state === 'ready' && status.value?.integrity === 'valid')
const statusWord = computed(() => status.value?.state ?? state.value)
const arrays = computed(() => records.value?.arrays ?? [])
const selectedArray = computed(() => arrays.value.find((item) => item.array_id === arrayId.value && item.level === level.value))
const acquisition = computed(() => records.value?.acquisitions?.[0])
const space = computed(() => records.value?.spaces?.[0])
const registration = computed(() => records.value?.registrations?.[0])
const attribution = computed(() => records.value?.attribution?.[0])
const limitations = computed(() => records.value?.limitations ?? [])
const zPlanes = computed(() => [...new Set(inventory.value.map((item) => item.grid_zyx[0]))])
const visibleChunks = computed(() => inventory.value.filter((item) => item.grid_zyx[0] === zGrid.value).sort((left, right) => left.grid_zyx[1] - right.grid_zyx[1] || left.grid_zyx[2] - right.grid_zyx[2]))
const gridColumns = computed(() => Math.max(1, ...visibleChunks.value.map((item) => item.grid_zyx[2] + 1)))

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function fail(error, fallback) {
  if (isAbort(error)) return
  state.value = 'failed'
  message.value = error instanceof Error ? error.message : fallback
}

function shapeText(values) {
  return values?.join(' × ') ?? 'unavailable'
}

function boundsText(bounds) {
  return bounds ? `${bounds[0].join(', ')} through ${bounds[1].join(', ')}` : 'not present'
}

async function loadVerifiedLocal(signal = controller.signal) {
  records.value = await loadMeasuredSpatialWorkspace(signal)
  await loadInventory(signal)
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    const [loadedDiscovery, loadedStatus] = await Promise.all([
      loadMeasuredSpatialDiscovery(controller.signal),
      loadMeasuredSpatialStatus(controller.signal)
    ])
    discovery.value = loadedDiscovery
    status.value = loadedStatus
    if (loadedStatus.state === 'ready' && loadedStatus.integrity === 'valid') await loadVerifiedLocal(controller.signal)
    state.value = 'idle'
  } catch (error) {
    fail(error, 'The measured liver atlas could not be loaded.')
  }
}

async function synchronize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'syncing'
  message.value = ''
  try {
    status.value = await syncMeasuredSpatial(controller.signal)
    await loadVerifiedLocal(controller.signal)
    discovery.value = await loadMeasuredSpatialDiscovery(controller.signal)
    state.value = 'idle'
    announcement.value = 'The signed measured-spatial metadata and complete 400-chunk inventory were independently verified and persisted locally.'
  } catch (error) {
    fail(error, 'Measured-spatial synchronization failed.')
  }
}

async function loadInventory(signal = controller.signal) {
  if (!ready.value && !records.value) return
  const generation = ++inventoryGeneration
  state.value = 'loading-inventory'
  selectedChunk.value = undefined
  const loaded = await loadMeasuredSpatialChunkInventory(arrayId.value, Number(level.value), signal)
  if (generation !== inventoryGeneration) return
  inventory.value = loaded
  zGrid.value = loaded[0]?.grid_zyx[0] ?? 0
  state.value = 'idle'
}

async function selectArray() {
  message.value = ''
  try {
    await loadInventory()
    announcement.value = `Selected ${arrayId.value}, level ${level.value}; no chunk bytes were requested.`
  } catch (error) {
    fail(error, 'The selected chunk inventory could not be loaded.')
  }
}

async function requestChunk(descriptor) {
  state.value = 'loading-chunk'
  message.value = ''
  selectedChunk.value = undefined
  try {
    selectedChunk.value = await loadMeasuredSpatialChunk(descriptor, controller.signal)
    status.value = await loadMeasuredSpatialStatus(controller.signal)
    state.value = 'idle'
    announcement.value = `Verified selected chunk ${descriptor.grid_zyx.join('.')}; no other viewport chunk was requested.`
  } catch (error) {
    fail(error, 'The selected measured chunk is missing, corrupt, or unavailable from the network.')
  }
}

async function completeOffline() {
  state.value = 'completing'
  message.value = ''
  try {
    completion.value = await completeMeasuredSpatialOffline(controller.signal)
    status.value = await loadMeasuredSpatialStatus(controller.signal)
    state.value = 'idle'
    announcement.value = 'All 400 manifest-owned chunks passed encoded and decoded verification for offline use.'
  } catch (error) {
    fail(error, 'Offline completion stopped because a chunk was missing, corrupt, or unavailable.')
  }
}

async function checkIntegrity() {
  state.value = 'checking'
  message.value = ''
  try {
    integrity.value = await verifyMeasuredSpatialIntegrity(controller.signal)
    status.value = await loadMeasuredSpatialStatus(controller.signal)
    state.value = integrity.value.status === 'failed' ? 'failed' : 'idle'
    if (integrity.value.status === 'failed') message.value = integrity.value.findings.join(' ')
    announcement.value = `Local measured-spatial integrity is ${integrity.value.status}; network access was disabled for this check.`
  } catch (error) {
    fail(error, 'Local measured-spatial integrity verification failed.')
  }
}

watch([arrayId, level], () => {
  if (records.value) void selectArray()
})

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>
<template lang="pug">
Section.measured-atlas(title="DigiMouse liver label atlas" title-id="measured-atlas-title" eyebrow="14 · Measured spatial atlas" lede="A bounded measured-derived whole-body label volume and exact binary liver segmentation. Semantic and tabular access works without WebGL." :status="statusWord" :tone="statusTone(statusWord)")
  .notice.notice--warning.stack.stack--tight(role="note" aria-label="Measured atlas registration boundary")
    p
      strong Whole-body atlas to lobule registration unavailable
    p No transform, inverse, landmarks, quality metrics, uncertainty, or valid region exists for #[code SPACE:MOUSE-LOBULE-LOCAL]. Goal 7 geometry is never substituted.

  .notice.notice--danger.stack.stack--tight(v-if="message" role="alert")
    strong Measured atlas remains unavailable
    p {{ message }}
    p No synthetic geometry, alternate level, or generated preview is shown in its place.

  .notice.repel
    div
      p
        strong {{ ready ? 'Verified local metadata ready' : status?.state === 'empty' ? 'Explicit metadata synchronization required' : 'Measured atlas verification unavailable' }}
      p {{ status?.cachedChunks ?? 0 }} / {{ status?.totalChunks ?? 400 }} chunks cached · offline {{ status?.offlineComplete ? 'complete' : 'incomplete' }}
    button.button(v-if="status?.state === 'empty'" type="button" :disabled="busy" data-testid="measured-spatial-sync" @click="synchronize") {{ state === 'syncing' ? 'Verifying metadata…' : 'Synchronize signed atlas' }}
    button.button.button--secondary(v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="initialize") Reload failed status

  details.stack.stack--tight(v-if="discovery")
    summary Independent publication pins
    dl.metrics.metrics--wide
      Metric(label="Release")
        | {{ discovery.pins.releaseId }}
        code.digest {{ discovery.pins.releaseDigest }}
      Metric(label="Trust / catalog")
        code.digest {{ discovery.pins.trustDigest }}
        code.digest {{ discovery.pins.catalogDigest }}
      Metric(label="Manifest / envelope")
        code.digest {{ discovery.pins.manifestDigest }}
        code.digest {{ discovery.pins.envelopeDigest }}
      Metric(label="Metadata / inventory")
        code.digest {{ discovery.pins.metadataDigest }}
        code.digest {{ discovery.pins.inventoryDigest }}
      Metric(label="Retired signer")
        | {{ discovery.pins.signerKeyId }}
        code.digest {{ discovery.pins.signerPublicKey }}

  template(v-if="ready && records")
    .grid(data-testid="measured-spatial-summary")
      article.card.card--flat.stack.stack--tight
        p.eyebrow specimen
        p
          strong {{ acquisition.subject.species }}
        p.muted One {{ acquisition.subject.mass_g }} g {{ acquisition.subject.sex }} {{ acquisition.subject.strain }} mouse · {{ acquisition.subject.state }} · {{ acquisition.modalities_used_to_create_atlas.join(' + ') }} derived
      article.card.card--flat.stack.stack--tight
        p.eyebrow liver segmentation
        p
          strong label 18 · UBERON:0002107
        p.muted {{ arrays.find(item => item.id === 'liver-mask:0')?.liver_voxels.toLocaleString() }} level-0 voxels; exact equality mask with no smoothing or morphology.
      article.card.card--flat.stack.stack--tight
        p.eyebrow coordinate limits
        p
          strong ZYX byte order only
        p.muted Axis polarity {{ space.axis_polarity }} · physical origin {{ space.physical_origin }} · registration uncertainty unreported.

    Section(title="Shapes, levels, spacing, and liver bounds" title-id="atlas-arrays-title" eyebrow="Semantic array inventory" :level="3" flat)
      p.muted uint8 · C-order ZYX · fixed gzip 9
      .scroll-x(role="region" tabindex="0" aria-label="Array inventory")
        table
          caption All four independently pinned array identities
          thead
            tr
              th(scope="col") Array / level
              th(scope="col") Shape ZYX
              th(scope="col") Spacing
              th(scope="col") Liver voxels
              th(scope="col") Inclusive bounds XYZ
          tbody
            tr(v-for="array in arrays" :key="array.id")
              th(scope="row")
                strong {{ array.kind }}
                code.digest {{ array.id }}
              td {{ shapeText(array.shape_zyx) }}
              td {{ shapeText(array.spacing_um) }} µm
              td {{ array.liver_voxels.toLocaleString() }}
              td {{ boundsText(array.liver_bounds_xyz) }}

    Section(title="Request one selected chunk" title-id="chunk-browser-title" eyebrow="Manifest-owned viewport" :level="3" flat)
      p.muted {{ inventory.length }} descriptors · 0 bytes fetched by selection controls
      p Changing array, level, or Z slab loads descriptors only. A chunk button requests exactly that coordinate; failures stay visible and no level-of-detail fallback is permitted.
      .grid
        .form
          label(for="chunk-array") Array
          select#chunk-array(v-model="arrayId" :disabled="busy")
            option(value="liver-mask") Liver binary mask
            option(value="anatomy-labels") Anatomical labels
        .form
          label(for="chunk-level") Exact level
          select#chunk-level(v-model.number="level" :disabled="busy")
            option(:value="0") 0 · 100 µm
            option(:value="1") 1 · 200 µm
        .form
          label(for="chunk-slab") Z chunk slab
          select#chunk-slab(v-model.number="zGrid" :disabled="busy")
            option(v-for="value in zPlanes" :key="value" :value="value") {{ value }} · origin {{ value * 32 }}
      .sidebar.sidebar--end
        .grid.grid--fixed(role="group" :aria-label="`${arrayId} level ${level}, Z chunk ${zGrid}`" :style="{ '--grid-columns': gridColumns }" data-testid="measured-spatial-chunk-map")
          button.tile(v-for="chunk in visibleChunks" :key="chunk.path" type="button" :disabled="busy" :aria-label="`Request Y ${chunk.grid_zyx[1]}, X ${chunk.grid_zyx[2]}`" :aria-pressed="selectedChunk?.descriptor.path === chunk.path" @click="requestChunk(chunk)")
            span Y{{ chunk.grid_zyx[1] }} · X{{ chunk.grid_zyx[2] }}
            small.muted {{ chunk.encoded_bytes }} B
        div.card.card--flat.stack.stack--tight(role="status")
          template(v-if="selectedChunk")
            p
              strong Encoded and decoded verification passed
            p
              code {{ selectedChunk.descriptor.path }}
            dl.facts
              div
                dt Cache source
                dd {{ selectedChunk.cacheSource }}
              div
                dt Voxel origin ZYX
                dd {{ selectedChunk.descriptor.voxel_origin_zyx.join(', ') }}
              div
                dt Valid voxel shape
                dd {{ selectedChunk.descriptor.voxel_shape_zyx.join(' × ') }}
              div
                dt Encoded / decoded
                dd {{ selectedChunk.encodedBytes }} / {{ selectedChunk.decodedBytes }} bytes
            p.muted The verified bytes are not transformed into an invented image orientation.
          p(v-else) Select a manifest-owned cell. No chunk is preloaded and no synthetic preview is available.

    Section(title="Verify every encoded and decoded chunk" title-id="offline-panel-title" eyebrow="Explicit artifact-offline closure" :level="3" flat)
      p Completion requests all missing coordinates and verifies all 400 descriptors. Integrity checks use local storage only and expose eviction or corruption.
      Toolbar(label="Offline verification")
        button.button(type="button" :disabled="busy" data-testid="measured-spatial-complete" @click="completeOffline") {{ state === 'completing' ? 'Verifying 400 chunks…' : status.offlineComplete ? 'Reverify offline completion' : 'Complete atlas for offline use' }}
        button.button.button--secondary(type="button" :disabled="busy" data-testid="measured-spatial-integrity" @click="checkIntegrity") {{ state === 'checking' ? 'Checking local cache…' : 'Check local integrity without network' }}
      dl.facts(v-if="completion || integrity" data-testid="measured-spatial-offline-result")
        div
          dt Offline complete
          dd {{ status.offlineComplete ? 'yes' : 'no' }}
        div
          dt Encoded + decoded
          dd {{ completion?.encodedAndDecodedVerified ? '400 verified' : `${integrity?.verifiedDecodedChunks ?? 0} locally verified` }}
        div
          dt Network during integrity
          dd {{ integrity?.networkAccess === false ? 'disabled' : 'not checked' }}
        div
          dt Findings
          dd {{ integrity?.findings.join(' ') || 'none' }}

    .grid
      Section(:title="attribution.title" title-id="atlas-rights-title" eyebrow="Source, rights, and attribution" :level="3" flat)
        p {{ attribution.creators.join(', ') }}. DOI #[a(:href="`https://doi.org/${attribution.doi}`" target="_blank" rel="noreferrer") {{ attribution.doi }}].
        p #[a(:href="attribution.source_url" target="_blank" rel="noreferrer") DigiMouse source] · #[a(:href="attribution.license.url" target="_blank" rel="noreferrer") {{ attribution.license.name }}].
        p Redistribution {{ attribution.license.redistribution }}; ShareAlike {{ attribution.license.share_alike ? 'required' : 'not declared' }}. {{ attribution.license.warranty_disclaimer }}
        p {{ attribution.license.no_endorsement }}
        p {{ attribution.software_license_boundary }}
      Section(title="Adapted material operations" title-id="atlas-modifications-title" eyebrow="Modification notice" :level="3" flat)
        ul
          li(v-for="item in attribution.modifications" :key="item") {{ item }}
        h4 Scientific limits
        ul
          li(v-for="item in limitations" :key="item.id") {{ item.statement }}
        p
          strong Registration:
          |  {{ registration.status }}. {{ registration.reason }}
  p.visually-hidden(role="status") {{ announcement }}
</template>
