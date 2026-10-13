<script setup vapor>
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
import Metric from './ui/Metric.vue'
import Section from './ui/Section.vue'
import Toolbar from './ui/Toolbar.vue'
import { statusTone } from './ui/tone.js'

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
<template lang="pug">
Section.measured-workbench(title="Qualified observations and isolated evaluation" title-id="measured-title" eyebrow="10 · Measured commons" :status="state" :tone="statusTone(state)")
  .notice.notice--danger.stack.stack--tight(v-if="message" role="alert")
    strong Measured workflow stopped
    p {{ message }}
  p.muted Measured values, derived normalizations, and fitted outputs retain separate labels. Local read routes never fall back upstream.
  .notice.repel
    div
      p
        strong {{ status?.state === 'ready' ? 'Verified local mirror ready' : 'Explicit synchronization required' }}
      p(v-if="status?.release") {{ status.release.id }} · {{ status.integrity }}
      p(v-else) Signed metadata and non-heldout records are absent locally.
    button.button(type="button" :disabled="busy" data-testid="measured-sync" @click="synchronize") {{ state === 'syncing' ? 'Verifying all pages…' : 'Sync measured commons' }}

  template(v-if="status?.state === 'ready' || state === 'ready'")
    dl.metrics
      Metric(label="Release digest" :value="discovery?.pins.releaseDigest" mono)
      Metric(label="Catalog" :value="discovery?.pins.catalogDigest" mono)
      Metric(label="Retired signer" :value="`${discovery?.pins.signerKeyId} verified at signed time`")

    .grid(data-testid="measured-families")
      article.stack.stack--tight(v-for="family in families" :key="family.id" :class="family.role === 'external-held-out' ? 'notice notice--warning' : 'card card--flat'")
        p.eyebrow {{ family.role }}
        h3 {{ family.title }}
        p
          code {{ family.id }}
        p(v-if="family.role === 'external-held-out'") Metadata visible; outcomes, uncertainties, summaries, defaults, and previews absent.
        p.muted(v-else) Values eligible only through their declared {{ family.role }} dataflow.

    .grid
      article.card.card--flat.stack.stack--tight
        p
          strong CEBS / NTP policy
        p.muted Official federal data under the pinned public-domain-default policy, retaining its third-party copyright caveat and exact attribution.
      article.card.card--flat.stack.stack--tight
        p
          strong Zenodo record 7648975
        p.muted Authors retain copyright; article and reviewed transcription are carried under CC BY 4.0 with attribution.

    .sidebar.sidebar--end
      Section(title="Calibration records" title-id="measured-records-title" :level="3" flat)
        p #[strong measured] raw reports alongside #[strong derived-measurement] deterministic normalization.
        .scroll-x(role="region" tabindex="0" aria-label="Calibration records table")
          table(data-testid="measured-table")
            caption Calibration records, raw and normalized
            thead
              tr
                th(scope="col") ID
                th(scope="col") Raw measured
                th(scope="col") Normalized derived
                th(scope="col") Locator
            tbody
              tr(v-for="item in measurements?.items" :key="item.id")
                th(scope="row")
                  code {{ item.id }}
                td {{ item.reported_value }} {{ item.reported_unit }}
                td {{ item.normalized.value }} {{ item.normalized.unit }}
                td {{ item.locator.table }} · {{ item.locator.source_native_cell }}
        button.button.button--secondary(type="button" :disabled="!measurements?.nextCursor || busy" data-testid="measured-next-page" @click="nextMeasurements") Next verified page
        p.muted {{ missingness.length }} calibration missingness rows on the current complete role traversal; QNS/blank never become zero.
      Section(title="Selected lineage" title-id="lineage-title" :level="3" flat)
        button.button.button--secondary(type="button" :disabled="busy" data-testid="inspect-lineage" @click="inspectLineage") Inspect ALT 24 h lineage
        dl.facts(v-if="lineage" data-testid="measured-lineage")
          div
            dt Identity
            dd {{ lineage.lineage.measurement.id }}
          div
            dt Scientific label
            dd {{ lineage.lineage.measurement.scientific_origin }} · {{ lineage.lineage.measurement.validation_state }}
          div
            dt Uncertainty
            dd {{ lineage.lineage.uncertainty.kind }}
          div
            dt Control qualifier
            dd {{ lineage.lineage.context.qualifiers[0]?.status }} “{{ lineage.lineage.context.qualifiers[0]?.raw_value }}”
          div
            dt Source locator
            dd {{ lineage.lineage.measurement.locator.source_native_cell }} in {{ lineage.lineage.measurement.locator.table }}
          div
            dt Transformation
            dd {{ lineage.lineage.normalized_transformation.expression }}
          div
            dt Source / license
            dd {{ lineage.lineage.source.accession }} · {{ lineage.lineage.license.rights_basis }}
          div
            dt Lineage digest
            dd.digest {{ lineage.lineageDigest }}

    Section(title="C55801C · ALT · 24 h · five dose groups" title-id="calibration-title" eyebrow="Calibration-only analysis" :level="3" flat)
      p The immutable calibration partition is selected within one study, observable, time, assay ID, protocol, unit, and declared group set. A fit is emitted only if scientific context is complete and identical.
      div
        button.button(type="button" :disabled="busy" data-testid="run-measured-calibration" @click="calibrate") Run deterministic calibration analysis
      article.notice.notice--warning.stack.stack--tight(v-if="calibration" data-testid="calibration-artifact")
        p
          strong {{ calibration.status }}
        code.digest {{ calibration.artifactDigest }}
        p {{ calibration.measurements.length }} pinned measurement values and lineage digests · {{ calibration.missingness.length }} selected missingness records.
        ul
          li(v-for="reason in calibration.reasons" :key="reason") {{ reason }}
        p Access proof: development {{ calibration.accessProof.developmentMeasurementsRead }}, validation {{ calibration.accessProof.validationMeasurementsRead }}, external-heldout {{ calibration.accessProof.externalHeldoutMeasurementsRead }}. Evaluation client available: {{ calibration.accessProof.evaluationClientAvailable ? 'yes' : 'no' }}.
        p
          strong No validation conclusion.

    Section(title="Freeze first, disclose separately" title-id="disclosure-title" eyebrow="Explicit heldout boundary" :level="3" flat)
      p This is dataflow isolation, not secrecy, DRM, or authentication. Protected responses are #[code private, no-store]; a local repository holder can inspect licensed source material.
      p(v-if="!calibration")
        strong Run and persist the calibration analysis before freezing.
      Toolbar(label="Heldout commitment and disclosure")
        button.button(type="button" :disabled="busy || !heldoutPartition || !calibration" data-testid="freeze-measured" @click="freeze") {{ commitment ? 'Retry exact commitment' : 'Freeze from calibration artifact' }}
        button.button.button--secondary(v-if="commitment" type="button" :disabled="busy" data-testid="disclose-measured" @click="disclose") Explicitly disclose heldout outcomes
      .notice.notice--success.stack.stack--tight(v-if="commitment" data-testid="commitment-receipt")
        p
          strong Frozen before disclosure
        code.digest {{ commitment.receipt.commitment_digest }}
        p nonce {{ commitment.frozenRequest.nonce }} · {{ cacheControl }}
        dl.facts(data-testid="frozen-artifact-digests")
          div
            dt Model / calibration
            dd.digest {{ commitment.artifacts.model.digest }}
          div
            dt Parameter policy
            dd.digest {{ commitment.artifacts.parameterPolicy.digest }}
          div
            dt Endpoint mapping
            dd.digest {{ commitment.artifacts.endpointMapping.digest }}
          div
            dt No-score policy
            dd.digest {{ commitment.artifacts.metricThresholdPolicy.digest }}
          div
            dt Not-evaluable prediction
            dd.digest {{ commitment.artifacts.prediction.digest }}
      .notice.notice--warning.stack.stack--tight(v-if="disclosure" data-testid="disclosure-values")
        p
          strong {{ disclosure.items.length }} heldout renal GSH group values disclosed
        p Immutable disclosure receipt {{ disclosure.disclosed_at }}.
        ul
          li(v-for="item in disclosure.items" :key="item.measurement_id")
            code {{ item.group_id }}
            | {{ ` ${item.reported_value}` }} {{ item.reported_unit }} · SEM {{ item.uncertainty.value }} · n={{ item.uncertainty.n }}
        p Labels remain external-held-out; disclosure does not produce a validation conclusion.
  p.visually-hidden(role="status") {{ announcement }}
</template>
