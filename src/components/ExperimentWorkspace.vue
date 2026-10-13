<script setup vapor>
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
import DataTable from './ui/DataTable.vue'
import Field from './ui/Field.vue'
import Panel from './ui/Panel.vue'

const TONES = { ready: 'success', successful: 'success', failed: 'danger', 'resource-exhausted': 'danger', cancelled: 'warning' }
const statusTone = (value) => TONES[value] ?? ''
const statusClass = (value) => (statusTone(value) ? `badge--${statusTone(value)}` : '')

const registryModels = ref([])
const embeddedModels = ref([])
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
const modelKey = ref('')
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
const historyOffset = ref(0)
const historyLimit = 25
let pollTimer
let controller
let attemptController
let pollController
let attemptGeneration = 0
let pollGeneration = 0

const exactModelKey = (item) => `${item.id}|${item.digest}`
const models = computed(() => {
  const exactRegistry = new Set(registryModels.value.map(exactModelKey))
  return [...registryModels.value, ...embeddedModels.value.filter((item) => !exactRegistry.has(exactModelKey(item)))]
})
const model = computed(() => models.value.find((item) => exactModelKey(item) === modelKey.value))
const latestRevision = computed(() => detail.value?.revisions.at(-1))
const isReadOnly = computed(() => Boolean(latestRevision.value) && latestRevision.value.specification.entries.some((entry) => !isRegistryModel(entry.model)))
const successfulAttempts = computed(() => history.value.items.filter((item) => item.attempt.outcome === 'successful' && item.attempt.resultArtifactId))
const modelFilterIds = computed(() => [...new Set(models.value.map((item) => item.id))])
const attemptStatus = computed(() => selectedAttempt.value?.attempt.outcome ?? selectedAttempt.value?.attempt.state ?? '')
const historyStart = computed(() => history.value.total === 0 ? 0 : history.value.offset + 1)
const historyEnd = computed(() => Math.min(history.value.offset + history.value.items.length, history.value.total))
const interventionTargets = computed(() => {
  if (!model.value) return []
  if (model.value.engine.type === 'fba') return model.value.definition.reactions.map((item) => ({ id: item.id, unit: item.unit }))
  return [...model.value.definition.species, ...model.value.definition.parameters].map((item) => ({ id: item.id, unit: item.unit }))
})

function isRegistryModel(item) {
  return registryModels.value.some((candidate) => candidate.id === item.id && candidate.digest === item.digest)
}

function setFailure(error, fallback) {
  state.value = 'failed'
  message.value = error instanceof Error ? error.message : fallback
}

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
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
  for (const entry of spec.entries) {
    if (!models.value.some((item) => item.id === entry.model.id && item.digest === entry.model.digest)) embeddedModels.value.push(entry.model)
  }
  modelKey.value = exactModelKey(spec.entries[0].model)
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

async function refreshHistory(reset = false) {
  if (reset) historyOffset.value = 0
  history.value = await loadWorkspaceHistory({ ...filters.value, limit: historyLimit, offset: historyOffset.value }, controller?.signal)
}

async function previousHistoryPage() {
  historyOffset.value = Math.max(0, historyOffset.value - historyLimit)
  await refreshHistory()
}

async function nextHistoryPage() {
  if (historyOffset.value + history.value.items.length >= history.value.total) return
  historyOffset.value += historyLimit
  await refreshHistory()
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
      loadWorkspaceHistory({ limit: historyLimit, offset: 0 }, controller.signal)
    ])
    registryModels.value = loadedModels
    profiles.value = loadedProfiles
    experiments.value = loadedExperiments
    history.value = loadedHistory
    modelKey.value ||= loadedModels[0] ? exactModelKey(loadedModels[0]) : ''
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
    modelKey.value = registryModels.value[0] ? exactModelKey(registryModels.value[0]) : ''
    name.value = 'Controlled first-order experiment'
    description.value = 'Local, digest-pinned portfolio experiment.'
    exportHref.value = ''
    message.value = ''
    chooseModel()
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
  if (isReadOnly.value) return
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
  if (!detail.value || isReadOnly.value) return
  try {
    detail.value = await cloneWorkspaceExperiment(detail.value.experiment.experimentId)
    experiments.value = await loadWorkspaceExperiments()
    message.value = 'Experiment cloned with an independent immutable revision history.'
  } catch (error) {
    setFailure(error, 'Experiment could not be cloned.')
  }
}

