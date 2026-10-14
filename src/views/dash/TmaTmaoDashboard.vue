<script setup vapor>
import { computed, ref, watch } from 'vue'
import CausalMap from '../../components/dash-gut/CausalMap.vue'
import DashRelated from '../../components/dash-gut/DashRelated.vue'
import EvidenceChips from '../../components/dash-gut/EvidenceChips.vue'
import LayoutMap from '../../components/dash-gut/LayoutMap.vue'
import SourceTable from '../../components/dash-gut/SourceTable.vue'
import { cholineRows } from '../../components/dash-gut/dose-rows.js'
import { STATUS_WORD } from '../../components/dash-gut/gut-presets.js'
import { TMA_MAP } from '../../components/dash-gut/map-sets.js'
import { CLAIM, DOSE_MAX_MG, TMA_PRESETS, claimNumbers, coverageBars, mapFlux, responseView, tmaPresetFor, tmaTiles } from '../../components/dash-gut/tma-view.js'
import { TMA_YIELD, URINARY_TMAO_RECOVERY } from '../../components/dash-gut/tma-model.js'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import ScenarioPresets from '../../components/dash/ScenarioPresets.vue'
import { knowledgeModule, loadKnowledge } from '../../kb/knowledge-lazy.js'
import { setPageTitle } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import RangeBar from '../../viz/RangeBar.vue'
import SliderField from '../../viz/SliderField.vue'
import StackedBar from '../../viz/StackedBar.vue'

// /dash/tma-tmao: "Can choline replace 10 g of glycine, and what happens to TMA and TMAO on the way?" Choline intake
// against the IOM and EFSA limits, the claimed 28 to 35 g, TMA + TMAO output scaled from the two human numbers that
// exist, the share of the glycine "deficit" choline could cover within the UL, and the markers (fishy odour, TMAO).
// Nothing here is simulated: it is arithmetic on recorded numbers, each labelled with its status.
setPageTitle('Choline, TMA and TMAO')
loadKnowledge()
const mg = ref(3500)
const conversion = ref(45) // % of choline that ends as glycine: the practitioner figure, an unsourced claim
const preset = ref(tmaPresetFor(mg.value))
watch(preset, (id) => { const item = TMA_PRESETS.find((entry) => entry.id === id); if (item && item.mg !== mg.value) mg.value = item.mg })
watch(mg, (value) => { preset.value = tmaPresetFor(value) })
const chosen = computed(() => TMA_PRESETS.find((item) => item.id === preset.value) ?? null)

const rows = computed(() => (knowledgeModule.value ? cholineRows(knowledgeModule.value).map((row) => ({ ...row, typical: { from: CLAIM.lowG * 1000, to: CLAIM.highG * 1000, label: 'The claim: 28 to 35 g' } })) : []))
const tiles = computed(() => tmaTiles(mg.value, conversion.value / 100))
const claim = computed(() => claimNumbers(conversion.value / 100))
const response = responseView()
const bars = computed(() => coverageBars(conversion.value / 100))
const flux = computed(() => mapFlux(mg.value))
const EVIDENCE = [
  { id: 'claim:choline-28-35g-for-10g-glycine' },
  { id: 'claim:choline-ul-3-5g-iom-efsa', note: 'EFSA set no UL', tone: 'warning' },
  { id: 'claim:above-ul-fishy-odor-and-cholinergic-effects' },
  { id: 'claim:above-ul-tmao-endothelial-stress' },
  { id: 'claim:choline-derived-glycine-silent' },
  { id: 'outcome:fishy-odor', label: 'Fishy body odour' },
  { id: 'outcome:elevated-tmao', label: 'TMAO as a marker' },
  { id: 'enzyme:fmo3', label: 'FMO3 clears TMA' },
  { id: 'disease:trimethylaminuria', label: 'Trimethylaminuria' }
]
const SOURCES = [
  { id: 'bolus', label: 'TMA + TMAO from a free-choline bolus', value: '63% of the dose', range: '32 to 100%', status: 'measured once', tone: 'info', article: TMA_YIELD.bolus.article },
  { id: 'habitual', label: 'TMA + TMAO from habitual dietary choline', value: '5% of the dose', range: '1 to 30%', status: 'assumed', tone: 'warning', article: null },
  { id: 'recovery', label: 'Urinary recovery of TMAO in 24 h', value: '96%', range: '95 to 96%', status: 'measured', tone: 'success', article: URINARY_TMAO_RECOVERY.article },
  { id: 'ul', label: 'Choline upper limit', value: '3500 mg a day (IOM); none (EFSA)', range: 'LOAEL 7500 mg', status: 'recorded', tone: 'success', article: 'article:iom-1998-choline-dri' }
]
</script>

