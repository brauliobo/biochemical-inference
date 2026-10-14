<script setup vapor>
import { computed, reactive, ref } from 'vue'
import robustness from '../../sim/data/robustness.json'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import LayoutMap from '../../components/dash/LayoutMap.vue'
import ProvenancePanel from '../../components/dash/ProvenancePanel.vue'
import RangeList from '../../components/dash/RangeList.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import RobustnessStrip from '../../components/dash/RobustnessStrip.vue'
import VariantSwitches from '../../components/dash/VariantSwitches.vue'
import { budgetBars, contentItems, deficitItems, doseScenario, mapFlux, synthesisItems } from '../../components/dash/glycine-model.js'
import { variantSwitches } from '../../components/dash/methylation-state.js'
import { extreme, formatTime, percentText, relativeRange, scenarioChart } from '../../components/dash/methylation-view.js'
import { useEnsemble } from '../../composables/useEnsemble.js'
import { useModelRun } from '../../composables/useModelRun.js'
import Badge from '../../ui/Badge.vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import InputField from '../../ui/InputField.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import ScenarioPicker from '../../viz/ScenarioPicker.vue'
import SliderField from '../../viz/SliderField.vue'
import StackedBar from '../../viz/StackedBar.vue'
import { formatNumber } from '../../viz/scale.js'

// Glycine: where it comes from and goes, what a dose does to plasma glycine (a weak, second-hand kinetic sketch) and,
// as a hypothesis, to SAM:SAH; and how big the "10 g/day deficit" claim is against the range of estimates.
const state = reactive({ doseG: 10, variants: { gnmtGlycineKm: 'reed130' } })
const uncertainty = ref(false)
const fluxMode = ref('net')
const switches = variantSwitches()
const modes = [{ value: 'net', label: 'Net budget (g/day)' }, { value: 'gross', label: 'Gross turnover (g/day)' }]
const PROVENANCE = ['glycine:ka', 'glycine:ke']

const { result, error } = useModelRun(() => import('../../components/dash/glycine-dash-run.js').then((m) => m.runGlycineDash), state, { debounceMs: 140 })
const ensemble = useEnsemble(() => (state.doseG > 0 ? { scenario: doseScenario(state.doseG), variants: { ...state.variants }, observables: ['samSahRatio'], n: 100, seed: 7 } : null), uncertainty)

const bars = budgetBars()
const deficit = deficitItems()
const synthesis = synthesisItems()
const content = contentItems()
const flux = computed(() => mapFlux(fluxMode.value))

const pkChart = computed(() => {
  const r = result.value
  if (!r) return null
  return scenarioChart({ time: r.pk.time, values: r.pk.plasma, reference: r.pk.baseline, unit: 'uM', title: 'Plasma glycine after the dose (kinetic sketch)', events: state.doseG > 0 ? [{ x: 0, label: `${state.doseG} g glycine` }] : [], label: 'Plasma glycine' })
})
const ratioChart = computed(() => {
  const r = result.value
  if (!r) return null
  return scenarioChart({ time: r.time, values: r.series.samSahRatio, reference: r.reference.samSahRatio, unit: 'ratio', title: 'Liver SAM:SAH after the dose (model hypothesis)', events: r.events, ribbon: uncertainty.value ? ensemble.bands.value?.bands?.samSahRatio : null })
})
const tiles = computed(() => {
  const r = result.value
  if (!r) return []
  const ratio = extreme(r.series.samSahRatio, r.reference.samSahRatio)
  const gnmt = extreme(r.series.gnmt, r.reference.gnmt)
  const sar = extreme(r.series.sar, r.reference.sar)
  const rel = (e) => (Math.abs(e.relative) >= 0.005 ? percentText(e.relative) : '')
  return [
    { id: 'plasma', label: 'Peak plasma glycine', value: formatNumber(r.pk.peak.value), unit: 'uM', delta: state.doseG > 0 ? percentText(r.pk.peak.value / r.pk.baseline - 1, 3) : '', tone: 'info', note: state.doseG > 0 ? `at ${formatTime(r.pk.peak.time)}; fasting ${formatNumber(r.pk.baseline)} uM` : 'no dose' },
    { id: 'samSahRatio', label: 'SAM:SAH (hypothesis)', value: formatNumber(ratio.value), unit: 'ratio', delta: rel(ratio), tone: ratio.relative < -0.05 ? 'warning' : rel(ratio) ? 'info' : '', note: `largest change at hour ${formatNumber(r.time[ratio.index], 3)}; over the run ${relativeRange(r.series.samSahRatio, r.reference.samSahRatio)}` },
    { id: 'gnmt', label: 'GNMT flux', value: formatNumber(gnmt.value), unit: 'uM/h', delta: rel(gnmt), tone: rel(gnmt) ? 'info' : '', note: `reference ${formatNumber(r.reference.gnmt)} uM/h; over the run ${relativeRange(r.series.gnmt, r.reference.gnmt)}` },
    { id: 'sar', label: 'Hepatic sarcosine', value: formatNumber(sar.value), unit: 'uM', delta: rel(sar), tone: rel(sar) ? 'info' : '', note: `reference ${formatNumber(r.reference.sar)} uM; over the run ${relativeRange(r.series.sar, r.reference.sar)}` }
  ]
})
const bandNote = computed(() => {
  if (!uncertainty.value || !state.doseG) return ''
  if (ensemble.error.value) return 'The uncertainty run failed.'
  if (ensemble.running.value) return `Running 100 parameter sets: ${Math.round(ensemble.progress.value * 100)}%`
  return ensemble.bands.value ? `Ribbon: 5th to 95th percentile of the response over ${ensemble.bands.value.ok} parameter sets.` : ''
})
const setVariant = (key, value) => { state.variants[key] = value }
</script>

