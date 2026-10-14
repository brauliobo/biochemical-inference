<script setup vapor>
import { computed, reactive, ref } from 'vue'
import robustness from '../../sim/data/robustness.json'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import MethylationMap from '../../components/dash/MethylationMap.vue'
import ProvenancePanel from '../../components/dash/ProvenancePanel.vue'
import RangeList from '../../components/dash/RangeList.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import RobustnessStrip from '../../components/dash/RobustnessStrip.vue'
import VariantSwitches from '../../components/dash/VariantSwitches.vue'
import { CONVERSION_STATUS, LIMITS_AXIS_MAX, fateBars, fateContested, requirement, tmaItems } from '../../components/dash/choline-model.js'
import { variantSwitches } from '../../components/dash/methylation-state.js'
import { relativeRange, resultTiles, scenarioChart } from '../../components/dash/methylation-view.js'
import { useModelRun } from '../../composables/useModelRun.js'
import Badge from '../../ui/Badge.vue'
import DataTable from '../../ui/DataTable.vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import RangeBar from '../../viz/RangeBar.vue'
import SliderField from '../../viz/SliderField.vue'
import StackedBar from '../../viz/StackedBar.vue'
import { formatNumber } from '../../viz/scale.js'

// Choline and betaine: where choline goes, what a continuous dose does to homocysteine in the model (and how much that
// depends on the contested BHMT constant), how much choline it would take to replace glycine, and the TMA marker.
const state = reactive({ cholineMg: 2000, betaineG: 3, variants: { bhmtBetaineKm: 'human2200' } })
const glycineG = ref(10)
const conversion = ref(0.447)
const switches = variantSwitches()
const bars = fateBars()
const contested = fateContested()
const PROVENANCE = ['betaine:ka', 'betaine:k10', 'betaine:k12', 'choline:ka', 'choline:k_bet']

const { result, error } = useModelRun(() => import('../../components/dash/choline-dash-run.js').then((m) => m.runCholineDash), state, { debounceMs: 140 })
const calc = computed(() => requirement({ glycineG: glycineG.value, conversion: conversion.value }))
const tma = computed(() => tmaItems(state.cholineMg))
const tiles = computed(() => (result.value ? resultTiles(result.value).filter((tile) => ['tHcy', 'samSahRatio', 'bet_p'].includes(tile.id)) : []))
const calcTiles = computed(() => {
  const c = calc.value
  return [
    { id: 'need', label: 'Choline needed', value: formatNumber(c.need.value), unit: 'g/day', delta: `${formatNumber(c.ulMultiple, 3)}x the IOM limit`, tone: c.overUl ? 'bad' : 'good', note: `range ${formatNumber(c.need.low)} to ${formatNumber(c.need.high)} g at 100% to 25% conversion` },
    { id: 'cover', label: 'Share of a 10 g/day deficit that choline within the limit could cover', value: `${Math.round(c.coverage.value * 100)}%`, unit: '', tone: 'info', note: `${formatNumber(c.coverage.glycineAtUlG)} g glycine from the headroom under 3.5 g` }
  ]
})
const thcyChart = computed(() => {
  const r = result.value
  if (!r) return null
  const base = scenarioChart({ time: r.time, values: r.thcyByKm.human2200, reference: r.reference.tHcy, unit: 'uM', title: 'Plasma tHcy under the two BHMT constants', events: [] })
  const lines = [
    { id: 'ref', label: 'Reference state', values: r.time.map(() => r.reference.tHcy), baseline: true, look: 0 },
    { id: 'reed100', label: 'BHMT Km(betaine) 100 uM (Reed)', values: r.thcyByKm.reed100, look: 2 },
    { id: 'human2200', label: 'BHMT Km(betaine) 2.2 mM (human enzyme)', values: r.thcyByKm.human2200, look: 1 }
  ]
  return { ...base, series: lines }
})
const betaineChart = computed(() => {
  const r = result.value
  return r ? scenarioChart({ time: r.pk.time, values: r.pk.betaine, reference: r.pk.betaineBase, unit: 'uM', title: 'Plasma betaine after one dose of the same size (Schwahn 2003 fit)', label: 'Plasma betaine' }) : null
})
const cholineChart = computed(() => {
  const r = result.value
  return r ? scenarioChart({ time: r.pk.time, values: r.pk.cholineBetaine, reference: r.pk.cholineBetaineBase, unit: 'uM', title: 'Plasma betaine after one choline dose (illustrative fit)', label: 'Plasma betaine' }) : null
})
const thcyRange = computed(() => (result.value ? relativeRange(result.value.series.tHcy, result.value.reference.tHcy) : ''))
const setVariant = (key, value) => { state.variants[key] = value }
</script>

