<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { APAP_RELEASE_ID, APAP_WARNING } from '../../shared/apap-contracts.js'
import { loadApapWorkspace, runApapBenchmark } from '../api.js'

const workspace = ref()
const records = ref({})
const result = ref()
const state = ref('loading')
const message = ref('')
const selectedProtocolId = ref('PROTOCOL:APAP-HUMAN-PK')
const heatmapVariable = ref('adduct')
const timeIndex = ref(0)
const cypActivity = ref(1)
const adductBinding = ref(1)
const zonation = ref(1)
const nacGsh = ref(1)
let controller

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
  selectedProtocolId.value = protocol.id
  result.value = records.value[protocol.context_id]?.result.protocol.id === protocol.id ? records.value[protocol.context_id].result : undefined
  timeIndex.value = 0
  message.value = ''
}

function chooseContext(contextId) {
  const protocol = workspace.value?.protocols.find((item) => item.context_id === contextId && item.protocol_class !== 'delayed-nac')
  if (protocol) chooseProtocol(protocol)
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    workspace.value = await loadApapWorkspace(controller.signal)
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The pinned APAP benchmark could not be verified.'
  }
}

async function run() {
  if (!selectedProtocol.value || state.value === 'running') return
  controller?.abort()
  controller = new AbortController()
  state.value = 'running'
  message.value = ''
  try {
    const record = await runApapBenchmark({
      releaseId: APAP_RELEASE_ID,
      contextId: selectedProtocol.value.context_id,
      protocolId: selectedProtocol.value.id,
      stepHours: 0.01,
      outputEveryHours: 0.5,
      mechanismScales: { cypActivity: cypActivity.value, adductBinding: adductBinding.value, zonation: zonation.value, nacGsh: nacGsh.value }
    }, controller.signal)
    result.value = record.result
    records.value = { ...records.value, [record.result.context.id]: record }
    timeIndex.value = record.result.timeHours.length - 1
    state.value = 'ready'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    result.value = undefined
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The APAP benchmark run failed.'
  }
}

function heatStyle(value, values) {
  const maximum = Math.max(...values)
  const ratio = maximum === 0 ? 0 : Math.min(1, value / maximum)
  return { backgroundColor: `color-mix(in srgb, var(--amber) ${Math.round(12 + ratio * 78)}%, #10201c)` }
}

onMounted(initialize)
onBeforeUnmount(() => controller?.abort())
</script>

