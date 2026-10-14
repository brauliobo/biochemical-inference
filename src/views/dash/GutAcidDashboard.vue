<script setup vapor>
import { computed, reactive, ref, watch } from 'vue'
import Co2Budget from '../../components/dash-gut/Co2Budget.vue'
import CausalMap from '../../components/dash-gut/CausalMap.vue'
import DashRelated from '../../components/dash-gut/DashRelated.vue'
import ExplanationStrip from '../../components/dash-gut/ExplanationStrip.vue'
import GutControls from '../../components/dash-gut/GutControls.vue'
import LayoutMap from '../../components/dash-gut/LayoutMap.vue'
import RunStatus from '../../components/dash-gut/RunStatus.vue'
import { EXPLANATIONS } from '../../components/dash-gut/gut-explanations.js'
import { GUT_DEFAULTS, GUT_PRESETS, STATUS_WORD, presetById, presetFor } from '../../components/dash-gut/gut-presets.js'
import { acidSeries, gutTiles, phSeries } from '../../components/dash-gut/gut-tiles.js'
import { GUT_ACID_MAP } from '../../components/dash-gut/map-sets.js'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import ProvenancePanel from '../../components/dash/ProvenancePanel.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import ScenarioPresets from '../../components/dash/ScenarioPresets.vue'
import { useModelRun } from '../../composables/useModelRun.js'
import { setPageTitle } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import Panel from '../../ui/Panel.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'

// /dash/gut-acid: "Why would glycine powder make me belch?" The gastric acid / bicarbonate / CO2 model (pH, a CO2
// budget against swallowed air), the competing explanations with their evidence, the causal map from glycine powder to
// throat burning and the acid / CO2 map. The model is illustrative; the glycine-raises-acid control is a hypothesis.
setPageTitle('Gut, acid and belching')
const controls = reactive({ ...GUT_DEFAULTS })
const preset = ref(presetFor(controls))
const snapshot = computed(() => ({ ...controls }))
watch(preset, (id) => {
  if (id && id !== presetFor(controls)) Object.assign(controls, presetById[id].controls)
})
watch(snapshot, (value) => { preset.value = presetFor(value) })
const chosen = computed(() => presetById[preset.value] ?? null)
const chosenStatus = computed(() => (chosen.value ? STATUS_WORD[chosen.value.status] : null))

const { result, running, error, warnings } = useModelRun(() => import('../../components/dash-gut/gut-run.js').then((module) => module.createGutRunner()), snapshot, { debounceMs: 120 })
const tiles = computed(() => (result.value ? gutTiles(result.value, controls) : []))
const explanations = computed(() => (result.value ? EXPLANATIONS.map((item) => ({ id: item.id, title: item.title, evidence: item.evidence, model: item.model(result.value, controls) })) : []))
const PARAMS = ['bao', 'dpao', 'ki_fb', 'alk_other', 'k_pump_rec', 'air_in', 'k_belch', 'k_pass', 'hco3_mucosal']
</script>

<template lang="pug">
DashboardShell(title="Gut, acid and belching" question="Why would glycine powder make me belch? What do the models say?" status="model")
  template(#controls)
    ScenarioPresets(label="Start from a situation" :scenarios="GUT_PRESETS" v-model="preset")
    p.cluster(v-if="chosen")
      Badge(:label="chosenStatus.word" :tone="chosenStatus.tone")
      span.muted {{ chosen.note }}
    GutControls(:controls="controls")
  RunStatus(:running="running" :error="error" :warnings="warnings" what="the stomach model")
  p.muted(v-if="!result && !error" role="status") Running the stomach model for the first time.
  template(v-if="result")
    Panel(title="What the model says" title-id="gut-tiles")
      ResultTiles(:tiles="tiles")
    Panel(title="Stomach pH and acid" title-id="gut-ph")
      LineChartPlus(id="gut-ph-chart" title="Stomach pH over 8 hours" :x="result.time" :series="phSeries(result)" :events="result.markers" :bands="[{ from: 0, to: 4, label: 'Below pH 4' }]" unit="pH" x-unit="h" :y-min="0" :y-max="8" :height="280")
      LineChartPlus(id="gut-acid-chart" title="Acid secreted by the stomach wall" :x="result.time" :series="acidSeries(result)" :events="result.markers" unit="mmol/h" x-unit="h" :y-min="0" :height="220")
    Panel(title="Where the CO2 goes" title-id="gut-co2" lede="Acid and bicarbonate make CO2, but almost all of it crosses the gut wall. Compare with the swallowed air in the same gas pocket.")
      Co2Budget(:co2="result.co2")
    Panel(title="Competing explanations for belching" title-id="gut-explanations" lede="Grades and verdicts come from the knowledge base; the last chip says what the model can say about each.")
      ExplanationStrip(:items="explanations")
    Panel(title="From glycine powder to throat burning" title-id="gut-causal" lede="Dashed links are hypotheses. Choose an entry to see its links and the verdict of the claim behind each.")
      CausalMap(id="gut-causal-map" title="Causal map: glycine, collagen, PPI and betaine HCl to belching, reflux and throat burning" :include="GUT_ACID_MAP.include" :labels="GUT_ACID_MAP.labels")
    Panel(title="Acid, bicarbonate and CO2 in the stomach" title-id="gut-map" lede="Edge width is the mean rate in this run (mmol/h); node colour is the mean concentration in the stomach fluid (mM).")
      LayoutMap(layout-id="gastric-acid" id="gut-acid-map" title="Gastric acid secretion, neutralisation and the CO2 to belching chain" :flux="result.flux" :concentration="result.concentration" flux-unit="mmol/h" conc-unit="mM")
    ProvenancePanel(model="gastric" :ids="PARAMS")
  template(#related)
    DashRelated(current="gut-acid")
  template(#notes)
    p The gastric model is one well-mixed stomach and duodenum with a single meal buffer. It has no mucus layer, pepsin, gastrin, oesophagus or gut bacteria, so TLESR, supragastric belching and fermentation are not modelled.
    p Swallowed air is an assumed constant (about 20 mL an hour, net); no study measured it. The glycine-raises-acid control starts at 0 because the human data (Wald 1982, Taylor 1982, McArthur 1983) do not support a size.
    p The burning after betaine HCl in someone with a past ulcer is a mucosal sensitivity question that a model of the stomach lumen cannot answer.
    p This is educational material, not medical advice.
</template>
