<script setup vapor>
import { computed, onMounted, ref } from 'vue'
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
import { newCommitmentIntent } from '../commitment.js'
import { useMirror } from '../composables/useMirror.js'
import Badge from '../ui/Badge.vue'
import Disclosure from '../ui/Disclosure.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import SyncCard from '../ui/SyncCard.vue'
import ChallengeResult from './challenge/ChallengeResult.vue'
import FreezePanel from './challenge/FreezePanel.vue'
import IntegrityPanel from './challenge/IntegrityPanel.vue'

const runs = ref([])
const commitment = ref()
const report = ref()
const diagnostics = ref()
const replay = ref()
const freezeIntent = ref()

const refreshRuns = async ({ signal, fresh }) => {
  runs.value = fresh(await loadChallengeRuns(20, signal)).items
}
const mirror = useMirror({
  api: {
    discovery: (signal) => loadChallengeDiscovery(signal),
    status: (signal) => loadChallengeStatus(signal),
    sync: (signal) => syncChallenge(signal),
    integrity: (signal) => verifyChallengeIntegrity(signal)
  },
  loadLocal: refreshRuns,
  text: {
    load: 'Challenge status could not be loaded.',
    sync: 'Challenge synchronization failed.',
    synced: 'The signed challenge release was synchronized and verified locally.',
    integrity: 'Local challenge integrity verification failed.',
    integrityDone: (checked) => `Local challenge integrity is ${checked.status}.`
  }
})
const { flow, discovery, status, integrity, ready } = mirror
const { state, message, announcement, busy } = flow

const frozen = computed(() => report.value?.frozen_commitment ?? commitment.value?.frozenCommitment)
const receipt = computed(() => report.value?.commitment_receipt ?? commitment.value?.receipt)
const diagnosticContent = computed(() => diagnostics.value?.content?.diagnostics)
const conclusion = computed(() => report.value?.producer_result.conclusion)
const diagnosticStatus = computed(() => {
  const values = report.value?.endpoint_diagnostics.map((item) => item.status)
  if (!values) return diagnosticContent.value?.passed ? 'evaluable' : 'invalid-diagnostics'
  if (values.includes('invalid-mapping')) return 'invalid-mapping'
  if (values.includes('invalid-diagnostics')) return 'invalid-diagnostics'
  return 'evaluable'
})
const stateLabel = computed(() => {
  if (state.value === 'failed') return 'operation failed'
  if (conclusion.value) return conclusion.value
  if (busy.value) return state.value
  return status.value?.state ?? state.value
})
const stateTone = computed(() => {
  if (state.value === 'failed' || conclusion.value === 'failed' || status.value?.state === 'failed') return 'danger'
  if (conclusion.value === 'not-evaluable' || status.value?.state === 'empty') return 'warning'
  return 'success'
})

const pins = computed(() => {
  const { pins: fixed } = discovery.value
  return [
    { label: 'Release pin', value: fixed.releaseId, code: fixed.releaseDigest },
    { label: 'Model pin', value: frozen.value?.consumer_id ?? 'Not frozen', code: frozen.value?.consumer_model_digest ?? 'Created before disclosure' },
    { label: 'Commitment pin', value: receipt.value ? 'Frozen' : 'Not created', code: receipt.value?.commitment_digest ?? 'No commitment digest' },
    { label: 'Disclosure pin', value: report.value ? report.value.lineage.disclosed_at : 'Not disclosed', code: report.value?.disclosure.disclosure_digest ?? 'No held-out read' },
    { label: 'Result pin', value: conclusion.value ?? 'Not scored', code: report.value?.producer_result.result_digest ?? 'No result digest' }
  ]
})
const closure = computed(() => {
  const { pins: fixed } = discovery.value
  return [
    { label: 'Catalog', code: fixed.catalogDigest },
    { label: 'Trust', code: fixed.trustDigest },
    { label: 'Manifest', code: fixed.manifestDigest },
    { label: 'Envelope', code: fixed.envelopeDigest },
    { label: 'Signer', value: fixed.signerKeyId, code: fixed.signerPublicKey },
    { label: 'Held-out partition', value: fixed.partitionId, code: fixed.partitionDigest },
    { label: 'Sampling grid', code: fixed.samplingGridDigest }
  ]
})
const diagnosticFacts = computed(() => {
  const content = diagnosticContent.value
  const yesNo = (flag) => (flag ? 'yes' : 'no')
  return [
    { label: 'Diagnostics artifact', value: diagnostics.value.artifactDigest, mono: true },
    { label: 'Submitted status', value: diagnosticStatus.value },
    { label: 'Exact sampling grid', value: `${content?.sampling_grid.points.filter((item) => item.matched).length} / ${content?.sampling_grid.points.length} exact` },
    { label: 'Mass diagnostic', value: `${content?.mass.passed ? 'passed' : 'failed'} · residual ${content?.mass.residual} · tolerance ${content?.mass.tolerance}` },
    { label: 'State diagnostic', value: `${content?.state.passed ? 'passed' : 'failed'} · finite ${yesNo(content?.state.finite)} · non-negative ${yesNo(content?.state.non_negative)}` }
  ]
})

