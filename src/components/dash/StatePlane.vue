<script setup vapor>
import { computed } from 'vue'
import ChartFrame from '../../ui/ChartFrame.vue'
import { uniqueId } from '../../ui/uid.js'
import { formatNumber } from '../../viz/scale.js'
import { useChartWidth } from '../../viz/useChartWidth.js'
import { planeModel } from './state-plane.js'

// The SAM:SAH x tHcy plane: three labelled bands for the state of the methylation index (under-methylation-like,
// reference-like, over-methylation-like), vertical limits for tHcy, and the path of the scenario through them.
// Start, largest departure and end are different marker shapes with printed labels. Text alternative: summary + table.
//
//   StatePlane(:time :ratio :thcy :reference-ratio :reference-thcy :focus-index)
const props = defineProps({
  id: { type: String, default: () => uniqueId('plane') },
  time: { type: Array, required: true },
  ratio: { type: Array, required: true },
  thcy: { type: Array, required: true },
  referenceRatio: { type: Number, required: true },
  referenceThcy: { type: Number, required: true },
  focusIndex: { type: Number, default: undefined }
})
const { el, width } = useChartWidth(560)
const model = computed(() => planeModel({ time: props.time, ratio: props.ratio, thcy: props.thcy, referenceRatio: props.referenceRatio, referenceThcy: props.referenceThcy, focusIndex: props.focusIndex, width: width.value, height: 300 }))
const label = computed(() => `SAM:SAH against plasma tHcy. ${model.value.summary}`)
const narrow = computed(() => width.value < 420)
</script>

<template lang="pug">
ChartFrame(:id="id" title="SAM:SAH and tHcy: where the scenario goes" :summary="model.summary" table-label="Show trajectory table")
  .viz-box(ref="el")
    svg.viz-svg.dash-plane(:viewBox="`0 0 ${model.width} ${model.height}`" role="img" :aria-label="label")
      rect.dash-plane__region(v-for="region in model.regions" :key="region.id" :class="`dash-plane__region--${region.id}`" :x="region.x" :y="region.y" :width="region.width" :height="region.height")
      text.dash-plane__region-label(v-for="region in model.regions" :key="`t-${region.id}`" :class="`dash-plane__region-label--${region.id}`" :x="region.x + 8" :y="region.y + 16") {{ narrow ? region.label.split(' (')[0] : region.label }}
      line.viz-gridline(v-for="tick in model.yTicks" :key="`gy-${tick.value}`" :x1="model.plot.left" :x2="model.plot.right" :y1="tick.pos" :y2="tick.pos")
      line.dash-plane__limit(v-for="strip in model.strips" :key="strip.id" :x1="strip.x" :x2="strip.x" :y1="model.plot.top" :y2="model.plot.bottom")
      text.viz-tick(v-for="strip in model.strips" :key="`l-${strip.id}`" :x="strip.x + 4" :y="model.plot.bottom - 6") {{ strip.id === 'upper' ? '12' : '15' }}
      line.viz-axis(:x1="model.plot.left" :x2="model.plot.right" :y1="model.plot.bottom" :y2="model.plot.bottom")
      line.viz-axis(:x1="model.plot.left" :x2="model.plot.left" :y1="model.plot.top" :y2="model.plot.bottom")
      text.viz-tick(v-for="tick in model.xTicks" :key="`x-${tick.value}`" :x="tick.pos" :y="model.plot.bottom + 16" text-anchor="middle") {{ formatNumber(tick.value) }}
      text.viz-tick(v-for="tick in model.yTicks" :key="`y-${tick.value}`" :x="model.plot.left - 6" :y="tick.pos + 4" text-anchor="end") {{ formatNumber(tick.value) }}
      text.viz-axis-title(:x="(model.plot.left + model.plot.right) / 2" :y="model.height - 6" text-anchor="middle") Plasma tHcy (uM), dashed lines at 12 and 15
      text.viz-axis-title(:x="14" :y="(model.plot.top + model.plot.bottom) / 2" text-anchor="middle" :transform="`rotate(-90 14 ${(model.plot.top + model.plot.bottom) / 2})`") SAM:SAH (liver)
      path.dash-plane__path(:d="model.path")
      circle.dash-plane__ref(:cx="model.reference.x" :cy="model.reference.y" r="6")
      circle.dash-plane__start(:cx="model.start.x" :cy="model.start.y" r="4")
      rect.dash-plane__focus(:x="model.focus.x - 5" :y="model.focus.y - 5" width="10" height="10")
      path.dash-plane__end(:d="`M${model.end.x} ${model.end.y - 6}L${model.end.x + 6} ${model.end.y}L${model.end.x} ${model.end.y + 6}L${model.end.x - 6} ${model.end.y}Z`")
  template(#legend)
    span.dash-key
      svg.dash-key__mark(viewBox="0 0 12 12" aria-hidden="true")
        circle.dash-plane__ref(cx="6" cy="6" r="5")
      | Reference state
    span.dash-key
      svg.dash-key__mark(viewBox="0 0 12 12" aria-hidden="true")
        circle.dash-plane__start(cx="6" cy="6" r="4")
      | Start of the run
    span.dash-key
      svg.dash-key__mark(viewBox="0 0 12 12" aria-hidden="true")
        rect.dash-plane__focus(x="1" y="1" width="10" height="10")
      | Largest change
    span.dash-key
      svg.dash-key__mark(viewBox="0 0 12 12" aria-hidden="true")
        path.dash-plane__end(d="M6 0L12 6L6 12L0 6Z")
      | End of the run
  template(#table)
    table
      caption Trajectory, sampled
      thead
        tr
          th(scope="col") Hour
          th(scope="col") SAM:SAH
          th(scope="col") tHcy (uM)
          th(scope="col") State
      tbody
        tr(v-for="row in model.rows" :key="row.time")
          th(scope="row") {{ formatNumber(row.time) }}
          td {{ formatNumber(row.ratio) }}
          td {{ formatNumber(row.thcy) }}
          td {{ row.state }}
</template>
