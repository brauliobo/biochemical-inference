<script setup vapor>
import { computed, onMounted, ref, watch } from 'vue'
import { loadPortfolioModels, runPortfolioExperiment } from '../api.js'
import { useWorkflow } from '../composables/useWorkflow.js'
import { defaultMethod, portfolioExperiment } from '../portfolio-experiment.js'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import InputField from '../ui/InputField.vue'
import Panel from '../ui/Panel.vue'
import SelectField from '../ui/SelectField.vue'
import { statusTone } from '../ui/tone.js'
import PortfolioResult from './portfolio/PortfolioResult.vue'

const METHODS = [
  { value: 'dormand-prince-5-4', label: 'Adaptive Dormand-Prince 5(4)' },
  { value: 'rk4', label: 'Fixed-step RK4' }
]

const models = ref([])
const modelId = ref('')
const method = ref(defaultMethod('ode'))
const duration = ref(10)
const outputInterval = ref(1)
const fixedStep = ref(0.1)
const replicates = ref(256)
const seed = ref(20260712)
const record = ref()
const { state, message, step } = useWorkflow({ settled: ['ready', 'failed'] })

const model = computed(() => models.value.find((item) => item.id === modelId.value))
const engine = computed(() => model.value?.engine.type)
const result = computed(() => record.value?.result)
const modelOptions = computed(() => models.value.map((item) => ({ value: item.id, label: item.name })))
const contract = computed(() => [
  { label: 'Model digest', value: model.value.digest, mono: true },
  { label: 'Knowledge release', value: model.value.knowledgeRelease.id },
  { label: 'Engine', value: `${model.value.engine.id} ${model.value.engine.version}` }
])

// A different model resets the method to its engine's default and drops the old run.
watch(modelId, () => {
  record.value = undefined
  message.value = ''
  method.value = defaultMethod(engine.value)
})

const initialize = () => step('loading', async ({ signal, fresh }) => {
  models.value = fresh(await loadPortfolioModels(signal))
  modelId.value = models.value[0]?.id ?? ''
}, { done: 'ready', failure: 'Simulation portfolio could not be loaded.' })

function run() {
  if (!model.value || state.value === 'running') return
  record.value = undefined
  const experiment = portfolioExperiment(model.value, {
    seed: seed.value,
    method: method.value,
    duration: duration.value,
    outputInterval: outputInterval.value,
    fixedStep: fixedStep.value,
    replicates: replicates.value,
    assumptions: ['Registry values are used without parameter substitution.'],
    limitations: ['This v2 compatibility run completes synchronously; durable queueing and specification restarts are available only through the v7 workspace.']
  })
  return step('running', async ({ signal, fresh }) => {
    record.value = fresh(await runPortfolioExperiment(experiment, signal))
  }, { done: 'ready', failure: 'Portfolio execution failed.' })
}

onMounted(initialize)
</script>

<template lang="pug">
Panel.portfolio-panel(title="ODE · SSA · FBA workbench" title-id="portfolio-title" eyebrow="Standards portfolio" lede="Select a bounded declarative benchmark. Every run pins its model and release digests, algorithm version, units, seed, assumptions, and limitations." :status="state" :tone="statusTone(state)")
  ErrorNotice(v-if="state === 'failed'" :message="message")
  .sidebar(v-if="model")
    form.stack(@submit.prevent="run")
      SelectField(id="portfolio-model" label="Model and engine" v-model="modelId" :options="modelOptions" :disabled="state === 'running'")
      SelectField(v-if="engine === 'ode'" id="portfolio-method" label="Integration method" v-model="method" :options="METHODS" :disabled="state === 'running'")
      template(v-if="engine !== 'fba'")
        InputField(id="portfolio-duration" label="Duration (s)" type="number" v-model="duration" min="0.1" max="100000" step="0.1" :disabled="state === 'running'")
        InputField(id="portfolio-output" label="Output interval (s)" type="number" v-model="outputInterval" min="0.01" :max="duration" step="0.01" :disabled="state === 'running'")
      InputField(v-if="engine === 'ode'" id="portfolio-step" label="Initial / fixed step (s)" type="number" v-model="fixedStep" min="0.0001" :max="duration" step="0.0001" :disabled="state === 'running'")
      InputField(v-if="engine === 'ssa'" id="portfolio-replicates" label="Replicates" type="number" v-model="replicates" min="1" max="10000" step="1" :disabled="state === 'running'")
      InputField(id="portfolio-seed" label="Seed (uint32)" type="number" v-model="seed" min="0" max="4294967295" step="1" :disabled="state === 'running'")
      div
        button.button(type="submit" :disabled="state === 'running'") {{ state === 'running' ? 'Executing isolated worker…' : `Run ${engine.toUpperCase()} benchmark` }}
    section.stack.stack--tight(aria-labelledby="portfolio-contract-title")
      h3#portfolio-contract-title Contract boundary
      Facts(rows :items="contract")
      h3 Units and observables
      ul
        li(v-for="observable in model.observables" :key="observable.id") {{ observable.name }} · {{ observable.unit.symbol }}
      h3 Assumptions
      ul
        li(v-for="item in model.assumptions" :key="item") {{ item }}
      h3 Limitations
      ul
        li(v-for="item in model.limitations" :key="item") {{ item }}
  PortfolioResult(v-if="result" :result="result")
</template>
