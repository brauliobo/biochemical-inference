<script setup>
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
const stateClass = computed(() => {
  if (state.value === 'failed' || resultConclusion.value === 'failed' || status.value?.state === 'failed') return 'failed'
  if (resultConclusion.value === 'not-evaluable' || status.value?.state === 'empty') return 'not-evaluable'
  return 'ready'
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

<template>
  <section class="challenge-workbench" aria-labelledby="challenge-title">
    <div class="section-heading">
      <div>
        <p class="kicker">13 · External challenge</p>
        <h2 id="challenge-title">Frozen APAP challenge workbench</h2>
      </div>
      <span class="status-chip" :class="stateClass" aria-live="polite">{{ stateLabel }}</span>
    </div>

    <div class="challenge-boundary" role="note" aria-label="Challenge scientific boundary">
      <div>
        <strong>Two aggregate parent-APAP Cmax endpoints only</strong>
        <p>One frozen 325 mg oral mapping, 50 L normalization, exact 20-time sampling grid, and predeclared absolute-relative-error threshold.</p>
      </div>
      <p><strong>No broad model validation.</strong> No clinical, treatment, dose-selection, safety, or bioequivalence claim.</p>
    </div>

    <div class="challenge-exclusions" aria-label="Excluded claims">
      <span>Clinical use excluded</span>
      <span>Treatment guidance excluded</span>
      <span>Bioequivalence claim excluded</span>
    </div>

    <div v-if="message" class="alert error" role="alert">
      <strong>Challenge operation stopped</strong>
      <p>{{ message }}</p>
    </div>

    <div class="challenge-state-strip">
      <div>
        <strong>{{ ready ? 'Verified local challenge snapshot ready' : status?.state === 'empty' ? 'Explicit synchronization required' : 'Challenge consumer unavailable' }}</strong>
        <span v-if="status">release {{ status.releaseId ?? 'not synchronized' }} · integrity {{ status.integrity }}</span>
        <span v-else>Loading isolated consumer status.</span>
      </div>
      <button v-if="status?.state === 'empty'" type="button" :disabled="busy" @click="synchronize">{{ state === 'syncing' ? 'Synchronizing…' : 'Synchronize signed challenge' }}</button>
      <button v-else-if="status?.state === 'failed'" type="button" :disabled="busy" @click="initialize">Reload failed status</button>
    </div>

    <template v-if="discovery">
      <dl class="challenge-pin-grid" aria-label="Challenge identity pins">
        <div>
          <dt>Release pin</dt>
          <dd>{{ discovery.pins.releaseId }}<code>{{ discovery.pins.releaseDigest }}</code></dd>
        </div>
        <div>
          <dt>Model pin</dt>
          <dd>{{ frozen?.consumer_id ?? 'Not frozen' }}<code>{{ frozen?.consumer_model_digest ?? 'Created before disclosure' }}</code></dd>
        </div>
        <div>
          <dt>Commitment pin</dt>
          <dd>{{ receipt ? 'Frozen' : 'Not created' }}<code>{{ receipt?.commitment_digest ?? 'No commitment digest' }}</code></dd>
        </div>
        <div>
          <dt>Disclosure pin</dt>
          <dd>{{ report ? report.lineage.disclosed_at : 'Not disclosed' }}<code>{{ report?.disclosure.disclosure_digest ?? 'No held-out read' }}</code></dd>
        </div>
        <div>
          <dt>Result pin</dt>
          <dd>{{ resultConclusion ?? 'Not scored' }}<code>{{ report?.producer_result.result_digest ?? 'No result digest' }}</code></dd>
        </div>
      </dl>

      <details class="challenge-closure">
        <summary>Verified release and protocol closure</summary>
        <dl>
          <div><dt>Catalog</dt><dd><code>{{ discovery.pins.catalogDigest }}</code></dd></div>
          <div><dt>Trust</dt><dd><code>{{ discovery.pins.trustDigest }}</code></dd></div>
          <div><dt>Manifest</dt><dd><code>{{ discovery.pins.manifestDigest }}</code></dd></div>
          <div><dt>Envelope</dt><dd><code>{{ discovery.pins.envelopeDigest }}</code></dd></div>
          <div><dt>Signer</dt><dd>{{ discovery.pins.signerKeyId }} · <code>{{ discovery.pins.signerPublicKey }}</code></dd></div>
          <div><dt>Held-out partition</dt><dd>{{ discovery.pins.partitionId }} · <code>{{ discovery.pins.partitionDigest }}</code></dd></div>
          <div><dt>Sampling grid</dt><dd><code>{{ discovery.pins.samplingGridDigest }}</code></dd></div>
        </dl>
      </details>
    </template>

    <div v-if="ready" class="challenge-control-grid">
      <section class="challenge-freeze" aria-labelledby="challenge-freeze-title">
        <p class="kicker">Commit before outcome access</p>
        <h3 id="challenge-freeze-title">1. Freeze model and predictions</h3>
        <p>The server builds and persists the model, equation set, parameter policy, concentration mapping, solver, software, diagnostics, prediction, and public-lineage artifacts before requesting disclosure.</p>
        <button type="button" :disabled="busy" data-testid="challenge-freeze" @click="freezeChallenge">{{ commitment ? 'Retry exact commitment' : state === 'freezing' ? 'Freezing…' : 'Freeze challenge commitment' }}</button>

        <div v-if="receipt" class="challenge-receipt" data-testid="challenge-commitment">
          <strong>Committed before disclosure</strong>
          <code>{{ receipt.commitment_digest }}</code>
          <span>created {{ receipt.created_at }} · committed {{ receipt.committed_at }}</span>
          <span>prediction artifact <code>{{ commitment?.artifacts.prediction.digest ?? report?.artifact_refs.prediction.digest }}</code></span>
        </div>

        <section v-if="frozen" class="challenge-predictions" aria-labelledby="challenge-predictions-title" data-testid="challenge-predictions">
          <h3 id="challenge-predictions-title">Frozen predictions</h3>
          <p>Predicted model outputs. These are not measured observations.</p>
          <ul>
            <li v-for="prediction in frozen.predictions" :key="prediction.endpoint_id">
              <span>predicted</span>
              <strong>{{ endpointName(prediction.endpoint_id) }}</strong>
              <b>{{ prediction.predicted_value }} {{ prediction.predicted_unit }}</b>
              <small>maximum at {{ prediction.predicted_time_h }} h · {{ prediction.endpoint_id }}</small>
            </li>
          </ul>
        </section>

        <p v-if="frozen && !report" class="challenge-undisclosed" role="status">Measured outcomes remain undisclosed. No measured value, uncertainty, score, or result is present in this view.</p>
        <button v-if="receipt && !report" type="button" :disabled="busy" data-testid="challenge-disclose" @click="discloseChallenge">{{ state === 'disclosing' ? 'Disclosing and scoring…' : 'Disclose held-out observations and score' }}</button>
      </section>

      <section class="challenge-local" aria-labelledby="challenge-local-title">
        <p class="kicker">Local evidence controls</p>
        <h3 id="challenge-local-title">Integrity and offline replay</h3>
        <p>Integrity rehashes the local immutable closure. Replay recomputes disclosure binding and independent scoring from stored artifacts without network access.</p>
        <div class="challenge-actions">
          <button type="button" :disabled="busy" data-testid="challenge-integrity" @click="checkIntegrity">{{ state === 'checking' ? 'Checking…' : 'Verify local integrity' }}</button>
          <button type="button" :disabled="busy || !report" data-testid="challenge-replay" @click="replayOffline">{{ state === 'replaying' ? 'Replaying…' : 'Replay result offline' }}</button>
        </div>
        <dl v-if="integrity" class="challenge-control-result" data-testid="challenge-integrity-result">
          <div><dt>Integrity</dt><dd>{{ integrity.status }}</dd></div>
          <div><dt>Artifacts</dt><dd>{{ integrity.artifacts ?? 'unavailable' }}</dd></div>
          <div><dt>Disclosure epochs</dt><dd>{{ integrity.disclosureEpochs ?? 0 }}</dd></div>
          <div><dt>Commitments / reports</dt><dd>{{ integrity.commitments ?? 0 }} / {{ integrity.reports ?? 0 }}</dd></div>
        </dl>
        <dl v-if="replay" class="challenge-control-result" data-testid="challenge-replay-result">
          <div><dt>Verification</dt><dd>{{ replay.verification }}</dd></div>
          <div><dt>Network access</dt><dd>{{ replay.network_access ? 'enabled' : 'disabled' }}</dd></div>
        </dl>

        <h3>Recent immutable runs</h3>
        <p v-if="runs.length === 0">No local commitments yet.</p>
        <ul v-else class="challenge-runs">
          <li v-for="run in runs" :key="run.commitment_digest">
            <div><strong>{{ run.result_digest ? 'Scored report' : run.disclosure_digest ? 'Disclosed' : 'Committed only' }}</strong><code>{{ run.commitment_digest }}</code></div>
            <button v-if="run.result_digest" type="button" :disabled="busy" @click="openReport(run.result_digest)">Open bounded report</button>
          </li>
        </ul>
      </section>
    </div>

    <section v-if="frozen && diagnostics" class="challenge-diagnostics" aria-labelledby="challenge-diagnostics-title">
      <div>
        <p class="kicker">Pre-disclosure diagnostics</p>
        <h3 id="challenge-diagnostics-title">Numerical and mapping readiness</h3>
        <p>Diagnostics can establish execution eligibility; they are not biological validation.</p>
      </div>
      <dl>
        <div><dt>Diagnostics artifact</dt><dd><code>{{ diagnostics.artifactDigest }}</code></dd></div>
        <div><dt>Submitted status</dt><dd>{{ diagnosticStatus }}</dd></div>
        <div><dt>Exact sampling grid</dt><dd>{{ diagnosticContent?.sampling_grid.points.filter(item => item.matched).length }} / {{ diagnosticContent?.sampling_grid.points.length }} exact</dd></div>
        <div><dt>Mass diagnostic</dt><dd>{{ diagnosticContent?.mass.passed ? 'passed' : 'failed' }} · residual {{ diagnosticContent?.mass.residual }} · tolerance {{ diagnosticContent?.mass.tolerance }}</dd></div>
        <div><dt>State diagnostic</dt><dd>{{ diagnosticContent?.state.passed ? 'passed' : 'failed' }} · finite {{ diagnosticContent?.state.finite ? 'yes' : 'no' }} · non-negative {{ diagnosticContent?.state.non_negative ? 'yes' : 'no' }}</dd></div>
      </dl>
    </section>

    <template v-if="report">
      <section ref="resultPanel" class="challenge-result" :class="report.producer_result.conclusion" aria-labelledby="challenge-result-title" data-testid="challenge-result" tabindex="-1">
        <p class="kicker">Bounded overall result</p>
        <div class="challenge-result-heading">
          <h3 id="challenge-result-title">{{ report.producer_result.conclusion }}</h3>
          <span>exactly two declared endpoints</span>
        </div>
        <p>{{ report.producer_result.bounded_conclusion }}</p>
        <p><strong>Interpretation boundary:</strong> {{ report.scientific_boundary }}.</p>
        <p>{{ CHALLENGE_CONCLUSION_BOUNDARY }}</p>
      </section>

      <section class="challenge-measured" aria-labelledby="challenge-measured-title" data-testid="challenge-measured">
        <p class="kicker">Disclosed measured evidence</p>
        <h3 id="challenge-measured-title">Measured observations</h3>
        <p>Measured values remain distinct from predictions. The source reported no endpoint uncertainty, so none is inferred or displayed.</p>
        <ul>
          <li v-for="observation in report.disclosure.observations" :key="observation.endpoint_id">
            <span>measured · {{ observation.validation_state }}</span>
            <strong>{{ endpointName(observation.endpoint_id) }}</strong>
            <b>{{ observation.normalized_value }} {{ observation.normalized_unit }}</b>
            <small>reported {{ observation.reported_value }} {{ observation.reported_unit }} · {{ observation.transformation }} · n={{ observation.n }}</small>
            <dl>
              <div><dt>Uncertainty</dt><dd>{{ observation.uncertainty_reported ? 'Reported by source' : 'Absent: not reported in source' }}</dd></div>
              <div><dt>Value locator</dt><dd>{{ locatorText(observation.locator) }}</dd></div>
              <div><dt>Sample-size locator</dt><dd>{{ locatorText(observation.n_locator) }}</dd></div>
              <div><dt>Source object</dt><dd><code>{{ observation.locator.source_object_id }}</code></dd></div>
            </dl>
          </li>
        </ul>
      </section>

      <section class="challenge-scoring" aria-labelledby="challenge-scoring-title">
        <p class="kicker">Independent endpoint scoring</p>
        <h3 id="challenge-scoring-title">Errors against the frozen threshold</h3>
        <p>Metric <code>{{ report.independent_scoring.metric }}</code>; threshold <strong>{{ report.independent_scoring.threshold }}</strong>; {{ report.independent_scoring.rounding }}.</p>
        <ul>
          <li v-for="endpoint in report.independent_scoring.endpoint_results" :key="endpoint.endpoint_id">
            <strong>{{ endpointName(endpoint.endpoint_id) }}</strong>
            <dl>
              <div><dt>Absolute relative error</dt><dd>{{ endpoint.absolute_relative_error ?? 'Not evaluable' }}</dd></div>
              <div><dt>Endpoint threshold</dt><dd>&lt;= {{ endpoint.threshold }}</dd></div>
              <div><dt>Endpoint result</dt><dd :class="endpoint.support_label">{{ endpoint.support_label }}</dd></div>
              <div><dt>Diagnostic status</dt><dd>{{ endpoint.diagnostic_status }}</dd></div>
            </dl>
          </li>
        </ul>
      </section>

      <section class="challenge-not-evaluable" aria-labelledby="challenge-not-evaluable-title" data-testid="challenge-not-evaluable">
        <p class="kicker">Explicitly outside this result</p>
        <h3 id="challenge-not-evaluable-title">All not-evaluable endpoints</h3>
        <p>These outcomes are not silently omitted and cannot inherit support from the two Cmax scores.</p>
        <ol>
          <li v-for="item in report.not_evaluable" :key="item.id">
            <strong>{{ item.endpoint }}</strong>
            <p>{{ item.reason }}</p>
            <code>{{ item.id }}</code>
          </li>
        </ol>
      </section>
    </template>

    <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </section>
</template>

<style scoped>
.challenge-workbench { grid-column: 1 / -1; min-width: 0; max-width: 100%; overflow: hidden; background: linear-gradient(145deg, rgba(18, 31, 29, .98), rgba(30, 31, 24, .95)); }
.challenge-boundary { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(260px, .75fr); gap: 1rem; padding: 1rem; border: 1px solid var(--amber); border-left: 5px solid var(--danger); background: #211a16; }
.challenge-boundary p { margin: .35rem 0 0; color: #d6b99c; font-size: .84rem; line-height: 1.55; }
.challenge-exclusions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin-top: 1px; background: var(--line); }
.challenge-exclusions span { padding: .7rem; background: #141c19; color: var(--amber); font: .7rem ui-monospace, monospace; text-align: center; text-transform: uppercase; }
.challenge-state-strip { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; padding: 1rem; border: 1px solid #3e625b; background: #0d1917; }
.challenge-state-strip div { display: grid; gap: .3rem; }
.challenge-state-strip span { color: var(--muted); font-size: .78rem; }
button { min-height: 44px; padding: .7rem .9rem; border: 1px solid #4b6b64; border-radius: 2px; background: #172824; color: var(--ink); font-weight: 700; }
button:hover:not(:disabled) { border-color: var(--lime); }
button:disabled { cursor: not-allowed; opacity: .5; }
.status-chip.not-evaluable { border-color: var(--amber); color: var(--amber); }
.challenge-pin-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 1px; margin: 1rem 0 0; background: var(--line); }
.challenge-pin-grid > div { min-width: 0; padding: .85rem; background: #10201d; }
.challenge-pin-grid dd { min-height: 2.8rem; overflow-wrap: anywhere; }
.challenge-pin-grid code { display: block; margin-top: .45rem; color: var(--muted); }
.challenge-closure { margin-top: 1px; padding: .85rem; border: 1px solid var(--line); background: #0e1917; }
.challenge-closure summary { cursor: pointer; font-weight: 700; }
.challenge-closure dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .7rem; }
.challenge-closure dd { overflow-wrap: anywhere; }
.challenge-control-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, .65fr); gap: 1rem; margin-top: 1rem; }
.challenge-freeze, .challenge-local, .challenge-diagnostics, .challenge-result, .challenge-measured, .challenge-scoring, .challenge-not-evaluable { min-width: 0; padding: 1rem; border: 1px solid var(--line); background: #0f1a18; }
.challenge-freeze h3, .challenge-local h3, .challenge-diagnostics h3, .challenge-result h3, .challenge-measured h3, .challenge-scoring h3, .challenge-not-evaluable h3 { margin-top: .25rem; }
.challenge-freeze > p, .challenge-local > p, .challenge-diagnostics p, .challenge-result p, .challenge-measured > p, .challenge-scoring > p, .challenge-not-evaluable > p { color: var(--muted); font-size: .84rem; line-height: 1.55; }
.challenge-receipt { display: grid; gap: .4rem; margin: 1rem 0; padding: 1rem; border: 1px solid var(--mint); background: #10231f; }
.challenge-receipt span { color: var(--muted); font-size: .76rem; }
.challenge-predictions ul, .challenge-measured ul, .challenge-scoring ul, .challenge-runs { display: grid; gap: .65rem; margin: 0; padding: 0; list-style: none; }
.challenge-predictions ul, .challenge-measured ul, .challenge-scoring ul { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.challenge-predictions li, .challenge-measured li, .challenge-scoring li { display: grid; min-width: 0; gap: .45rem; padding: 1rem; border: 1px solid var(--line); background: #111d1b; }
.challenge-predictions li > span, .challenge-measured li > span { color: var(--mint); font: .68rem ui-monospace, monospace; text-transform: uppercase; }
.challenge-predictions b, .challenge-measured b { color: var(--lime); font-size: 1.25rem; }
.challenge-predictions small, .challenge-measured small { color: var(--muted); line-height: 1.5; }
.challenge-undisclosed { padding: .8rem; border-left: 3px solid var(--amber); background: #211b14; color: #dfc09f !important; }
.challenge-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; }
.challenge-control-result, .challenge-measured dl, .challenge-scoring dl, .challenge-diagnostics dl { margin: 1rem 0 0; }
.challenge-control-result div, .challenge-measured dl div, .challenge-scoring dl div, .challenge-diagnostics dl div { display: flex; justify-content: space-between; gap: 1rem; padding: .45rem 0; border-bottom: 1px solid var(--line); }
.challenge-control-result dd, .challenge-measured dl dd, .challenge-scoring dl dd, .challenge-diagnostics dl dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
.challenge-runs li { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: .7rem; padding: .7rem; border: 1px solid var(--line); }
.challenge-runs li div { display: grid; min-width: 0; gap: .25rem; }
.challenge-diagnostics { display: grid; grid-template-columns: minmax(240px, .6fr) minmax(0, 1.4fr); gap: 1.5rem; margin-top: 1rem; }
.challenge-diagnostics dl { margin: 0; }
.challenge-result, .challenge-measured, .challenge-scoring, .challenge-not-evaluable { margin-top: 1rem; }
.challenge-result:focus-visible { outline: 3px solid var(--lime); outline-offset: 3px; }
.challenge-result.failed { border: 2px solid var(--danger); background: #261817; }
.challenge-result.not-evaluable { border: 2px solid var(--amber); background: #211b14; }
.challenge-result.supported-within-boundary { border: 2px solid var(--mint); }
.challenge-result-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
.challenge-result-heading h3 { color: var(--danger); font: 800 clamp(2rem, 5vw, 4.2rem)/1 ui-monospace, monospace; letter-spacing: -.06em; text-transform: uppercase; }
.challenge-result.not-evaluable h3 { color: var(--amber); }
.challenge-result.supported-within-boundary h3 { color: var(--mint); }
.challenge-result-heading span { color: var(--muted); font-size: .78rem; }
.challenge-measured { border-top: 3px solid var(--lime); }
.challenge-scoring { border-top: 3px solid var(--danger); }
.challenge-scoring dd.unsupported { color: var(--danger); }
.challenge-scoring dd.not-evaluable { color: var(--amber); }
.challenge-scoring dd.supported-within-boundary { color: var(--mint); }
.challenge-not-evaluable ol { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; margin: 0; padding: 0; list-style: none; counter-reset: excluded; }
.challenge-not-evaluable li { min-width: 0; padding: 1rem; border-left: 3px solid var(--amber); background: #181b17; counter-increment: excluded; }
.challenge-not-evaluable li strong::before { content: counter(excluded, decimal-leading-zero) " · "; color: var(--amber); }
.challenge-not-evaluable li p { color: var(--muted); font-size: .8rem; line-height: 1.5; }

@media (max-width: 1100px) {
  .challenge-pin-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .challenge-boundary, .challenge-exclusions, .challenge-control-grid, .challenge-closure dl, .challenge-predictions ul, .challenge-measured ul, .challenge-scoring ul, .challenge-diagnostics, .challenge-not-evaluable ol { grid-template-columns: minmax(0, 1fr); }
  .challenge-pin-grid { grid-template-columns: minmax(0, 1fr); }
  .challenge-state-strip, .challenge-result-heading { display: grid; align-items: stretch; }
  .challenge-actions { grid-template-columns: minmax(0, 1fr); }
  .challenge-runs li { grid-template-columns: minmax(0, 1fr); }
  .challenge-control-result div, .challenge-measured dl div, .challenge-scoring dl div, .challenge-diagnostics dl div { display: grid; gap: .25rem; }
  .challenge-control-result dd, .challenge-measured dl dd, .challenge-scoring dl dd, .challenge-diagnostics dl dd { text-align: left; }
  .challenge-exclusions span { text-align: left; }
  button { width: 100%; }
}
</style>