<template lang="pug">
section.apap-panel(aria-labelledby="apap-title")
  .apap-warning(role="note" aria-label="Persistent APAP scientific warning")
    strong Synthetic · non-clinical · unsupported
    span {{ APAP_WARNING }}
  .section-heading
    div
      p.kicker Goal 6 · deterministic liver toxicity benchmark
      h2#apap-title APAP benchmark workbench
    span.status-chip(:class="state" aria-live="polite") {{ result ? result.outcome : state }}
  .alert.error(v-if="state === 'failed'" role="alert")
    p {{ message }}
    button.secondary(v-if="!workspace" type="button" @click="initialize") Retry APAP compatibility check
  template(v-if="workspace")
    .apap-provenance
      dl.provenance-grid
        div
          dt Pinned release
          dd {{ workspace.detail.release.id }}
        div
          dt Trusted digest
          dd.digest {{ workspace.detail.release.digest }}
        div
          dt Equation set
          dd {{ workspace.discovery.equationSetId }}
        div
          dt Evidence boundary
          dd Illustrative assumptions · synthetic observations

    h3 Human and mouse contexts
    .apap-contexts
      button.apap-context(v-for="context in workspace.contexts" :key="context.id" type="button" :class="{ selected: selectedContext?.id === context.id }" :aria-pressed="selectedContext?.id === context.id" @click="chooseContext(context.id)")
        span {{ context.taxon_label }}
        strong {{ context.id }}
        small {{ context.challenge_route }} · {{ context.strain ?? 'no cohort/strain asserted' }} · {{ context.sex }} · {{ context.fasting_status }}

    h3 Bounded synthetic protocols
    .protocol-cards
      button.protocol-card(v-for="protocol in workspace.protocols" :key="protocol.id" type="button" :class="{ selected: selectedProtocolId === protocol.id }" :aria-pressed="selectedProtocolId === protocol.id" @click="chooseProtocol(protocol)")
        span.assumption-label {{ protocol.protocol_class }} · unsupported
        strong {{ protocol.name }}
        small {{ protocol.observation_window.lower }}–{{ protocol.observation_window.upper }} h · {{ protocol.interventions.map(item => `${item.role} ${item.dose.lower} ${item.dose.unit} at ${item.start_time.lower} h`).join(' · ') }}
        p {{ protocol.exclusion }}

    .apap-run-layout
      form.apap-controls(@submit.prevent="run")
        h3 Explicit mechanism scales
        label(for="apap-cyp") CYP activity
        input#apap-cyp(v-model.number="cypActivity" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
        label(for="apap-binding") NAPQI adduct binding
        input#apap-binding(v-model.number="adductBinding" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
        label(for="apap-zonation") Zonation amplitude
        input#apap-zonation(v-model.number="zonation" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
        label(for="apap-nac-gsh") NAC-to-GSH term
        input#apap-nac-gsh(v-model.number="nacGsh" type="number" min="0" max="2" step="0.1" :disabled="state === 'running'")
        button.run-button(type="submit" :disabled="state === 'running'")
          span {{ state === 'running' ? 'Integrating bounded model…' : 'Run APAP benchmark' }}
          span.arrow(aria-hidden="true") →
      .parameter-diff
        h3 Upstream species parameter records
        p Values remain separate by context; absence is shown rather than filled by taxon logic.
        .series-table-wrap
          table
            caption Human/mouse source parameter difference
            thead
              tr
                th(scope="col") Human
                th(scope="col") Mouse
            tbody
              tr(v-for="index in Math.max(humanParameters.length, mouseParameters.length)" :key="index")
                td
                  template(v-if="humanParameters[index - 1]")
                    code {{ humanParameters[index - 1].id }}
                    span {{ humanParameters[index - 1].quantity.value }} {{ humanParameters[index - 1].quantity.unit }}
                  span(v-else) Not supplied
                td
                  template(v-if="mouseParameters[index - 1]")
                    code {{ mouseParameters[index - 1].id }}
                    span {{ mouseParameters[index - 1].quantity.value }} {{ mouseParameters[index - 1].quantity.unit }}
                  span(v-else) Not supplied

    h3 Validation coverage
    .validation-grid
      article(v-for="row in workspace.validationMatrix" :key="row.id")
        span.unsupported-badge Unsupported
        strong {{ row.claim_type }}
        p {{ row.rationale }}

  article.apap-result(v-if="result" aria-labelledby="apap-result-title")
    .run-header
      div
        span.run-label#apap-result-title Canonical APAP run identity
        code {{ result.runId }}
      span.prediction {{ result.warning }}
    dl.study-metrics
      div
        span Peak central APAP
        strong {{ result.summary.peakCentralApap.toFixed(4) }}
        small model-unit
      div
        span NAPQI formed
        strong {{ result.summary.totalNapqiFormed.toFixed(4) }}
        small model-unit
      div
        span Final adduct
        strong {{ result.summary.finalAdductBurden.toFixed(5) }}
        small model-unit
      div
        span Peak injured fraction
        strong {{ result.summary.peakInjuredFraction.toFixed(5) }}
        small dimensionless · unsupported

    .apap-time-control
      label(for="apap-time") Lobule time: {{ snapshot?.timeHours }} h
      input#apap-time(v-model.number="timeIndex" type="range" min="0" :max="result.lobule.snapshots.length - 1" step="1")
      label(for="apap-field") Heatmap field
      select#apap-field(v-model="heatmapVariable")
        option(value="apap") APAP
        option(value="napqi") NAPQI
        option(value="gsh") GSH
        option(value="adduct") Adduct
        option(value="oxygen") Oxygen
        option(value="injured") Injured fraction

    template(v-if="snapshot")
      .lobule-heatmap(role="img" :aria-label="`${heatmapVariable} across 12 portal-to-central lobule bins at ${snapshot.timeHours} hours`")
        div(v-for="(value, index) in snapshot[heatmapVariable]" :key="index" :style="heatStyle(value, snapshot[heatmapVariable])" :aria-label="`Bin ${index + 1}: ${value}`")
          span {{ index + 1 }}
          strong {{ value.toFixed(4) }}
      .lobule-axis(aria-hidden="true")
        span Portal
        span Central
      .series-table-wrap
        table
          caption Accessible lobule state at {{ snapshot.timeHours }} h; no interpolation
          thead
            tr
              th(scope="col") Bin
              th(scope="col") APAP
              th(scope="col") NAPQI
              th(scope="col") GSH
              th(scope="col") Adduct
              th(scope="col") O₂
              th(scope="col") Healthy
              th(scope="col") Stressed
              th(scope="col") Injured
              th(scope="col") Recovering
          tbody
            tr(v-for="(_, index) in snapshot.apap" :key="index")
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

    .study-grid
      section.study-card
        h3 Systemic time series
        table
          caption Exact output at {{ result.timeHours[timeIndex] }} h
          thead
            tr
              th(scope="col") Output
              th(scope="col") Value
              th(scope="col") Unit
          tbody
            tr(v-for="series in result.systemicOutputs" :key="series.id")
              th(scope="row") {{ series.name }}
              td {{ series.values[timeIndex].toFixed(5) }}
              td {{ series.unit }}
      section.study-card
        h3 Conservation diagnostics
        dl.compact-list
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
        h3 Limiting cases
        ul.limiting-cases
          li(v-for="item in result.diagnostics.limitingCases" :key="item.id")
            strong {{ item.passed ? 'Pass' : 'Fail' }} · {{ item.id }}
            span {{ item.expectation }} Maximum signal {{ item.maximumSignal }}.

    .parameter-diff(v-if="modelParameterDiff.length")
      h3 Exact effective human/mouse parameter differences
      table
        caption Differences arise from visible context bindings, not taxon branches
        thead
          tr
            th(scope="col") Symbol
            th(scope="col") Human
            th(scope="col") Mouse
            th(scope="col") Provenance
        tbody
          tr(v-for="item in modelParameterDiff" :key="item.symbol")
            th(scope="row") {{ item.symbol }}
            td {{ item.human.value }} {{ item.human.unit }}
            td {{ item.mouse.value }} {{ item.mouse.unit }}
            td {{ item.human.origin }} / {{ item.mouse.origin }}

    details.apap-audit
      summary Effective parameters, assumptions, synthetic comparison, and limitations
      h3 Exact effective parameters
      table
        caption Context-bound values used by this run
        thead
          tr
            th(scope="col") Parameter
            th(scope="col") Value
            th(scope="col") Origin
            th(scope="col") Assumption
        tbody
          tr(v-for="item in result.effectiveParameters" :key="item.symbol")
            th(scope="row") {{ item.symbol }}
            td {{ item.value }} {{ item.unit }}
            td {{ item.origin }}
            td
              code {{ item.assumptionId }}
      h3 Synthetic observations (not biological validation)
      table
        caption Calibration and validation partitions remain unsupported
        thead
          tr
            th(scope="col") Observation
            th(scope="col") Partition
            th(scope="col") Observed
            th(scope="col") Model output
            th(scope="col") Status
        tbody
          tr(v-for="item in result.syntheticComparisons" :key="item.observationId")
            th(scope="row") {{ item.observationId }}
            td {{ item.partition }}
            td {{ item.observed }} {{ item.unit }}
            td {{ item.predicted }} {{ item.unit }}
            td
              span.unsupported-badge {{ item.validationStatus }}
      h3 Assumptions and limitations
      ul.study-limitations
        li(v-for="item in result.limitations" :key="item.id")
          strong {{ item.id }}
          span {{ item.statement }}
</template>
