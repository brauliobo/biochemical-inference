<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadParameterOptions, runParameterStudy } from '../api.js'
import Metric from '../ui/Metric.vue'
import Section from '../ui/Section.vue'
import { badgeClass, statusTone } from '../ui/tone.js'

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
const partition = computed(() => options.value?.partitions[0])

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
Section.parameter-study-panel(title="Synthetic decay inference study" title-id="parameter-study-title" eyebrow="Parameter evidence · calibration · uncertainty" lede="Every value below is labeled synthetic or assumption. This benchmark validates inference algorithms and partition discipline; it contains no measured biology." :status="result ? `${result.lifecycle} · ${result.outcome}` : state" :tone="statusTone(result?.outcome ?? state)")
  .notice.notice--danger(v-if="state === 'failed'" role="alert") {{ message }}
  template(v-if="options")
    dl.metrics
      Metric(label="Parameter release" :value="options.release.id")
      Metric(label="Pinned digest" :value="options.release.digest" mono)
      Metric(label="Target context" :value="options.targetContext.name")
      Metric(label="Data status" value="Synthetic · assumptions explicit")
    .sidebar
      form.form(@submit.prevent="run")
        label(for="study-seed") Seed (uint32)
        input#study-seed(v-model.number="seed" type="number" min="0" max="4294967295" step="1" :disabled="state === 'running'")
        label(for="study-proposal") Metropolis proposal scale (s⁻¹)
        input#study-proposal(v-model.number="proposalScale" type="number" min="0.0001" max="1" step="0.0001" :disabled="state === 'running'")
        label(for="study-iterations") Optimizer maximum iterations
        input#study-iterations(v-model.number="optimizerIterations" type="number" min="1" max="1000" step="1" :disabled="state === 'running'")
        label.choice
          input(v-model="stressAlternative" type="checkbox" :disabled="state === 'running'")
          span Include misspecified offset model (assumption stress)
        button.button(type="submit" :disabled="state === 'running'") {{ state === 'running' ? 'Running deterministic study…' : 'Run inference study' }}
      section.stack.stack--tight(aria-labelledby="study-why-title")
        h3#study-why-title Why this value
        p
          strong {{ options.selectedCandidateId }} · {{ options.selectedValue }} {{ options.canonicalUnit }}
        p.muted Synthetic candidate selected in the exact target context.
        p {{ selectedDecision?.rationale }}
        h3 Supporting bounds and prior
        ul
          li {{ options.bounds.candidateId }}: {{ options.bounds.lower }}–{{ options.bounds.upper }} {{ options.canonicalUnit }}
          li {{ options.prior.candidateId }}: normal({{ options.prior.mean }}, {{ options.prior.standardDeviation }}) · synthetic prior
        h3 Explicit exclusions
        ul.plain-list.stack.stack--tight
          li.stack.stack--tight(v-for="decision in excludedDecisions" :key="decision.candidateId")
            p
              strong {{ decision.candidateId }}
            p.muted {{ decision.rationale }}
    Section(:title="`Fixed partition · ${partition.id}`" title-id="study-partition-title" :level="3" flat)
      .grid
        div.stack.stack--tight
          strong Calibration IDs ({{ partition.calibration_observation_ids.length }})
          ul.plain-list.stack.stack--tight
            li(v-for="id in partition.calibration_observation_ids" :key="id")
              code {{ id }}
        div.stack.stack--tight
          strong Held-out validation IDs ({{ partition.validation_observation_ids.length }})
          ul.plain-list.stack.stack--tight
            li(v-for="id in partition.validation_observation_ids" :key="id")
              code {{ id }}
      p.muted {{ partition.rationale }}
  article.card.card--flat.stack(v-if="result" aria-labelledby="study-result-title")
    .repel
      div
        h3#study-result-title Canonical terminal study identity
        code.digest {{ result.studyId }}
      span(:class="badgeClass(result.outcome)") {{ result.lifecycle }} · {{ result.outcome }}
    dl.metrics
      Metric(label="Local sensitivity" :value="result.sensitivity.local.at(-1).derivative.toFixed(4)" note="Centered finite difference · final point" large)
      Metric(label="Calibrated k" :value="result.calibration.estimate === null ? 'not converged' : result.calibration.estimate.toFixed(8)" :note="result.calibration.estimate === null ? `Best-so-far ${result.calibration.bestSoFar.toFixed(8)} is not a converged estimate` : 's⁻¹ · calibration IDs only'" large)
      Metric(label="Identifiability" :value="result.identifiability.identifiable ? 'identifiable' : 'underidentified'" :note="`Fisher rank ${result.identifiability.rank}/${result.identifiability.columns} · condition ${result.identifiability.conditionNumber}`" large)
      Metric(label="Posterior" :value="result.posterior.converged ? `${result.posterior.interval.lower.toFixed(5)}–${result.posterior.interval.upper.toFixed(5)}` : 'non-converged'" :note="`R-hat ${result.posterior.rHat.toFixed(4)} · acceptance ${result.posterior.acceptanceRates.map(item => item.toFixed(2)).join(', ')}`" large)
    .grid
      Section(title="Sensitivity and screening" title-id="study-sensitivity-title" :level="3" flat)
        .scroll-x(role="region" tabindex="0" aria-label="Seeded Morris elementary effects")
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
        p.muted {{ result.calibration.iterations }} bounded Nelder-Mead iterations · objective {{ result.calibration.objective.toExponential(3) }}.
      Section(title="Held-out posterior predictive validation" title-id="study-validation-title" :level="3" flat)
        template(v-if="result.validation.status === 'available'")
          p {{ result.validation.covered }}/{{ result.validation.total }} held-out observations covered ({{ (result.validation.coverageProbability * 100).toFixed(0) }}%).
        template(v-else)
          p Posterior predictive validation suppressed. Diagnostic information only; no coverage result was computed.
          ul
            li(v-for="diagnostic in result.validation.diagnostics" :key="diagnostic") {{ diagnostic }}
        .scroll-x(v-if="result.validation.status === 'available'" role="region" tabindex="0" aria-label="Held-out predictions")
          table
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
    section.stack.stack--tight(aria-labelledby="study-uncertainty-title")
      h3#study-uncertainty-title Uncertainty categories
      .grid.grid--compact
        article.card.card--flat.stack.stack--tight(v-for="item in result.uncertainty" :key="item.category")
          p.eyebrow {{ item.label }}
          p
            strong {{ item.category }}
          p.muted {{ item.description }}
    section.stack.stack--tight(aria-labelledby="study-robustness-title")
      h3#study-robustness-title Robustness matrix · {{ result.robustness.status }}
      p.notice {{ result.robustness.conclusion }}
      .scroll-x(role="region" tabindex="0" aria-label="Robustness matrix")
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
    section.stack.stack--tight(aria-labelledby="study-limitations-title")
      h3#study-limitations-title Study limitations
      ul
        li(v-for="item in result.limitations" :key="item") {{ item }}
</template>
