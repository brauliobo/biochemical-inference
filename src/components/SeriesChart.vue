<script setup vapor>
import { computed } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import LineChart from '../ui/LineChart.vue'
import { fixed } from '../ui/format.js'

// One simulated series over time as an accessible figure: line chart, a
// sentence describing it, and a short sampled table; optionally against a
// comparison series. `legend` names the plotted run and enables the legend.
const props = defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  label: { type: String, required: true },
  column: { type: String, required: true },
  tableLabel: { type: String, required: true },
  series: { type: Object, required: true },
  compare: { type: Object, default: undefined },
  hours: { type: Array, required: true },
  digits: { type: Number, default: 3 },
  topDigits: { type: Number, default: 1 },
  height: { type: Number, default: 280 },
  floor: { type: Number, default: 1 },
  legend: { type: String, default: '' }
})

const SAMPLE_COUNT = 8
const end = computed(() => props.hours.at(-1))
const last = computed(() => props.series.values.at(-1) ?? 0)
const max = computed(() => Math.max(props.floor, ...props.series.values, ...(props.compare?.values ?? [])) * 1.08)
const lines = computed(() => [...(props.compare ? [{ values: props.compare.values, compare: true }] : []), { values: props.series.values }])
const summary = computed(() => {
  const values = props.series.values
  const peak = Math.max(...values)
  return `Starts at ${fixed(values[0], props.digits)}, peaks at ${fixed(peak, props.digits)} (${props.hours[values.indexOf(peak)] ?? 0} h) and ends at ${fixed(last.value, props.digits)}; range 0 to ${end.value} h.`
})
const samples = computed(() => {
  const final = props.hours.length - 1
  const step = Math.max(1, Math.ceil(final / SAMPLE_COUNT))
  const indexes = []
  for (let index = 0; index < final; index += step) indexes.push(index)
  return [...indexes, final].map((index) => ({
    time: props.hours[index],
    value: fixed(props.series.values[index], props.digits),
    compare: props.compare ? fixed(props.compare.values[index], props.digits, '') : ''
  }))
})
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :value="`${fixed(last, digits)} ${series.unit} at ${end} h`" :summary="summary" :table-label="tableLabel")
  LineChart(:times="hours" :lines="lines" :max="max" :height="height" :label="`${label}. Final value ${fixed(last, digits)} ${series.unit}.`" :top-label="fixed(max, topDigits)" start-label="0 h" :end-label="`${end} h`" :unit="series.unit")
  template(v-if="legend" #legend)
    span.cluster
      i.swatch
      | {{ legend }}
    span.cluster(v-if="compare")
      i.swatch(style="--swatch-color: var(--color-warning-border)")
      | Baseline comparison
  template(#table)
    table
      caption Sampled {{ series.name }} values
      thead
        tr
          th(scope="col") Hour
          th(scope="col") {{ column }} ({{ series.unit }})
          th(v-if="compare" scope="col") Baseline comparison
      tbody
        tr(v-for="sample in samples" :key="sample.time")
          th(scope="row") {{ sample.time }}
          td {{ sample.value }}
          td(v-if="compare") {{ sample.compare }}
</template>
