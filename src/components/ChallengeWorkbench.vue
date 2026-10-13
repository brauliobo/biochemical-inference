<script setup vapor>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { CHALLENGE_CONCLUSION_BOUNDARY } from '../../shared/challenge-contracts.js'
import {
  discloseChallengeCommitment,
  loadChallengeArtifact,
  loadChallengeDiscovery,
  loadChallengeReport,
  loadChallengeRuns,
  loadChallengeStatus,
  prepareChallengeCommitment,
  replayChallengeReport,
  syncChallenge,
  verifyChallengeIntegrity
} from '../api.js'
import Panel from './ui/Panel.vue'

const resultTone = Object.freeze({ failed: 'notice--danger', 'not-evaluable': 'notice--warning', 'supported-within-boundary': 'notice--success' })
const supportTone = Object.freeze({ unsupported: 'badge--danger', 'not-evaluable': 'badge--warning', 'supported-within-boundary': 'badge--success' })

const endpointNames = Object.freeze({
  'endpoint:apap-cmax:reference': 'Reference formulation Cmax',
  'endpoint:apap-cmax:test': 'Test formulation Cmax'
})

const discovery = ref()
const status = ref()
const runs = ref([])
const commitment = ref()
const report = ref()
const diagnostics = ref()
const integrity = ref()
const replay = ref()
const freezeIntent = ref()
const resultPanel = ref()
const state = ref('loading')
const message = ref('')
const announcement = ref('')
let controller

const busy = computed(() => ['loading', 'syncing', 'freezing', 'disclosing', 'opening', 'checking', 'replaying'].includes(state.value))
const ready = computed(() => status.value?.state === 'ready' && status.value?.integrity === 'valid')
const frozen = computed(() => report.value?.frozen_commitment ?? commitment.value?.frozenCommitment)
const receipt = computed(() => report.value?.commitment_receipt ?? commitment.value?.receipt)
const diagnosticContent = computed(() => diagnostics.value?.content?.diagnostics)
const diagnosticStatus = computed(() => {
  const values = report.value?.endpoint_diagnostics.map((item) => item.status)
  if (!values) return diagnosticContent.value?.passed ? 'evaluable' : 'invalid-diagnostics'
  if (values.includes('invalid-mapping')) return 'invalid-mapping'
  if (values.includes('invalid-diagnostics')) return 'invalid-diagnostics'
  return 'evaluable'
})
const resultConclusion = computed(() => report.value?.producer_result.conclusion)
const stateLabel = computed(() => {
  if (state.value === 'failed') return 'operation failed'
  if (resultConclusion.value) return resultConclusion.value
  if (busy.value) return state.value
  return status.value?.state ?? state.value
})
const stateTone = computed(() => {
  if (state.value === 'failed' || resultConclusion.value === 'failed' || status.value?.state === 'failed') return 'danger'
  if (resultConclusion.value === 'not-evaluable' || status.value?.state === 'empty') return 'warning'
  return 'success'
})

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function exactTimestamp() {
  return new Date().toISOString().replace(/\.[0-9]{3}Z$/, 'Z')
}

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function fail(error, fallback) {
  if (isAbort(error)) return
  state.value = 'failed'
  message.value = error instanceof Error ? error.message : fallback
}

async function refreshRuns(signal = controller.signal) {
  runs.value = (await loadChallengeRuns(20, signal)).items
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    const [loadedDiscovery, loadedStatus] = await Promise.all([
      loadChallengeDiscovery(controller.signal),
      loadChallengeStatus(controller.signal)
    ])
    discovery.value = loadedDiscovery
    status.value = loadedStatus
    if (loadedStatus.state === 'ready' && loadedStatus.integrity === 'valid') await refreshRuns()
    state.value = 'idle'
  } catch (error) {
    fail(error, 'Challenge status could not be loaded.')
  }
}

