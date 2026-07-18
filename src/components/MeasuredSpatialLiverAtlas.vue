<script setup>
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

<template>
  <section class="measured-atlas" aria-labelledby="measured-atlas-title">
    <header class="atlas-header">
      <div>
        <p class="kicker">14 · Measured spatial atlas</p>
        <h2 id="measured-atlas-title">DigiMouse liver label atlas</h2>
        <p class="atlas-lede">A bounded measured-derived whole-body label volume and exact binary liver segmentation. Semantic and tabular access works without WebGL.</p>
      </div>
      <span class="status-chip" :class="status?.state === 'ready' ? 'ready' : status?.state ?? state" aria-live="polite">{{ status?.state ?? state }}</span>
    </header>

    <div class="atlas-boundary" role="note" aria-label="Measured atlas registration boundary">
      <strong>Whole-body atlas to lobule registration unavailable</strong>
      <p>No transform, inverse, landmarks, quality metrics, uncertainty, or valid region exists for <code>SPACE:MOUSE-LOBULE-LOCAL</code>. Goal 7 geometry is never substituted.</p>
    </div>

    <div v-if="message" class="alert error" role="alert">
      <strong>Measured atlas remains unavailable</strong>
      <p>{{ message }}</p>
      <p>No synthetic geometry, alternate level, or generated preview is shown in its place.</p>
    </div>

    <div class="atlas-state-strip">
      <div>
        <strong>{{ ready ? 'Verified local metadata ready' : status?.state === 'empty' ? 'Explicit metadata synchronization required' : 'Measured atlas verification unavailable' }}</strong>
        <span>{{ status?.cachedChunks ?? 0 }} / {{ status?.totalChunks ?? 400 }} chunks cached · offline {{ status?.offlineComplete ? 'complete' : 'incomplete' }}</span>
      </div>
      <button v-if="status?.state === 'empty'" type="button" :disabled="busy" data-testid="measured-spatial-sync" @click="synchronize">{{ state === 'syncing' ? 'Verifying metadata…' : 'Synchronize signed atlas' }}</button>
      <button v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="initialize">Reload failed status</button>
    </div>

    <template v-if="discovery">
      <details class="atlas-pins">
        <summary>Independent publication pins</summary>
        <dl>
          <div><dt>Release</dt><dd>{{ discovery.pins.releaseId }}<code>{{ discovery.pins.releaseDigest }}</code></dd></div>
          <div><dt>Trust / catalog</dt><dd><code>{{ discovery.pins.trustDigest }}</code><code>{{ discovery.pins.catalogDigest }}</code></dd></div>
          <div><dt>Manifest / envelope</dt><dd><code>{{ discovery.pins.manifestDigest }}</code><code>{{ discovery.pins.envelopeDigest }}</code></dd></div>
          <div><dt>Metadata / inventory</dt><dd><code>{{ discovery.pins.metadataDigest }}</code><code>{{ discovery.pins.inventoryDigest }}</code></dd></div>
          <div><dt>Retired signer</dt><dd>{{ discovery.pins.signerKeyId }}<code>{{ discovery.pins.signerPublicKey }}</code></dd></div>
        </dl>
      </details>
    </template>

    <template v-if="ready && records">
      <div class="atlas-facts" data-testid="measured-spatial-summary">
        <article>
          <span>specimen</span>
          <strong>{{ acquisition.subject.species }}</strong>
          <p>One {{ acquisition.subject.mass_g }} g {{ acquisition.subject.sex }} {{ acquisition.subject.strain }} mouse · {{ acquisition.subject.state }} · {{ acquisition.modalities_used_to_create_atlas.join(' + ') }} derived</p>
        </article>
        <article>
          <span>liver segmentation</span>
          <strong>label 18 · UBERON:0002107</strong>
          <p>{{ arrays.find(item => item.id === 'liver-mask:0')?.liver_voxels.toLocaleString() }} level-0 voxels; exact equality mask with no smoothing or morphology.</p>
        </article>
        <article>
          <span>coordinate limits</span>
          <strong>ZYX byte order only</strong>
          <p>Axis polarity {{ space.axis_polarity }} · physical origin {{ space.physical_origin }} · registration uncertainty unreported.</p>
        </article>
      </div>

      <section class="array-table" aria-labelledby="atlas-arrays-title">
        <div class="subheading">
          <div><p class="kicker">Semantic array inventory</p><h3 id="atlas-arrays-title">Shapes, levels, spacing, and liver bounds</h3></div>
          <span>uint8 · C-order ZYX · fixed gzip 9</span>
        </div>
        <div class="table-scroll">
          <table>
            <caption>All four independently pinned array identities</caption>
            <thead><tr><th scope="col">Array / level</th><th scope="col">Shape ZYX</th><th scope="col">Spacing</th><th scope="col">Liver voxels</th><th scope="col">Inclusive bounds XYZ</th></tr></thead>
            <tbody>
              <tr v-for="array in arrays" :key="array.id">
                <th scope="row"><strong>{{ array.kind }}</strong><code>{{ array.id }}</code></th>
                <td>{{ shapeText(array.shape_zyx) }}</td>
                <td>{{ shapeText(array.spacing_um) }} µm</td>
                <td>{{ array.liver_voxels.toLocaleString() }}</td>
                <td>{{ boundsText(array.liver_bounds_xyz) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="chunk-browser" aria-labelledby="chunk-browser-title">
        <div class="subheading">
          <div><p class="kicker">Manifest-owned viewport</p><h3 id="chunk-browser-title">Request one selected chunk</h3></div>
          <span>{{ inventory.length }} descriptors · 0 bytes fetched by selection controls</span>
        </div>
        <p>Changing array, level, or Z slab loads descriptors only. A chunk button requests exactly that coordinate; failures stay visible and no level-of-detail fallback is permitted.</p>
        <div class="chunk-controls">
          <label>Array
            <select v-model="arrayId" :disabled="busy">
              <option value="liver-mask">Liver binary mask</option>
              <option value="anatomy-labels">Anatomical labels</option>
            </select>
          </label>
          <label>Exact level
            <select v-model.number="level" :disabled="busy">
              <option :value="0">0 · 100 µm</option>
              <option :value="1">1 · 200 µm</option>
            </select>
          </label>
          <label>Z chunk slab
            <select v-model.number="zGrid" :disabled="busy">
              <option v-for="value in zPlanes" :key="value" :value="value">{{ value }} · origin {{ value * 32 }}</option>
            </select>
          </label>
        </div>
        <div class="chunk-layout">
          <div class="chunk-map" role="group" :aria-label="`${arrayId} level ${level}, Z chunk ${zGrid}`" :style="{ '--chunk-columns': gridColumns }" data-testid="measured-spatial-chunk-map">
            <button v-for="chunk in visibleChunks" :key="chunk.path" type="button" :disabled="busy" :aria-label="`Request Y ${chunk.grid_zyx[1]}, X ${chunk.grid_zyx[2]}`" :class="{ selected: selectedChunk?.descriptor.path === chunk.path }" @click="requestChunk(chunk)">
              <span>Y{{ chunk.grid_zyx[1] }} · X{{ chunk.grid_zyx[2] }}</span>
              <small>{{ chunk.encoded_bytes }} B</small>
            </button>
          </div>
          <aside class="chunk-readout" aria-live="polite">
            <template v-if="selectedChunk">
              <strong>Encoded and decoded verification passed</strong>
              <code>{{ selectedChunk.descriptor.path }}</code>
              <dl>
                <div><dt>Cache source</dt><dd>{{ selectedChunk.cacheSource }}</dd></div>
                <div><dt>Voxel origin ZYX</dt><dd>{{ selectedChunk.descriptor.voxel_origin_zyx.join(', ') }}</dd></div>
                <div><dt>Valid voxel shape</dt><dd>{{ selectedChunk.descriptor.voxel_shape_zyx.join(' × ') }}</dd></div>
                <div><dt>Encoded / decoded</dt><dd>{{ selectedChunk.encodedBytes }} / {{ selectedChunk.decodedBytes }} bytes</dd></div>
              </dl>
              <p>The verified bytes are not transformed into an invented image orientation.</p>
            </template>
            <p v-else>Select a manifest-owned cell. No chunk is preloaded and no synthetic preview is available.</p>
          </aside>
        </div>
      </section>

      <section class="offline-panel" aria-labelledby="offline-panel-title">
        <div><p class="kicker">Explicit artifact-offline closure</p><h3 id="offline-panel-title">Verify every encoded and decoded chunk</h3><p>Completion requests all missing coordinates and verifies all 400 descriptors. Integrity checks use local storage only and expose eviction or corruption.</p></div>
        <div class="offline-actions">
          <button type="button" :disabled="busy" data-testid="measured-spatial-complete" @click="completeOffline">{{ state === 'completing' ? 'Verifying 400 chunks…' : status.offlineComplete ? 'Reverify offline completion' : 'Complete atlas for offline use' }}</button>
          <button type="button" :disabled="busy" data-testid="measured-spatial-integrity" @click="checkIntegrity">{{ state === 'checking' ? 'Checking local cache…' : 'Check local integrity without network' }}</button>
        </div>
        <dl v-if="completion || integrity" class="offline-result" data-testid="measured-spatial-offline-result">
          <div><dt>Offline complete</dt><dd>{{ status.offlineComplete ? 'yes' : 'no' }}</dd></div>
          <div><dt>Encoded + decoded</dt><dd>{{ completion?.encodedAndDecodedVerified ? '400 verified' : `${integrity?.verifiedDecodedChunks ?? 0} locally verified` }}</dd></div>
          <div><dt>Network during integrity</dt><dd>{{ integrity?.networkAccess === false ? 'disabled' : 'not checked' }}</dd></div>
          <div><dt>Findings</dt><dd>{{ integrity?.findings.join(' ') || 'none' }}</dd></div>
        </dl>
      </section>

      <div class="provenance-grid">
        <section aria-labelledby="atlas-rights-title">
          <p class="kicker">Source, rights, and attribution</p>
          <h3 id="atlas-rights-title">{{ attribution.title }}</h3>
          <p>{{ attribution.creators.join(', ') }}. DOI <a :href="`https://doi.org/${attribution.doi}`" target="_blank" rel="noreferrer">{{ attribution.doi }}</a>.</p>
          <p><a :href="attribution.source_url" target="_blank" rel="noreferrer">DigiMouse source</a> · <a :href="attribution.license.url" target="_blank" rel="noreferrer">{{ attribution.license.name }}</a>.</p>
          <p>Redistribution {{ attribution.license.redistribution }}; ShareAlike {{ attribution.license.share_alike ? 'required' : 'not declared' }}. {{ attribution.license.warranty_disclaimer }}</p>
          <p>{{ attribution.license.no_endorsement }}</p>
          <p>{{ attribution.software_license_boundary }}</p>
        </section>
        <section aria-labelledby="atlas-modifications-title">
          <p class="kicker">Modification notice</p>
          <h3 id="atlas-modifications-title">Adapted material operations</h3>
          <ul><li v-for="item in attribution.modifications" :key="item">{{ item }}</li></ul>
          <h3>Scientific limits</h3>
          <ul><li v-for="item in limitations" :key="item.id">{{ item.statement }}</li></ul>
          <p><strong>Registration:</strong> {{ registration.status }}. {{ registration.reason }}</p>
        </section>
      </div>
    </template>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<style scoped>
.measured-atlas { grid-column: 1 / -1; min-width: 0; overflow: hidden; border: 1px solid #385c59; background: linear-gradient(150deg, #0c1718 0%, #102423 55%, #0b1617 100%); box-shadow: 0 30px 80px rgba(0, 0, 0, .3); }
.atlas-header, .subheading, .atlas-state-strip, .offline-panel { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; }
.atlas-header { padding: clamp(1.25rem, 3vw, 2.5rem); border-bottom: 1px solid #294744; background: radial-gradient(circle at 85% 10%, rgba(106, 190, 155, .14), transparent 34%); }
.atlas-header h2 { max-width: 18ch; margin: .2rem 0 .65rem; font-size: clamp(1.8rem, 4vw, 3.3rem); line-height: .98; letter-spacing: -.04em; }
.atlas-lede { max-width: 68ch; color: #b4c7c4; line-height: 1.65; }
.atlas-boundary { display: grid; grid-template-columns: minmax(220px, .65fr) minmax(0, 1.35fr); gap: 1rem; padding: 1rem clamp(1.25rem, 3vw, 2.5rem); border-bottom: 1px solid #695837; background: #211d14; color: #e4cf9d; }
.atlas-boundary p { margin: 0; color: #c8b98f; }
.atlas-state-strip { margin: 1.25rem clamp(1.25rem, 3vw, 2.5rem); padding: 1rem; border: 1px solid #355754; background: #091313; }
.atlas-state-strip div { display: grid; gap: .3rem; }
.atlas-state-strip span, .subheading span { color: #91aaa6; font-size: .78rem; }
.atlas-pins { margin: 0 clamp(1.25rem, 3vw, 2.5rem) 1.5rem; border-top: 1px solid #294744; border-bottom: 1px solid #294744; }
.atlas-pins summary { padding: .85rem 0; cursor: pointer; color: #b8d9ce; }
.atlas-pins dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin: 0 0 1rem; background: #294744; }
.atlas-pins dl > div { min-width: 0; padding: .8rem; background: #0c1919; }
.atlas-pins dt { color: #89a39f; font-size: .72rem; text-transform: uppercase; letter-spacing: .08em; }
.atlas-pins dd { display: grid; gap: .25rem; margin: .3rem 0 0; }
.atlas-pins code, .array-table code, .chunk-readout code { display: block; overflow-wrap: anywhere; color: #8dd7bd; font-size: .72rem; }
.atlas-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin: 0 clamp(1.25rem, 3vw, 2.5rem) 1.5rem; background: #385c59; }
.atlas-facts article { padding: 1.15rem; background: #0d1b1b; }
.atlas-facts span { color: #7fbba7; font: .68rem ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; }
.atlas-facts strong { display: block; margin: .45rem 0; color: #eef9f5; }
.atlas-facts p, .chunk-browser > p, .chunk-readout p, .offline-panel p, .provenance-grid p { color: #a7bdb9; font-size: .84rem; line-height: 1.55; }
.array-table, .chunk-browser, .offline-panel, .provenance-grid { margin: 1rem clamp(1.25rem, 3vw, 2.5rem); }
.array-table, .chunk-browser, .offline-panel { padding: clamp(1rem, 2vw, 1.5rem); border: 1px solid #294744; background: #0b1717; }
.subheading h3, .offline-panel h3, .provenance-grid h3 { margin: .2rem 0 .6rem; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 760px; border-collapse: collapse; }
caption { padding: .8rem 0; color: #91aaa6; text-align: left; }
th, td { padding: .75rem; border-top: 1px solid #294744; text-align: left; vertical-align: top; }
thead th { color: #8db7aa; font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; }
tbody th strong { display: block; }
.chunk-controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; margin: 1rem 0; }
.chunk-controls label { display: grid; gap: .4rem; color: #bcd0cc; font-size: .78rem; }
.chunk-controls select { width: 100%; }
.chunk-layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(250px, .65fr); gap: 1rem; }
.chunk-map { display: grid; grid-template-columns: repeat(var(--chunk-columns), minmax(74px, 1fr)); gap: .5rem; align-content: start; }
.chunk-map button { display: grid; gap: .25rem; min-height: 64px; padding: .65rem; border: 1px solid #355754; background: #112321; color: #dcece7; text-align: left; }
.chunk-map button:hover, .chunk-map button:focus-visible, .chunk-map button.selected { border-color: #83d1b7; background: #18342e; }
.chunk-map small { color: #89a39f; }
.chunk-readout { min-width: 0; padding: 1rem; border-left: 3px solid #6fc6aa; background: #0d1e1c; }
.chunk-readout dl, .offline-result { display: grid; gap: .55rem; }
.chunk-readout dl > div, .offline-result > div { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; border-bottom: 1px solid #294744; }
.chunk-readout dd, .offline-result dd { margin: 0; text-align: right; }
.offline-panel { align-items: center; }
.offline-panel > div:first-child { max-width: 62ch; }
.offline-actions { display: grid; gap: .6rem; min-width: 240px; }
.offline-result { flex-basis: 100%; }
.provenance-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.provenance-grid section { min-width: 0; padding: 1.25rem; border-top: 3px solid #b59b5e; background: #101a19; }
.provenance-grid a { color: #8dd7bd; }
.provenance-grid li { margin-bottom: .45rem; color: #b4c7c4; line-height: 1.45; }
button { min-height: 42px; }
@media (max-width: 850px) {
  .atlas-facts, .chunk-controls, .provenance-grid { grid-template-columns: minmax(0, 1fr); }
  .chunk-layout { grid-template-columns: minmax(0, 1fr); }
  .chunk-readout { border-top: 3px solid #6fc6aa; border-left: 0; }
  .offline-panel { align-items: stretch; flex-wrap: wrap; }
}
@media (max-width: 560px) {
  .atlas-header, .atlas-state-strip, .subheading, .offline-panel { display: grid; }
  .atlas-boundary { grid-template-columns: minmax(0, 1fr); }
  .atlas-pins dl { grid-template-columns: minmax(0, 1fr); }
  .atlas-state-strip button, .offline-actions, .offline-actions button { width: 100%; }
  .chunk-map { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .chunk-readout dl > div, .offline-result > div { grid-template-columns: minmax(0, 1fr); }
  .chunk-readout dd, .offline-result dd { text-align: left; }
}
</style>