<template lang="pug">
DashboardShell(title="Glycine" question="Where does glycine come from and go, and what would a dose do?" status="model")
  template(#controls)
    .stack
      SliderField(id="dash-dose" label="Glycine dose (one oral dose)" unit="g" :min="0" :max="10" :step="0.5" :model-value="state.doseG" @input="(value) => { state.doseG = value }" hint="Model for a 70 kg adult")
      InputField(id="dash-uncertainty" type="checkbox" label="Show parameter uncertainty" v-model="uncertainty" hint="100 parameter sets, about 3 s")
  ErrorNotice(v-if="error" title="The model run failed" :message="error.message")
  .dash-skeleton(v-if="!result && !error" role="status") Running the model.
  template(v-if="result")
    ResultTiles(:tiles="tiles")
    Notice(tone="warning" role="note" title="Hypothesis: no human data")
      p No human study measured SAM, SAH or sarcosine after glycine. The plasma curve rests on one second-hand study of nine people.
    Panel(title="Plasma glycine after the dose" title-id="gly-pk")
      .stack
        .cluster
          Badge(label="Weak source" tone="warning")
          span.muted One second-hand study; the curve is linear and valid up to about 0.15 g/kg.
        LineChartPlus(id="gly-pk-chart" :title="pkChart.title" :x="pkChart.x" :series="pkChart.series" :events="pkChart.events" :unit="pkChart.unit" :y-min="0" :y-max="pkChart.yMax" :height="260")
    Panel(title="Effect on SAM:SAH (hypothesis)" title-id="gly-ratio")
      .stack
        LineChartPlus(id="gly-ratio-chart" :title="ratioChart.title" :x="ratioChart.x" :series="ratioChart.series" :events="ratioChart.events" :unit="ratioChart.unit" :y-min="ratioChart.yMin" :y-max="ratioChart.yMax" :height="280")
        p.muted(v-if="bandNote" role="status") {{ bandNote }}
        VariantSwitches(:switches="switches" :variants="state.variants" :rows="robustness.rows" :keys="['gnmtGlycineKm']" @update="setVariant")
        RobustnessStrip(:rows="robustness.rows" scenario="glycine-10g" :groups="['glycine']")
    Panel(title="Where glycine comes from and goes" title-id="gly-flux")
      .stack
        ScenarioPicker(label="Numbers on the map" :options="modes" v-model="fluxMode")
        LayoutMap(layout="glycine-flux" id="gly-map" title="Glycine sources and sinks" :flux="flux" flux-unit="g/day")
        StackedBar(id="gly-budget" title="Net glycine budget, with the contested ranges (g/day)" :bars="bars" :normalize="false" unit="g/day")
    Panel(title="The 10 g/day deficit" title-id="gly-deficit")
      .stack
        RangeList(id="gly-deficit-list" title="The claim against the estimates (g/day)" unit="g/day" :items="deficit")
        RangeList(id="gly-synth" title="De novo synthesis estimates differ 15-fold (g/day)" unit="g/day" :items="synthesis")
        p.muted The estimates measure different things: a net pathway sum, and tracer rates that include recycling. No study has tested the deficit.
    Panel(title="Glycine in products" title-id="gly-content")
      RangeList(id="gly-products" title="Glycine delivered (g)" unit="g" :items="content")
    ProvenancePanel(model="pk" :ids="PROVENANCE")
  template(#notes)
    .stack
      p Glycine dose, plasma curve: a Bateman fit to one second-hand study (217 to 909 uM at 40 min). The hepatic response uses the integrated methylation model (GNMT Km for glycine is contested: 130 uM or about 2 mM; switch it on the left).
      p Chronic glycine does not lower SAM:SAH in the model: SAM feedback on GNMT, 5-MTHF inhibition and the serine route cancel the extra flux.
  template(#related)
    RouterLink(to="/dash/methylation?scenario=glycine-10g") Methylation balance
    RouterLink(to="/dash/choline") Choline and betaine
    RouterLink(to="/dash/gut-acid") Gut and acid
    RouterLink(to="/kb/compound/glycine") Glycine page
    RouterLink(to="/evidence") Evidence
</template>
