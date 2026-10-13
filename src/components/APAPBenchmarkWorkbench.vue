<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { APAP_RELEASE_ID, APAP_WARNING } from '../../shared/apap-contracts.js'
import { loadApapWorkspace, runApapBenchmark } from '../api.js'
import SpatialTissueWorkbench from './SpatialTissueWorkbench.vue'
import DataTable from './ui/DataTable.vue'
import Field from './ui/Field.vue'
import Panel from './ui/Panel.vue'

const emit = defineEmits(['completed'])

const workspace = ref()
const records = ref({})
const result = ref()
const state = ref('loading')
const message = ref('')
const selectedProtocolId = ref('PROTOCOL:APAP-HUMAN-PK')
const heatmapVariable = ref('adduct')
const timeIndex = ref(0)
const selectedBin = ref(0)
const cypActivity = ref(1)
const adductBinding = ref(1)
const zonation = ref(1)
const nacGsh = ref(1)
let controller
let generation = 0

const selectedProtocol = computed(() => workspace.value?.protocols.find((item) => item.id === selectedProtocolId.value))
const selectedContext = computed(() => workspace.value?.contexts.find((item) => item.id === selectedProtocol.value?.context_id))
const snapshot = computed(() => result.value?.lobule.snapshots[timeIndex.value])
const humanParameters = computed(() => workspace.value?.parameters.filter((item) => item.context_id === 'CONTEXT:APAP-HUMAN-LIVER') ?? [])
const mouseParameters = computed(() => workspace.value?.parameters.filter((item) => item.context_id === 'CONTEXT:APAP-MOUSE-LIVER') ?? [])
const modelParameterDiff = computed(() => {
  const human = records.value['CONTEXT:APAP-HUMAN-LIVER']?.result.effectiveParameters ?? []
  const mouse = records.value['CONTEXT:APAP-MOUSE-LIVER']?.result.effectiveParameters ?? []
  if (!human.length || !mouse.length) return []
  return human.map((item) => ({ symbol: item.symbol, human: item, mouse: mouse.find((candidate) => candidate.symbol === item.symbol) })).filter((item) => item.mouse && item.human.value !== item.mouse.value)
})

function chooseProtocol(protocol) {
  if (state.value === 'running') return
  selectedProtocolId.value = protocol.id
  result.value = records.value[protocol.context_id]?.result.protocol.id === protocol.id ? records.value[protocol.context_id].result : undefined
  timeIndex.value = 0
  message.value = ''
}

function chooseContext(contextId) {
  if (state.value === 'running') return
  const protocol = workspace.value?.protocols.find((item) => item.context_id === contextId && item.protocol_class !== 'delayed-nac')
  if (protocol) chooseProtocol(protocol)
}

async function initialize() {
  const requestGeneration = ++generation
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    const loaded = await loadApapWorkspace(controller.signal)
    if (requestGeneration !== generation) return
    workspace.value = loaded
    state.value = 'ready'
  } catch (error) {
    if (requestGeneration !== generation || error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The pinned APAP benchmark could not be verified.'
  }
}

async function run() {
  if (!selectedProtocol.value || state.value === 'running') return
  const requestGeneration = ++generation
  const protocolId = selectedProtocol.value.id
  const contextId = selectedProtocol.value.context_id
  controller?.abort()
  controller = new AbortController()
  state.value = 'running'
  message.value = ''
  try {
    const record = await runApapBenchmark({
      releaseId: APAP_RELEASE_ID,
      contextId,
      protocolId,
      stepHours: 0.01,
      outputEveryHours: 0.5,
      mechanismScales: { cypActivity: cypActivity.value, adductBinding: adductBinding.value, zonation: zonation.value, nacGsh: nacGsh.value }
    }, controller.signal)
    if (requestGeneration !== generation || selectedProtocolId.value !== protocolId || record.result.context.id !== contextId || record.result.protocol.id !== protocolId) return
    result.value = record.result
    records.value = { ...records.value, [record.result.context.id]: record }
    emit('completed', record)
    timeIndex.value = record.result.timeHours.length - 1
    state.value = 'ready'
  } catch (error) {
    if (requestGeneration !== generation || error instanceof DOMException && error.name === 'AbortError') return
    result.value = undefined
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The APAP benchmark run failed.'
  }
}