async function queueRun() {
  if (!latestRevision.value || isReadOnly.value) return
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
  stopPolling()
  const generation = ++attemptGeneration
  attemptController?.abort()
  attemptController = new AbortController()
  try {
    const [loadedAttempt, loadedEvents, loadedArtifacts] = await Promise.all([
      loadWorkspaceAttempt(attemptId, attemptController.signal),
      loadWorkspaceEvents(attemptId, attemptController.signal),
      loadWorkspaceArtifacts(attemptId, attemptController.signal)
    ])
    if (generation !== attemptGeneration) return
    selectedAttempt.value = loadedAttempt
    events.value = loadedEvents
    artifacts.value = loadedArtifacts
    report.value = undefined
    startPolling()
  } catch (error) {
    if (!isAbort(error) && generation === attemptGeneration) setFailure(error, 'Attempt detail could not be loaded.')
  }
}

function stopPolling() {
  pollGeneration += 1
  clearTimeout(pollTimer)
  pollController?.abort()
  pollController = undefined
}

function startPolling() {
  stopPolling()
  const attemptId = selectedAttempt.value?.attempt.attemptId
  if (!attemptId || selectedAttempt.value.attempt.state === 'terminal') return
  const generation = pollGeneration
  pollTimer = setTimeout(() => pollSelectedAttempt(attemptId, generation), 750)
}

async function pollSelectedAttempt(attemptId, generation) {
  if (generation !== pollGeneration) return
  const requestController = new AbortController()
  pollController = requestController
  try {
    const [loadedAttempt, loadedEvents, loadedArtifacts] = await Promise.all([
      loadWorkspaceAttempt(attemptId, requestController.signal),
      loadWorkspaceEvents(attemptId, requestController.signal),
      loadWorkspaceArtifacts(attemptId, requestController.signal)
    ])
    if (generation !== pollGeneration || selectedAttempt.value?.attempt.attemptId !== attemptId) return
    selectedAttempt.value = loadedAttempt
    events.value = loadedEvents
    artifacts.value = loadedArtifacts
    if (loadedAttempt.attempt.state === 'terminal') {
      await refreshHistory()
      return
    }
  } catch (error) {
    if (generation !== pollGeneration || isAbort(error)) return
  } finally {
    if (pollController === requestController) pollController = undefined
  }
  if (generation === pollGeneration) pollTimer = setTimeout(() => pollSelectedAttempt(attemptId, generation), 750)
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
})
onBeforeUnmount(() => {
  controller?.abort()
  attemptGeneration += 1
  attemptController?.abort()
  stopPolling()
})
</script>

