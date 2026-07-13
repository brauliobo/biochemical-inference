<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  cancelWorkspaceAttempt,
  cloneWorkspaceExperiment,
  compareWorkspaceAttempts,
  createWorkspaceExperiment,
  createWorkspaceReport,
  createWorkspaceRevision,
  exportWorkspaceExperiment,
  importWorkspaceExperiment,
  loadPortfolioModels,
  loadWorkspaceArtifacts,
  loadWorkspaceAttempt,
  loadWorkspaceCheckpoints,
  loadWorkspaceEvents,
  loadWorkspaceExperiment,
  loadWorkspaceExperiments,
  loadWorkspaceHistory,
  loadWorkspaceResourceProfiles,
  queueWorkspaceRun,
  restartWorkspaceCheckpoint
} from '../api.js'

const models = ref([])
const profiles = ref([])
const experiments = ref([])
const detail = ref()
const history = ref({ items: [], total: 0, limit: 50, offset: 0 })
const selectedAttempt = ref()
const events = ref([])
const artifacts = ref([])
const report = ref()
const comparison = ref()
const state = ref('loading')
const message = ref('')
const exportHref = ref('')
const exportName = ref('experiment.zip')
const name = ref('Controlled first-order experiment')
const description = ref('Local, digest-pinned portfolio experiment.')
const modelId = ref('')
const resourceProfileId = ref('local-default')
const taxonId = ref('NCBITaxon:9606')
const tissueId = ref('')
const duration = ref(10)
const seed = ref(20260713)
const design = ref('single')
const ensembleMembers = ref(3)
const interventionTarget = ref('')
const interventionTime = ref(5)
const interventionValue = ref(5)
const numericalKind = ref('exact')
const absoluteTolerance = ref(1e-9)
const relativeTolerance = ref(1e-7)
const filters = ref({ status: '', release: '', model: '', taxon: '', tissue: '' })
let pollTimer
let controller

const model = computed(() => models.value.find((item) => item.id === modelId.value))
const latestRevision = computed(() => detail.value?.revisions.at(-1))
const activeAttempts = computed(() => history.value.items.filter((item) => item.attempt.state !== 'terminal'))
const successfulAttempts = computed(() => history.value.items.filter((item) => item.attempt.outcome === 'successful' && item.attempt.resultArtifactId))
const interventionTargets = computed(() => {
  if (!model.value) return []
  if (model.value.engine.type === 'fba') return model.value.definition.reactions.map((item) => ({ id: item.id, unit: item.unit }))
  return [...model.value.definition.species, ...model.value.definition.parameters].map((item) => ({ id: item.id, unit: item.unit }))
})

function setFailure(error, fallback) {
  state.value = 'failed'
  message.value = error instanceof Error ? error.message : fallback
}

function chooseModel() {
  interventionTarget.value = interventionTargets.value[0]?.id ?? ''
}

function portfolioExperiment(selected, entrySeed, interventions) {
  const controls = selected.engine.type === 'ode'
    ? { method: 'dormand-prince-5-4', timeUnit: 'second', duration: duration.value, outputInterval: 1, fixedStep: 0.1, absoluteTolerance: 1e-9, relativeTolerance: 1e-7, maxInternalSteps: 100000 }
    : selected.engine.type === 'ssa'
      ? { method: 'gillespie-direct', timeUnit: 'second', duration: duration.value, outputInterval: 1, replicates: 128, maxEventsPerReplicate: 100000 }
      : { method: 'two-phase-simplex', feasibilityTolerance: 1e-8, maxIterations: 10000 }
  return {
    contractVersion: '2.0.0',
    modelId: selected.id,
    modelDigest: selected.digest,
    knowledgeRelease: selected.knowledgeRelease,
    engine: { ...selected.engine, algorithm: controls.method, algorithmVersion: '1.0.0' },
    seed: entrySeed,
    assumptions: ['Registry values are used without substitution unless the immutable revision declares a portfolio variant.'],
    limitations: ['Workspace execution is a bounded numerical experiment, not a physiological or clinical prediction.'],
    interventions,
    controls
  }
}

