<script setup>
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { TAXA, SimulationRequestSchema } from '../shared/contracts.js'
import { loadNetwork, loadProvenance, loadWorkspace, runSimulation } from './api.js'
import { compatibleRuns } from './comparison.js'
import BuildProvenance from './components/BuildProvenance.vue'
import AtlasExplorer from './components/AtlasExplorer.vue'
import EvidencePanel from './components/EvidencePanel.vue'
import TimeSeriesChart from './components/TimeSeriesChart.vue'
import PortfolioWorkbench from './components/PortfolioWorkbench.vue'
import ExperimentWorkspace from './components/ExperimentWorkspace.vue'
import ParameterStudyWorkbench from './components/ParameterStudyWorkbench.vue'
import APAPBenchmarkWorkbench from './components/APAPBenchmarkWorkbench.vue'
import ReviewWorkbench from './components/ReviewWorkbench.vue'
import PhysiologyPluginWorkbench from './components/PhysiologyPluginWorkbench.vue'
import DataPlaneWorkbench from './components/DataPlaneWorkbench.vue'
import { METABOLITE_IDS } from '../shared/identifiers.js'

const NetworkView = defineAsyncComponent(() => import('./components/NetworkView.vue'))

const taxonId = ref(9606)
const preset = ref('baseline')
const activity = ref(1)
const duration = ref(24)
const release = ref()
const model = ref()
const network = ref()
const provenance = ref()
const provenanceState = ref('loading')
const provenanceError = ref('')
const result = ref()
const baseline = ref()
const selectedId = ref(METABOLITE_IDS.homocysteine)
const state = ref('loading')
const message = ref('')
const resultIsPrevious = ref(false)
const apapRun = ref()
const errors = ref({})
let knowledgeGeneration = 0
let knowledgeController
let provenanceGeneration = 0
let provenanceController

const selectedCompound = computed(() => network.value?.compounds.find((item) => item.id === selectedId.value))
const selectedModelReaction = computed(() => model.value?.topology.reactions.find((item) => item.id === selectedId.value))
const selectedReaction = computed(() => network.value?.reactions.find((item) => item.id === selectedModelReaction.value?.knowledgeReactionId))
const connectedModelReactions = computed(() => model.value?.topology.reactions.filter((item) => [...item.reactantIds, ...item.productIds].includes(selectedId.value)) ?? [])
const connectedReactions = computed(() => network.value?.reactions.filter((item) => connectedModelReactions.value.some((modeled) => modeled.knowledgeReactionId === item.id)) ?? [])
const selectedEvidence = computed(() => {
  if (!network.value) return []
  const ids = new Set([
    ...(selectedCompound.value?.evidenceIds ?? []),
    ...(selectedReaction.value?.evidenceIds ?? []),
    ...connectedReactions.value.flatMap((reaction) => reaction.evidenceIds),
    ...network.value.proteins.filter((protein) => connectedReactions.value.some((reaction) => reaction.proteinIds.includes(protein.id))).flatMap((protein) => protein.evidenceIds)
  ])
  return network.value.evidence.filter((item) => ids.has(item.id))
})
const comparison = computed(() => result.value?.preset === 'reduced-mthfr' && baseline.value && compatibleRuns(result.value, baseline.value) ? baseline.value : undefined)
const requestLocked = computed(() => state.value === 'running' || state.value === 'loading' || !network.value)
const evidenceQuery = computed(() => selectedCompound.value ? `${selectedCompound.value.name} ${selectedCompound.value.id}` : selectedModelReaction.value?.name ?? 'MTHFR')

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function markChanged() {
  if (result.value) resultIsPrevious.value = true
  message.value = ''
}

watch([preset, activity, duration], markChanged)
watch(preset, (value) => {
  const selected = model.value?.presets.find((item) => item.id === value)
  if (selected?.mthfrActivity != null) activity.value = selected.mthfrActivity
})

