<script setup vapor>
import { computed } from 'vue'
import { REACTION_IDS } from '../../shared/identifiers.js'
import ChartFrame from '../ui/ChartFrame.vue'

const props = defineProps({
  result: { type: Object, required: true },
  comparison: { type: Object, default: undefined },
  selectedId: { type: String, required: true }
})

// Chart geometry in SVG user units; colours and strokes come from CSS classes.
const width = 760
const height = 280
const fluxHeight = 190
const pad = { left: 56, right: 18, top: 18, bottom: 42 }
const sampleCount = 8

const maxTime = computed(() => props.result.timeHours.at(-1) ?? 1)
const selected = computed(() => props.result.concentrations.find((series) => series.id === props.selectedId) ?? props.result.concentrations[0])
const comparisonSeries = computed(() => props.comparison?.concentrations.find((series) => series.id === selected.value.id))
const maxY = computed(() => Math.max(1, ...selected.value.values, ...(comparisonSeries.value?.values ?? [])) * 1.08)
const selectedFlux = computed(() => props.result.fluxes.find((series) => series.id === props.selectedId) ?? props.result.fluxes.find((series) => series.id === REACTION_IDS.mthfr) ?? props.result.fluxes[0])
const comparisonFlux = computed(() => props.comparison?.fluxes.find((series) => series.id === selectedFlux.value.id))
const maxFlux = computed(() => Math.max(0.01, ...selectedFlux.value.values, ...(comparisonFlux.value?.values ?? [])) * 1.08)

