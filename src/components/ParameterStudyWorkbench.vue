<script setup vapor>
import { computed, onMounted, ref } from 'vue'
import { loadParameterOptions, runParameterStudy } from '../api.js'
import { useWorkflow } from '../composables/useWorkflow.js'
import Card from '../ui/Card.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import InputField from '../ui/InputField.vue'
import Panel from '../ui/Panel.vue'
import { statusTone } from '../ui/tone.js'
import StudyResult from './parameter-study/StudyResult.vue'

const options = ref()
const record = ref()
const seed = ref(20260712)
const proposalScale = ref(0.002)
const optimizerIterations = ref(200)
const stressAlternative = ref(false)
const { state, message, step } = useWorkflow({ settled: ['ready', 'failed'] })

const result = computed(() => record.value?.result)
const selectedDecision = computed(() => options.value?.decisions.find((item) => item.decision === 'selected'))
const excludedDecisions = computed(() => options.value?.decisions.filter((item) => item.decision === 'excluded') ?? [])
const partition = computed(() => options.value?.partitions[0])
const summary = computed(() => [
  { label: 'Parameter release', value: options.value.release.id },
  { label: 'Pinned digest', value: options.value.release.digest, mono: true },
  { label: 'Target context', value: options.value.targetContext.name },
  { label: 'Data status', value: 'Synthetic · assumptions explicit' }
])

const initialize = () => step('loading', async ({ signal, fresh }) => {
  options.value = fresh(await loadParameterOptions(signal))
}, { done: 'ready', failure: 'Parameter evidence could not be loaded.' })

function run() {
  if (!options.value || state.value === 'running') return
  record.value = undefined
  return step('running', async ({ signal, fresh }) => {
    record.value = fresh(await runParameterStudy({
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
    }, signal))
  }, { done: 'ready', failure: 'Parameter study failed.' })
}

onMounted(initialize)
</script>

<template lang="pug">
Panel.parameter-study-panel(title="Synthetic decay inference study" title-id="parameter-study-title" eyebrow="Parameter evidence · calibration · uncertainty" lede="Every value below is labeled synthetic or assumption. This benchmark validates inference algorithms and partition discipline; it contains no measured biology." :status="result ? `${result.lifecycle} · ${result.outcome}` : state" :tone="statusTone(result?.outcome ?? state)")
  ErrorNotice(v-if="state === 'failed'" :message="message")
  template(v-if="options")
    Facts(:items="summary")
    .sidebar
      form.stack(@submit.prevent="run")
        InputField(id="study-seed" label="Seed (uint32)" type="number" v-model="seed" min="0" max="4294967295" step="1" :disabled="state === 'running'")
        InputField(id="study-proposal" label="Metropolis proposal scale (s⁻¹)" type="number" v-model="proposalScale" min="0.0001" max="1" step="0.0001" :disabled="state === 'running'")
        InputField(id="study-iterations" label="Optimizer maximum iterations" type="number" v-model="optimizerIterations" min="1" max="1000" step="1" :disabled="state === 'running'")
        InputField(id="study-stress" label="Include misspecified offset model (assumption stress)" type="checkbox" v-model="stressAlternative" :disabled="state === 'running'")
        div
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
    Panel(:title="`Fixed partition · ${partition.id}`" title-id="study-partition-title" :level="3" flat)
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
  StudyResult(v-if="result" :result="result")
</template>
