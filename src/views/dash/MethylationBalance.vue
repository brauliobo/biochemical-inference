<script setup vapor>
import { computed, reactive, ref, watch } from 'vue'
import robustness from '../../sim/data/robustness.json'
import { scenarioIndex } from '../../sim/scenarios.js'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import MethylationControls from '../../components/dash/MethylationControls.vue'
import MethylationMap from '../../components/dash/MethylationMap.vue'
import ProvenancePanel from '../../components/dash/ProvenancePanel.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import RobustnessStrip from '../../components/dash/RobustnessStrip.vue'
import StatePlane from '../../components/dash/StatePlane.vue'
import ValidationDots from '../../components/dash/ValidationDots.vue'
import VariantSwitches from '../../components/dash/VariantSwitches.vue'
import { chipOf } from '../../components/dash/chips.js'
import { DEFAULT_PRESET, controlsForPreset, scenarioFor, variantSwitches, variantsForPreset } from '../../components/dash/methylation-state.js'
import { ALL_QUANTITIES, QUANTITIES, classifyState, consumerBars, resultTiles, timeChart } from '../../components/dash/methylation-view.js'
import { useEnsemble } from '../../composables/useEnsemble.js'
import { useModelRun } from '../../composables/useModelRun.js'
import { navigate, useRoute } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import LiveMessage from '../../ui/LiveMessage.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import ScenarioPicker from '../../viz/ScenarioPicker.vue'
import StackedBar from '../../viz/StackedBar.vue'

// Methylation balance: who spends the methyl groups and what tips the SAM:SAH balance. Pick a preset or move the
// 12 sliders; the hepatic model runs in the page (about 100 ms), the optional ribbons come from a worker.
const route = useRoute()
const start = scenarioIndex[route.query.scenario] ? route.query.scenario : DEFAULT_PRESET
const state = reactive({ presetId: start, controls: controlsForPreset(start), variants: variantsForPreset(start) })
const uncertainty = ref(false)
const quantity = ref('samSahRatio')
const switches = variantSwitches()
const PROVENANCE = ['ks_gnmt_sam', 'km_gnmt_gly', 'ki_gnmt_mthf2', 'km_bhmt_bet', 'ki_mthfr_sam', 'km_nnmt_sam', 'km_nnmt_nam', 'km_chdh_cho', 'km_mtr_mthf']
const quantities = [...QUANTITIES.map((q) => ({ value: q.id, label: q.label })), { value: ALL_QUANTITIES, label: 'All, % of reference' }]

const { result, running, error } = useModelRun(() => import('../../components/dash/methylation-dash-run.js').then((m) => m.runMethylationDash), state, { debounceMs: 140 })
const ensemble = useEnsemble(() => ({ scenario: scenarioFor(state.presetId, state.controls), variants: { ...state.variants }, observables: QUANTITIES.map((q) => q.id), n: 100, seed: 7 }), uncertainty)

const preset = computed(() => scenarioIndex[state.presetId])
const chip = computed(() => chipOf(preset.value))
const tiles = computed(() => (result.value ? resultTiles(result.value) : []))
const chart = computed(() => (result.value ? timeChart(result.value, quantity.value, uncertainty.value ? ensemble.bands.value : null) : null))
const bars = computed(() => (result.value ? consumerBars(result.value) : []))
const plane = computed(() => {
  const r = result.value
  if (!r) return null
  const k = r.focus.index
  return { time: r.time, ratio: r.series.samSahRatio, thcy: r.series.tHcy, referenceRatio: r.reference.samSahRatio, referenceThcy: r.reference.tHcy, focusIndex: k, state: classifyState(r.series.samSahRatio[k], r.reference.samSahRatio, r.series.tHcy[k]) }
})
const announce = computed(() => {
  if (running.value || !tiles.value.length) return ''
  const ratio = tiles.value[0]
  return `${preset.value.label}: SAM:SAH ${ratio.value}${ratio.delta ? `, ${ratio.delta}` : ', unchanged'}.`
})
const bandNote = computed(() => {
  if (!uncertainty.value) return ''
  if (ensemble.error.value) return 'The uncertainty run failed.'
  if (ensemble.running.value) return `Running 100 parameter sets: ${Math.round(ensemble.progress.value * 100)}%`
  const bands = ensemble.bands.value
  return bands ? `Ribbons: 5th to 95th percentile of the response over ${bands.ok} parameter sets, anchored at this run's starting value.` : ''
})

