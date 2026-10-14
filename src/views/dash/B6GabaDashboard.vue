<script setup vapor>
import { computed, reactive, ref, watch } from 'vue'
import CausalMap from '../../components/dash-gut/CausalMap.vue'
import DashRelated from '../../components/dash-gut/DashRelated.vue'
import EvidenceChips from '../../components/dash-gut/EvidenceChips.vue'
import LayoutMap from '../../components/dash-gut/LayoutMap.vue'
import RunStatus from '../../components/dash-gut/RunStatus.vue'
import { B6_DEFAULTS, B6_PRESETS, PLP_SUFFIX, b6PresetFor, b6Tiles, effectSeries, mapFlux, stepBars, validationRows } from '../../components/dash-gut/b6-view.js'
import { b6Equivalent, b6LabelDose, b6Rows, ulOf } from '../../components/dash-gut/dose-rows.js'
import { STATUS_WORD } from '../../components/dash-gut/gut-presets.js'
import { B6_MAP } from '../../components/dash-gut/map-sets.js'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import ProvenancePanel from '../../components/dash/ProvenancePanel.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import ScenarioPresets from '../../components/dash/ScenarioPresets.vue'
import { useModelRun } from '../../composables/useModelRun.js'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import { setPageTitle } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import RangeBar from '../../viz/RangeBar.vue'
import SliderField from '../../viz/SliderField.vue'

// /dash/b6-gaba: "What does vitamin B6 (PLP) do for GABA, glycine and homocysteine, and how much is too much?" The GABA shunt
// and B6 map with the PLP-dependent steps drawn by remaining activity, the effect of low B6 from the methylation model
// against what human studies found, and the B6 dose against the IOM and EFSA upper limits.
setPageTitle('Vitamin B6 and GABA')
loadKnowledge()
const controls = reactive({ ...B6_DEFAULTS })
const snapshot = computed(() => ({ ...controls }))
const preset = ref(b6PresetFor(controls))
watch(preset, (id) => { if (id && id !== b6PresetFor(controls)) Object.assign(controls, B6_PRESETS.find((item) => item.id === id).controls) })
watch(snapshot, (value) => { preset.value = b6PresetFor(value) })
const chosen = computed(() => B6_PRESETS.find((item) => item.id === preset.value) ?? null)

const { result, running, error, warnings } = useModelRun(() => import('../../components/dash-gut/b6-run.js').then((module) => module.createB6Runner()), snapshot, { debounceMs: 100 })

const dose = ref(20) // mg of vitamin B6 on the pyridoxine basis, as the limits are set
const typical = computed(() => {
  const k = knowledgeModule.value
  if (!k) return null
  const record = k.quantOf('quant:p5p-supplement-typical-dose-supplement')
  return { from: b6Equivalent(k, 'p5p', record.low).mg, to: b6Equivalent(k, 'p5p', record.high).mg, label: `Typical P5P supplement (${record.low} to ${record.high} mg)` }
})
const rows = computed(() => (knowledgeModule.value ? b6Rows(knowledgeModule.value).map((row) => (row.id === 'scf' ? row : { ...row, typical: typical.value })) : []))
const uls = computed(() => ({ efsa: ulOf(rows.value, 'efsa'), iom: ulOf(rows.value, 'iom') }))
const labelDoses = computed(() => (knowledgeModule.value ? { p5p: b6LabelDose(knowledgeModule.value, 'p5p', dose.value), pyridoxine: dose.value } : null))
const tiles = computed(() => (result.value && knowledgeModule.value ? b6Tiles(result.value, dose.value, uls.value) : []))
const effect = computed(() => (result.value ? effectSeries(result.value) : null))
const effectEvents = computed(() => [{ x: 41, label: 'Restriction study' }, ...(controls.plp === 41 ? [] : [{ x: controls.plp, label: 'This scenario' }])])
const table = computed(() => (result.value ? validationRows(result.value) : []))
const bars = computed(() => (result.value ? stepBars(result.value) : []))
const flux = computed(() => mapFlux(controls.plp))
const EVIDENCE = [
  { id: 'claim:shmt-gcs-need-plp' },
  { id: 'claim:p5p-bypasses-hepatic-activation', label: 'P5P is better than pyridoxine', note: 'not tested head to head', tone: 'warning' },
  { id: 'claim:p5p-gad-gaba-relieves-anxiety' },
  { id: 'claim:pyroluria-causes-b6-zinc-deficiency' },
  { id: 'claim:undermethylated-have-functional-b6-deficiency' },
  { id: 'compound:vitamin-b6', label: 'Critical effect of the upper limits: sensory neuropathy', note: 'IOM and EFSA', tone: 'info', plain: true },
  { id: 'article:field-2022-b6-anxiety', label: 'Field 2022: 100 mg pyridoxine HCl a day, about eight times the EFSA UL', note: 'anxiety trial', tone: 'warning' }
]
const PARAMS = ['kplp_cbs', 'kplp_cth', 'kplp_shmt', 'kplp_gcs']
</script>

