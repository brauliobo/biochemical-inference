<script setup vapor>
import { computed, ref } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import LegendToggle from './LegendToggle.vue'
import { buildLineModel, describeLines, indexAtPixel, readoutAt, tableHeadings, tableRows } from './line-model.js'
import { formatNumber } from './scale.js'
import { markerPath, isOpenMarker, seriesLook } from './shapes.js'
import { useChartWidth } from './useChartWidth.js'

// Multi-series time courses with uncertainty ribbons, event markers, reference
// lines and bands, a baseline-vs-scenario overlay, a log/linear switch, legend
// toggles and a crosshair with a value readout (pointer, or keyboard: arrow keys
// move, Shift+arrows jump ten samples, Home/End go to the ends, Escape clears).
// It is wrapped in ChartFrame: caption, text summary and a data table.
//
//   LineChartPlus(title="SAM:SAH ratio" :x="hours" unit="ratio" x-unit="h"
//     :series="[{ id: 'base', label: 'Baseline', values, baseline: true },
//               { id: 'gly', label: 'Glycine 5 g', values, lower, upper }]"   lower/upper = p5/p95
//     :events="[{ x: 2, label: 'Glycine 5 g' }]"
//     :bands="[{ from: 4, to: 8, label: 'Typical range' }]" :ref-lines="[{ value: 3, label: 'Threshold' }]")
//
// Series colour, dash and marker shape come from their order (or `look`: 0 to 7).
const props = defineProps({
  id: { type: String, default: () => uniqueId('line') },
  title: { type: String, required: true },
  x: { type: Array, required: true },
  series: { type: Array, required: true },
  events: { type: Array, default: () => [] },
  bands: { type: Array, default: () => [] },
  refLines: { type: Array, default: () => [] },
  unit: { type: String, default: '' },
  xUnit: { type: String, default: 'h' },
  xLabel: { type: String, default: '' },
  yLabel: { type: String, default: '' },
  height: { type: Number, default: 300 },
  yScale: { type: String, default: 'linear' },
  yMin: { type: Number, default: undefined },
  yMax: { type: Number, default: undefined },
  allowLog: { type: Boolean, default: true },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show data table' }
})

const { el, width } = useChartWidth(720)
const hidden = ref([])
const logOn = ref(props.yScale === 'log')
const active = ref(-1)
const focused = ref(false)

const model = computed(() => buildLineModel({
  x: props.x,
  series: props.series,
  events: props.events,
  bands: props.bands,
  refLines: props.refLines,
  width: width.value,
  height: props.height,
  yScale: logOn.value ? 'log' : 'linear',
  yMin: props.yMin,
  yMax: props.yMax,
  hidden: hidden.value
}))
const drawOrder = computed(() => [...model.value.lines.filter((line) => line.baseline), ...model.value.lines.filter((line) => !line.baseline)])
const legendItems = computed(() => props.series.map((entry, index) => ({ id: entry.id, label: entry.label, look: seriesLook(entry.look ?? index), dashed: Boolean(entry.baseline) })))
const summaryText = computed(() => props.summary || describeLines({ x: props.x, series: props.series, events: props.events, bands: props.bands, refLines: props.refLines, xUnit: props.xUnit, unit: props.unit }))
const readout = computed(() => (active.value < 0 ? null : readoutAt({ x: props.x, series: props.series, events: props.events, bands: props.bands, hidden: hidden.value, xUnit: props.xUnit, unit: props.unit, index: active.value })))
const crossX = computed(() => (active.value < 0 ? 0 : model.value.xScale(props.x[active.value])))
const crossMarks = computed(() => {
  if (active.value < 0) return []
  return model.value.lines
    .map((line, index) => ({ line, value: props.series[index].values[active.value] }))
    .filter(({ line, value }) => line.visible && Number.isFinite(value))
    .map(({ line, value }) => ({ id: line.id, d: markerPath(line.look.shape, crossX.value, model.value.yScale(value), 5.5), open: isOpenMarker(line.look.shape), colorClass: line.look.colorClass }))
})
const heads = computed(() => tableHeadings({ series: props.series, unit: props.unit }))
const rows = computed(() => tableRows({ x: props.x, series: props.series }))
const xTitle = computed(() => props.xLabel || `Time (${props.xUnit})`)
const yTitle = computed(() => props.yLabel || props.unit)
const label = computed(() => `${props.title}. Line chart of ${props.series.length} ${props.series.length === 1 ? 'series' : 'series'}; the summary and data table follow it.`)
const focusLabel = computed(() => `${props.title}: chart readout. Use the left and right arrow keys to move along the time axis, Shift with an arrow to jump, Home and End for the ends.`)
const hint = computed(() => 'Hover the chart, or focus it and use the arrow keys, to read values.')
const extras = computed(() => [
  ...props.events.map((event) => ({ kind: 'Event', label: event.label, at: `${formatNumber(event.x)} ${props.xUnit}` })),
  ...props.bands.map((band) => ({ kind: 'Reference range', label: band.label, at: `${formatNumber(band.from)} to ${formatNumber(band.to)} ${props.unit}` })),
  ...props.refLines.map((line) => ({ kind: 'Reference line', label: line.label, at: `${formatNumber(line.value)} ${props.unit}` }))
])