<template lang="pug">
DashboardShell(title="Choline and betaine" question="Can choline replace 10 g of glycine?" status="calculator")
  template(#controls)
    .stack
      SliderField(id="dash-choline" label="Extra choline per day" unit="mg" :min="0" :max="4000" :step="50" :model-value="state.cholineMg" @input="(value) => { state.cholineMg = value }" hint="Elemental choline; the IOM upper limit is 3500 mg")
      SliderField(id="dash-betaine" label="Betaine per day" unit="g" :min="0" :max="12" :step="0.25" :model-value="state.betaineG" @input="(value) => { state.betaineG = value }" hint="Anhydrous betaine")
  ErrorNotice(v-if="error" title="The model run failed" :message="error.message")
  .dash-skeleton(v-if="!result && !error" role="status") Running the model.
  template(v-if="result")
    .stack.stack--tight
      ResultTiles(:tiles="tiles")
      p.muted {{ `Plasma tHcy over the run: ${thcyRange} against the reference state (liver model, continuous intake).` }}
    Panel(title="Where choline goes" title-id="cho-fate")
      .stack
        StackedBar(id="cho-fate-bar" title="Choline supply and fate (mmol/day, contested ranges)" :bars="bars" :normalize="false" unit="mmol/day")
        ul.plain-list.stack.stack--tight
          li.muted(v-for="line in contested" :key="line") {{ line }}
    Panel(title="Choline to betaine to glycine" title-id="cho-map")
      MethylationMap(:map-data="result.map" title="Core methylation network under this intake")
    Panel(title="Can choline replace glycine?" title-id="cho-calc")
      .stack
        .grid
          SliderField(id="calc-glycine" label="Glycine to replace" unit="g" :min="0" :max="10" :step="0.5" v-model="glycineG")
          SliderField(id="calc-conversion" label="Share of choline that ends as glycine" unit="" :min="0.25" :max="1" :step="0.01" :format="(v) => `${Math.round(v * 100)}%`" v-model="conversion" hint="100% is the stoichiometric ceiling; 45% is the figure often quoted, with no source")
        ResultTiles(:tiles="calcTiles" label="Calculator results")
        RangeBar(id="cho-limits" title="Choline needed against the reference intakes (mg/day)" :rows="calc.rows" unit="mg/day" :min="0" :max="LIMITS_AXIS_MAX" :step="50")
        RangeList(id="cho-partition" title="Choline for the glycine, by how much of it is converted (g/day)" unit="g/day" :items="calc.partitions")
        ul.cluster.plain-list
          li(v-for="part in calc.partitions" :key="part.id")
            Badge(:label="CONVERSION_STATUS[part.status] ?? part.status" :tone="part.status === 'hypothesis' ? 'warning' : part.status === 'computed' ? 'success' : 'info'")
            span.muted {{ ` ${Math.round(part.conversion * 100)}%: ${part.label}` }}
        DataTable(caption="Salt forms that would supply that much choline" :columns="['Form', 'Choline share', 'Amount of product (g)', 'Status']" :count="calc.salts.length")
          tr(v-for="salt in calc.salts" :key="salt.id")
            th(scope="row") {{ salt.label }}
            td {{ `${formatNumber(salt.fraction * 100, 3)}%` }}
            td {{ formatNumber(salt.grams) }}
            td {{ salt.status }}
    Panel(title="Trimethylamine (TMA) marker" title-id="cho-tma")
      .stack
        RangeList(id="cho-tma-list" title="Choline turned into TMA by gut bacteria (mmol/day)" unit="mmol/day" :items="tma")
        .cluster
          Badge(label="Assumed fraction" tone="warning")
          span.muted The share reaching gut bacteria is not measured for a habitual diet; TMAO itself is not modelled.
          RouterLink(to="/dash/tma-tmao") TMA and TMAO dashboard
    Panel(title="Betaine, choline and homocysteine" title-id="cho-hcy")
      .stack
        VariantSwitches(:switches="switches" :variants="state.variants" :rows="robustness.rows" :keys="['bhmtBetaineKm']" @update="setVariant")
        LineChartPlus(id="cho-thcy" :title="thcyChart.title" :x="thcyChart.x" :series="thcyChart.series" unit="uM" :y-min="thcyChart.yMin" :y-max="thcyChart.yMax" :height="280")
        RobustnessStrip(:rows="robustness.rows" :groups="['choline']")
    Panel(title="Plasma after one dose" title-id="cho-pk")
      .grid.dash-grid
        LineChartPlus(id="cho-pk-betaine" :title="betaineChart.title" :x="betaineChart.x" :series="betaineChart.series" unit="uM" :y-min="0" :y-max="betaineChart.yMax" :height="240")
        LineChartPlus(id="cho-pk-choline" :title="cholineChart.title" :x="cholineChart.x" :series="cholineChart.series" unit="uM" :y-min="0" :y-max="cholineChart.yMax" :height="240")
    ProvenancePanel(model="pk" :ids="PROVENANCE")
  template(#notes)
    .stack
      p Stoichiometry: each choline can give one glycine by oxidation to betaine, two demethylations (BHMT, then DMG dehydrogenase) and sarcosine dehydrogenase. 10 g glycine is 0.133 mol and needs 13.9 g choline at 100% conversion, 3.96 times the IOM upper limit of 3.5 g. EFSA has set no upper limit.
      p The betaine curve is a measured two-compartment fit (one study, 12 men). The choline curve is four fitted numbers and is illustrative; no CDP-choline or alpha-GPC kinetics exist in the parameter set.
  template(#related)
    RouterLink(to="/dash/glycine") Glycine
    RouterLink(to="/dash/methylation?scenario=betaine-6g-day") Methylation balance
    RouterLink(to="/dash/tma-tmao") TMA and TMAO
    RouterLink(to="/kb/compound/choline") Choline page
</template>