<template lang="pug">
DashboardShell(title="Choline, TMA and TMAO" question="Could 28 to 35 g of choline stand in for 10 g of glycine, and what would that do to TMA and TMAO?" status="calculator")
  template(#controls)
    ScenarioPresets(label="Choline intake" :scenarios="TMA_PRESETS" v-model="preset")
    p.cluster(v-if="chosen")
      Badge(:label="STATUS_WORD[chosen.status].word" :tone="STATUS_WORD[chosen.status].tone")
      span.muted {{ chosen.note }}
    SliderField(id="tma-conversion" label="Share of choline that ends as glycine" unit="%" :min="25" :max="100" :step="5" v-model="conversion" hint="100% is the stoichiometric ceiling. 40 to 50% is often quoted without a source.")
  Panel(title="What the numbers say" title-id="tma-tiles")
    ResultTiles(:tiles="tiles")
  Panel(title="Choline against the upper limits" title-id="tma-range" lede="Move the intake along the bars. The bracket marks the claimed need for 10 g of glycine, 28 to 35 g.")
    RangeBar(v-if="rows.length" id="tma-range-bar" title="Choline intake against the IOM and EFSA limits" :rows="rows" unit="mg/day" :min="0" :max="DOSE_MAX_MG" :step="100" value-label="Choline intake" v-model="mg")
    p.muted(v-else role="status") Loading the reference intakes.
  Panel(title="What 10 g of glycine would take" title-id="tma-claim")
    .dg-pair
      StackedBar(id="tma-coverage-bar" title="Glycine deficit estimate that choline within the UL could cover" :bars="bars" unit="g glycine/day")
      ul.stack.stack--tight.plain-list(aria-label="Choline needed for 10 g of glycine")
        li {{ `At 100% conversion: ${claim.ceilingG.toFixed(1)} g of choline (${(claim.ceilingG / 3.5).toFixed(1)} times the IOM UL).` }}
        li {{ `At ${conversion}% conversion: ${claim.needG.toFixed(1)} g of choline (${claim.ulMultiple.toFixed(1)} times the UL).` }}
        li(v-for="item in claim.alternatives" :key="item.id")
          Badge(:label="item.status" :tone="item.status === 'hypothesis' ? 'warning' : item.status === 'computed' ? 'success' : 'info'")
          span {{ ` ${item.label}: ${item.cholineG.toFixed(1)} g` }}
  Panel(title="TMA and TMAO output against choline intake" title-id="tma-response" lede="Scaled linearly from the two recorded yields. Nobody measured the yield at 3.5 g or 30 g a day.")
    Notice(tone="warning" role="note" title="An extrapolation, not a prediction")
      p The one human dose was 15 mmol (1.6 g) of choline. The right-hand side of this chart extends that by a factor of up to 22; a gut and liver pathway that saturates would give less.
    LineChartPlus(id="tma-response-chart" title="TMA + TMAO output against choline intake" :x="response.x" :series="response.series" :events="response.events" unit="mmol/day" x-unit="g/day" x-label="Choline intake" :y-min="0" :height="300")
  Panel(title="Choline, TMA and TMAO in the gut and liver" title-id="tma-map" lede="Edge width is the TMA made and oxidised at the chosen intake (mmol a day, bolus yield, working FMO3).")
    LayoutMap(layout-id="tma-tmao-axis" id="tma-axis-map" title="Choline to TMA by gut bacteria, TMA to TMAO by FMO3" :flux="flux" flux-unit="mmol/day")
  Panel(title="Markers and what the evidence says" title-id="tma-evidence" lede="Fishy odour and TMAO are the two markers; grades and verdicts come from the knowledge base.")
    EvidenceChips(label="Evidence on choline, TMA and TMAO" :items="EVIDENCE")
    SourceTable(caption="Numbers behind the TMA chart" :rows="SOURCES")
  Panel(title="Choline in the causal map" title-id="tma-causal" lede="Dashed links are hypotheses; choose an entry to see the verdict of the claim behind each.")
    CausalMap(id="tma-causal-map" title="Causal map: choline, TMA, TMAO, fishy odour and cardiovascular risk" :include="TMA_MAP.include" :labels="TMA_MAP.labels")
  template(#related)
    DashRelated(current="tma-tmao")
  template(#notes)
    p Choline is oxidised to betaine, dimethylglycine, sarcosine and glycine, so in principle it can supply glycine without the powder ever touching the gut. The arithmetic is the problem: 10 g of glycine is 0.133 mol, which needs 13.9 g of choline even if every molecule converted, almost four times the IOM upper limit.
    p Free choline taken in large amounts is also food for gut bacteria that make TMA, which the liver oxidises to TMAO. In the one dose study found, 63% of a 15 mmol free-choline bolus came back as urinary TMA and TMAO; phosphatidylcholine did not raise TMAO. Whether TMAO itself harms is contested.
    p The choline upper limit of 3.5 g a day is the IOM figure. EFSA derived none, although the claim that both authorities set it is repeated; the claim page says so.
    p This is educational material, not medical advice.
</template>