async function synchronize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'syncing'
  message.value = ''
  try {
    status.value = await syncChallenge(controller.signal)
    await refreshRuns()
    state.value = 'idle'
    announcement.value = 'The signed challenge release was synchronized and verified locally.'
  } catch (error) {
    fail(error, 'Challenge synchronization failed.')
  }
}

async function freezeChallenge() {
  state.value = 'freezing'
  message.value = ''
  report.value = undefined
  replay.value = undefined
  commitment.value = undefined
  diagnostics.value = undefined
  freezeIntent.value ??= { nonce: randomNonce(), createdAt: exactTimestamp() }
  try {
    const prepared = await prepareChallengeCommitment(freezeIntent.value, controller.signal)
    const diagnosticArtifact = await loadChallengeArtifact(prepared.artifacts.diagnostics.digest, controller.signal)
    commitment.value = prepared
    diagnostics.value = diagnosticArtifact
    await refreshRuns()
    state.value = 'idle'
    announcement.value = 'Model and predictions were committed before any held-out values were disclosed.'
  } catch (error) {
    fail(error, 'Challenge commitment failed.')
  }
}

async function discloseChallenge() {
  if (!receipt.value) return
  state.value = 'disclosing'
  message.value = ''
  try {
    const completed = await discloseChallengeCommitment(receipt.value.commitment_digest, controller.signal)
    report.value = completed
    await refreshRuns()
    state.value = 'idle'
    announcement.value = `Challenge disclosure and scoring completed with overall result ${completed.producer_result.conclusion}.`
    await nextTick()
    resultPanel.value?.focus()
  } catch (error) {
    fail(error, 'Challenge disclosure or scoring failed.')
  }
}

async function openReport(resultDigest) {
  state.value = 'opening'
  message.value = ''
  try {
    const completed = await loadChallengeReport(resultDigest, controller.signal)
    const diagnosticArtifact = await loadChallengeArtifact(completed.artifact_refs.diagnostics.digest, controller.signal)
    report.value = completed
    commitment.value = undefined
    diagnostics.value = diagnosticArtifact
    replay.value = undefined
    state.value = 'idle'
    announcement.value = `Opened bounded challenge report ${resultDigest}.`
    await nextTick()
    resultPanel.value?.focus()
  } catch (error) {
    fail(error, 'Challenge report could not be opened.')
  }
}

async function checkIntegrity() {
  state.value = 'checking'
  message.value = ''
  try {
    integrity.value = await verifyChallengeIntegrity(controller.signal)
    status.value = await loadChallengeStatus(controller.signal)
    state.value = integrity.value.status === 'failed' ? 'failed' : 'idle'
    if (integrity.value.status === 'failed') message.value = integrity.value.findings?.join(' ') ?? 'Local challenge integrity failed.'
    announcement.value = `Local challenge integrity is ${integrity.value.status}.`
  } catch (error) {
    fail(error, 'Local challenge integrity verification failed.')
  }
}

async function replayOffline() {
  if (!report.value) return
  state.value = 'replaying'
  message.value = ''
  try {
    replay.value = await replayChallengeReport(report.value.producer_result.result_digest, controller.signal)
    state.value = 'idle'
    announcement.value = 'The stored report replay passed with network access disabled.'
  } catch (error) {
    fail(error, 'Offline report replay failed.')
  }
}

function endpointName(endpointId) {
  return endpointNames[endpointId] ?? endpointId
}

