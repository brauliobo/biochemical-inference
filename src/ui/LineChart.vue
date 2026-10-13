<script setup vapor>
import { computed } from 'vue'

// An inline SVG line chart on a zero baseline: one polyline per entry of
// `lines` ({ values, compare }), `times` along x. Colours and strokes come from
// CSS classes, geometry is in SVG units. Put it inside <ChartFrame>, which
// supplies the caption, text summary and data table that make it accessible.
//
//   LineChart(:times="hours" :lines="[{ values: baseline, compare: true }, { values }]" :max="peak" label="Homocysteine over time"
//             top-label="12.0" start-label="0 h" end-label="24 h" unit="uM")
//
// `stretch` draws on a unit square that fills its box (no ticks).
const props = defineProps({
  times: { type: Array, required: true },
  lines: { type: Array, required: true },
  max: { type: Number, required: true },
  label: { type: String, required: true },
  width: { type: Number, default: 760 },
  height: { type: Number, default: 280 },
  topLabel: { type: String, default: '' },
  startLabel: { type: String, default: '' },
  endLabel: { type: String, default: '' },
  unit: { type: String, default: '' },
  stretch: { type: Boolean, default: false }
})

const pad = computed(() => (props.stretch ? { left: 0, right: 0, top: 0, bottom: 0 } : { left: 56, right: 18, top: 18, bottom: 42 }))
const plot = computed(() => ({ x: pad.value.left, y: pad.value.top, right: props.width - pad.value.right, bottom: props.height - pad.value.bottom }))
const lastTime = computed(() => props.times.at(-1) || 1)

function points(values) {
  const { x, y, right, bottom } = plot.value
  return values.map((value, index) => {
    const time = props.times[index] ?? lastTime.value
    return `${(x + (time / lastTime.value) * (right - x)).toFixed(1)},${(y + (1 - value / props.max) * (bottom - y)).toFixed(1)}`
  }).join(' ')
}
const drawn = computed(() => [...props.lines.filter((line) => line.compare), ...props.lines.filter((line) => !line.compare)]
  .map((line) => ({ compare: Boolean(line.compare), points: points(line.values) })))
</script>

<template lang="pug">
svg.chart(:class="{ 'chart--stretch': stretch }" :viewBox="`0 0 ${width} ${height}`" :preserveAspectRatio="stretch ? 'none' : undefined" role="img" :aria-label="label")
  line.chart__axis(:x1="plot.x" :y1="plot.y" :x2="plot.x" :y2="plot.bottom")
  line.chart__axis(:x1="plot.x" :y1="plot.bottom" :x2="plot.right" :y2="plot.bottom")
  line.chart__gridline(:x1="plot.x" :y1="plot.y" :x2="plot.right" :y2="plot.y")
  line.chart__gridline(:x1="plot.x" :y1="(plot.bottom + plot.y) / 2" :x2="plot.right" :y2="(plot.bottom + plot.y) / 2")
  template(v-if="!stretch")
    text.chart__tick(:x="plot.x - 9" :y="plot.y + 4" text-anchor="end") {{ topLabel }}
    text.chart__tick(:x="plot.x - 9" :y="plot.bottom + 4" text-anchor="end") 0
    text.chart__tick(:x="plot.x" :y="height - 14") {{ startLabel }}
    text.chart__tick(:x="plot.right" :y="height - 14" text-anchor="end") {{ endLabel }}
    text.chart__tick(x="14" :y="height / 2" :transform="`rotate(-90 14 ${height / 2})`" text-anchor="middle") {{ unit }}
  polyline.chart__line(v-for="(line, index) in drawn" :key="index" :class="{ 'chart__line--compare': line.compare }" :points="line.points")
</template>
