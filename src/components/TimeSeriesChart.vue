<script setup>
import { computed } from 'vue'
import { REACTION_IDS } from '../../shared/identifiers.js'

const props = defineProps({
  result: { type: Object, required: true },
  comparison: { type: Object, default: undefined },
  selectedId: { type: String, required: true }
})

const width = 760
const height = 280
const fluxHeight = 190
const pad = { left: 56, right: 18, top: 18, bottom: 42 }

const selected = computed(() => props.result.concentrations.find((series) => series.id === props.selectedId) ?? props.result.concentrations[0])
const comparisonSeries = computed(() => props.comparison?.concentrations.find((series) => series.id === selected.value.id))
const maxY = computed(() => Math.max(1, ...selected.value.values, ...(comparisonSeries.value?.values ?? [])) * 1.08)
const selectedFlux = computed(() => props.result.fluxes.find((series) => series.id === props.selectedId) ?? props.result.fluxes.find((series) => series.id === REACTION_IDS.mthfr) ?? props.result.fluxes[0])
const comparisonFlux = computed(() => props.comparison?.fluxes.find((series) => series.id === selectedFlux.value.id))
const maxFlux = computed(() => Math.max(0.01, ...selectedFlux.value.values, ...(comparisonFlux.value?.values ?? [])) * 1.08)

function points(values) {
  const maxTime = props.result.timeHours.at(-1) ?? 1
  return values.map((value, index) => {
    const time = props.result.timeHours[index] ?? maxTime
    const x = pad.left + (time / maxTime) * (width - pad.left - pad.right)
    const y = pad.top + (1 - value / maxY.value) * (height - pad.top - pad.bottom)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

function fluxPoints(values) {
  const maxTime = props.result.timeHours.at(-1) ?? 1
  return values.map((value, index) => {
    const time = props.result.timeHours[index] ?? maxTime
    const x = pad.left + (time / maxTime) * (width - pad.left - pad.right)
    const y = pad.top + (1 - value / maxFlux.value) * (fluxHeight - pad.top - pad.bottom)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

const finalValue = computed(() => selected.value.values.at(-1) ?? 0)
const finalFlux = computed(() => selectedFlux.value.values.at(-1) ?? 0)
</script>

<template lang="pug">
figure.chart-card(aria-labelledby="chart-caption")
  figcaption#chart-caption
    strong {{ selected.name }} concentration
    span.chart-value {{ finalValue.toFixed(3) }} {{ selected.unit }} at {{ result.timeHours.at(-1) }} h
  svg.time-chart(:viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="`${selected.name} concentration over time. Final value ${finalValue.toFixed(3)} ${selected.unit}.`")
    line.axis(:x1="pad.left" :y1="pad.top" :x2="pad.left" :y2="height - pad.bottom")
    line.axis(:x1="pad.left" :y1="height - pad.bottom" :x2="width - pad.right" :y2="height - pad.bottom")
    line.grid(:x1="pad.left" :y1="pad.top" :x2="width - pad.right" :y2="pad.top")
    line.grid(:x1="pad.left" :y1="(height - pad.bottom + pad.top) / 2" :x2="width - pad.right" :y2="(height - pad.bottom + pad.top) / 2")
    text.tick(:x="pad.left - 9" :y="pad.top + 4" text-anchor="end") {{ maxY.toFixed(1) }}
    text.tick(:x="pad.left - 9" :y="height - pad.bottom + 4" text-anchor="end") 0
    text.tick(:x="pad.left" :y="height - 14") 0 h
    text.tick(:x="width - pad.right" :y="height - 14" text-anchor="end") {{ result.timeHours.at(-1) }} h
    polyline.comparison-line(v-if="comparisonSeries" :points="points(comparisonSeries.values)" fill="none")
    polyline.result-line(:points="points(selected.values)" fill="none")
    text.axis-label(x="14" :y="height / 2" transform="rotate(-90 14 140)" text-anchor="middle") {{ selected.unit }}
  .chart-legend
    span.legend-item
      i.swatch.current
      | {{ result.preset === 'baseline' ? 'Baseline' : 'Current reduced-MTHFR run' }}
    span.legend-item(v-if="comparisonSeries")
      i.swatch.compare
      | Baseline comparison
figure.chart-card(aria-labelledby="flux-chart-caption")
  figcaption#flux-chart-caption
    strong {{ selectedFlux.name }} time series
    span.chart-value {{ finalFlux.toFixed(4) }} {{ selectedFlux.unit }} at {{ result.timeHours.at(-1) }} h
  svg.time-chart.flux-chart(:viewBox="`0 0 ${width} ${fluxHeight}`" role="img" :aria-label="`${selectedFlux.name} over time. Final value ${finalFlux.toFixed(4)} ${selectedFlux.unit}.`")
    line.axis(:x1="pad.left" :y1="pad.top" :x2="pad.left" :y2="fluxHeight - pad.bottom")
    line.axis(:x1="pad.left" :y1="fluxHeight - pad.bottom" :x2="width - pad.right" :y2="fluxHeight - pad.bottom")
    line.grid(:x1="pad.left" :y1="pad.top" :x2="width - pad.right" :y2="pad.top")
    text.tick(:x="pad.left - 9" :y="pad.top + 4" text-anchor="end") {{ maxFlux.toFixed(2) }}
    text.tick(:x="pad.left - 9" :y="fluxHeight - pad.bottom + 4" text-anchor="end") 0
    text.tick(:x="pad.left" :y="fluxHeight - 14") 0 h
    text.tick(:x="width - pad.right" :y="fluxHeight - 14" text-anchor="end") {{ result.timeHours.at(-1) }} h
    polyline.comparison-line(v-if="comparisonFlux" :points="fluxPoints(comparisonFlux.values)" fill="none")
    polyline.result-line(:points="fluxPoints(selectedFlux.values)" fill="none")
    text.axis-label(x="14" :y="fluxHeight / 2" :transform="`rotate(-90 14 ${fluxHeight / 2})`" text-anchor="middle") {{ selectedFlux.unit }}
</template>
