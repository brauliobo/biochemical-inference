<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadPortfolioModels, runPortfolioExperiment } from '../api.js'

const models = ref([])
const modelId = ref('')
const method = ref('dormand-prince-5-4')
const duration = ref(10)
const outputInterval = ref(1)
const fixedStep = ref(0.1)
const replicates = ref(256)
const seed = ref(20260712)
const state = ref('loading')
const message = ref('')
const record = ref()
let controller

const model = computed(() => models.value.find((item) => item.id === modelId.value))
const result = computed(() => record.value?.result)
const odeChart = computed(() => {
  if (result.value?.data?.engine !== 'ode') return ''
  const series = result.value.data.trajectories[0]
  const maximum = Math.max(...series.values, 1)
  return series.values.map((value, index) => `${index * 100 / Math.max(1, series.values.length - 1)},${100 - value * 90 / maximum}`).join(' ')
})

function selectModel() {
  record.value = undefined
  message.value = ''
  if (model.value?.engine.type === 'ode') method.value = 'dormand-prince-5-4'
  else if (model.value?.engine.type === 'ssa') method.value = 'gillespie-direct'
  else method.value = 'two-phase-simplex'
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  try {
    models.value = await loadPortfolioModels(controller.signal)
    modelId.value = models.value[0]?.id ?? ''
    selectModel()
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Simulation portfolio could not be loaded.'
  }
}

function experiment() {
  const selected = model.value
  const controls = selected.engine.type === 'ode'
    ? { method: method.value, duration: duration.value, outputInterval: outputInterval.value, fixedStep: fixedStep.value, absoluteTolerance: 1e-9, relativeTolerance: 1e-7, maxInternalSteps: 100000 }
    : selected.engine.type === 'ssa'
      ? { method: 'gillespie-direct', duration: duration.value, outputInterval: outputInterval.value, replicates: replicates.value, maxEventsPerReplicate: 100000 }
      : { method: 'two-phase-simplex', feasibilityTolerance: 1e-8, maxIterations: 10000 }
  return {
    contractVersion: '2.0.0',
    modelId: selected.id,
    modelDigest: selected.digest,
    knowledgeRelease: selected.knowledgeRelease,
    engine: { ...selected.engine, algorithm: controls.method, algorithmVersion: '1.0.0' },
    seed: seed.value,
    assumptions: ['Registry values are used without parameter substitution.'],
    limitations: ['This v2 compatibility run completes synchronously; durable queueing and specification restarts are available only through the v7 workspace.'],
    interventions: [],
    controls
  }
}

