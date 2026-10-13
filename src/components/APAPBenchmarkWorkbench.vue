<script setup vapor>
import { computed, onMounted, reactive, ref } from 'vue'
import { APAP_RELEASE_ID, APAP_WARNING } from '../../shared/apap-contracts.js'
import { loadApapWorkspace, runApapBenchmark } from '../api.js'
import { useWorkflow } from '../composables/useWorkflow.js'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import { statusTone } from '../ui/tone.js'
import ApapResult from './apap/ApapResult.vue'
import ContextPicker from './apap/ContextPicker.vue'
import ScaleControls from './apap/ScaleControls.vue'

const emit = defineEmits(['completed'])

const workspace = ref()
const records = ref({})
const result = ref()
const selectedProtocolId = ref('PROTOCOL:APAP-HUMAN-PK')
const timeIndex = ref(0)
const scales = reactive({ cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 })
const { state, message, step } = useWorkflow({ settled: ['ready', 'failed'] })

const running = computed(() => state.value === 'running')
const selectedProtocol = computed(() => workspace.value?.protocols.find((item) => item.id === selectedProtocolId.value))
const selectedContext = computed(() => workspace.value?.contexts.find((item) => item.id === selectedProtocol.value?.context_id))
const resultOf = (contextId) => records.value[contextId]?.result
const pins = computed(() => [
  { label: 'Pinned release', value: workspace.value.detail.release.id },
  { label: 'Trusted digest', value: workspace.value.detail.release.digest },
  { label: 'Equation set', value: workspace.value.discovery.equationSetId },
  { label: 'Evidence boundary', value: 'Illustrative assumptions · synthetic observations' }
])

function chooseProtocol(protocol) {
  if (running.value) return
  selectedProtocolId.value = protocol.id
  const known = resultOf(protocol.context_id)
  result.value = known?.protocol.id === protocol.id ? known : undefined
  timeIndex.value = 0
  message.value = ''
}

function chooseContext(contextId) {
  if (running.value) return
  const protocol = workspace.value?.protocols.find((item) => item.context_id === contextId && item.protocol_class !== 'delayed-nac')
  if (protocol) chooseProtocol(protocol)
}

const initialize = () => step('loading', async ({ signal, fresh }) => {
  workspace.value = fresh(await loadApapWorkspace(signal))
}, { done: 'ready', failure: 'The pinned APAP benchmark could not be verified.' })

function run() {
  if (!selectedProtocol.value || running.value) return undefined
  const { id: protocolId, context_id: contextId } = selectedProtocol.value
  return step('running', async ({ signal, fresh }) => {
    const record = fresh(await runApapBenchmark({
      releaseId: APAP_RELEASE_ID,
      contextId,
      protocolId,
      stepHours: 0.01,
      outputEveryHours: 0.5,
      mechanismScales: { ...scales }
    }, signal))
    // A response for a protocol that is no longer selected is dropped.
    return selectedProtocolId.value === protocolId && record.result.context.id === contextId && record.result.protocol.id === protocolId ? record : undefined
  }, {
    done: (record) => {
      if (!record) return 'ready'
      result.value = record.result
      records.value = { ...records.value, [record.result.context.id]: record }
      timeIndex.value = record.result.timeHours.length - 1
      emit('completed', record)
      return 'ready'
    },
    failure: 'The APAP benchmark run failed.'
  })
}

onMounted(initialize)
</script>

<template lang="pug">
Panel(title="APAP benchmark workbench" title-id="apap-title" eyebrow="Goal 6 · deterministic liver toxicity benchmark" :status="result ? result.outcome : state" :tone="statusTone(state)")
  Notice(tone="warning" role="note" aria-label="Persistent APAP scientific warning" title="Synthetic · non-clinical · unsupported")
    p {{ APAP_WARNING }}
  LiveMessage(visible :text="state === 'loading' ? 'Verifying the pinned APAP benchmark…' : running ? 'Integrating the bounded model. Context, protocol and scale controls are locked until it finishes.' : ''")
  ErrorNotice(v-if="state === 'failed'" :message="message" :retry-label="workspace ? '' : 'Retry APAP compatibility check'" @retry="initialize")

  template(v-if="workspace")
    Facts(:items="pins")
    ContextPicker(:contexts="workspace.contexts" :protocols="workspace.protocols" :context-id="selectedContext?.id" :protocol-id="selectedProtocolId" :locked="running" @context="chooseContext" @protocol="chooseProtocol")
    ScaleControls(v-model:scales="scales" :parameters="workspace.parameters" :locked="running" :running="running" @run="run")
    section.stack.stack--tight
      h3 Validation coverage
      .grid
        Card(v-for="row in workspace.validationMatrix" :key="row.id")
          div
            Badge(tone="warning" label="Unsupported")
          strong {{ row.claim_type }}
          p {{ row.rationale }}
    ApapResult(v-if="result" v-model:timeIndex="timeIndex" :result="result" :taxon-id="selectedContext.taxon_id" :human-result="resultOf('CONTEXT:APAP-HUMAN-LIVER')" :mouse-result="resultOf('CONTEXT:APAP-MOUSE-LIVER')")
</template>