function specification() {
  const selected = model.value
  const target = interventionTargets.value.find((item) => item.id === interventionTarget.value)
  const interventions = design.value === 'intervention-schedule' && target
    ? [{ targetId: target.id, time: selected.engine.type === 'fba' ? 0 : interventionTime.value, value: interventionValue.value, unit: target.unit }]
    : []
  const count = design.value === 'ensemble' ? ensembleMembers.value : 1
  const entries = Array.from({ length: count }, (_, index) => ({
    id: count === 1 ? 'primary' : `member_${index + 1}`,
    label: count === 1 ? 'Primary specification' : `Ensemble member ${index + 1}`,
    model: selected,
    experiment: portfolioExperiment(selected, (seed.value + index) >>> 0, interventions)
  }))
  const designContract = design.value === 'ensemble' ? { type: 'ensemble', members: count } : { type: design.value }
  return {
    contractVersion: '1.0.0',
    design: designContract,
    context: { taxonId: taxonId.value, tissueId: tissueId.value || null },
    entries,
    numericalContract: numericalKind.value === 'exact' ? { kind: 'exact' } : { kind: 'tolerance', absolute: absoluteTolerance.value, relative: relativeTolerance.value },
    tags: ['workspace']
  }
}

function applyRevision(revision) {
  const spec = revision.specification
  modelId.value = spec.entries[0].model.id
  taxonId.value = spec.context.taxonId
  tissueId.value = spec.context.tissueId ?? ''
  design.value = ['single', 'ensemble', 'intervention-schedule'].includes(spec.design.type) ? spec.design.type : 'single'
  ensembleMembers.value = spec.entries.length
  seed.value = spec.entries[0].experiment.seed
  duration.value = spec.entries[0].experiment.controls.duration ?? 10
  numericalKind.value = spec.numericalContract.kind
  if (spec.numericalContract.kind === 'tolerance') {
    absoluteTolerance.value = spec.numericalContract.absolute
    relativeTolerance.value = spec.numericalContract.relative
  }
  chooseModel()
  const intervention = spec.entries[0].experiment.interventions[0]
  if (intervention) {
    interventionTarget.value = intervention.targetId
    interventionTime.value = intervention.time
    interventionValue.value = intervention.value
  }
}

async function refreshHistory() {
  history.value = await loadWorkspaceHistory(filters.value)
  if (selectedAttempt.value) {
    const matching = history.value.items.find((item) => item.attempt.attemptId === selectedAttempt.value.attempt.attemptId)
    if (matching) selectedAttempt.value = await loadWorkspaceAttempt(matching.attempt.attemptId)
  }
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  try {
    const [loadedModels, loadedProfiles, loadedExperiments, loadedHistory] = await Promise.all([
      loadPortfolioModels(controller.signal),
      loadWorkspaceResourceProfiles(controller.signal),
      loadWorkspaceExperiments(controller.signal),
      loadWorkspaceHistory({}, controller.signal)
    ])
    models.value = loadedModels
    profiles.value = loadedProfiles
    experiments.value = loadedExperiments
    history.value = loadedHistory
    modelId.value ||= loadedModels[0]?.id ?? ''
    chooseModel()
    if (loadedExperiments[0]) await selectExperiment(loadedExperiments[0].experimentId)
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    setFailure(error, 'Experiment workspace could not be loaded.')
  }
}

async function selectExperiment(experimentId) {
  if (!experimentId) {
    detail.value = undefined
    name.value = 'Controlled first-order experiment'
    description.value = 'Local, digest-pinned portfolio experiment.'
    exportHref.value = ''
    message.value = ''
    return
  }
  detail.value = await loadWorkspaceExperiment(experimentId)
  name.value = detail.value.experiment.name
  description.value = detail.value.experiment.description
  applyRevision(detail.value.revisions.at(-1))
  exportHref.value = ''
  message.value = ''
}

