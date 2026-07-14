<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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

const CALIBRATION_GROUPS = Object.freeze([
  'group:cebs0004:dose-0',
  'group:cebs0004:dose-150',
  'group:cebs0004:dose-1500',
  'group:cebs0004:dose-2000',
  'group:cebs0004:dose-50'
])
const LINEAGE_EXAMPLE = 'measurement:cebs0004:0113:h24:alt'
const discovery = ref()
const status = ref()
const families = ref([])
const partitions = ref([])
const sources = ref([])
const applicability = ref([])
const measurements = ref()
const missingness = ref([])
const lineage = ref()
const calibration = ref()
const freezeIntent = ref()
const commitment = ref()
const disclosure = ref()
const cacheControl = ref('')
const state = ref('loading')
const message = ref('')
const announcement = ref('')
let controller

const busy = computed(() => ['loading', 'syncing', 'calibrating', 'freezing', 'disclosing'].includes(state.value))
const heldoutPartition = computed(() => partitions.value.find((item) => item.role === 'external-held-out'))
const heldoutFamily = computed(() => families.value.find((item) => item.role === 'external-held-out'))

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function exactTimestamp() {
  return new Date().toISOString().replace(/\.[0-9]{3}Z$/, 'Z')
}

async function loadLocal() {
  const [familyPage, partitionPage, sourcePage, applicabilityPage, measurementPage, missingPage] = await Promise.all([
    loadMeasuredPage('families', { limit: 100 }, controller.signal),
    loadMeasuredPage('partitions', { limit: 100 }, controller.signal),
    loadMeasuredPage('sources', { limit: 100 }, controller.signal),
    loadMeasuredPage('applicability', { limit: 100 }, controller.signal),
    loadMeasuredPage('measurements', { role: 'calibration', limit: 10 }, controller.signal),
    loadMeasuredPage('missingness', { role: 'calibration', limit: 100 }, controller.signal)
  ])
  families.value = familyPage.items
  partitions.value = partitionPage.items
  sources.value = sourcePage.items
  applicability.value = applicabilityPage.items
  measurements.value = measurementPage
  missingness.value = missingPage.items
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    const [loadedDiscovery, loadedStatus] = await Promise.all([loadMeasuredDiscovery(controller.signal), loadMeasuredStatus(controller.signal)])
    discovery.value = loadedDiscovery
    status.value = loadedStatus
    if (loadedStatus.state === 'ready') await loadLocal()
    state.value = loadedStatus.state === 'ready' ? 'ready' : loadedStatus.state
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Measured commons could not be loaded.'
  }
}

async function synchronize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'syncing'
  message.value = ''
  try {
    status.value = await syncMeasured(controller.signal)
    await loadLocal()
    state.value = 'ready'
    announcement.value = 'Measured commons synchronization completed and local integrity passed.'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Measured synchronization failed.'
  }
}

async function nextMeasurements() {
  if (!measurements.value?.nextCursor) return
  const expected = measurements.value.nextCursor
  try {
    const page = await loadMeasuredPage('measurements', { role: 'calibration', limit: 10, cursor: expected }, controller.signal)
    if (measurements.value?.nextCursor !== expected) return
    measurements.value = page
    announcement.value = `Loaded the next measured page beginning with ${page.items[0]?.id}.`
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Measured page failed.'
  }
}

async function inspectLineage() {
  try {
    lineage.value = await loadMeasuredLineage(LINEAGE_EXAMPLE, controller.signal)
    announcement.value = 'Complete selected measurement lineage loaded from the local mirror.'
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Measured lineage failed.'
  }
}

async function calibrate() {
  state.value = 'calibrating'
  message.value = ''
  try {
    calibration.value = await runMeasuredCalibration({
      familyId: 'family:cebs:study-c55801c',
      groupIds: CALIBRATION_GROUPS,
      observableId: 'observable:cebs:alt',
      partitionId: 'partition:calibration:cebs-c55801c',
      studyId: 'study:cebs:002-01586-0004-0000-6',
      timeUnit: 'h',
      timeValue: '24'
    }, controller.signal)
    state.value = 'ready'
    announcement.value = `Calibration analysis completed as ${calibration.value.status}.`
  } catch (error) {
    state.value = 'ready'
    message.value = error instanceof Error ? error.message : 'Calibration analysis failed.'
  }
}

async function freeze() {
  if (!heldoutPartition.value || !heldoutFamily.value || !calibration.value) return
  state.value = 'freezing'
  message.value = ''
  if (!freezeIntent.value) {
    freezeIntent.value = {
      calibrationArtifactDigest: calibration.value.artifactDigest,
      targetPartitionId: heldoutPartition.value.id,
      nonce: randomNonce(),
      createdAt: exactTimestamp()
    }
  }
  try {
    const result = await freezeMeasuredCommitment(freezeIntent.value, controller.signal)
    commitment.value = result.value
    cacheControl.value = result.cacheControl
    state.value = 'ready'
    announcement.value = 'Consumer commitment frozen. Heldout values remain undisclosed.'
  } catch (error) {
    state.value = 'ready'
    message.value = error instanceof Error ? error.message : 'Commitment freeze failed.'
  }
}

