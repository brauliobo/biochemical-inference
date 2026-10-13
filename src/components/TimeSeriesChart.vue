<script setup vapor>
import { computed } from 'vue'
import { REACTION_IDS } from '../../shared/identifiers.js'
import SeriesChart from './SeriesChart.vue'

// The selected concentration and its flux over time, optionally against the
// retained baseline run.
const props = defineProps({
  result: { type: Object, required: true },
  comparison: { type: Object, default: undefined },
  selectedId: { type: String, required: true }
})

const concentration = computed(() => props.result.concentrations.find((series) => series.id === props.selectedId) ?? props.result.concentrations[0])
const flux = computed(() => props.result.fluxes.find((series) => series.id === props.selectedId) ?? props.result.fluxes.find((series) => series.id === REACTION_IDS.mthfr) ?? props.result.fluxes[0])
const compareConcentration = computed(() => props.comparison?.concentrations.find((series) => series.id === concentration.value.id))
const compareFlux = computed(() => props.comparison?.fluxes.find((series) => series.id === flux.value.id))
</script>

<template lang="pug">
.stack
  SeriesChart(id="chart" :title="`${concentration.name} concentration`" :label="`${concentration.name} concentration over time`" column="Concentration" table-label="Show concentration values" :series="concentration" :compare="compareConcentration" :hours="result.timeHours" :legend="result.preset === 'baseline' ? 'Baseline' : 'Current reduced-MTHFR run'")
  SeriesChart(id="flux-chart" :title="`${flux.name} time series`" :label="`${flux.name} over time`" column="Flux" table-label="Show flux values" :series="flux" :compare="compareFlux" :hours="result.timeHours" :digits="4" :top-digits="2" :height="190" :floor="0.01")
</template>