async function createExperiment() {
  state.value = 'saving'
  try {
    detail.value = await createWorkspaceExperiment({ name: name.value, description: description.value, specification: specification(), resourceProfileId: resourceProfileId.value })
    experiments.value = await loadWorkspaceExperiments()
    state.value = 'ready'
    message.value = 'Experiment and immutable revision created.'
  } catch (error) {
    setFailure(error, 'Experiment could not be created.')
  }
}

async function saveRevision() {
  if (!detail.value) return createExperiment()
  state.value = 'saving'
  try {
    await createWorkspaceRevision(detail.value.experiment.experimentId, { specification: specification(), resourceProfileId: resourceProfileId.value })
    await selectExperiment(detail.value.experiment.experimentId)
    experiments.value = await loadWorkspaceExperiments()
    state.value = 'ready'
    message.value = 'A new immutable revision was created; prior revisions were retained.'
  } catch (error) {
    setFailure(error, 'Revision could not be created.')
  }
}

async function cloneExperiment() {
  if (!detail.value) return
  try {
    detail.value = await cloneWorkspaceExperiment(detail.value.experiment.experimentId)
    experiments.value = await loadWorkspaceExperiments()
    message.value = 'Experiment cloned with an independent immutable revision history.'
  } catch (error) {
    setFailure(error, 'Experiment could not be cloned.')
  }
}

async function queueRun() {
  if (!latestRevision.value) return
  try {
    const attempt = await queueWorkspaceRun(latestRevision.value.revisionId, resourceProfileId.value)
    await refreshHistory()
    await inspectAttempt(attempt.attemptId)
    message.value = 'Attempt queued. Its scientific identity is stable; this attempt identity is unique.'
  } catch (error) {
    setFailure(error, 'Run could not be queued.')
  }
}

async function inspectAttempt(attemptId) {
  selectedAttempt.value = await loadWorkspaceAttempt(attemptId)
  const [loadedEvents, loadedArtifacts] = await Promise.all([loadWorkspaceEvents(attemptId), loadWorkspaceArtifacts(attemptId)])
  events.value = loadedEvents
  artifacts.value = loadedArtifacts
  report.value = undefined
}

async function cancelAttempt() {
  if (!selectedAttempt.value) return
  try {
    await cancelWorkspaceAttempt(selectedAttempt.value.attempt.attemptId)
    await refreshHistory()
    await inspectAttempt(selectedAttempt.value.attempt.attemptId)
  } catch (error) {
    setFailure(error, 'Attempt could not be cancelled.')
  }
}

async function restartAttempt() {
  if (!selectedAttempt.value) return
  try {
    const checkpoints = await loadWorkspaceCheckpoints(selectedAttempt.value.attempt.attemptId)
    const attempt = await restartWorkspaceCheckpoint(checkpoints.at(-1).checkpointId, resourceProfileId.value)
    await refreshHistory()
    await inspectAttempt(attempt.attemptId)
    message.value = 'Restart queued from the exact specification checkpoint. No engine state was continued.'
  } catch (error) {
    setFailure(error, 'Specification restart could not be queued.')
  }
}

async function compareLatest() {
  if (successfulAttempts.value.length < 2) return
  try {
    comparison.value = await compareWorkspaceAttempts({ leftAttemptId: successfulAttempts.value[1].attempt.attemptId, rightAttemptId: successfulAttempts.value[0].attempt.attemptId, contract: { kind: 'tolerance', absolute: absoluteTolerance.value, relative: relativeTolerance.value } })
  } catch (error) {
    setFailure(error, 'Attempts could not be compared.')
  }
}

async function generateReport() {
  if (!selectedAttempt.value) return
  try {
    report.value = await createWorkspaceReport(selectedAttempt.value.attempt.attemptId)
    artifacts.value = await loadWorkspaceArtifacts(selectedAttempt.value.attempt.attemptId)
  } catch (error) {
    setFailure(error, 'Report could not be generated.')
  }
}