async function disclose() {
  if (!commitment.value) return
  state.value = 'disclosing'
  message.value = ''
  try {
    const result = await discloseMeasuredEvaluation({ commitmentDigest: commitment.value.receipt.commitment_digest }, controller.signal)
    disclosure.value = result.value
    cacheControl.value = result.cacheControl
    state.value = 'ready'
    announcement.value = `Explicit disclosure returned ${disclosure.value.items.length} heldout GSH values.`
  } catch (error) {
    state.value = 'ready'
    message.value = error instanceof Error ? error.message : 'Heldout disclosure failed.'
  }
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <section class="measured-workbench" aria-labelledby="measured-title">
    <div class="section-heading">
      <div>
        <p class="kicker">10 · Measured commons</p>
        <h2 id="measured-title">Qualified observations and isolated evaluation</h2>
      </div>
      <span class="status-chip" :class="state">{{ state }}</span>
    </div>

    <div v-if="message" class="alert error" role="alert"><strong>Measured workflow stopped</strong><p>{{ message }}</p></div>
    <p class="source-note">Measured values, derived normalizations, and fitted outputs retain separate labels. Local read routes never fall back upstream.</p>
    <div class="measured-sync-strip">
      <div>
        <strong>{{ status?.state === 'ready' ? 'Verified local mirror ready' : 'Explicit synchronization required' }}</strong>
        <span v-if="status?.release">{{ status.release.id }} · {{ status.integrity }}</span>
        <span v-else>Signed metadata and non-heldout records are absent locally.</span>
      </div>
      <button type="button" :disabled="busy" data-testid="measured-sync" @click="synchronize">{{ state === 'syncing' ? 'Verifying all pages…' : 'Sync measured commons' }}</button>
    </div>

    <template v-if="status?.state === 'ready' || state === 'ready'">
      <div class="measured-pins">
        <code>{{ discovery?.pins.releaseDigest }}</code>
        <span>catalog {{ discovery?.pins.catalogDigest }}</span>
        <span>retired signer {{ discovery?.pins.signerKeyId }} verified at signed time</span>
      </div>

      <div class="measured-family-grid" data-testid="measured-families">
        <article v-for="family in families" :key="family.id" :class="`measured-family ${family.role}`">
          <span>{{ family.role }}</span>
          <h3>{{ family.title }}</h3>
          <code>{{ family.id }}</code>
          <p v-if="family.role === 'external-held-out'">Metadata visible; outcomes, uncertainties, summaries, defaults, and previews absent.</p>
          <p v-else>Values eligible only through their declared {{ family.role }} dataflow.</p>
        </article>
      </div>

      <div class="measured-rights">
        <article><strong>CEBS / NTP policy</strong><p>Official federal data under the pinned public-domain-default policy, retaining its third-party copyright caveat and exact attribution.</p></article>
        <article><strong>Zenodo record 7648975</strong><p>Authors retain copyright; article and reviewed transcription are carried under CC BY 4.0 with attribution.</p></article>
      </div>

      <div class="measured-grid">
        <section aria-labelledby="measured-records-title">
          <h3 id="measured-records-title">Calibration records</h3>
          <p><strong>measured</strong> raw reports alongside <strong>derived-measurement</strong> deterministic normalization.</p>
          <div class="series-table-wrap">
            <table data-testid="measured-table">
              <thead><tr><th>ID</th><th>Raw measured</th><th>Normalized derived</th><th>Locator</th></tr></thead>
              <tbody>
                <tr v-for="item in measurements?.items" :key="item.id">
                  <th><code>{{ item.id }}</code></th>
                  <td>{{ item.reported_value }} {{ item.reported_unit }}</td>
                  <td>{{ item.normalized.value }} {{ item.normalized.unit }}</td>
                  <td>{{ item.locator.table }} · {{ item.locator.source_native_cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" :disabled="!measurements?.nextCursor || busy" data-testid="measured-next-page" @click="nextMeasurements">Next verified page</button>
          <p>{{ missingness.length }} calibration missingness rows on the current complete role traversal; QNS/blank never become zero.</p>
        </section>

        <section aria-labelledby="lineage-title">
          <h3 id="lineage-title">Selected lineage</h3>
          <button type="button" :disabled="busy" data-testid="inspect-lineage" @click="inspectLineage">Inspect ALT 24 h lineage</button>
          <dl v-if="lineage" class="compact-list" data-testid="measured-lineage">
            <div><dt>Identity</dt><dd>{{ lineage.lineage.measurement.id }}</dd></div>
            <div><dt>Scientific label</dt><dd>{{ lineage.lineage.measurement.scientific_origin }} · {{ lineage.lineage.measurement.validation_state }}</dd></div>
            <div><dt>Uncertainty</dt><dd>{{ lineage.lineage.uncertainty.kind }}</dd></div>
            <div><dt>Control qualifier</dt><dd>{{ lineage.lineage.context.qualifiers[0]?.status }} “{{ lineage.lineage.context.qualifiers[0]?.raw_value }}”</dd></div>
            <div><dt>Source locator</dt><dd>{{ lineage.lineage.measurement.locator.source_native_cell }} in {{ lineage.lineage.measurement.locator.table }}</dd></div>
            <div><dt>Transformation</dt><dd>{{ lineage.lineage.normalized_transformation.expression }}</dd></div>
            <div><dt>Source / license</dt><dd>{{ lineage.lineage.source.accession }} · {{ lineage.lineage.license.rights_basis }}</dd></div>
            <div><dt>Lineage digest</dt><dd class="digest">{{ lineage.lineageDigest }}</dd></div>
          </dl>
        </section>
      </div>

      <section class="measured-calibration" aria-labelledby="calibration-title">
        <div><p class="kicker">Calibration-only analysis</p><h3 id="calibration-title">C55801C · ALT · 24 h · five dose groups</h3></div>
        <p>The immutable calibration partition is selected within one study, observable, time, assay ID, protocol, unit, and declared group set. A fit is emitted only if scientific context is complete and identical.</p>
        <button type="button" :disabled="busy" data-testid="run-measured-calibration" @click="calibrate">Run deterministic calibration analysis</button>
        <article v-if="calibration" class="calibration-artifact" data-testid="calibration-artifact">
          <strong>{{ calibration.status }}</strong>
          <code>{{ calibration.artifactDigest }}</code>
          <p>{{ calibration.measurements.length }} pinned measurement values and lineage digests · {{ calibration.missingness.length }} selected missingness records.</p>
          <ul><li v-for="reason in calibration.reasons" :key="reason">{{ reason }}</li></ul>
          <p>Access proof: development {{ calibration.accessProof.developmentMeasurementsRead }}, validation {{ calibration.accessProof.validationMeasurementsRead }}, external-heldout {{ calibration.accessProof.externalHeldoutMeasurementsRead }}. Evaluation client available: {{ calibration.accessProof.evaluationClientAvailable ? 'yes' : 'no' }}.</p>
          <p><strong>No validation conclusion.</strong></p>
        </article>
      </section>

      <section class="measured-disclosure" aria-labelledby="disclosure-title">
        <p class="kicker">Explicit heldout boundary</p>
        <h3 id="disclosure-title">Freeze first, disclose separately</h3>
        <p>This is dataflow isolation, not secrecy, DRM, or authentication. Protected responses are <code>private, no-store</code>; a local repository holder can inspect licensed source material.</p>
        <p v-if="!calibration"><strong>Run and persist the calibration analysis before freezing.</strong></p>
        <button type="button" :disabled="busy || !heldoutPartition || !calibration" data-testid="freeze-measured" @click="freeze">{{ commitment ? 'Retry exact commitment' : 'Freeze from calibration artifact' }}</button>
        <div v-if="commitment" class="commitment-receipt" data-testid="commitment-receipt">
          <strong>Frozen before disclosure</strong>
          <code>{{ commitment.receipt.commitment_digest }}</code>
          <span>nonce {{ commitment.frozenRequest.nonce }} · {{ cacheControl }}</span>
          <dl class="compact-list" data-testid="frozen-artifact-digests">
            <div><dt>Model / calibration</dt><dd class="digest">{{ commitment.artifacts.model.digest }}</dd></div>
            <div><dt>Parameter policy</dt><dd class="digest">{{ commitment.artifacts.parameterPolicy.digest }}</dd></div>
            <div><dt>Endpoint mapping</dt><dd class="digest">{{ commitment.artifacts.endpointMapping.digest }}</dd></div>
            <div><dt>No-score policy</dt><dd class="digest">{{ commitment.artifacts.metricThresholdPolicy.digest }}</dd></div>
            <div><dt>Not-evaluable prediction</dt><dd class="digest">{{ commitment.artifacts.prediction.digest }}</dd></div>
          </dl>
        </div>
        <button v-if="commitment" type="button" :disabled="busy" data-testid="disclose-measured" @click="disclose">Explicitly disclose heldout outcomes</button>
        <div v-if="disclosure" class="disclosure-values" data-testid="disclosure-values">
          <strong>{{ disclosure.items.length }} heldout renal GSH group values disclosed</strong>
          <p>Immutable disclosure receipt {{ disclosure.disclosed_at }}.</p>
          <ul><li v-for="item in disclosure.items" :key="item.measurement_id"><code>{{ item.group_id }}</code> {{ item.reported_value }} {{ item.reported_unit }} · SEM {{ item.uncertainty.value }} · n={{ item.uncertainty.n }}</li></ul>
          <p>Labels remain external-held-out; disclosure does not produce a validation conclusion.</p>
        </div>
      </section>
    </template>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </section>
</template>
