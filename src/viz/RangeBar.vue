<script setup vapor>
import { computed } from 'vue'
import Badge from '../ui/Badge.vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import { buildRangeModel, describeRanges, rangeTable } from './range-model.js'
import SliderField from './SliderField.vue'
import { withUnit } from './scale.js'
import { markerPath } from './shapes.js'
import { useChartWidth } from './useChartWidth.js'

// A dose against its limits, one row per authority (for example IOM and EFSA):
// AI / RDA / EAR / PRI markers (each its own shape), the tolerable upper level
// (a bar), the typical dose range (a bracket), and, with v-model, an adjustable
// value with a slider and a status word per row. A row with no UL says so in words
// ("No upper limit established"): the absence is never left blank.
//
//   RangeBar(title="Choline intake" unit="mg/day" v-model="intake" :min="0" :max="4000" :step="50"
//     :rows="[{ id: 'iom', label: 'IOM (US)', markers: [{ kind: 'ai', value: 550 }, { kind: 'ul', value: 3500 }],
//               typical: { from: 250, to: 1000, label: 'Typical supplement dose' } },
//             { id: 'efsa', label: 'EFSA (EU)', markers: [{ kind: 'ai', value: 400 }], noUlNote: 'insufficient data' }]")
//
// Sample values in the docs and gallery are illustrative, never dosing advice.
const model = defineModel({ type: Number, default: undefined })
const props = defineProps({
  id: { type: String, default: () => uniqueId('range') },
  title: { type: String, required: true },
  rows: { type: Array, required: true },
  unit: { type: String, default: '' },
  min: { type: Number, default: 0 },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  valueLabel: { type: String, default: 'Your value' },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show data table' }
})