async function exportExperiment() {
  if (!detail.value) return
  try {
    const exported = await exportWorkspaceExperiment(detail.value.experiment.experimentId)
    exportName.value = exported.fileName
    exportHref.value = `data:application/zip;base64,${exported.bundleBase64}`
    message.value = 'Portable bundle verified and ready for download.'
  } catch (error) {
    setFailure(error, 'Experiment could not be exported.')
  }
}

async function importExperiment(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const bytes = new Uint8Array(await file.arrayBuffer())
    let binary = ''
    for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768))
    detail.value = await importWorkspaceExperiment(btoa(binary))
    experiments.value = await loadWorkspaceExperiments()
    applyRevision(detail.value.revisions.at(-1))
    message.value = 'Portable bundle imported. Reruns will be checked against its declared numerical contract.'
  } catch (error) {
    setFailure(error, 'Portable bundle could not be imported.')
  } finally {
    event.target.value = ''
  }
}

onMounted(() => {
  initialize()
  pollTimer = setInterval(async () => {
    if (activeAttempts.value.length === 0) return
    try {
      await refreshHistory()
      if (selectedAttempt.value) await inspectAttempt(selectedAttempt.value.attempt.attemptId)
    } catch {
      // Explicit actions surface errors; polling retains the last verified view.
    }
  }, 750)
})
onBeforeUnmount(() => {
  controller?.abort()
  clearInterval(pollTimer)
})
</script>

