<script setup vapor>
import { computed, ref } from 'vue'
import DataTable from '../../ui/DataTable.vue'
import Disclosure from '../../ui/Disclosure.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import Badge from '../../ui/Badge.vue'
import { fixed } from '../../ui/format.js'
import LobuleView from './LobuleView.vue'

// A completed run: identity, headline numbers, the lobule view, systemic
// series, conservation diagnostics, limiting cases and the exact parameters.
const props = defineProps({
  result: { type: Object, required: true },
  taxonId: { type: String, required: true },
  humanResult: { type: Object, default: undefined },
  mouseResult: { type: Object, default: undefined }
})
const timeIndex = defineModel('timeIndex', { type: Number, required: true })
const selectedBin = ref(0)
const field = ref('adduct')

const summary = computed(() => {
  const { summary: values } = props.result
  return [
    { label: 'Peak central APAP', value: fixed(values.peakCentralApap, 4), note: 'model-unit', large: true },
    { label: 'NAPQI formed', value: fixed(values.totalNapqiFormed, 4), note: 'model-unit', large: true },
    { label: 'Final adduct', value: fixed(values.finalAdductBurden, 5), note: 'model-unit', large: true },
    { label: 'Peak injured fraction', value: fixed(values.peakInjuredFraction, 5), note: 'dimensionless · unsupported', large: true }
  ]
})
const diagnostics = computed(() => {
  const { diagnostics: values, engine } = props.result
  const refinement = values.timestepRefinement
  return [
    { label: 'APAP mass residual', value: `${values.mass.residual} / ${values.mass.tolerance}` },
    { label: 'Cell-fraction max sum error', value: String(values.cellState.maximumSumError) },
    { label: 'Minimum state / fraction', value: `${values.state.minimumValue} / ${values.cellState.minimumFraction}` },
    { label: 'Fixed integration', value: `${values.integrationSteps} × ${engine.stepHours} h` },
    { label: '1x/2x/4x timestep refinement', value: `${refinement.passed ? 'Pass' : 'Fail'} · max ${Math.max(...refinement.comparisons.map((item) => item.maximumAbsoluteDifference)).toExponential(3)} / ${refinement.tolerance}` }
  ]
})
// Parameters whose effective value differs between the two contexts, when both were run.
const differences = computed(() => {
  const human = props.humanResult?.effectiveParameters ?? []
  const mouse = props.mouseResult?.effectiveParameters ?? []
  if (!human.length || !mouse.length) return []
  return human
    .map((item) => ({ symbol: item.symbol, human: item, mouse: mouse.find((candidate) => candidate.symbol === item.symbol) }))
    .filter((item) => item.mouse && item.human.value !== item.mouse.value)
})
</script>

<template lang="pug">
Panel(title="Canonical APAP run identity" title-id="apap-result-title" :level="3")
  p
    code {{ result.runId }}
  Notice(tone="warning") {{ result.warning }}
  Facts(:items="summary")
  LobuleView(v-model:timeIndex="timeIndex" v-model:selectedBin="selectedBin" v-model:field="field" :result="result" :taxon-id="taxonId")
  .grid
    Panel(title="Systemic time series" title-id="apap-series-title" :level="4")
      DataTable(:caption="`Exact output at ${result.timeHours[timeIndex]} h`" :columns="['Output', 'Value', 'Unit']")
        tr(v-for="series in result.systemicOutputs" :key="series.id")
          th(scope="row") {{ series.name }}
          td {{ fixed(series.values[timeIndex], 5) }}
          td {{ series.unit }}
    Panel(title="Conservation diagnostics" title-id="apap-diagnostics-title" :level="4")
      Facts(rows :items="diagnostics")
  Panel(title="Limiting cases" title-id="apap-limiting-title" :level="4")
    ul.plain-list.stack.stack--tight
      li.cluster(v-for="item in result.diagnostics.limitingCases" :key="item.id")
        strong {{ item.passed ? 'Pass' : 'Fail' }} · {{ item.id }}
        span {{ item.expectation }} Maximum signal {{ item.maximumSignal }}.
  Panel(v-if="differences.length" title="Exact effective human/mouse parameter differences" title-id="apap-diff-title" :level="4")
    DataTable(caption="Differences arise from visible context bindings, not taxon branches" :columns="['Symbol', 'Human', 'Mouse', 'Provenance']")
      tr(v-for="item in differences" :key="item.symbol")
        th(scope="row") {{ item.symbol }}
        td {{ item.human.value }} {{ item.human.unit }}
        td {{ item.mouse.value }} {{ item.mouse.unit }}
        td {{ item.human.origin }} / {{ item.mouse.origin }}
  Disclosure(card summary="Effective parameters, assumptions, synthetic comparison, and limitations")
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
          Badge(tone="warning" :label="item.validationStatus")
    h4 Assumptions and limitations
    ul.plain-list.stack.stack--tight
      li.cluster(v-for="item in result.limitations" :key="item.id")
        strong {{ item.id }}
        span {{ item.statement }}
</template>