<template lang="pug">
Panel(title-id="experiment-workspace-title" title="Durable local research runs" eyebrow="Controlled experiment workspace" :status="state" :tone="statusTone(state)")
  p.lede Immutable specifications, distinct scientific and attempt identities, bounded child workers, exact specification restarts, content-addressed artifacts, and offline portable bundles.
  .notice.notice--danger(v-if="state === 'failed'" role="alert") {{ message }}
  div(role="status")
    p.notice(v-if="state !== 'failed' && message") {{ message }}

  .grid(v-if="models.length")
    Panel(title-id="workspace-editor-title" :title="detail ? 'Edit as a new revision' : 'Create experiment'" :level="3")
      form.stack(@submit.prevent="detail ? saveRevision() : createExperiment()")
        p.notice.notice--warning(v-if="isReadOnly" role="note") This revision embeds a model that is not in the exact local registry. Its ID and digest remain inspectable and exportable, but revision and execution controls are read-only.
        Field(id="workspace-existing" label="Existing experiment")
          select#workspace-existing(:value="detail?.experiment.experimentId ?? ''" @change="selectExperiment($event.target.value)")
            option(value="") New experiment
            option(v-for="item in experiments" :key="item.experimentId" :value="item.experimentId") {{ item.name }}
        Field(id="workspace-name" label="Name")
          input#workspace-name(v-model="name" maxlength="160" required :disabled="isReadOnly")
        Field(id="workspace-description" label="Description")
          textarea#workspace-description(v-model="description" rows="3" maxlength="2000" :disabled="isReadOnly")
        Field(id="workspace-model" label="Portfolio model")
          select#workspace-model(v-model="modelKey" :disabled="isReadOnly" @change="chooseModel")
            option(v-for="item in models" :key="exactModelKey(item)" :value="exactModelKey(item)") {{ item.name }} · {{ item.id }} · {{ item.digest }}{{ isRegistryModel(item) ? '' : ' · embedded external' }}
        .grid
          Field(id="workspace-taxon" label="Taxon")
            select#workspace-taxon(v-model="taxonId" :disabled="isReadOnly")
              option(value="NCBITaxon:9606") Human · NCBITaxon:9606
              option(value="NCBITaxon:10090") Mouse · NCBITaxon:10090
          Field(id="workspace-tissue" label="Tissue CURIE (optional)")
            input#workspace-tissue(v-model="tissueId" placeholder="UBERON:0002107" :disabled="isReadOnly")
        Field(id="workspace-design" label="Portfolio design")
          select#workspace-design(v-model="design" :disabled="isReadOnly")
            option(value="single") Single specification
            option(value="ensemble") Seeded ensemble
            option(value="intervention-schedule") Intervention schedule
        Field(v-if="design === 'ensemble'" id="workspace-members" label="Ensemble members")
          input#workspace-members(v-model.number="ensembleMembers" type="number" min="2" max="8" :disabled="isReadOnly")
        template(v-if="design === 'intervention-schedule'")
          Field(id="workspace-intervention-target" label="Assignment target")
            select#workspace-intervention-target(v-model="interventionTarget" :disabled="isReadOnly")
              option(v-for="target in interventionTargets" :key="target.id" :value="target.id") {{ target.id }} · {{ target.unit.symbol }}
          .grid
            Field(id="workspace-intervention-time" label="Time")
              input#workspace-intervention-time(v-model.number="interventionTime" type="number" min="0" :disabled="isReadOnly || model.engine.type === 'fba'")
            Field(id="workspace-intervention-value" label="Assigned value")
              input#workspace-intervention-value(v-model.number="interventionValue" type="number" min="0" :disabled="isReadOnly")
        .grid
          Field(v-if="model.engine.type !== 'fba'" id="workspace-duration" label="Duration (s)")
            input#workspace-duration(v-model.number="duration" type="number" min="1" max="100000" :disabled="isReadOnly")
          Field(id="workspace-seed" label="Seed")
            input#workspace-seed(v-model.number="seed" type="number" min="0" max="4294967295" :disabled="isReadOnly")
        Field(id="workspace-contract" label="Rerun contract")
          select#workspace-contract(v-model="numericalKind" :disabled="isReadOnly")
            option(value="exact") Exact canonical result
            option(value="tolerance") Absolute + relative tolerance
        .grid(v-if="numericalKind === 'tolerance'")
          Field(id="workspace-absolute" label="Absolute tolerance")
            input#workspace-absolute(v-model.number="absoluteTolerance" type="number" min="0" step="any" :disabled="isReadOnly")
          Field(id="workspace-relative" label="Relative tolerance")
            input#workspace-relative(v-model.number="relativeTolerance" type="number" min="0" step="any" :disabled="isReadOnly")
        Field(id="workspace-profile" label="Resource profile")
          select#workspace-profile(v-model="resourceProfileId" :disabled="isReadOnly")
            option(v-for="item in profiles" :key="item.id" :value="item.id") {{ item.name }} · {{ item.concurrency }} workers · {{ item.memoryMb }} MB
        button.button(type="submit" :disabled="state === 'saving' || isReadOnly") {{ detail ? 'Create immutable revision' : 'Create experiment' }}

    Panel(title-id="workspace-ledger-title" title="Revision ledger" :level="3")
      template(v-if="detail")
        p {{ detail.experiment.name }} · {{ detail.revisions.length }} immutable revision{{ detail.revisions.length === 1 ? '' : 's' }}
        ol.plain-list.stack.stack--tight
          li.card.stack.stack--tight(v-for="revision in detail.revisions" :key="revision.revisionId")
            strong Revision {{ revision.ordinal }} · {{ revision.source }}
            p
              code {{ revision.specificationDigest }}
            p Snapshot {{ revision.snapshotDigest }}
            p(v-for="entry in revision.specification.entries" :key="`${entry.model.id}-${entry.model.digest}`") Model {{ entry.model.id }} · {{ entry.model.digest }}
        .cluster
          button.button(type="button" :disabled="isReadOnly" @click="queueRun") Queue latest revision
          button.button.button--secondary(type="button" :disabled="isReadOnly" @click="cloneExperiment") Clone experiment
          button.button.button--secondary(type="button" @click="exportExperiment") Export portable ZIP
          a.button.button--secondary(v-if="exportHref" :href="exportHref" :download="exportName") Download {{ exportName }}
        Field(id="workspace-import" label="Import portable ZIP")
          input#workspace-import(type="file" accept=".zip,application/zip" @change="importExperiment")
      template(v-else)
        .stack.stack--tight
          strong No persisted experiment selected
          p Configure the form to create the first immutable revision, or import a verified portable ZIP.
        Field(id="workspace-import-empty" label="Import portable ZIP")
          input#workspace-import-empty(type="file" accept=".zip,application/zip" @change="importExperiment")

  Panel(title-id="workspace-history-title" title="Queue and searchable history" :level="3")
    template(v-slot:actions)
      button.button.button--secondary(type="button" @click="refreshHistory(true)") Refresh
    p.muted {{ history.total }} attempt{{ history.total === 1 ? '' : 's' }}. Filters apply to immutable revision metadata.
    form.stack(aria-label="History filters" @submit.prevent="refreshHistory(true)")
      .grid
        Field(id="history-status" label="Status")
          select#history-status(v-model="filters.status")
            option(value="") All
            option(value="queued") Queued
            option(value="running") Running
            option(value="successful") Successful
            option(value="failed") Failed
            option(value="resource-exhausted") Resource exhausted
            option(value="cancelled") Cancelled
        Field(id="history-model" label="Model")
          select#history-model(v-model="filters.model")
            option(value="") All
            option(v-for="id in modelFilterIds" :key="id" :value="id") {{ id }}
        Field(id="history-taxon" label="Taxon")
          select#history-taxon(v-model="filters.taxon")
            option(value="") All
            option(value="NCBITaxon:9606") Human
            option(value="NCBITaxon:10090") Mouse
        Field(id="history-tissue" label="Tissue")
          input#history-tissue(v-model="filters.tissue" placeholder="UBERON:...")
        Field(id="history-release" label="Release")
          input#history-release(v-model="filters.release" placeholder="release id")
      div
        button.button.button--secondary(type="submit") Apply filters
    DataTable(caption="Durable run attempts" :columns="['Experiment', 'Attempt', 'Kind', 'State / outcome', 'Context']" :count="history.items.length" empty-text="No attempts match these filters.")
      tr(v-for="item in history.items" :key="item.attempt.attemptId")
        th(scope="row")
          button.button.button--link(type="button" @click="inspectAttempt(item.attempt.attemptId)") {{ item.experimentName }}
        td
          code {{ item.attempt.attemptId }}
        td {{ item.attempt.kind }}{{ item.attempt.restartMode ? ' · from specification' : '' }}
        td
          span.badge(:class="statusClass(item.attempt.outcome ?? item.attempt.state)") {{ item.attempt.outcome ?? item.attempt.state }}
        td {{ item.taxonId }}{{ item.tissueId ? ` · ${item.tissueId}` : '' }}
    nav.repel(aria-label="History pagination")
      p {{ `Showing ${historyStart}–${historyEnd} of ${history.total}` }}
      .cluster
        button.button.button--secondary(type="button" :disabled="history.offset === 0" @click="previousHistoryPage") Previous page
        button.button.button--secondary(type="button" :disabled="history.offset + history.items.length >= history.total" @click="nextHistoryPage") Next page

  Panel(v-if="selectedAttempt" title-id="attempt-title" title="Attempt inspector" :level="3" :status="attemptStatus" :tone="statusTone(attemptStatus)")
    dl.facts
      div
        dt Attempt identity
        dd
          code {{ selectedAttempt.attempt.attemptId }}
      div
        dt Scientific identity
        dd
          code {{ selectedAttempt.attempt.runId }}
    p.notice.notice--warning(v-if="selectedAttempt.attempt.kind === 'restart'" role="note") Restarted from the exact specification. This is not stateful continuation.
    .cluster
      button.button.button--secondary(v-if="selectedAttempt.attempt.state !== 'terminal'" type="button" @click="cancelAttempt") Cancel attempt
      button.button.button--secondary(v-else type="button" @click="restartAttempt") Restart from specification
      button.button.button--secondary(v-if="selectedAttempt.attempt.resultArtifactId" type="button" @click="generateReport") Generate offline report
      button.button.button--secondary(v-if="successfulAttempts.length >= 2" type="button" @click="compareLatest") Compare latest successful attempts
    .grid
      .stack.stack--tight
        h4 Events
        ol.plain-list.stack.stack--tight
          li(v-for="event in events" :key="event.eventId")
            strong {{ event.sequence }} · {{ event.type }}
            |
            time(:datetime="event.at") {{ event.at }}
      .stack.stack--tight
        h4 Artifacts
        ul.plain-list.stack.stack--tight
          li(v-for="artifact in artifacts" :key="artifact.artifactId")
            a(:href="`/api/v7/workspace/artifacts/${encodeURIComponent(artifact.artifactId)}`") {{ artifact.name }}
            |
            span {{ artifact.bytes }} bytes · {{ artifact.digest }}
        p(v-if="artifacts.length === 0") No artifact has been atomically published.
    .notice(v-if="comparison" role="status")
      strong Comparison {{ comparison.status }}
      p {{ comparison.specificationChanged ? 'Specifications changed.' : 'Specifications are identical.' }} {{ comparison.differences.length }} numeric difference{{ comparison.differences.length === 1 ? '' : 's' }} recorded.
    .cluster(v-if="report")
      strong Static offline report
      a(v-for="format in ['html', 'json', 'csv', 'svg']" :key="format" :href="`/api/v7/workspace/reports/${encodeURIComponent(report.reportId)}/files/${format}`" target="_blank" rel="noreferrer") {{ format.toUpperCase() }}
</template>