<template lang="pug">
section.experiment-workspace(aria-labelledby="experiment-workspace-title")
  .section-heading
    div
      p.kicker Controlled experiment workspace
      h2#experiment-workspace-title Durable local research runs
    span.status-chip(:class="state" aria-live="polite") {{ state }}
  p.workspace-intro Immutable specifications, distinct scientific and attempt identities, bounded child workers, exact specification restarts, content-addressed artifacts, and offline portable bundles.
  .alert.error(v-if="state === 'failed'" role="alert") {{ message }}
  .workspace-notice(v-else-if="message" role="status") {{ message }}

  .experiment-grid(v-if="models.length")
    form.experiment-editor(@submit.prevent="detail ? saveRevision() : createExperiment()")
      h3 {{ detail ? 'Edit as a new revision' : 'Create experiment' }}
      label(for="workspace-existing") Existing experiment
      select#workspace-existing(:value="detail?.experiment.experimentId ?? ''" @change="selectExperiment($event.target.value)")
        option(value="") New experiment
        option(v-for="item in experiments" :key="item.experimentId" :value="item.experimentId") {{ item.name }}
      label(for="workspace-name") Name
      input#workspace-name(v-model="name" maxlength="160" required)
      label(for="workspace-description") Description
      textarea#workspace-description(v-model="description" rows="3" maxlength="2000")
      label(for="workspace-model") Portfolio model
      select#workspace-model(v-model="modelId" @change="chooseModel")
        option(v-for="item in models" :key="item.id" :value="item.id") {{ item.name }}
      .experiment-inline
        div
          label(for="workspace-taxon") Taxon
          select#workspace-taxon(v-model="taxonId")
            option(value="NCBITaxon:9606") Human · NCBITaxon:9606
            option(value="NCBITaxon:10090") Mouse · NCBITaxon:10090
        div
          label(for="workspace-tissue") Tissue CURIE (optional)
          input#workspace-tissue(v-model="tissueId" placeholder="UBERON:0002107")
      label(for="workspace-design") Portfolio design
      select#workspace-design(v-model="design")
        option(value="single") Single specification
        option(value="ensemble") Seeded ensemble
        option(value="intervention-schedule") Intervention schedule
      template(v-if="design === 'ensemble'")
        label(for="workspace-members") Ensemble members
        input#workspace-members(v-model.number="ensembleMembers" type="number" min="2" max="8")
      template(v-if="design === 'intervention-schedule'")
        label(for="workspace-intervention-target") Assignment target
        select#workspace-intervention-target(v-model="interventionTarget")
          option(v-for="target in interventionTargets" :key="target.id" :value="target.id") {{ target.id }} · {{ target.unit.symbol }}
        .experiment-inline
          div
            label(for="workspace-intervention-time") Time
            input#workspace-intervention-time(v-model.number="interventionTime" type="number" min="0" :disabled="model.engine.type === 'fba'")
          div
            label(for="workspace-intervention-value") Assigned value
            input#workspace-intervention-value(v-model.number="interventionValue" type="number" min="0")
      .experiment-inline
        div(v-if="model.engine.type !== 'fba'")
          label(for="workspace-duration") Duration (s)
          input#workspace-duration(v-model.number="duration" type="number" min="1" max="100000")
        div
          label(for="workspace-seed") Seed
          input#workspace-seed(v-model.number="seed" type="number" min="0" max="4294967295")
      label(for="workspace-contract") Rerun contract
      select#workspace-contract(v-model="numericalKind")
        option(value="exact") Exact canonical result
        option(value="tolerance") Absolute + relative tolerance
      .experiment-inline(v-if="numericalKind === 'tolerance'")
        div
          label(for="workspace-absolute") Absolute tolerance
          input#workspace-absolute(v-model.number="absoluteTolerance" type="number" min="0" step="any")
        div
          label(for="workspace-relative") Relative tolerance
          input#workspace-relative(v-model.number="relativeTolerance" type="number" min="0" step="any")
      label(for="workspace-profile") Resource profile
      select#workspace-profile(v-model="resourceProfileId")
        option(v-for="item in profiles" :key="item.id" :value="item.id") {{ item.name }} · {{ item.concurrency }} workers · {{ item.memoryMb }} MB
      button.run-button(type="submit" :disabled="state === 'saving'")
        span {{ detail ? 'Create immutable revision' : 'Create experiment' }}
        span.arrow(aria-hidden="true") →

    .experiment-ledger
      h3 Revision ledger
      template(v-if="detail")
        p {{ detail.experiment.name }} · {{ detail.revisions.length }} immutable revision{{ detail.revisions.length === 1 ? '' : 's' }}
        ol.revision-list
          li(v-for="revision in detail.revisions" :key="revision.revisionId")
            strong Revision {{ revision.ordinal }} · {{ revision.source }}
            code {{ revision.specificationDigest }}
            span Snapshot {{ revision.snapshotDigest }}
        .experiment-actions
          button.run-button(type="button" @click="queueRun") Queue latest revision
          button.secondary(type="button" @click="cloneExperiment") Clone experiment
          button.secondary(type="button" @click="exportExperiment") Export portable ZIP
          label.import-button(for="workspace-import") Import portable ZIP
          input#workspace-import.visually-hidden(type="file" accept=".zip,application/zip" @change="importExperiment")
          a.secondary(v-if="exportHref" :href="exportHref" :download="exportName") Download {{ exportName }}
      .workspace-empty(v-else)
        strong No persisted experiment selected
        p Configure the form to create the first immutable revision, or import a verified portable ZIP.
        label.import-button(for="workspace-import-empty") Import portable ZIP
        input#workspace-import-empty.visually-hidden(type="file" accept=".zip,application/zip" @change="importExperiment")

  .history-panel
    .history-heading
      div
        h3 Queue and searchable history
        p {{ history.total }} attempt{{ history.total === 1 ? '' : 's' }}. Filters apply to immutable revision metadata.
      button.secondary(type="button" @click="refreshHistory") Refresh
    form.history-filters(@submit.prevent="refreshHistory")
      label(for="history-status") Status
      select#history-status(v-model="filters.status")
        option(value="") All
        option(value="queued") Queued
        option(value="running") Running
        option(value="successful") Successful
        option(value="failed") Failed
        option(value="resource-exhausted") Resource exhausted
        option(value="cancelled") Cancelled
      label(for="history-model") Model
      select#history-model(v-model="filters.model")
        option(value="") All
        option(v-for="item in models" :key="item.id" :value="item.id") {{ item.id }}
      label(for="history-taxon") Taxon
      select#history-taxon(v-model="filters.taxon")
        option(value="") All
        option(value="NCBITaxon:9606") Human
        option(value="NCBITaxon:10090") Mouse
      label(for="history-tissue") Tissue
      input#history-tissue(v-model="filters.tissue" placeholder="UBERON:...")
      label(for="history-release") Release
      input#history-release(v-model="filters.release" placeholder="release id")
      button.secondary(type="submit") Apply filters
    .history-table-wrap
      table
        caption Durable run attempts
        thead
          tr
            th(scope="col") Experiment
            th(scope="col") Attempt
            th(scope="col") Kind
            th(scope="col") State / outcome
            th(scope="col") Context
        tbody
          tr(v-for="item in history.items" :key="item.attempt.attemptId")
            th(scope="row")
              button.table-select(type="button" @click="inspectAttempt(item.attempt.attemptId)") {{ item.experimentName }}
            td
              code {{ item.attempt.attemptId }}
            td {{ item.attempt.kind }}{{ item.attempt.restartMode ? ' · from specification' : '' }}
            td
              span.status-chip(:class="item.attempt.outcome ?? item.attempt.state") {{ item.attempt.outcome ?? item.attempt.state }}
            td {{ item.taxonId }}{{ item.tissueId ? ` · ${item.tissueId}` : '' }}
          tr(v-if="history.items.length === 0")
            td(colspan="5") No attempts match these filters.

  article.attempt-inspector(v-if="selectedAttempt" aria-labelledby="attempt-title")
    .run-header
      div
        span.run-label#attempt-title Attempt identity
        code {{ selectedAttempt.attempt.attemptId }}
        span.run-label Scientific identity
        code {{ selectedAttempt.attempt.runId }}
      span.status-chip(:class="selectedAttempt.attempt.outcome ?? selectedAttempt.attempt.state") {{ selectedAttempt.attempt.outcome ?? selectedAttempt.attempt.state }}
    p.restart-boundary(v-if="selectedAttempt.attempt.kind === 'restart'") Restarted from the exact specification. This is not stateful continuation.
    .attempt-actions
      button.secondary(v-if="selectedAttempt.attempt.state !== 'terminal'" type="button" @click="cancelAttempt") Cancel attempt
      button.secondary(v-else type="button" @click="restartAttempt") Restart from specification
      button.secondary(v-if="selectedAttempt.attempt.resultArtifactId" type="button" @click="generateReport") Generate offline report
      button.secondary(v-if="successfulAttempts.length >= 2" type="button" @click="compareLatest") Compare latest successful attempts
    .attempt-columns
      section
        h3 Events
        ol.event-list
          li(v-for="event in events" :key="event.eventId")
            strong {{ event.sequence }} · {{ event.type }}
            time {{ event.at }}
      section
        h3 Artifacts
        ul.artifact-list
          li(v-for="artifact in artifacts" :key="artifact.artifactId")
            a(:href="`/api/v7/workspace/artifacts/${encodeURIComponent(artifact.artifactId)}`") {{ artifact.name }}
            span {{ artifact.bytes }} bytes · {{ artifact.digest }}
        p(v-if="artifacts.length === 0") No artifact has been atomically published.
    .comparison-result(v-if="comparison")
      strong Comparison {{ comparison.status }}
      p {{ comparison.specificationChanged ? 'Specifications changed.' : 'Specifications are identical.' }} {{ comparison.differences.length }} numeric difference{{ comparison.differences.length === 1 ? '' : 's' }} recorded.
    .report-links(v-if="report")
      strong Static offline report
      a(v-for="format in ['html', 'json', 'csv', 'svg']" :key="format" :href="`/api/v7/workspace/reports/${encodeURIComponent(report.reportId)}/files/${format}`" target="_blank" rel="noreferrer") {{ format.toUpperCase() }}
</template>