function locatorText(locator) {
  return `PDF p. ${locator.pdf_page} · printed p. ${locator.printed_page} · ${locator.section} ¶${locator.paragraph}${locator.continuation ? ' (continued)' : ''}`
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
Panel(title-id="challenge-title" title="Frozen APAP challenge workbench" eyebrow="13 · External challenge" :status="stateLabel" :tone="stateTone")
  .notice.notice--warning.stack.stack--tight(role="note" aria-label="Challenge scientific boundary")
    strong Two aggregate parent-APAP Cmax endpoints only
    p One frozen 325 mg oral mapping, 50 L normalization, exact 20-time sampling grid, and predeclared absolute-relative-error threshold.
    p #[strong No broad model validation.] No clinical, treatment, dose-selection, safety, or bioequivalence claim.
  ul.plain-list.cluster(aria-label="Excluded claims")
    li.badge.badge--warning Clinical use excluded
    li.badge.badge--warning Treatment guidance excluded
    li.badge.badge--warning Bioequivalence claim excluded

  .notice.notice--danger.stack.stack--tight(v-if="message" role="alert")
    strong Challenge operation stopped
    p {{ message }}
  p.visually-hidden(role="status" aria-atomic="true") {{ announcement }}

  .card.repel
    .stack.stack--tight
      strong {{ ready ? 'Verified local challenge snapshot ready' : status?.state === 'empty' ? 'Explicit synchronization required' : 'Challenge consumer unavailable' }}
      p.muted(v-if="status") release {{ status.releaseId ?? 'not synchronized' }} · integrity {{ status.integrity }}
      p.muted(v-else) Loading isolated consumer status.
    button.button(v-if="status?.state === 'empty'" type="button" :disabled="busy" @click="synchronize") {{ state === 'syncing' ? 'Synchronizing…' : 'Synchronize signed challenge' }}
    button.button.button--secondary(v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="initialize") Reload failed status

  template(v-if="discovery")
    dl.facts(aria-label="Challenge identity pins")
      div
        dt Release pin
        dd
          | {{ discovery.pins.releaseId }}
          code {{ discovery.pins.releaseDigest }}
      div
        dt Model pin
        dd
          | {{ frozen?.consumer_id ?? 'Not frozen' }}
          code {{ frozen?.consumer_model_digest ?? 'Created before disclosure' }}
      div
        dt Commitment pin
        dd
          | {{ receipt ? 'Frozen' : 'Not created' }}
          code {{ receipt?.commitment_digest ?? 'No commitment digest' }}
      div
        dt Disclosure pin
        dd
          | {{ report ? report.lineage.disclosed_at : 'Not disclosed' }}
          code {{ report?.disclosure.disclosure_digest ?? 'No held-out read' }}
      div
        dt Result pin
        dd
          | {{ resultConclusion ?? 'Not scored' }}
          code {{ report?.producer_result.result_digest ?? 'No result digest' }}

    details.card.stack
      summary Verified release and protocol closure
      dl.facts.facts--rows
        div
          dt Catalog
          dd
            code {{ discovery.pins.catalogDigest }}
        div
          dt Trust
          dd
            code {{ discovery.pins.trustDigest }}
        div
          dt Manifest
          dd
            code {{ discovery.pins.manifestDigest }}
        div
          dt Envelope
          dd
            code {{ discovery.pins.envelopeDigest }}
        div
          dt Signer
          dd {{ discovery.pins.signerKeyId }} · #[code {{ discovery.pins.signerPublicKey }}]
        div
          dt Held-out partition
          dd {{ discovery.pins.partitionId }} · #[code {{ discovery.pins.partitionDigest }}]
        div
          dt Sampling grid
          dd
            code {{ discovery.pins.samplingGridDigest }}

  .grid(v-if="ready")
    Panel(title-id="challenge-freeze-title" title="1. Freeze model and predictions" eyebrow="Commit before outcome access" :level="3")
      p The server builds and persists the model, equation set, parameter policy, concentration mapping, solver, software, diagnostics, prediction, and public-lineage artifacts before requesting disclosure.
      div
        button.button(type="button" :disabled="busy" data-testid="challenge-freeze" @click="freezeChallenge") {{ commitment ? 'Retry exact commitment' : state === 'freezing' ? 'Freezing…' : 'Freeze challenge commitment' }}

      .notice.notice--success.stack.stack--tight(v-if="receipt" data-testid="challenge-commitment")
        strong Committed before disclosure
        p
          code {{ receipt.commitment_digest }}
        p created {{ receipt.created_at }} · committed {{ receipt.committed_at }}
        p prediction artifact #[code {{ commitment?.artifacts.prediction.digest ?? report?.artifact_refs.prediction.digest }}]

      Panel(v-if="frozen" title-id="challenge-predictions-title" title="Frozen predictions" :level="4" data-testid="challenge-predictions")
        p.muted Predicted model outputs. These are not measured observations.
        ul.plain-list.grid
          li.card.stack.stack--tight(v-for="prediction in frozen.predictions" :key="prediction.endpoint_id")
            p.eyebrow predicted
            p #[strong {{ endpointName(prediction.endpoint_id) }}]
            p #[strong {{ prediction.predicted_value }} {{ prediction.predicted_unit }}]
            p.muted maximum at {{ prediction.predicted_time_h }} h · {{ prediction.endpoint_id }}

      p.notice.notice--warning(v-if="frozen && !report" role="status") Measured outcomes remain undisclosed. No measured value, uncertainty, score, or result is present in this view.
      div(v-if="receipt && !report")
        button.button(type="button" :disabled="busy" data-testid="challenge-disclose" @click="discloseChallenge") {{ state === 'disclosing' ? 'Disclosing and scoring…' : 'Disclose held-out observations and score' }}

    Panel(title-id="challenge-local-title" title="Integrity and offline replay" eyebrow="Local evidence controls" :level="3")
      p Integrity rehashes the local immutable closure. Replay recomputes disclosure binding and independent scoring from stored artifacts without network access.
      .cluster
        button.button.button--secondary(type="button" :disabled="busy" data-testid="challenge-integrity" @click="checkIntegrity") {{ state === 'checking' ? 'Checking…' : 'Verify local integrity' }}
        button.button.button--secondary(type="button" :disabled="busy || !report" data-testid="challenge-replay" @click="replayOffline") {{ state === 'replaying' ? 'Replaying…' : 'Replay result offline' }}
      dl.facts.facts--rows(v-if="integrity" data-testid="challenge-integrity-result")
        div
          dt Integrity
          dd {{ integrity.status }}
        div
          dt Artifacts
          dd {{ integrity.artifacts ?? 'unavailable' }}
        div
          dt Disclosure epochs
          dd {{ integrity.disclosureEpochs ?? 0 }}
        div
          dt Commitments / reports
          dd {{ integrity.commitments ?? 0 }} / {{ integrity.reports ?? 0 }}
      dl.facts.facts--rows(v-if="replay" data-testid="challenge-replay-result")
        div
          dt Verification
          dd {{ replay.verification }}
        div
          dt Network access
          dd {{ replay.network_access ? 'enabled' : 'disabled' }}

      h4 Recent immutable runs
      p(v-if="runs.length === 0") No local commitments yet.
      ul.plain-list.stack.stack--tight(v-else)
        li.repel(v-for="run in runs" :key="run.commitment_digest")
          .stack.stack--tight
            strong {{ run.result_digest ? 'Scored report' : run.disclosure_digest ? 'Disclosed' : 'Committed only' }}
            code {{ run.commitment_digest }}
          button.button.button--secondary(v-if="run.result_digest" type="button" :disabled="busy" @click="openReport(run.result_digest)") Open bounded report

  Panel(v-if="frozen && diagnostics" title-id="challenge-diagnostics-title" title="Numerical and mapping readiness" eyebrow="Pre-disclosure diagnostics" :level="3")
    p Diagnostics can establish execution eligibility; they are not biological validation.
    dl.facts.facts--rows
      div
        dt Diagnostics artifact
        dd
          code {{ diagnostics.artifactDigest }}
      div
        dt Submitted status
        dd {{ diagnosticStatus }}
      div
        dt Exact sampling grid
        dd {{ diagnosticContent?.sampling_grid.points.filter(item => item.matched).length }} / {{ diagnosticContent?.sampling_grid.points.length }} exact
      div
        dt Mass diagnostic
        dd {{ diagnosticContent?.mass.passed ? 'passed' : 'failed' }} · residual {{ diagnosticContent?.mass.residual }} · tolerance {{ diagnosticContent?.mass.tolerance }}
      div
        dt State diagnostic
        dd {{ diagnosticContent?.state.passed ? 'passed' : 'failed' }} · finite {{ diagnosticContent?.state.finite ? 'yes' : 'no' }} · non-negative {{ diagnosticContent?.state.non_negative ? 'yes' : 'no' }}

  template(v-if="report")
    section.notice.stack.stack--tight(ref="resultPanel" :class="resultTone[report.producer_result.conclusion]" aria-labelledby="challenge-result-title" data-testid="challenge-result" tabindex="-1")
      p.eyebrow Bounded overall result
      .repel
        h3#challenge-result-title {{ report.producer_result.conclusion }}
        span exactly two declared endpoints
      p {{ report.producer_result.bounded_conclusion }}
      p #[strong Interpretation boundary:] {{ report.scientific_boundary }}.
      p {{ CHALLENGE_CONCLUSION_BOUNDARY }}

    Panel(title-id="challenge-measured-title" title="Measured observations" eyebrow="Disclosed measured evidence" :level="3" data-testid="challenge-measured")
      p.muted Measured values remain distinct from predictions. The source reported no endpoint uncertainty, so none is inferred or displayed.
      ul.plain-list.grid
        li.card.stack.stack--tight(v-for="observation in report.disclosure.observations" :key="observation.endpoint_id")
          p.eyebrow measured · {{ observation.validation_state }}
          p #[strong {{ endpointName(observation.endpoint_id) }}]
          p #[strong {{ observation.normalized_value }} {{ observation.normalized_unit }}]
          p.muted reported {{ observation.reported_value }} {{ observation.reported_unit }} · {{ observation.transformation }} · n={{ observation.n }}
          dl.facts.facts--rows
            div
              dt Uncertainty
              dd {{ observation.uncertainty_reported ? 'Reported by source' : 'Absent: not reported in source' }}
            div
              dt Value locator
              dd {{ locatorText(observation.locator) }}
            div
              dt Sample-size locator
              dd {{ locatorText(observation.n_locator) }}
            div
              dt Source object
              dd
                code {{ observation.locator.source_object_id }}

    Panel(title-id="challenge-scoring-title" title="Errors against the frozen threshold" eyebrow="Independent endpoint scoring" :level="3")
      p Metric #[code {{ report.independent_scoring.metric }}]; threshold #[strong {{ report.independent_scoring.threshold }}]; {{ report.independent_scoring.rounding }}.
      ul.plain-list.grid
        li.card.stack.stack--tight(v-for="endpoint in report.independent_scoring.endpoint_results" :key="endpoint.endpoint_id")
          p #[strong {{ endpointName(endpoint.endpoint_id) }}]
          dl.facts.facts--rows
            div
              dt Absolute relative error
              dd {{ endpoint.absolute_relative_error ?? 'Not evaluable' }}
            div
              dt Endpoint threshold
              dd &lt;= {{ endpoint.threshold }}
            div
              dt Endpoint result
              dd
                span.badge(:class="supportTone[endpoint.support_label]") {{ endpoint.support_label }}
            div
              dt Diagnostic status
              dd {{ endpoint.diagnostic_status }}

    Panel(title-id="challenge-not-evaluable-title" title="All not-evaluable endpoints" eyebrow="Explicitly outside this result" :level="3" data-testid="challenge-not-evaluable")
      p.muted These outcomes are not silently omitted and cannot inherit support from the two Cmax scores.
      ol.plain-list.grid
        li.card.stack.stack--tight(v-for="item in report.not_evaluable" :key="item.id")
          strong {{ item.endpoint }}
          p {{ item.reason }}
          code {{ item.id }}
</template>
