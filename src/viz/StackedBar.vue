<script setup vapor>
import { computed } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import Swatch from './Swatch.vue'
import { buildStack, describeStack, stackTable } from './stack-model.js'
import { useChartWidth } from './useChartWidth.js'

// Horizontal stacked bars of shares: one bar (SAM consumer shares) or several to
// compare scenarios. Items keep one colour across bars. Items that carry
// `low`/`high` also get a "share ranges" strip with their uncertainty. Wrapped in
// ChartFrame: summary, a key with the numbers, and a data table. No pie charts.
//
//   StackedBar(title="Where the methyl groups go" :bars="[{ id: 'base', label: 'Baseline', items: [
//     { id: 'gnmt', label: 'GNMT', value: 40, low: 30, high: 50 }, { id: 'pemt', label: 'PEMT', value: 30 } ] }]")
//
// `normalize` (default) scales each bar to 100 percent. `select` is emitted with an
// item id when a segment or its key entry is clicked.
const props = defineProps({
  id: { type: String, default: () => uniqueId('stack') },
  title: { type: String, required: true },
  bars: { type: Array, required: true },
  normalize: { type: Boolean, default: true },
  unit: { type: String, default: '' },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show data table' }
})
const emit = defineEmits(['select'])

const { el, width } = useChartWidth(640)
const model = computed(() => buildStack({ bars: props.bars, normalize: props.normalize, width: width.value, unit: props.unit }))
const summaryText = computed(() => props.summary || describeStack({ bars: props.bars, normalize: props.normalize, unit: props.unit }))
const table = computed(() => stackTable({ bars: props.bars, normalize: props.normalize, unit: props.unit }))
const rangeHeadingY = computed(() => model.value.axisY + 38)
const keyRows = computed(() => model.value.categories.map((category) => ({
  ...category,
  texts: model.value.bars.map((bar) => {
    const segment = bar.segments.find((entry) => entry.id === category.id)
    return segment ? `${props.bars.length > 1 ? `${bar.label}: ` : ''}${segment.amountText}` : ''
  }).filter(Boolean)
})))
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-box(ref="el")
    svg.viz-svg(:viewBox="`0 0 ${model.width} ${model.height}`" role="img" :aria-label="`${title}. Stacked share bar${bars.length > 1 ? 's' : ''}; the summary and data table follow it.`")
      g(v-for="bar in model.bars" :key="bar.id")
        text.viz-label--strong(v-if="bar.label && model.stacked" x="0" :y="bar.top + 23") {{ bar.label }}
        text.viz-label--strong(v-else-if="bar.label" :x="model.left" :y="bar.top - 7") {{ bar.label }}
        g(v-for="segment in bar.segments" :key="segment.id" :class="segment.look.colorClass")
          rect.viz-seg(:x="segment.x" :y="bar.top" :width="segment.w" height="36" @click="emit('select', segment.id)")
            title {{ segment.title }}
          text.viz-seg__text(v-if="segment.text" :x="segment.x + segment.w / 2" :y="bar.top + 23" text-anchor="middle") {{ segment.text }}
      line.viz-axis(:x1="model.left" :x2="model.right" :y1="model.axisY" :y2="model.axisY")
      g(v-for="tick in model.ticks" :key="tick.value")
        line.viz-axis(:x1="tick.pos" :x2="tick.pos" :y1="model.axisY" :y2="model.axisY + 5")
        text.viz-tick(:x="tick.pos" :y="model.axisY + 19" :text-anchor="tick.value === 0 ? 'start' : tick.pos > model.right - 4 ? 'end' : 'middle'") {{ tick.label }}
      template(v-if="model.ranges.length")
        text.viz-label--strong(x="14" :y="rangeHeadingY") Share ranges (low to high)
        g(v-for="row in model.ranges" :key="row.id" :class="row.look.colorClass")
          text.viz-label(x="14" :y="row.y + 4") {{ row.label }}
          text.viz-label(:x="row.vx" :y="row.vy" :text-anchor="row.vanchor") {{ row.text }}
          line.viz-whisker(:x1="row.x1" :x2="row.x2" :y1="row.y + row.dy" :y2="row.y + row.dy")
          line.viz-whisker(:x1="row.x1" :x2="row.x1" :y1="row.y + row.dy - 5" :y2="row.y + row.dy + 5")
          line.viz-whisker(:x1="row.x2" :x2="row.x2" :y1="row.y + row.dy - 5" :y2="row.y + row.dy + 5")
          circle.viz-dot(:cx="row.xv" :cy="row.y + row.dy" r="5")
        line.viz-axis(x1="14" :x2="model.width - 14" :y1="model.rangeAxisY" :y2="model.rangeAxisY")
        g(v-for="tick in model.rangeTicks" :key="`r-${tick.value}`")
          line.viz-axis(:x1="tick.pos" :x2="tick.pos" :y1="model.rangeAxisY" :y2="model.rangeAxisY + 5")
          text.viz-tick(:x="tick.pos" :y="model.rangeAxisY + 19" :text-anchor="tick.value === 0 ? 'start' : 'middle'") {{ tick.label }}
  template(#legend)
    button.viz-key.viz-key--button(v-for="entry in keyRows" :key="entry.id" type="button" @click="emit('select', entry.id)")
      Swatch(:look="entry.look" kind="box")
      span.viz-key__text
        | {{ entry.label }}
        span.muted(v-if="entry.texts.length") {{ ` ${entry.texts.join('; ')}` }}
  template(#table)
    table
      caption {{ title }}: values
      thead
        tr
          th(scope="col") Item
          th(v-for="head in table.heads" :key="head" scope="col") {{ head }}
      tbody
        tr(v-for="row in table.rows" :key="row.id")
          th(scope="row") {{ row.label }}
          td(v-for="(cell, index) in row.cells" :key="index") {{ cell }}
</template>
