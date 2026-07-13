<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadParameterOptions, runParameterStudy } from '../api.js'

const options = ref()
const record = ref()
const state = ref('loading')
const message = ref('')
const seed = ref(20260712)
const proposalScale = ref(0.002)
const optimizerIterations = ref(200)
const stressAlternative = ref(false)
let controller

const result = computed(() => record.value?.result)
const selectedDecision = computed(() => options.value?.decisions.find((item) => item.decision === 'selected'))
const excludedDecisions = computed(() => options.value?.decisions.filter((item) => item.decision === 'excluded') ?? [])

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    options.value = await loadParameterOptions(controller.signal)
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Parameter evidence could not be loaded.'
  }
}

async function run() {
  if (!options.value || state.value === 'running') return
  controller?.abort()
  controller = new AbortController()
  state.value = 'running'
  record.value = undefined
  message.value = ''
  try {
    record.value = await runParameterStudy({
      parameterId: options.value.parameter.id,
      targetContextId: options.value.targetContext.id,
      datasetId: options.value.datasets[0].id,
      seed: seed.value,
      transforms: [],
      controls: {
        sensitivityRelativeStep: 1e-4,
        morrisTrajectories: 12,
        morrisLevels: 6,
        optimizerMaxIterations: optimizerIterations.value,
        optimizerTolerance: 1e-10,
        posteriorChains: 4,
        posteriorWarmup: 300,
        posteriorSamples: 700,
        posteriorProposalScale: proposalScale.value,
        observationSigma: 0.05,
        includeMisspecifiedAlternative: stressAlternative.value
      }
    }, controller.signal)
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Parameter study failed.'
  }
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
section.parameter-study-panel(aria-labelledby="parameter-study-title")
  .section-heading
    div
      p.kicker Parameter evidence · calibration · uncertainty
      h2#parameter-study-title Synthetic decay inference study
    span.status-chip(:class="result?.outcome ?? state" aria-live="polite") {{ result ? `${result.lifecycle} · ${result.outcome}` : state }}
  p.study-intro Every value below is labeled synthetic or assumption. This benchmark validates inference algorithms and partition discipline; it contains no measured biology.
  .alert.error(v-if="state === 'failed'" role="alert") {{ message }}
  template(v-if="options")
    .study-provenance
      dl.compact-list
        div
          dt Parameter release
          dd {{ options.release.id }}
        div
          dt Pinned digest
          dd.digest {{ options.release.digest }}
        div
          dt Target context
          dd {{ options.targetContext.name }}
        div
          dt Data status
          dd Synthetic · assumptions explicit
    .study-layout
      form.study-controls(@submit.prevent="run")
        label(for="study-seed") Seed (uint32)
        input#study-seed(v-model.number="seed" type="number" min="0" max="4294967295" step="1" :disabled="state === 'running'")
        label(for="study-proposal") Metropolis proposal scale (s⁻¹)
        input#study-proposal(v-model.number="proposalScale" type="number" min="0.0001" max="1" step="0.0001" :disabled="state === 'running'")
        label(for="study-iterations") Optimizer maximum iterations
        input#study-iterations(v-model.number="optimizerIterations" type="number" min="1" max="1000" step="1" :disabled="state === 'running'")
        label.study-checkbox
          input(v-model="stressAlternative" type="checkbox" :disabled="state === 'running'")
          span Include misspecified offset model (assumption stress)
        button.run-button(type="submit" :disabled="state === 'running'")
          span {{ state === 'running' ? 'Running deterministic study…' : 'Run inference study' }}
          span.arrow(aria-hidden="true") →
      .candidate-audit
        h3 Why this value
        p
          strong {{ options.selectedCandidateId }} · {{ options.selectedValue }} {{ options.canonicalUnit }}
          span Synthetic candidate selected in the exact target context.
        p {{ selectedDecision?.rationale }}
        h3 Supporting bounds and prior
        ul
          li {{ options.bounds.candidateId }}: {{ options.bounds.lower }}–{{ options.bounds.upper }} {{ options.canonicalUnit }}
          li {{ options.prior.candidateId }}: normal({{ options.prior.mean }}, {{ options.prior.standardDeviation }}) · synthetic prior
        h3 Explicit exclusions
        ul.exclusion-list
          li(v-for="decision in excludedDecisions" :key="decision.candidateId")
            strong {{ decision.candidateId }}
            span {{ decision.rationale }}
    .partition-audit
      h3 Fixed partition · {{ options.partitions[0].id }}
      .partition-columns
        div
          strong Calibration IDs ({{ options.partitions[0].calibration_observation_ids.length }})
          code(v-for="id in options.partitions[0].calibration_observation_ids" :key="id") {{ id }}
        div
          strong Held-out validation IDs ({{ options.partitions[0].validation_observation_ids.length }})
          code(v-for="id in options.partitions[0].validation_observation_ids" :key="id") {{ id }}
      p {{ options.partitions[0].rationale }}
  article.study-result(v-if="result" aria-labelledby="study-result-title")
    .run-header
      div
        span.run-label#study-result-title Canonical terminal study identity
        code {{ result.studyId }}
      span.status-chip(:class="result.outcome") {{ result.lifecycle }} · {{ result.outcome }}
    .study-metrics
      div
        span Local sensitivity
        strong {{ result.sensitivity.local.at(-1).derivative.toFixed(4) }}
        small Centered finite difference · final point
      div
        span Calibrated k
        strong {{ result.calibration.estimate === null ? 'not converged' : result.calibration.estimate.toFixed(8) }}
        small(v-if="result.calibration.estimate !== null") s⁻¹ · calibration IDs only
        small(v-else) Best-so-far {{ result.calibration.bestSoFar.toFixed(8) }} is not a converged estimate
      div
        span Identifiability
        strong {{ result.identifiability.identifiable ? 'identifiable' : 'underidentified' }}
        small Fisher rank {{ result.identifiability.rank }}/{{ result.identifiability.columns }} · condition {{ result.identifiability.conditionNumber }}
      div
        span Posterior
        strong {{ result.posterior.converged ? `${result.posterior.interval.lower.toFixed(5)}–${result.posterior.interval.upper.toFixed(5)}` : 'non-converged' }}
        small R-hat {{ result.posterior.rHat.toFixed(4) }} · acceptance {{ result.posterior.acceptanceRates.map(item => item.toFixed(2)).join(', ') }}
    .study-grid
      section.study-card
        h3 Sensitivity and screening
        table
          caption Seeded Morris elementary effects
          thead
            tr
              th(scope="col") Parameter
              th(scope="col") μ*
              th(scope="col") σ
              th(scope="col") Trajectories
          tbody
            tr(v-for="item in result.sensitivity.morris" :key="item.parameterId")
              th(scope="row") {{ item.parameterId }}
              td {{ item.muStar.toFixed(5) }}
              td {{ item.sigma.toFixed(5) }}
              td {{ item.trajectories }}
        p {{ result.calibration.iterations }} bounded Nelder-Mead iterations · objective {{ result.calibration.objective.toExponential(3) }}.
      section.study-card
        h3 Held-out posterior predictive validation
        template(v-if="result.validation.status === 'available'")
          p {{ result.validation.covered }}/{{ result.validation.total }} held-out observations covered ({{ (result.validation.coverageProbability * 100).toFixed(0) }}%).
        template(v-else)
          p Posterior predictive validation suppressed. Diagnostic information only; no coverage result was computed.
          ul.study-limitations
            li(v-for="diagnostic in result.validation.diagnostics" :key="diagnostic") {{ diagnostic }}
        table(v-if="result.validation.status === 'available'")
          caption Validation IDs were not used for calibration or posterior fitting
          thead
            tr
              th(scope="col") Observation
              th(scope="col") Observed
              th(scope="col") 95% interval
              th(scope="col") Covered
          tbody
            tr(v-for="prediction in result.validation.predictions" :key="prediction.observationId")
              th(scope="row") {{ prediction.observationId }}
              td {{ prediction.observed.toFixed(4) }}
              td {{ prediction.interval.lower.toFixed(4) }}–{{ prediction.interval.upper.toFixed(4) }}
              td {{ prediction.covered ? 'yes' : 'no' }}
    h3 Uncertainty categories
    .uncertainty-grid
      article(v-for="item in result.uncertainty" :key="item.category")
        span.assumption-label {{ item.label }}
        strong {{ item.category }}
        p {{ item.description }}
    h3 Robustness matrix · {{ result.robustness.status }}
    p.robustness-conclusion {{ result.robustness.conclusion }}
    .series-table-wrap
      table
        caption Parameter, solver, timestep, and model-form variation
        thead
          tr
            th(scope="col") Scenario
            th(scope="col") Start
            th(scope="col") Solver / step
            th(scope="col") Model form
            th(scope="col") Estimate
            th(scope="col") Held-out RMSE
            th(scope="col") Supports
        tbody
          tr(v-for="row in result.robustness.matrix" :key="row.id")
            th(scope="row") {{ row.id }}
            td {{ row.parameterStart.toFixed(3) }}
            td {{ row.solver }} / {{ row.timestep }}
            td {{ row.modelForm }}
            td {{ row.estimate === null ? 'non-converged' : row.estimate.toFixed(6) }}
            td {{ row.heldOutRmse === null ? 'n/a' : row.heldOutRmse.toFixed(6) }}
            td {{ row.supportsConclusion ? 'yes' : 'no' }}
    h3 Study limitations
    ul.study-limitations
      li(v-for="item in result.limitations" :key="item") {{ item }}
</template>