watch(taxonId, async (value) => {
  result.value = undefined
  baseline.value = undefined
  resultIsPrevious.value = false
  message.value = ''
  if (!release.value) return
  const generation = ++knowledgeGeneration
  knowledgeController?.abort()
  knowledgeController = new AbortController()
  const releaseId = release.value.id
  network.value = undefined
  state.value = 'loading'
  try {
    const loaded = await loadNetwork(releaseId, value, knowledgeController.signal)
    if (generation !== knowledgeGeneration || value !== taxonId.value) return
    network.value = loaded
    state.value = 'ready'
  } catch (error) {
    if (generation !== knowledgeGeneration || isAbort(error)) return
    state.value = 'incompatible'
    message.value = error instanceof Error ? error.message : 'The knowledge network is incompatible.'
  }
})

async function initialize() {
  const generation = ++knowledgeGeneration
  knowledgeController?.abort()
  knowledgeController = new AbortController()
  const requestedTaxon = taxonId.value
  network.value = undefined
  provenance.value = undefined
  provenanceState.value = 'loading'
  provenanceError.value = ''
  provenanceController?.abort()
  state.value = 'loading'
  try {
    const workspace = await loadWorkspace(requestedTaxon, knowledgeController.signal)
    if (generation !== knowledgeGeneration || requestedTaxon !== taxonId.value) return
    release.value = workspace.release
    model.value = workspace.model
    network.value = workspace.network
    state.value = 'ready'
    requestProvenance(workspace.release)
  } catch (error) {
    if (generation !== knowledgeGeneration || isAbort(error)) return
    state.value = 'incompatible'
    message.value = error instanceof Error ? error.message : 'The knowledge release is incompatible.'
  }
}

async function requestProvenance(verifiedRelease = release.value) {
  if (!verifiedRelease) return
  const generation = ++provenanceGeneration
  provenanceController?.abort()
  provenanceController = new AbortController()
  provenance.value = undefined
  provenanceState.value = 'loading'
  provenanceError.value = ''
  try {
    const loaded = await loadProvenance(verifiedRelease, provenanceController.signal)
    if (generation !== provenanceGeneration || verifiedRelease.id !== release.value?.id) return
    provenance.value = loaded
    provenanceState.value = 'available'
  } catch (error) {
    if (generation !== provenanceGeneration || isAbort(error)) return
    provenanceState.value = 'unavailable'
    provenanceError.value = error instanceof Error ? error.message : 'The build provenance request failed.'
  }
}

function setCustomActivity() {
  preset.value = 'custom'
}

async function run() {
  if (!release.value || !model.value || !network.value || state.value !== 'ready') return
  errors.value = {}
  const input = {
    releaseId: release.value.id,
    taxonId: taxonId.value,
    preset: preset.value,
    mthfrActivity: activity.value,
    durationHours: duration.value,
    stepHours: model.value.controls.stepHours
  }
  const parsed = SimulationRequestSchema.safeParse(input)
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors
    errors.value = {
      activity: fields.mthfrActivity?.[0] ?? '',
      duration: fields.durationHours?.[0] ?? ''
    }
    return
  }
  state.value = 'running'
  message.value = ''
  try {
    const completed = await runSimulation(parsed.data)
    result.value = completed
    if (completed.preset === 'baseline') baseline.value = completed
    resultIsPrevious.value = false
    state.value = 'ready'
  } catch (error) {
    result.value = undefined
    resultIsPrevious.value = false
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The simulation failed. Your controls were preserved.'
  }
}

function select(id) {
  selectedId.value = id
}

onMounted(initialize)
onBeforeUnmount(() => {
  knowledgeController?.abort()
  provenanceController?.abort()
})
</script>

<template lang="pug">
header.masthead
  .mast-copy
    p.eyebrow Controlled pathway model · MVP 1.0
    h1 Biochemical inference workbench
    p.lede Compare deterministic one-carbon trajectories while retaining the evidence, assumptions, and numerical controls behind every run.
  .scope-badge(role="note")
    strong Demonstration, not diagnosis
    span Illustrative kinetics · bounded pathway · no clinical use

