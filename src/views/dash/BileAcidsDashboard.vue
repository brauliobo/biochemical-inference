<script setup vapor>
import { computed, reactive, ref, watch } from 'vue'
import { BILE_DEFAULTS, BILE_PRESETS, bileFlux, bilePresetFor, bileTiles, curveSeries, kineticRows, shareBars } from '../../components/dash-gut/bile-view.js'
import { articlePath } from '../../components/dash-gut/causal-view.js'
import CausalMap from '../../components/dash-gut/CausalMap.vue'
import DashRelated from '../../components/dash-gut/DashRelated.vue'
import EvidenceChips from '../../components/dash-gut/EvidenceChips.vue'
import LayoutMap from '../../components/dash-gut/LayoutMap.vue'
import RunStatus from '../../components/dash-gut/RunStatus.vue'
import { STATUS_WORD } from '../../components/dash-gut/gut-presets.js'
import { BILE_MAP } from '../../components/dash-gut/map-sets.js'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import ScenarioPresets from '../../components/dash/ScenarioPresets.vue'
import { useModelRun } from '../../composables/useModelRun.js'
import { setPageTitle } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import DataTable from '../../ui/DataTable.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import SliderField from '../../viz/SliderField.vue'
import StackedBar from '../../viz/StackedBar.vue'

// /dash/bile-acids: "If I take glycine, does bile conjugation shift from taurine to glycine?" Bile acids are joined to
// glycine or taurine by one enzyme, so the two compete. The what-if is calibrated to observed bile (75% glycine
// conjugates) and flagged: there is no human data on glycine supplements. Taurine 3 g a day reversed the ratio (Hardison 1983).
setPageTitle('Bile acids: glycine or taurine')
const controls = reactive({ ...BILE_DEFAULTS })
const snapshot = computed(() => ({ ...controls }))
const preset = ref(bilePresetFor(controls))
watch(preset, (id) => { if (id && id !== bilePresetFor(controls)) Object.assign(controls, BILE_PRESETS.find((item) => item.id === id).controls) })
watch(snapshot, (value) => { preset.value = bilePresetFor(value) })
const chosen = computed(() => BILE_PRESETS.find((item) => item.id === preset.value) ?? null)

const { result, running, error, warnings } = useModelRun(() => import('../../components/dash-gut/bile-run.js').then((module) => module.createBileRunner()), snapshot, { debounceMs: 100 })
const tiles = computed(() => (result.value ? bileTiles(result.value, controls) : []))
const bars = computed(() => (result.value ? shareBars(result.value) : []))
const curves = computed(() => (result.value ? curveSeries(result.value, controls) : null))
const flux = computed(() => (result.value ? bileFlux(result.value) : {}))
const kinetics = kineticRows()
const EVIDENCE = [
  { id: 'article:hardison-1983-taurine-supplementation-bile', label: 'Hardison 1983: taurine 3 g a day reverses the ratio (6 men, 2 weeks)', note: 'measured', tone: 'success' },
  { id: 'claim:glycine-overload-shifts-bile-conjugation-and-reflux' },
  { id: 'article:johnson-1991-baat-human-liver', label: 'Johnson 1991: BAAT kinetics, human liver' },
  { id: 'article:styles-2016-baat-recombinant', label: 'Styles 2016: BAAT kinetics, recombinant' },
  { id: 'enzyme:baat', label: 'Hepatic glycine and taurine pools in people: not found', note: 'no data', tone: 'warning' }
]
</script>

<template lang="pug">
DashboardShell(title="Bile acids: glycine or taurine" question="Does a glycine supplement change which amino acid the liver attaches to bile acids, and could that matter for reflux?" status="hypothesis")
  template(#controls)
    ScenarioPresets(label="Start from a situation" :scenarios="BILE_PRESETS" v-model="preset")
    p.cluster(v-if="chosen")
      Badge(:label="STATUS_WORD[chosen.status].word" :tone="STATUS_WORD[chosen.status].tone")
      span.muted {{ chosen.note }}
    .dg-controls
      SliderField(id="bile-glycine" label="Extra glycine a day" unit="g" :min="0" :max="20" :step="1" v-model="controls.glycineG" hint="Raises liver glycine through the methylation model.")
      SliderField(id="bile-taurine" label="Liver taurine supply" unit="x" :min="0.25" :max="4" :step="0.25" v-model="controls.taurineX" hint="1 = now. A taurine supplement raises it; the size is not known.")
  Notice(tone="warning" role="note" title="No human data")
    p No study has measured bile conjugation after a glycine supplement. The curves below show the direction competition predicts, calibrated to the observed bile.
  RunStatus(:running="running" :error="error" :warnings="warnings" what="the bile-acid what-if")
  p.muted(v-if="!result && !error" role="status") Running the bile-acid what-if for the first time.
  template(v-if="result")
    Panel(title="What the model says" title-id="bile-tiles")
      ResultTiles(:tiles="tiles")
    Panel(title="Glycine against taurine in bile" title-id="bile-ratio")
      .dg-pair
        StackedBar(id="bile-share-chart" title="Share of conjugated bile acids" :bars="bars" unit="%")
        LineChartPlus(id="bile-curve-chart" title="Glycine-conjugated share against the glycine supplement" :x="curves.x" :series="curves.series" :events="curves.events" :bands="[{ from: 70, to: 80, label: 'Observed range' }]" unit="%" x-unit="g/day" x-label="Extra glycine a day" :y-min="40" :y-max="100" :height="280")
    Panel(title="Conjugation in the liver" title-id="bile-map" lede="Edge width is the conjugation rate in the what-if (mmol a day), scaled so that glycine at the observed share uses 6 mmol a day.")
      LayoutMap(layout-id="bile-acid-conjugation" id="bile-conjugation-map" title="Bile-acid activation, conjugation to glycine or taurine, and bacterial deconjugation" :flux="flux" flux-unit="mmol/day")
    Panel(title="What the evidence says" title-id="bile-evidence")
      EvidenceChips(label="Evidence on bile-acid conjugation" :items="EVIDENCE")
      DataTable(caption="BAAT kinetics: what they imply" :columns="['Source', 'Km', 'Rate ratio per Gly/Tau', 'Liver Gly/Tau needed for 3 : 1']" :count="kinetics.length")
        tr(v-for="row in kinetics" :key="row.id")
          th(scope="row")
            RouterLink(:to="articlePath(row.article)") {{ row.label }}
          td {{ row.km }}
          td {{ row.coefficient }}
          td {{ row.needs }}
    Panel(title="Bile reflux in the causal map" title-id="bile-causal" lede="Dashed links are hypotheses; choose an entry to see the verdict of the claim behind each.")
      CausalMap(id="bile-causal-map" title="Causal map: glycine, bile conjugation and duodenogastric reflux to belching and throat reflux" :include="BILE_MAP.include" :labels="BILE_MAP.labels")
  template(#related)
    DashRelated(current="bile-acids")
  template(#notes)
    p BAAT joins cholyl-CoA to glycine or to taurine. For competing substrates well below their Km the two rates are in the ratio (Vmax/Km x amino acid) of each; Johnson 1991 and Styles 2016 disagree about which amino acid has the higher Vmax, and the human liver pools needed to predict the absolute ratio were not found, so the what-if only computes the change.
    p Bile conjugation is a small glycine sink: about 6 mmol (0.45 g) a day gross, and most of the freed glycine is recovered after bacterial deconjugation.
    p The claim that a glycine overload shifts conjugation and promotes alkaline duodenogastric reflux is recorded as unsupported; this page shows the competition logic, not evidence for the reflux.
    p This is educational material, not medical advice.
</template>