async function run() {
  if (!model.value || state.value === 'running') return
  controller?.abort()
  controller = new AbortController()
  state.value = 'running'
  record.value = undefined
  message.value = ''
  try {
    record.value = await runPortfolioExperiment(experiment(), controller.signal)
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Portfolio execution failed.'
  }
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
section.portfolio-panel(aria-labelledby="portfolio-title")
  .section-heading
    div
      p.kicker Standards portfolio
      h2#portfolio-title ODE · SSA · FBA workbench
    span.status-chip(:class="state" aria-live="polite") {{ state }}
  p.portfolio-intro Select a bounded declarative benchmark. Every run pins its model and release digests, algorithm version, units, seed, assumptions, and limitations.
  .alert.error(v-if="state === 'failed'" role="alert") {{ message }}
  .portfolio-layout(v-if="model")
    form.portfolio-controls(@submit.prevent="run")
      label(for="portfolio-model") Model and engine
      select#portfolio-model(v-model="modelId" :disabled="state === 'running'" @change="selectModel")
        option(v-for="item in models" :key="item.id" :value="item.id") {{ item.name }}
      template(v-if="model.engine.type === 'ode'")
        label(for="portfolio-method") Integration method
        select#portfolio-method(v-model="method" :disabled="state === 'running'")
          option(value="dormand-prince-5-4") Adaptive Dormand-Prince 5(4)
          option(value="rk4") Fixed-step RK4
      template(v-if="model.engine.type !== 'fba'")
        label(for="portfolio-duration") Duration (s)
        input#portfolio-duration(v-model.number="duration" type="number" min="0.1" max="100000" step="0.1" :disabled="state === 'running'")
        label(for="portfolio-output") Output interval (s)
        input#portfolio-output(v-model.number="outputInterval" type="number" min="0.01" :max="duration" step="0.01" :disabled="state === 'running'")
      template(v-if="model.engine.type === 'ode'")
        label(for="portfolio-step") Initial / fixed step (s)
        input#portfolio-step(v-model.number="fixedStep" type="number" min="0.0001" :max="duration" step="0.0001" :disabled="state === 'running'")
      template(v-if="model.engine.type === 'ssa'")
        label(for="portfolio-replicates") Replicates
        input#portfolio-replicates(v-model.number="replicates" type="number" min="1" max="10000" step="1" :disabled="state === 'running'")
      label(for="portfolio-seed") Seed (uint32)
      input#portfolio-seed(v-model.number="seed" type="number" min="0" max="4294967295" step="1" :disabled="state === 'running'")
      button.run-button(type="submit" :disabled="state === 'running'")
        span {{ state === 'running' ? 'Executing isolated worker…' : `Run ${model.engine.type.toUpperCase()} benchmark` }}
        span.arrow(aria-hidden="true") →
    .portfolio-contract
      h3 Contract boundary
      dl.compact-list
        div
          dt Model digest
          dd.digest {{ model.digest }}
        div
          dt Knowledge release
          dd {{ model.knowledgeRelease.id }}
        div
          dt Engine
          dd {{ model.engine.id }} {{ model.engine.version }}
      h3 Units and observables
      ul
        li(v-for="observable in model.observables" :key="observable.id") {{ observable.name }} · {{ observable.unit.symbol }}
      h3 Assumptions
      ul
        li(v-for="item in model.assumptions" :key="item") {{ item }}
      h3 Limitations
      ul
        li(v-for="item in model.limitations" :key="item") {{ item }}
  article.portfolio-result(v-if="result" aria-labelledby="portfolio-result-title")
    .run-header
      div
        span.run-label#portfolio-result-title Terminal run identity
        code {{ result.runId }}
      span.status-chip(:class="result.outcome") {{ result.lifecycle }} · {{ result.outcome }}
    template(v-if="result.data?.engine === 'ode'")
      figure.portfolio-chart
        figcaption Reactant trajectory ({{ result.data.trajectories[0].unit.symbol }})
        svg(viewBox="0 0 100 100" role="img" :aria-label="`ODE reactant trajectory with ${result.data.time.length} points`")
          polyline(:points="odeChart" fill="none" stroke="currentColor" stroke-width="2")
      .series-table-wrap
        table
          caption ODE final state
          thead
            tr
              th(scope="col") State
              th(scope="col") Final value
              th(scope="col") Unit
          tbody
            tr(v-for="series in result.data.trajectories" :key="series.id")
              th(scope="row") {{ series.name }}
              td {{ series.values.at(-1).toPrecision(7) }}
              td {{ series.unit.symbol }}
    .series-table-wrap(v-else-if="result.data?.engine === 'ssa'")
      table
        caption SSA final replicate summaries (n={{ result.data.replicates }})
        thead
          tr
            th(scope="col") State
            th(scope="col") Mean
            th(scope="col") Variance
            th(scope="col") Median
            th(scope="col") Range
            th(scope="col") Unit
        tbody
          tr(v-for="summary in result.data.summaries" :key="summary.id")
            th(scope="row") {{ summary.name }}
            td {{ summary.mean.toFixed(3) }}
            td {{ summary.variance.toFixed(3) }}
            td {{ summary.median }}
            td {{ summary.minimum }}–{{ summary.maximum }}
            td {{ summary.unit.symbol }}
    .series-table-wrap(v-else-if="result.data?.engine === 'fba'")
      table
        caption FBA optimum {{ result.data.objective.toFixed(6) }} {{ result.data.objectiveUnit.symbol }}
        thead
          tr
            th(scope="col") Flux
            th(scope="col") Value
            th(scope="col") Unit
        tbody
          tr(v-for="flux in result.data.fluxes" :key="flux.id")
            th(scope="row") {{ flux.name }}
            td {{ flux.value.toFixed(6) }}
            td {{ flux.unit.symbol }}
    .alert.error(v-else-if="result.failure" role="alert")
      strong {{ result.failure.code }}
      p {{ result.failure.message }}
    .portfolio-diagnostics
      strong {{ result.diagnostics.algorithm }} {{ result.diagnostics.algorithmVersion }}
      span {{ result.diagnostics.iterations }} iterations/events · seed {{ result.provenance.seed }}
      code {{ result.provenance.modelDigest }}
</template>