const { el, width } = useChartWidth(640)
const geometry = computed(() => buildRangeModel({ rows: props.rows, width: width.value, min: props.min, max: props.max, value: model.value, unit: props.unit }))
const sliderMax = computed(() => geometry.value.domain[1])
const summaryText = computed(() => props.summary || describeRanges({ rows: props.rows, unit: props.unit, value: model.value }))
const table = computed(() => rangeTable({ rows: props.rows, unit: props.unit, value: model.value }))
const hatchId = computed(() => `${props.id}-hatch`)
const dotsId = computed(() => `${props.id}-dots`)
const userText = computed(() => `${props.valueLabel}: ${withUnit(model.value, props.unit)}`)
const userAnchor = computed(() => (geometry.value.userX > geometry.value.width * 0.7 ? 'end' : 'start'))
const TONES = { 'above-ul': ['Above the UL', 'danger'], below: ['Below the reference intake', 'warning'], within: ['Within the range', 'success'], 'no-ul': ['No UL to compare', 'info'] }
const statuses = computed(() => geometry.value.rows.filter((row) => row.status).map((row) => ({ id: row.id, label: row.label, text: row.status.text, badge: TONES[row.status.code][0], tone: TONES[row.status.code][1] })))
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-box(ref="el")
    svg.viz-svg(:viewBox="`0 0 ${geometry.width} ${geometry.height}`" role="img" :aria-label="`${title}. Dose against reference intakes and upper limits for ${rows.length} ${rows.length === 1 ? 'authority' : 'authorities'}; the summary and data table follow it.`")
      defs
        pattern(:id="hatchId" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)")
          line.viz-hatch(x1="0" y1="0" x2="0" y2="6")
        pattern(:id="dotsId" width="6" height="6" patternUnits="userSpaceOnUse")
          circle.viz-dots(cx="3" cy="3" r="1")
      g(v-for="row in geometry.rows" :key="row.id")
        text.viz-label--strong(:x="geometry.left" :y="row.titleY") {{ row.label }}
        text.viz-label(v-if="row.noUl" :x="geometry.left" :y="row.noteY") {{ row.noUlText }}
        g(v-for="region in row.regions" :key="region.kind")
          rect.viz-region(:class="`viz-region--${region.kind}`" :x="region.x" :y="row.trackY" :width="region.w" :height="row.trackH")
          rect(v-if="region.kind === 'above'" :fill="`url(#${hatchId})`" :x="region.x" :y="row.trackY" :width="region.w" :height="row.trackH")
          rect(v-if="region.kind === 'below'" :fill="`url(#${dotsId})`" :x="region.x" :y="row.trackY" :width="region.w" :height="row.trackH")
          text.viz-label(v-if="region.kind === 'no-limit' && region.w > 150" :x="region.x + region.w - 6" :y="row.trackY + row.trackH - 3" text-anchor="end") no upper limit
        g(v-if="row.typical")
          path.viz-bracket(:d="`M${row.typical.x1} ${row.bracketY - 4}V${row.bracketY + 4}M${row.typical.x1} ${row.bracketY}H${row.typical.x2}M${row.typical.x2} ${row.bracketY - 4}V${row.bracketY + 4}`")
          text.viz-label(:x="row.typical.x1" :y="row.bracketY - 8") {{ row.typical.label }}
        g(v-for="marker in row.markers" :key="marker.kind")
          path.viz-ref-marker(:class="{ 'viz-ref-marker--ul': marker.kind === 'ul' }" :d="marker.d")
          text.viz-label--strong(:x="marker.labelX" :y="marker.labelY" :text-anchor="marker.anchor") {{ marker.text }}
        path.viz-user-mark(v-if="geometry.userX !== null" :d="markerPath('diamond', geometry.userX, row.trackY + row.trackH / 2, 5)")
      line.viz-user(v-if="geometry.userX !== null" :x1="geometry.userX" :x2="geometry.userX" :y1="geometry.top - 4" :y2="geometry.axisY")
      text.viz-label--strong(v-if="geometry.userX !== null" :x="geometry.userX + (userAnchor === 'start' ? 6 : -6)" y="12" :text-anchor="userAnchor") {{ userText }}
      line.viz-axis(:x1="geometry.left" :x2="geometry.right" :y1="geometry.axisY" :y2="geometry.axisY")
      g(v-for="tick in geometry.ticks" :key="tick.value")
        line.viz-axis(:x1="tick.pos" :x2="tick.pos" :y1="geometry.axisY" :y2="geometry.axisY + 5")
        text.viz-tick(:x="tick.pos" :y="geometry.axisY + 19" text-anchor="middle") {{ tick.label }}
      text.viz-axis-title(v-if="unit" :x="(geometry.left + geometry.right) / 2" :y="geometry.axisY + 38" text-anchor="middle") {{ unit }}
    ul.viz-status.plain-list(v-if="statuses.length")
      li(v-for="item in statuses" :key="item.id")
        Badge(:label="item.badge" :tone="item.tone")
        span {{ ` ${item.label}: ${item.text}` }}
  SliderField(v-if="model !== undefined" :id="`${id}-slider`" :label="valueLabel" :unit="unit" :min="min" :max="sliderMax" :step="step" v-model="model")
  template(#legend)
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        path.viz-ref-marker(:d="markerPath('triangle', 14, 7, 5)")
      | AI
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        path.viz-ref-marker(:d="markerPath('circle', 14, 7, 5)")
      | RDA / PRI
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        path.viz-ref-marker(:d="markerPath('square', 14, 7, 4.5)")
      | EAR
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        path.viz-ref-marker.viz-ref-marker--ul(d="M14 1V13")
      | UL (upper limit)
  template(#table)
    table
      caption {{ title }}: reference values by authority
      thead
        tr
          th(scope="col") Authority
          th(v-for="head in table.heads" :key="head" scope="col") {{ head }}
      tbody
        tr(v-for="row in table.rows" :key="row.id")
          th(scope="row") {{ row.label }}
          td(v-for="(cell, index) in row.cells" :key="index") {{ cell }}
</template>