function freeze() {
  report.value = undefined
  replay.value = undefined
  commitment.value = undefined
  diagnostics.value = undefined
  freezeIntent.value ??= newCommitmentIntent()
  return flow.step('freezing', async (task) => {
    const prepared = task.fresh(await prepareChallengeCommitment(freezeIntent.value, task.signal))
    diagnostics.value = task.fresh(await loadChallengeArtifact(prepared.artifacts.diagnostics.digest, task.signal))
    commitment.value = prepared
    await refreshRuns(task)
  }, { announce: 'Model and predictions were committed before any held-out values were disclosed.', failure: 'Challenge commitment failed.' })
}

function disclose() {
  if (!receipt.value) return
  return flow.step('disclosing', async (task) => {
    report.value = task.fresh(await discloseChallengeCommitment(receipt.value.commitment_digest, task.signal))
    await refreshRuns(task)
  }, { announce: () => `Challenge disclosure and scoring completed with overall result ${report.value.producer_result.conclusion}.`, failure: 'Challenge disclosure or scoring failed.' })
}

function openReport(resultDigest) {
  return flow.step('opening', async (task) => {
    const opened = task.fresh(await loadChallengeReport(resultDigest, task.signal))
    diagnostics.value = task.fresh(await loadChallengeArtifact(opened.artifact_refs.diagnostics.digest, task.signal))
    report.value = opened
    commitment.value = undefined
    replay.value = undefined
  }, { announce: `Opened bounded challenge report ${resultDigest}.`, failure: 'Challenge report could not be opened.' })
}

function replayOffline() {
  if (!report.value) return
  return flow.step('replaying', async (task) => {
    replay.value = task.fresh(await replayChallengeReport(report.value.producer_result.result_digest, task.signal))
  }, { announce: 'The stored report replay passed with network access disabled.', failure: 'Offline report replay failed.' })
}

onMounted(mirror.initialize)
</script>

<template lang="pug">
Panel(title="Frozen APAP challenge workbench" title-id="challenge-title" eyebrow="13 · External challenge" :status="stateLabel" :tone="stateTone")
  Notice(tone="warning" role="note" aria-label="Challenge scientific boundary" title="Two aggregate parent-APAP Cmax endpoints only")
    p One frozen 325 mg oral mapping, 50 L normalization, exact 20-time sampling grid, and predeclared absolute-relative-error threshold.
    p #[strong No broad model validation.] No clinical, treatment, dose-selection, safety, or bioequivalence claim.
  ul.plain-list.cluster(aria-label="Excluded claims")
    li
      Badge(tone="warning" label="Clinical use excluded")
    li
      Badge(tone="warning" label="Treatment guidance excluded")
    li
      Badge(tone="warning" label="Bioequivalence claim excluded")

  ErrorNotice(v-if="message" title="Challenge operation stopped" :message="message")
  LiveMessage(:text="announcement")

  SyncCard(:status="status" :ready="ready" :busy="busy" :syncing="state === 'syncing'" ready-title="Verified local challenge snapshot ready" unavailable-title="Challenge consumer unavailable" sync-label="Synchronize signed challenge" syncing-label="Synchronizing…" @sync="mirror.synchronize" @reload="mirror.initialize")
    p.muted(v-if="status") release {{ status.releaseId ?? 'not synchronized' }} · integrity {{ status.integrity }}
    p.muted(v-else) Loading isolated consumer status.

  template(v-if="discovery")
    Facts(aria-label="Challenge identity pins" :items="pins")
    Disclosure(summary="Verified release and protocol closure" card)
      Facts(rows :items="closure")

  .grid(v-if="ready")
    FreezePanel(:commitment="commitment" :frozen="frozen" :receipt="receipt" :report="report" :state="state" :busy="busy" @freeze="freeze" @disclose="disclose")
    IntegrityPanel(:integrity="integrity" :replay="replay" :runs="runs" :report="report" :state="state" :busy="busy" @check="mirror.checkIntegrity" @replay="replayOffline" @open="openReport")

  Panel(v-if="frozen && diagnostics" title="Numerical and mapping readiness" title-id="challenge-diagnostics-title" eyebrow="Pre-disclosure diagnostics" :level="3")
    p Diagnostics can establish execution eligibility; they are not biological validation.
    Facts(rows :items="diagnosticFacts")

  ChallengeResult(v-if="report" :report="report")
</template>