function toggle(id) {
  hidden.value = hidden.value.includes(id) ? hidden.value.filter((item) => item !== id) : [...hidden.value, id]
}
function move(event) {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  if (!rect.width) return
  const pixel = ((event.clientX - rect.left) / rect.width) * model.value.width
  active.value = indexAtPixel(model.value, props.x, pixel)
}
function leave() {
  if (!focused.value) active.value = -1
}
function onFocus() {
  focused.value = true
  if (active.value < 0) active.value = 0
}
function onBlur() {
  focused.value = false
  active.value = -1
}
function onKey(event) {
  const last = props.x.length - 1
  const jump = event.shiftKey ? 10 : 1
  const keys = {
    ArrowRight: () => Math.min(last, Math.max(active.value, 0) + jump),
    ArrowLeft: () => Math.max(0, Math.max(active.value, 0) - jump),
    PageUp: () => Math.min(last, Math.max(active.value, 0) + 10),
    PageDown: () => Math.max(0, Math.max(active.value, 0) - 10),
    Home: () => 0,
    End: () => last
  }
  if (event.key === 'Escape') {
    active.value = -1
    return
  }
  const next = keys[event.key]
  if (!next) return
  event.preventDefault()
  active.value = next()
}
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-box(ref="el")
    .viz-plot(role="group" tabindex="0" :aria-label="focusLabel" @keydown="onKey" @focus="onFocus" @blur="onBlur")
      svg.viz-svg(:viewBox="`0 0 ${model.width} ${model.height}`" role="img" :aria-label="label" @pointermove="move" @pointerleave="leave")
        g.viz-grid
          line.viz-gridline(v-for="tick in model.yTicks" :key="`gy-${tick.value}`" :x1="model.plot.left" :x2="model.plot.right" :y1="tick.pos" :y2="tick.pos")
        g(v-for="band in model.bands" :key="`band-${band.label}`")
          rect.viz-band(:x="model.plot.left" :y="band.y" :width="model.plot.right - model.plot.left" :height="band.height")
          line.viz-band__edge(:x1="model.plot.left" :x2="model.plot.right" :y1="band.y" :y2="band.y")
          line.viz-band__edge(:x1="model.plot.left" :x2="model.plot.right" :y1="band.y + band.height" :y2="band.y + band.height")
          text.viz-label(:x="model.plot.right - 6" :y="band.labelY" text-anchor="end") {{ band.label }}
        g(v-for="line in model.refLines" :key="`ref-${line.label}`")
          line.viz-refline(:x1="model.plot.left" :x2="model.plot.right" :y1="line.y" :y2="line.y")
          text.viz-label(:x="model.plot.left + 6" :y="line.y - 5") {{ line.label }}
        line.viz-axis(:x1="model.plot.left" :x2="model.plot.right" :y1="model.plot.bottom" :y2="model.plot.bottom")
        line.viz-axis(:x1="model.plot.left" :x2="model.plot.left" :y1="model.plot.top" :y2="model.plot.bottom")
        g(v-for="tick in model.xTicks" :key="`tx-${tick.value}`")
          line.viz-axis(:x1="tick.pos" :x2="tick.pos" :y1="model.plot.bottom" :y2="model.plot.bottom + 5")
          text.viz-tick(:x="tick.pos" :y="model.plot.bottom + 19" text-anchor="middle") {{ tick.label }}
        g(v-for="tick in model.yTicks" :key="`ty-${tick.value}`")
          line.viz-axis(:x1="model.plot.left - 5" :x2="model.plot.left" :y1="tick.pos" :y2="tick.pos")
          text.viz-tick(:x="model.plot.left - 9" :y="tick.pos + 4" text-anchor="end") {{ tick.label }}
        text.viz-axis-title(:x="(model.plot.left + model.plot.right) / 2" :y="model.height - 6" text-anchor="middle") {{ xTitle }}
        text.viz-axis-title(v-if="yTitle" x="14" :y="(model.plot.top + model.plot.bottom) / 2" text-anchor="middle" :transform="`rotate(-90 14 ${(model.plot.top + model.plot.bottom) / 2})`") {{ yTitle }}
        template(v-for="line in drawOrder" :key="`line-${line.id}`")
          g(v-if="line.visible" :class="line.look.colorClass")
            path.viz-ribbon(v-if="line.ribbon" :d="line.ribbon")
            path.viz-line(:class="[line.look.dashClass, { 'viz-line--baseline': line.baseline }]" :d="line.path")
            path.viz-mark(v-if="!line.baseline" :class="{ 'viz-mark--open': line.markOpen }" :d="line.markPath")
        g(v-for="event in model.events" :key="`event-${event.x}-${event.label}`")
          line.viz-event(:x1="event.pos" :x2="event.pos" :y1="event.labelY + 4" :y2="model.plot.bottom")
          path.viz-event__mark(:d="markerPath('diamond', event.pos, model.plot.bottom, 4)")
          text.viz-event__label(:x="event.pos + (event.anchor === 'start' ? 5 : -5)" :y="event.labelY" :text-anchor="event.anchor") {{ event.text }}
        g(v-if="readout")
          line.viz-crosshair(:x1="crossX" :x2="crossX" :y1="model.plot.top" :y2="model.plot.bottom")
          path.viz-mark.viz-mark--active(v-for="mark in crossMarks" :key="mark.id" :class="[mark.colorClass, { 'viz-mark--open': mark.open }]" :d="mark.d")
    .viz-readout(aria-live="polite" aria-atomic="true")
      template(v-if="readout")
        strong {{ readout.xText }}
        ul.viz-readout__list
          li(v-for="row in readout.rows" :key="row.id")
            | {{ row.label }}: {{ row.valueText }}
            span.muted(v-if="row.rangeText") {{ ` (${row.rangeText})` }}
            span.muted(v-if="row.inBands.length") {{ `, inside ${row.inBands.join(', ')}` }}
          li(v-for="event in readout.events" :key="event.label") Event: {{ event.label }}
      span.muted(v-else) {{ hint }}
  template(#legend)
    LegendToggle(:items="legendItems" :hidden="hidden" @toggle="toggle")
    button.viz-toggle(v-if="allowLog && model.logAllowed" type="button" :aria-pressed="logOn" @click="logOn = !logOn")
      span.viz-toggle__label Log scale
  template(#table)
    table
      caption {{ title }}: sampled values
      thead
        tr
          th(scope="col") {{ xTitle }}
          th(v-for="head in heads" :key="head" scope="col") {{ head }}
      tbody
        tr(v-for="row in rows" :key="row.x")
          th(scope="row") {{ row.x }}
          td(v-for="(cell, index) in row.cells" :key="index") {{ cell }}
    table(v-if="extras.length")
      caption Events and reference ranges
      thead
        tr
          th(scope="col") Kind
          th(scope="col") Name
          th(scope="col") Where
      tbody
        tr(v-for="item in extras" :key="item.kind + item.label")
          th(scope="row") {{ item.kind }}
          td {{ item.label }}
          td {{ item.at }}
</template>