<template lang="pug">
DashboardShell(title="Vitamin B6 and GABA" question="What does PLP, the active form of vitamin B6, do for GABA, glycine and homocysteine, and how much B6 is too much?" status="model")
  template(#controls)
    ScenarioPresets(label="B6 status" :scenarios="B6_PRESETS" v-model="preset")
    p.cluster(v-if="chosen")
      Badge(:label="STATUS_WORD[chosen.status].word" :tone="STATUS_WORD[chosen.status].tone")
      span.muted {{ chosen.note }}
    SliderField(id="b6-plp" label="Cellular PLP" unit="% of normal" :min="15" :max="150" :step="5" v-model="controls.plp" hint="Scales CBS, CTH, SHMT and the glycine cleavage system in the methylation model.")
  RunStatus(:running="running" :error="error" :warnings="warnings" what="the methylation model")
  p.muted(v-if="!result && !error" role="status") Running the methylation model for the first time.
  template(v-if="result")
    Panel(title="What the model says" title-id="b6-tiles")
      ResultTiles(:tiles="tiles")
    Panel(title="The GABA shunt and the B6 cofactor" title-id="b6-map" lede="Edge width is the activity left at this PLP level. GAD and ABAT use an assumed curve; steps that do not need PLP stay at 100%.")
      LayoutMap(layout-id="gaba-shunt-b6" id="b6-shunt-map" title="Vitamin B6 activation, PLP-dependent enzymes and the GABA shunt" :flux="flux" flux-unit="% of normal" :suffix="PLP_SUFFIX")
      ul.dg-bars(aria-label="Remaining activity of the modelled PLP-dependent steps")
        li(v-for="bar in bars" :key="bar.id")
          span {{ bar.label }}
          .dg-bar(:style="{ '--dg-fill': bar.fill }")
            span
          span.dg-bars__value {{ `${bar.percent}%` }}
      p.muted Remaining activity from the methylation model's PLP curve (K in units of normal PLP; confidence low or assumed).
    Panel(title="What low B6 does in the model, and in people" title-id="b6-effects")
      LineChartPlus(id="b6-effect-chart" title="Change in liver markers against cellular PLP" :x="effect.x" :series="effect.series" :events="effectEvents" :ref-lines="[{ value: 0, label: 'Normal' }]" unit="% change" x-unit="% PLP" x-label="Cellular PLP, % of normal" :height="300")
      DataTable(caption="The model at 41% PLP against human data" :columns="['Marker', 'Model at 41% PLP', 'Observed in people', 'Verdict', 'Source']" :count="table.length")
        tr(v-for="row in table" :key="row.id")
          th(scope="row") {{ row.label }}
          td {{ row.model }}
          td {{ row.observed }}
          td
            Badge(:label="row.verdict.word" :tone="row.verdict.tone")
          td
            RouterLink(:to="row.href" :aria-label="`Open the study: ${row.label}`") Open the study
    Panel(title="How much B6 is too much?" title-id="b6-dose" lede="Move the dose along the bars. Limits are in mg of vitamin B6 on the pyridoxine basis; the EU and US limits differ by a factor of eight.")
      RangeBar(v-if="rows.length" id="b6-dose-bar" title="B6 dose against reference intakes and upper limits" :rows="rows" unit="mg/day" :min="0" :max="150" :step="1" value-label="Your B6 dose" v-model="dose")
      p.muted(v-else role="status") Loading the reference intakes.
      ul.plain-list.cluster(v-if="labelDoses" aria-label="The same B6 dose as a label dose")
        li {{ `On a P5P label: ${labelDoses.p5p.toFixed(1)} mg` }}
        li {{ `On a pyridoxine (base) label: ${labelDoses.pyridoxine.toFixed(1)} mg` }}
    Panel(title="What the evidence says" title-id="b6-evidence")
      EvidenceChips(label="Evidence on vitamin B6, P5P and GABA" :items="EVIDENCE")
    Panel(title="B6 in the causal map" title-id="b6-causal" lede="Dashed links are hypotheses; choose an entry to see the verdict of the claim behind each.")
      CausalMap(id="b6-causal-map" title="Causal map: P5P, PLP, the PLP enzymes, GABA and glycine" :include="B6_MAP.include" :labels="B6_MAP.labels")
    ProvenancePanel(model="methylation" :ids="PARAMS")
  template(#related)
    DashRelated(current="b6-gaba")
  template(#notes)
    p PLP is the cofactor of glutamate decarboxylase (GAD, which makes GABA), the transaminase that breaks GABA down, SHMT and the glycine cleavage system (glycine), and CBS and CTH (transsulfuration). The methylation model scales CBS, CTH, SHMT and the cleavage system with cellular PLP; GAD and ABAT are drawn with an assumed curve because the model does not contain them.
    p In human B6 restriction cystathionine rises, fasting homocysteine does not, and glycine rises a little. The model gets the first right and overshoots the second; the table says which rows agree and why the others do not.
    p Oral P5P is largely dephosphorylated in the gut before absorption. No head-to-head trial in healthy people is recorded, and a pyridoxine dose is limited by the same sensory neuropathy as P5P. Pyroluria (kryptopyrroluria) as a cause of B6 and zinc deficiency is contested.
    p This is educational material, not medical advice.
</template>