// Share of the largest value in the snapshot, 0 to 1; drives the bar under each bin.
function heatRatio(value, values) {
  const maximum = Math.max(...values)
  return maximum === 0 ? 0 : Math.min(1, value / maximum)
}

onMounted(initialize)
onBeforeUnmount(() => {
  generation += 1
  controller?.abort()
})
</script>

<template lang="pug">
Panel(title-id="apap-title" title="APAP benchmark workbench" eyebrow="Goal 6 · deterministic liver toxicity benchmark" :status="result ? result.outcome : state" :tone="state === 'failed' ? 'danger' : state === 'ready' ? 'success' : ''")
  .notice.notice--warning.stack.stack--tight(role="note" aria-label="Persistent APAP scientific warning")
    strong Synthetic · non-clinical · unsupported
    p {{ APAP_WARNING }}
  div(role="status")
    p.notice(v-if="state === 'loading'") Verifying the pinned APAP benchmark…
    p.notice(v-else-if="state === 'running'") Integrating the bounded model. Context, protocol and scale controls are locked until it finishes.
  .notice.notice--danger.stack.stack--tight(v-if="state === 'failed'" role="alert")
    p {{ message }}
    div(v-if="!workspace")
      button.button.button--secondary(type="button" @click="initialize") Retry APAP compatibility check

  template(v-if="workspace")
    dl.facts
      div
        dt Pinned release
        dd {{ workspace.detail.release.id }}
      div
        dt Trusted digest
        dd {{ workspace.detail.release.digest }}
      div
        dt Equation set
        dd {{ workspace.discovery.equationSetId }}
      div
        dt Evidence boundary
        dd Illustrative assumptions · synthetic observations

    section.stack.stack--tight
      h3 Human and mouse contexts
      .grid
        button.card(v-for="context in workspace.contexts" :key="context.id" type="button" :aria-pressed="selectedContext?.id === context.id" :disabled="state === 'running'" @click="chooseContext(context.id)")
          span {{ context.taxon_label }}
          strong {{ context.id }}
          small.muted {{ context.challenge_route }} · {{ context.strain ?? 'no cohort/strain asserted' }} · {{ context.sex }} · {{ context.fasting_status }}

    section.stack.stack--tight
      h3 Bounded synthetic protocols
      .grid
        button.card(v-for="protocol in workspace.protocols" :key="protocol.id" type="button" :aria-pressed="selectedProtocolId === protocol.id" :disabled="state === 'running'" @click="chooseProtocol(protocol)")
          span.eyebrow {{ protocol.protocol_class }} · unsupported
          strong {{ protocol.name }}
          small.muted {{ protocol.observation_window.lower }}–{{ protocol.observation_window.upper }} h · {{ protocol.interventions.map(item => `${item.role} ${item.dose.lower} ${item.dose.unit} at ${item.start_time.lower} h`).join(' · ') }}
          span {{ protocol.exclusion }}

    .grid
      Panel(title-id="apap-controls-title" title="Explicit mechanism scales" :level="3")
        form.stack(@submit.prevent="run")
          Field(id="apap-cyp" label="CYP activity")
            input#apap-cyp(v-model.number="cypActivity" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
          Field(id="apap-binding" label="NAPQI adduct binding")
            input#apap-binding(v-model.number="adductBinding" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
          Field(id="apap-zonation" label="Zonation amplitude")
            input#apap-zonation(v-model.number="zonation" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
          Field(id="apap-nac-gsh" label="NAC-to-GSH term")
            input#apap-nac-gsh(v-model.number="nacGsh" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
          div
            button.button(type="submit" :disabled="state === 'running'") {{ state === 'running' ? 'Integrating bounded model…' : 'Run APAP benchmark' }}
      Panel(title-id="apap-species-title" title="Upstream species parameter records" :level="3")
        p.muted Values remain separate by context; absence is shown rather than filled by taxon logic.
        DataTable(caption="Human/mouse source parameter difference" :columns="['Human', 'Mouse']")
          tr(v-for="index in Math.max(humanParameters.length, mouseParameters.length)" :key="index")
            td
              .cluster(v-if="humanParameters[index - 1]")
                code {{ humanParameters[index - 1].id }}
                span {{ humanParameters[index - 1].quantity.value }} {{ humanParameters[index - 1].quantity.unit }}
              span.muted(v-else) Not supplied
            td
              .cluster(v-if="mouseParameters[index - 1]")
                code {{ mouseParameters[index - 1].id }}
                span {{ mouseParameters[index - 1].quantity.value }} {{ mouseParameters[index - 1].quantity.unit }}
              span.muted(v-else) Not supplied

    section.stack.stack--tight
      h3 Validation coverage
      .grid
        article.card.stack.stack--tight(v-for="row in workspace.validationMatrix" :key="row.id")
          div
            span.badge.badge--warning Unsupported
          strong {{ row.claim_type }}
          p {{ row.rationale }}

  Panel(v-if="result" title-id="apap-result-title" title="Canonical APAP run identity" :level="3")
    p
      code {{ result.runId }}
    p.notice.notice--warning {{ result.warning }}
    dl.facts
      div
        dt Peak central APAP
        dd #[strong {{ result.summary.peakCentralApap.toFixed(4) }}] #[small.muted model-unit]
      div
        dt NAPQI formed
        dd #[strong {{ result.summary.totalNapqiFormed.toFixed(4) }}] #[small.muted model-unit]
      div
        dt Final adduct
        dd #[strong {{ result.summary.finalAdductBurden.toFixed(5) }}] #[small.muted model-unit]
      div
        dt Peak injured fraction
        dd #[strong {{ result.summary.peakInjuredFraction.toFixed(5) }}] #[small.muted dimensionless · unsupported]

    .grid
      Field(id="apap-time" :label="`Lobule time: ${snapshot?.timeHours} h`")
        input#apap-time(v-model.number="timeIndex" type="range" min="0" :max="result.lobule.snapshots.length - 1" step="1")
      Field(id="apap-field" label="Heatmap field")
        select#apap-field(v-model="heatmapVariable")
          option(value="apap") APAP
          option(value="napqi") NAPQI
          option(value="gsh") GSH
          option(value="adduct") Adduct
          option(value="oxygen") Oxygen
          option(value="injured") Injured fraction

    template(v-if="snapshot")
      SpatialTissueWorkbench(:taxon-id="selectedContext.taxon_id" :snapshot="snapshot" :time-index="timeIndex" :field="heatmapVariable" :selected-bin="selectedBin" @select-bin="selectedBin = $event")
      .heatmap(role="group" :aria-label="`${heatmapVariable} across 12 portal-to-central lobule bins at ${snapshot.timeHours} hours`")
        button(v-for="(value, index) in snapshot[heatmapVariable]" :key="index" type="button" :aria-label="`Bin ${index + 1}: ${value}`" :aria-pressed="selectedBin === index" @click="selectedBin = index")
          span {{ index + 1 }}
          strong {{ value.toFixed(4) }}
          span.heatmap__bar(:style="{ '--heat': heatRatio(value, snapshot[heatmapVariable]) }")
      p.repel.muted(aria-hidden="true")
        span Portal
        span Central
      DataTable(:caption="`Accessible lobule state at ${snapshot.timeHours} h; no interpolation`" :columns="['Bin', 'APAP', 'NAPQI', 'GSH', 'Adduct', 'O₂', 'Healthy', 'Stressed', 'Injured', 'Recovering']")
        tr(v-for="(_, index) in snapshot.apap" :key="index" :aria-current="selectedBin === index ? 'true' : undefined")
          th(scope="row") {{ index + 1 }}
          td {{ snapshot.apap[index].toFixed(4) }}
          td {{ snapshot.napqi[index].toFixed(4) }}
          td {{ snapshot.gsh[index].toFixed(4) }}
          td {{ snapshot.adduct[index].toFixed(4) }}
          td {{ snapshot.oxygen[index].toFixed(4) }}
          td {{ snapshot.healthy[index].toFixed(4) }}
          td {{ snapshot.stressed[index].toFixed(4) }}
          td {{ snapshot.injured[index].toFixed(4) }}
          td {{ snapshot.recovering[index].toFixed(4) }}

    .grid
      Panel(title-id="apap-series-title" title="Systemic time series" :level="4")
        DataTable(:caption="`Exact output at ${result.timeHours[timeIndex]} h`" :columns="['Output', 'Value', 'Unit']")
          tr(v-for="series in result.systemicOutputs" :key="series.id")
            th(scope="row") {{ series.name }}
            td {{ series.values[timeIndex].toFixed(5) }}
            td {{ series.unit }}
      Panel(title-id="apap-diagnostics-title" title="Conservation diagnostics" :level="4")
        dl.facts.facts--rows
          div
            dt APAP mass residual
            dd {{ result.diagnostics.mass.residual }} / {{ result.diagnostics.mass.tolerance }}
          div
            dt Cell-fraction max sum error
            dd {{ result.diagnostics.cellState.maximumSumError }}
          div
            dt Minimum state / fraction
            dd {{ result.diagnostics.state.minimumValue }} / {{ result.diagnostics.cellState.minimumFraction }}
          div
            dt Fixed integration
            dd {{ result.diagnostics.integrationSteps }} × {{ result.engine.stepHours }} h
          div
            dt 1x/2x/4x timestep refinement
            dd {{ result.diagnostics.timestepRefinement.passed ? 'Pass' : 'Fail' }} · max {{ Math.max(...result.diagnostics.timestepRefinement.comparisons.map(item => item.maximumAbsoluteDifference)).toExponential(3) }} / {{ result.diagnostics.timestepRefinement.tolerance }}
    Panel(title-id="apap-limiting-title" title="Limiting cases" :level="4")
      ul.plain-list.stack.stack--tight
        li.cluster(v-for="item in result.diagnostics.limitingCases" :key="item.id")
          strong {{ item.passed ? 'Pass' : 'Fail' }} · {{ item.id }}
          span {{ item.expectation }} Maximum signal {{ item.maximumSignal }}.

    Panel(v-if="modelParameterDiff.length" title-id="apap-diff-title" title="Exact effective human/mouse parameter differences" :level="4")
      DataTable(caption="Differences arise from visible context bindings, not taxon branches" :columns="['Symbol', 'Human', 'Mouse', 'Provenance']")
        tr(v-for="item in modelParameterDiff" :key="item.symbol")
          th(scope="row") {{ item.symbol }}
          td {{ item.human.value }} {{ item.human.unit }}
          td {{ item.mouse.value }} {{ item.mouse.unit }}
          td {{ item.human.origin }} / {{ item.mouse.origin }}

    details.card.stack
      summary Effective parameters, assumptions, synthetic comparison, and limitations
      h4 Exact effective parameters
      DataTable(caption="Context-bound values used by this run" :columns="['Parameter', 'Value', 'Origin', 'Assumption']")
        tr(v-for="item in result.effectiveParameters" :key="item.symbol")
          th(scope="row") {{ item.symbol }}
          td {{ item.value }} {{ item.unit }}
          td {{ item.origin }}
          td
            code {{ item.assumptionId }}
      h4 Synthetic observations (not biological validation)
      DataTable(caption="Calibration and validation partitions remain unsupported" :columns="['Observation', 'Partition', 'Observed', 'Model output', 'Status']")
        tr(v-for="item in result.syntheticComparisons" :key="item.observationId")
          th(scope="row") {{ item.observationId }}
          td {{ item.partition }}
          td {{ item.observed }} {{ item.unit }}
          td {{ item.predicted }} {{ item.unit }}
          td
            span.badge.badge--warning {{ item.validationStatus }}
      h4 Assumptions and limitations
      ul.plain-list.stack.stack--tight
        li.cluster(v-for="item in result.limitations" :key="item.id")
          strong {{ item.id }}
          span {{ item.statement }}
</template>
