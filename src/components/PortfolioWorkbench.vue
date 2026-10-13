<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { loadPortfolioModels, runPortfolioExperiment } from '../api.js'
import ChartFrame from '../ui/ChartFrame.vue'
import Section from '../ui/Section.vue'
import { badgeClass, statusTone } from '../ui/tone.js'

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

const sampleCount = 8
const model = computed(() => models.value.find((item) => item.id === modelId.value))
const result = computed(() => record.value?.result)
const odeChart = computed(() => {
  if (result.value?.data?.engine !== 'ode') return ''
  const series = result.value.data.trajectories[0]
  const maximum = Math.max(...series.values, 1)
  return series.values.map((value, index) => `${index * 100 / Math.max(1, series.values.length - 1)},${100 - value * 90 / maximum}`).join(' ')
})
// Text alternative for the trajectory: a sentence and a short sampled table.
const odeSummary = computed(() => {
  if (result.value?.data?.engine !== 'ode') return ''
  const { time, trajectories: [series] } = result.value.data
  const peak = Math.max(...series.values)
  return `${series.name} starts at ${series.values[0].toPrecision(4)}, peaks at ${peak.toPrecision(4)} and ends at ${series.values.at(-1).toPrecision(4)} ${series.unit.symbol} over ${time.at(-1)} s.`
})
const odeSamples = computed(() => {
  if (result.value?.data?.engine !== 'ode') return []
  const { time, trajectories: [series] } = result.value.data
  const last = series.values.length - 1
  const step = Math.max(1, Math.ceil(last / sampleCount))
  const indexes = []
  for (let index = 0; index < last; index += step) indexes.push(index)
  return [...indexes, last].map((index) => ({ time: time[index], value: series.values[index] }))
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
    ? { method: method.value, timeUnit: 'second', duration: duration.value, outputInterval: outputInterval.value, fixedStep: fixedStep.value, absoluteTolerance: 1e-9, relativeTolerance: 1e-7, maxInternalSteps: 100000 }
    : selected.engine.type === 'ssa'
      ? { method: 'gillespie-direct', timeUnit: 'second', duration: duration.value, outputInterval: outputInterval.value, replicates: replicates.value, maxEventsPerReplicate: 100000 }
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
Section.portfolio-panel(title="ODE · SSA · FBA workbench" title-id="portfolio-title" eyebrow="Standards portfolio" lede="Select a bounded declarative benchmark. Every run pins its model and release digests, algorithm version, units, seed, assumptions, and limitations." :status="state" :tone="statusTone(state)")
  .notice.notice--danger(v-if="state === 'failed'" role="alert") {{ message }}
  .sidebar(v-if="model")
    form.form(@submit.prevent="run")
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
      button.button(type="submit" :disabled="state === 'running'") {{ state === 'running' ? 'Executing isolated worker…' : `Run ${model.engine.type.toUpperCase()} benchmark` }}
    section.stack.stack--tight(aria-labelledby="portfolio-contract-title")
      h3#portfolio-contract-title Contract boundary
      dl.facts
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
  article.card.card--flat.stack(v-if="result" aria-labelledby="portfolio-result-title")
    .repel
      div
        h3#portfolio-result-title Terminal run identity
        code.digest {{ result.runId }}
      span(:class="badgeClass(result.outcome)") {{ result.lifecycle }} · {{ result.outcome }}
    template(v-if="result.data?.engine === 'ode'")
      ChartFrame(id="portfolio-chart" :title="`Reactant trajectory (${result.data.trajectories[0].unit.symbol})`" :summary="odeSummary" table-label="Show trajectory samples")
        svg.chart.chart--stretch(viewBox="0 0 100 100" preserveAspectRatio="none" role="img" :aria-label="`ODE reactant trajectory with ${result.data.time.length} points`")
          line.chart__axis(x1="0" y1="100" x2="100" y2="100")
          line.chart__axis(x1="0" y1="0" x2="0" y2="100")
          line.chart__gridline(x1="0" y1="50" x2="100" y2="50")
          polyline.chart__line(:points="odeChart")
        template(#table)
          table
            caption Sampled {{ result.data.trajectories[0].name }}
            thead
              tr
                th(scope="col") Time (s)
                th(scope="col") Value ({{ result.data.trajectories[0].unit.symbol }})
            tbody
              tr(v-for="sample in odeSamples" :key="sample.time")
                th(scope="row") {{ sample.time }}
                td {{ sample.value.toPrecision(5) }}
      .scroll-x(role="region" tabindex="0" aria-label="ODE final state values")
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
    .scroll-x(v-else-if="result.data?.engine === 'ssa'" role="region" tabindex="0" aria-label="SSA replicate summaries")
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
    .scroll-x(v-else-if="result.data?.engine === 'fba'" role="region" tabindex="0" aria-label="FBA flux values")
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
    .notice.notice--danger.stack.stack--tight(v-else-if="result.failure" role="alert")
      strong {{ result.failure.code }}
      p {{ result.failure.message }}
    .notice.stack.stack--tight
      p
        strong {{ result.diagnostics.algorithm }} {{ result.diagnostics.algorithmVersion }}
      p {{ result.diagnostics.iterations }} iterations/events · seed {{ result.provenance.seed }}
      p
        code {{ result.provenance.modelDigest }}
</template>