function path(values, chartHeight, maximum) {
  return values.map((value, index) => {
    const time = props.result.timeHours[index] ?? maxTime.value
    const x = pad.left + (time / maxTime.value) * (width - pad.left - pad.right)
    const y = pad.top + (1 - value / maximum) * (chartHeight - pad.top - pad.bottom)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

const points = (values) => path(values, height, maxY.value)
const fluxPoints = (values) => path(values, fluxHeight, maxFlux.value)

const finalValue = computed(() => selected.value.values.at(-1) ?? 0)
const finalFlux = computed(() => selectedFlux.value.values.at(-1) ?? 0)

// Text alternative: range and peak in words, plus a short sampled table.
function describe(series, digits) {
  const values = series.values
  const peak = Math.max(...values)
  const peakTime = props.result.timeHours[values.indexOf(peak)] ?? 0
  return `Starts at ${values[0].toFixed(digits)}, peaks at ${peak.toFixed(digits)} (${peakTime} h) and ends at ${values.at(-1).toFixed(digits)}; range 0 to ${maxTime.value} h.`
}
const summary = computed(() => describe(selected.value, 3))
const fluxSummary = computed(() => describe(selectedFlux.value, 4))

const sampleIndexes = computed(() => {
  const last = props.result.timeHours.length - 1
  const step = Math.max(1, Math.ceil(last / sampleCount))
  const indexes = []
  for (let index = 0; index < last; index += step) indexes.push(index)
  return [...indexes, last]
})
const samples = computed(() => sampleIndexes.value.map((index) => ({
  time: props.result.timeHours[index],
  value: selected.value.values[index],
  compare: comparisonSeries.value?.values[index],
  flux: selectedFlux.value.values[index],
  fluxCompare: comparisonFlux.value?.values[index]
})))
</script>

<template lang="pug">
.stack
  ChartFrame(id="chart" :title="`${selected.name} concentration`" :value="`${finalValue.toFixed(3)} ${selected.unit} at ${result.timeHours.at(-1)} h`" :summary="summary" table-label="Show concentration values")
    svg.chart(:viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="`${selected.name} concentration over time. Final value ${finalValue.toFixed(3)} ${selected.unit}.`")
      line.chart__axis(:x1="pad.left" :y1="pad.top" :x2="pad.left" :y2="height - pad.bottom")
      line.chart__axis(:x1="pad.left" :y1="height - pad.bottom" :x2="width - pad.right" :y2="height - pad.bottom")
      line.chart__gridline(:x1="pad.left" :y1="pad.top" :x2="width - pad.right" :y2="pad.top")
      line.chart__gridline(:x1="pad.left" :y1="(height - pad.bottom + pad.top) / 2" :x2="width - pad.right" :y2="(height - pad.bottom + pad.top) / 2")
      text.chart__tick(:x="pad.left - 9" :y="pad.top + 4" text-anchor="end") {{ maxY.toFixed(1) }}
      text.chart__tick(:x="pad.left - 9" :y="height - pad.bottom + 4" text-anchor="end") 0
      text.chart__tick(:x="pad.left" :y="height - 14") 0 h
      text.chart__tick(:x="width - pad.right" :y="height - 14" text-anchor="end") {{ result.timeHours.at(-1) }} h
      polyline.chart__line.chart__line--compare(v-if="comparisonSeries" :points="points(comparisonSeries.values)")
      polyline.chart__line(:points="points(selected.values)")
      text.chart__tick(x="14" :y="height / 2" :transform="`rotate(-90 14 ${height / 2})`" text-anchor="middle") {{ selected.unit }}
    template(#legend)
      span.cluster
        i.swatch
        | {{ result.preset === 'baseline' ? 'Baseline' : 'Current reduced-MTHFR run' }}
      span.cluster(v-if="comparisonSeries")
        i.swatch(style="--swatch-color: var(--color-warning-border)")
        | Baseline comparison
    template(#table)
      table
        caption Sampled {{ selected.name }} values
        thead
          tr
            th(scope="col") Hour
            th(scope="col") Concentration ({{ selected.unit }})
            th(v-if="comparisonSeries" scope="col") Baseline comparison
        tbody
          tr(v-for="sample in samples" :key="sample.time")
            th(scope="row") {{ sample.time }}
            td {{ sample.value.toFixed(3) }}
            td(v-if="comparisonSeries") {{ sample.compare?.toFixed(3) }}
  ChartFrame(id="flux-chart" :title="`${selectedFlux.name} time series`" :value="`${finalFlux.toFixed(4)} ${selectedFlux.unit} at ${result.timeHours.at(-1)} h`" :summary="fluxSummary" table-label="Show flux values")
    svg.chart(:viewBox="`0 0 ${width} ${fluxHeight}`" role="img" :aria-label="`${selectedFlux.name} over time. Final value ${finalFlux.toFixed(4)} ${selectedFlux.unit}.`")
      line.chart__axis(:x1="pad.left" :y1="pad.top" :x2="pad.left" :y2="fluxHeight - pad.bottom")
      line.chart__axis(:x1="pad.left" :y1="fluxHeight - pad.bottom" :x2="width - pad.right" :y2="fluxHeight - pad.bottom")
      line.chart__gridline(:x1="pad.left" :y1="pad.top" :x2="width - pad.right" :y2="pad.top")
      text.chart__tick(:x="pad.left - 9" :y="pad.top + 4" text-anchor="end") {{ maxFlux.toFixed(2) }}
      text.chart__tick(:x="pad.left - 9" :y="fluxHeight - pad.bottom + 4" text-anchor="end") 0
      text.chart__tick(:x="pad.left" :y="fluxHeight - 14") 0 h
      text.chart__tick(:x="width - pad.right" :y="fluxHeight - 14" text-anchor="end") {{ result.timeHours.at(-1) }} h
      polyline.chart__line.chart__line--compare(v-if="comparisonFlux" :points="fluxPoints(comparisonFlux.values)")
      polyline.chart__line(:points="fluxPoints(selectedFlux.values)")
      text.chart__tick(x="14" :y="fluxHeight / 2" :transform="`rotate(-90 14 ${fluxHeight / 2})`" text-anchor="middle") {{ selectedFlux.unit }}
    template(#table)
      table
        caption Sampled {{ selectedFlux.name }} values
        thead
          tr
            th(scope="col") Hour
            th(scope="col") Flux ({{ selectedFlux.unit }})
            th(v-if="comparisonFlux" scope="col") Baseline comparison
        tbody
          tr(v-for="sample in samples" :key="sample.time")
            th(scope="row") {{ sample.time }}
            td {{ sample.flux.toFixed(4) }}
            td(v-if="comparisonFlux") {{ sample.fluxCompare?.toFixed(4) }}
</template>