main#main
  section.status-panel(aria-labelledby="knowledge-title")
    .section-heading
      div
        p.kicker 01 · Provenance
        h2#knowledge-title Verified knowledge workspace
      span.status-chip(:class="state") {{ state === 'loading' ? 'Loading' : state === 'incompatible' ? 'Incompatible' : 'Digest pinned' }}
    .loading(v-if="state === 'loading' && !network" aria-live="polite") Loading release, model, and taxon network…
    .alert.error(v-else-if="state === 'incompatible'" role="alert")
      strong Simulation disabled
      p {{ message }}
      button.secondary(type="button" @click="initialize") Retry compatibility check
    .provenance(v-else-if="release && model")
      dl.provenance-grid
        div
          dt Release
          dd {{ release.id }}
        div
          dt SHA-256 digest
          dd.digest {{ release.digest }}
        div
          dt Knowledge source
          dd {{ release.source === 'bundled-demonstration' ? 'Bundled pinned demonstration' : 'biochemical-db API' }}
        div
          dt Model / engine
          dd {{ model.version }} / {{ model.engineVersion }}
      p.source-note Curated network evidence is kept separate from model-only concentrations and kinetics.
      BuildProvenance(:provenance="provenance" :status="provenanceState" :error="provenanceError" @retry="requestProvenance()")

  .workspace(v-if="release && model")
    aside.controls-panel(aria-labelledby="experiment-title")
      .section-heading
        div
          p.kicker 02 · Configure
          h2#experiment-title Experiment
      form(@submit.prevent="run" novalidate)
        label(for="taxon") Taxon and protein evidence
        select#taxon(v-model.number="taxonId" :disabled="requestLocked")
          option(v-for="taxon in TAXA" :key="taxon.id" :value="taxon.id") {{ taxon.name }} · {{ taxon.scientificName }}

        label(for="preset") Perturbation preset
        select#preset(v-model="preset" :disabled="requestLocked")
          option(v-for="item in model.presets" :key="item.id" :value="item.id") {{ item.name }}

        label(for="activity") MTHFR relative activity
        .input-with-unit
          input#activity(v-model.number="activity" type="number" min="0.1" max="1.5" step="0.05" :disabled="requestLocked" :aria-invalid="Boolean(errors.activity)" :aria-describedby="errors.activity ? 'activity-error' : 'activity-help'" @input="setCustomActivity")
          span × baseline
        small#activity-help Supported range 0.10–1.50.
        small#activity-error.field-error(v-if="errors.activity" role="alert") Enter activity from 0.10 to 1.50.

        label(for="duration") Duration
        .input-with-unit
          input#duration(v-model.number="duration" type="number" min="1" max="72" step="1" :disabled="requestLocked" :aria-invalid="Boolean(errors.duration)" :aria-describedby="errors.duration ? 'duration-error' : 'duration-help'")
          span hours
        small#duration-help Supported range 1–72 hours; fixed {{ model.controls.stepHours }} h step.
        small#duration-error.field-error(v-if="errors.duration" role="alert") Enter a duration from 1 to 72 hours.

        button.run-button(type="submit" :disabled="requestLocked || state === 'incompatible'")
          span {{ state === 'running' ? 'Integrating…' : result && state === 'failed' ? 'Retry simulation' : 'Run deterministic model' }}
          span.arrow(aria-hidden="true") →
      .control-note
        strong Units
        p {{ model.concentrationUnit }} concentrations; {{ model.fluxUnit }} fluxes.

    section.network-panel(aria-labelledby="network-title")
      .section-heading
        div
          p.kicker 03 · Inspect
          h2#network-title Modeled one-carbon topology
        span.entity-count {{ model.topology.entities.length }} entities · {{ model.topology.reactions.length }} reactions
      NetworkView(v-if="network" :model="model" :network="network" :result="result" :selected-id="selectedId" @select="select")
      .loading.network-loading(v-else aria-live="polite") Loading taxon-specific evidence; the previous network is hidden.
      .semantic-network
        h3 Inspectable simulation topology
        p Every entity and directed reaction below participates in the equations. Curated mappings link to knowledge evidence; model-only and boundary terms are explicit assumptions.
        .entity-list(role="list" aria-label="Modeled topology entities")
          button.entity-button(v-for="entity in model.topology.entities" :key="entity.id" type="button" :class="{ selected: selectedId === entity.id }" :aria-pressed="selectedId === entity.id" @click="select(entity.id)")
            span.entity-kind {{ entity.kind }} {{ entity.stateVariable ? 'state' : 'entity' }}
            strong {{ entity.name }}
            code {{ entity.id }}
          button.entity-button(v-for="reaction in model.topology.reactions" :key="reaction.id" type="button" :class="{ selected: selectedId === reaction.id }" :aria-pressed="selectedId === reaction.id" @click="select(reaction.id)")
            span.entity-kind {{ reaction.kind }} reaction
            strong {{ reaction.name }}
            code {{ reaction.id }}

    section.details-panel(v-if="network" aria-labelledby="details-title")
      .section-heading
        div
          p.kicker 04 · Evidence
          h2#details-title {{ selectedCompound?.name ?? selectedModelReaction?.name ?? 'Modeled entity' }}
      template(v-if="selectedCompound")
        dl.detail-grid
          div
            dt Formula
            dd {{ selectedCompound.formula }}
          div
            dt Charge
            dd {{ selectedCompound.charge }}
          div(v-if="result?.concentrations.find(item => item.id === selectedId)")
            dt Final model value
            dd {{ result.concentrations.find(item => item.id === selectedId)?.values.at(-1)?.toFixed(3) }} {{ model.concentrationUnit }}
        h3 Connected reactions
        ul.connected-list
          li(v-for="reaction in connectedReactions" :key="reaction.id") {{ reaction.name }}
      template(v-if="selectedModelReaction")
        p.model-classification {{ selectedModelReaction.kind }} modeled reaction
        p(v-if="selectedReaction") Curated mapping: {{ selectedReaction.equation }}
        p(v-else) This equation term is an explicit {{ selectedModelReaction.kind }} assumption and has no curated reaction mapping.
      h3 Taxon-specific proteins
      ul.protein-list
        li(v-for="protein in network.proteins.filter(item => connectedReactions.some(reaction => reaction.proteinIds.includes(item.id)) || selectedReaction?.proteinIds.includes(item.id))" :key="protein.id")
          strong {{ protein.gene }}
          span {{ protein.name }} · {{ protein.id }} · taxon {{ protein.taxonId }}
        li(v-if="!network.proteins.some(item => connectedReactions.some(reaction => reaction.proteinIds.includes(item.id)) || selectedReaction?.proteinIds.includes(item.id))") No protein association is asserted for this boundary or generic reaction.
      h3 Evidence
      ul.evidence-list
        li(v-for="evidence in selectedEvidence" :key="evidence.id")
          a(:href="evidence.url" target="_blank" rel="noreferrer") {{ evidence.citation }}
          span {{ evidence.kind }} · {{ evidence.evidenceClass }} evidence

    AtlasExplorer(:taxon-id="taxonId")

    EvidencePanel(:suggested-query="evidenceQuery")

    PortfolioWorkbench

    ExperimentWorkspace

    ParameterStudyWorkbench

    APAPBenchmarkWorkbench(@completed="apapRun = $event")

    ReviewWorkbench(:apap-run="apapRun")

    PhysiologyPluginWorkbench

    DataPlaneWorkbench

    section.results-panel(aria-labelledby="results-title")
      .section-heading
        div
          p.kicker 07 · Results
          h2#results-title Controlled run
        span.status-chip.previous(v-if="resultIsPrevious") Previous specification
      .alert.error(v-if="state === 'failed'" role="alert")
        strong Simulation failed; no stale result is displayed
        p {{ message }}
        p Your valid experiment controls are preserved. Use “Retry simulation” to try again.
      .empty-result(v-else-if="!result")
        strong No simulation has been run
        p Configure a bounded preset, then run the deterministic model. Network knowledge remains inspectable before execution.
      template(v-else)
        .previous-note(v-if="resultIsPrevious" role="status") These results belong to the previous configuration. Run again to update them.
        .run-header
          div
            span.run-label Stable run identity
            code {{ result.runId }}
          span.prediction {{ result.predictionLabel }}
        dl.summary-grid
          div
            dt Final homocysteine
            dd {{ result.summary.finalHomocysteine.toFixed(3) }}
            span {{ model.concentrationUnit }} · {{ result.summary.homocysteineChangePercent.toFixed(1) }}% from initial
          div
            dt Final SAM:SAH
            dd {{ result.summary.finalSamSahRatio.toFixed(3) }}
            span {{ result.summary.samSahRatioChangePercent.toFixed(1) }}% from initial
          div
            dt Taxon / preset
            dd {{ TAXA.find(item => item.id === result?.taxonId)?.name }}
            span {{ result.preset }} · activity {{ result.effectiveInputs.mthfrActivity }}
        .directional(v-if="result.preset === 'reduced-mthfr' && comparison")
          strong Reduced-MTHFR directional comparison
          p Homocysteine is {{ result.summary.finalHomocysteine > comparison.summary.finalHomocysteine ? 'higher' : 'lower' }} and the SAM:SAH ratio is {{ result.summary.finalSamSahRatio < comparison.summary.finalSamSahRatio ? 'lower' : 'higher' }} than the compatible retained baseline prediction.
        .previous-note(v-else-if="result.preset === 'reduced-mthfr' && baseline" role="status") The retained baseline has a different release, model, taxon, duration, step, or initial condition and is not compared.
        TimeSeriesChart(:result="result" :comparison="comparison" :selected-id="selectedId")
        .series-table-wrap
          table
            caption Final concentration and flux values
            thead
              tr
                th(scope="col") Series
                th(scope="col") Kind
                th(scope="col") Final value
                th(scope="col") Unit
            tbody
              tr(v-for="series in result.concentrations" :key="series.id" :class="{ emphasized: series.id === selectedId }")
                th(scope="row")
                  button.table-select(type="button" @click="select(series.id)") {{ series.name }}
                td Concentration
                td {{ series.values.at(-1)?.toFixed(4) }}
                td {{ series.unit }}
              tr(v-for="series in result.fluxes" :key="series.id")
                th(scope="row") {{ series.name }}
                td Flux
                td {{ series.values.at(-1)?.toFixed(4) }}
                td {{ series.unit }}
        .diagnostics
          div
            h3 Integration diagnostics
            dl.compact-list
              div
                dt Method
                dd {{ result.diagnostics.method }}
              div
                dt Steps
                dd {{ result.diagnostics.integrationSteps }} × {{ result.diagnostics.integrationStepHours }} h
              div
                dt Maximum derivative
                dd {{ result.diagnostics.maxAbsoluteDerivative }}
              div
                dt Non-negative state
                dd {{ result.diagnostics.nonNegative ? 'yes' : 'no' }}
              div
                dt Net represented-pool change
                dd {{ result.diagnostics.netRepresentedPoolChange }} {{ model.concentrationUnit }}
          div
            h3 Warnings
            ul
              li(v-for="warning in result.warnings" :key="warning") {{ warning }}
            p Run pins {{ result.release.id }} · {{ result.release.digest }} · model {{ result.modelVersion }} · engine {{ result.engineVersion }}.

    section.limitations(v-if="network" aria-labelledby="limitations-title")
      p.kicker Scientific boundary
      h2#limitations-title Assumptions and limitations
      ul
        li(v-for="limitation in model.limitations" :key="limitation") {{ limitation }}
        li(v-for="limitation in network.limitations" :key="limitation.id") {{ limitation.statement }}

footer
  p(v-if="provenanceState === 'available'") Verified release metadata and build provenance are shown above. No output is medical advice.
  p(v-else) Build provenance is unavailable; reproducibility is not established. No output is medical advice.
</template>