function apply(id) {
  state.presetId = id
  Object.assign(state.controls, controlsForPreset(id))
  Object.assign(state.variants, variantsForPreset(id))
}
function pick(id) {
  apply(id)
  navigate(`/dash/methylation?scenario=${id}`, { replace: true })
}
// a link to another scenario of this page (or the back button) changes only the query: the view stays mounted
watch(() => route.query.scenario, (id) => { if (id && scenarioIndex[id] && id !== state.presetId) apply(id) })
function reset() { Object.assign(state.controls, controlsForPreset(state.presetId)) }
function setVariant(key, value) { state.variants[key] = value }
</script>

<template lang="pug">
DashboardShell(title="Methylation balance" question="Who spends the methyl groups, and what tips SAM:SAH toward under- or over-methylation?" status="model")
  template(#controls)
    MethylationControls(:state="state" v-model:uncertainty="uncertainty" :running="ensemble.running.value" :progress="ensemble.progress.value" @preset="pick" @reset="reset")
  ErrorNotice(v-if="error" title="The model run failed" :message="error.message")
  LiveMessage(:text="announce")
  .dash-skeleton(v-if="!result && !error" role="status") Running the model.
  template(v-if="result")
    .stack.stack--tight
      .cluster
        strong {{ preset.short ?? preset.label }}
        Badge(:label="chip.label" :tone="chip.tone")
        Badge(:label="plane.state.label" tone="info")
      ResultTiles(:tiles="tiles")
      p.muted.dash-evidence {{ preset.evidence.summary }}
    .grid.dash-grid
      Panel(title="Who spends the methyl groups?" title-id="dash-consumers")
        StackedBar(id="dash-consumers-bar" title="Share of SAM use by enzyme" :bars="bars" unit="%")
      Panel(title="Under- or over-methylation?" title-id="dash-plane")
        StatePlane(id="dash-plane-chart" :time="plane.time" :ratio="plane.ratio" :thcy="plane.thcy" :reference-ratio="plane.referenceRatio" :reference-thcy="plane.referenceThcy" :focus-index="plane.focusIndex")
    Panel(title="Time course" title-id="dash-time")
      .stack
        ScenarioPicker(label="Show" :options="quantities" v-model="quantity")
        LineChartPlus(id="dash-time-chart" :title="chart.title" :x="chart.x" :series="chart.series" :events="chart.events" :ref-lines="chart.refLines" :unit="chart.unit" :y-min="chart.yMin" :y-max="chart.yMax" :height="300")
        p.muted(v-if="bandNote" role="status") {{ bandNote }}
    Panel(title="The network in this scenario" title-id="dash-network")
      MethylationMap(:map-data="result.map")
    .grid.dash-grid
      Panel(title="What is robust?" title-id="dash-robust")
        RobustnessStrip(:rows="robustness.rows" :scenario="state.presetId")
      Panel(title="Contested constants" title-id="dash-variants")
        VariantSwitches(:switches="switches" :variants="state.variants" :rows="robustness.rows" @update="setVariant")
    ValidationDots
    ProvenancePanel(model="methylation" :ids="PROVENANCE")
  template(#notes)
    .stack
      p {{ preset.description }}
      ul.plain-list.stack.stack--tight(v-if="preset.expected")
        li(v-for="item in preset.expected" :key="item.observable") {{ `${item.observable}: ${item.direction}${item.note ? ` (${item.note})` : ''}` }}
      p.muted Fluxes and levels are hepatic (1 L liver, uM and uM/h) except plasma glycine, betaine and tHcy. Each member of the uncertainty run is calibrated to its own steady state. See the methylation model notes for the 28 of 41 validation checks.
  template(#related)
    RouterLink(to="/dash/glycine") Glycine
    RouterLink(to="/dash/choline") Choline and betaine
    RouterLink(to="/dash/histamine-night") Histamine at night
    RouterLink(to="/evidence") Evidence
    RouterLink(to="/kb/state/undermethylation") Under-methylation
</template>
