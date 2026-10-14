<script setup vapor>
import { computed, ref } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import LegendToggle from './LegendToggle.vue'
import { markerPath, isOpenMarker } from './shapes.js'
import { buildTimeline, describeTimeline, groupsOf, stepDot, timelineTable } from './timeline-model.js'
import { useChartWidth } from './useChartWidth.js'

// Articles by year and design: one lane per design, one marker per article
// (colour plus a different marker shape per design). One tab stop: arrow keys
// move along a lane (left/right) or between lanes (up/down), Home/End jump to
// the ends of the lane, Enter or Space selects. The readout under the chart
// names the article under the pointer or the keyboard cursor, and links to it
// when it has an `href`. Legend buttons hide a design.
//
//   Timeline(title="Articles by year and design" :items="[{ id: 'a1', title: 'Trial of X', year: 2004, group: 'RCT' }]" @select="open")
const props = defineProps({
  id: { type: String, default: () => uniqueId('timeline') },
  title: { type: String, required: true },
  items: { type: Array, required: true },
  groups: { type: Array, default: undefined },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show data table' }
})
const emit = defineEmits(['select'])

const { el, width } = useChartWidth(720)
const hidden = ref([])
const active = ref(null)
const focused = ref(false)
const model = computed(() => buildTimeline({ items: props.items, groups: props.groups, hidden: hidden.value, width: width.value }))
const legend = computed(() => groupsOf(props.items, props.groups).map((group) => ({ id: group.id, label: `${group.label} (${group.count})`, look: group.look })))
const summaryText = computed(() => props.summary || describeTimeline({ items: props.items, groups: props.groups, hidden: hidden.value }))
const table = computed(() => timelineTable({ items: props.items, groups: props.groups }))
const current = computed(() => (active.value === null ? null : model.value.order.find((dot) => dot.id === active.value) ?? null))
const lookOf = computed(() => new Map(groupsOf(props.items, props.groups).map((group) => [group.id, group])))
const openOf = (lane) => isOpenMarker(lane.look.shape)
const dotPath = (dot, lane, radius = 5) => markerPath(lane.look.shape, dot.x, dot.y, radius)

function toggle(id) {
  hidden.value = hidden.value.includes(id) ? hidden.value.filter((item) => item !== id) : [...hidden.value, id]
  if (current.value === null) active.value = null
}
function onFocus() {
  focused.value = true
  if (active.value === null || !current.value) active.value = model.value.order[0]?.id ?? null
}
function onBlur() {
  focused.value = false
  active.value = null
}
function onKey(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    if (current.value) {
      event.preventDefault()
      emit('select', current.value.item)
    }
    return
  }
  const next = stepDot(model.value.order, active.value, event.key)
  if (next === null) return
  event.preventDefault()
  active.value = next
}
function hover(dot) {
  active.value = dot.id
}
function leave() {
  if (!focused.value) active.value = null
}
function pick(dot) {
  active.value = dot.id
  emit('select', dot.item)
}
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-box(ref="el")
    .viz-plot(role="group" tabindex="0" :aria-label="`${title}: article markers. Use the arrow keys to move along a lane or between lanes, Home and End for the ends, Enter to select.`" @focus="onFocus" @blur="onBlur" @keydown="onKey")
      svg.viz-svg(:viewBox="`0 0 ${model.width} ${model.height}`" role="img" :aria-label="`${title}. Markers by year, one lane per design; the summary and data table follow it.`")
        g(v-for="lane in model.lanes" :key="lane.id" :class="lane.look.colorClass")
          rect.viz-lane(:x="0" :y="lane.top" :width="model.width" :height="lane.height")
          text.viz-label--strong(:x="model.left === 14 ? 14 : 8" :y="lane.labelY") {{ lane.label }}
          path.viz-mark.viz-dot-mark(v-for="dot in lane.dots" :key="dot.id" :class="{ 'viz-mark--open': openOf(lane), 'is-active': active === dot.id }" :d="dotPath(dot, lane, active === dot.id ? 7 : 5)" @pointerenter="hover(dot)" @pointerleave="leave" @click="pick(dot)")
        line.viz-axis(:x1="model.left" :x2="model.right" :y1="model.axisY" :y2="model.axisY")
        g(v-for="tick in model.ticks" :key="tick.year")
          line.viz-axis(:x1="tick.pos" :x2="tick.pos" :y1="model.axisY" :y2="model.axisY + 5")
          text.viz-tick(:x="tick.pos" :y="model.axisY + 19" text-anchor="middle") {{ tick.label }}
        text.viz-axis-title(:x="model.right" :y="model.height - 2" text-anchor="end") Year
    .viz-readout(aria-live="polite" aria-atomic="true")
      template(v-if="current")
        strong {{ current.item.title }}
        span {{ ` (${current.item.year}, ${lookOf.get(current.item.group)?.label ?? current.item.group})` }}
        span.muted(v-if="current.item.detail") {{ ` ${current.item.detail}` }}
        a(v-if="current.item.href" :href="current.item.href") {{ ' Open' }}
      span.muted(v-else) Hover a marker, or focus the chart and use the arrow keys, to read an article.
  template(#legend)
    LegendToggle(:items="legend" :hidden="hidden" label="Show or hide designs" @toggle="toggle")
  template(#table)
    table
      caption {{ title }}: articles by year and design
      thead
        tr
          th(scope="col") Year
          th(v-for="head in table.heads" :key="head" scope="col") {{ head }}
      tbody
        tr(v-for="row in table.rows" :key="row.year")
          th(scope="row") {{ row.year }}
          td(v-for="(cell, index) in row.cells" :key="index") {{ cell }}
</template>
