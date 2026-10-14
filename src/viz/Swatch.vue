<script setup vapor>
import { computed } from 'vue'
import { isOpenMarker, markerPath } from './shapes.js'

// The key to one series, band or marker: the same colour, dash pattern and
// marker shape the chart uses, so a legend never relies on hue alone.
//
//   Swatch(:look="seriesLook(2)")            a line with dash and marker
//   Swatch(:look="seriesLook(0)" kind="band") a filled band
//   Swatch(kind="box" tone="viz-s3")          a filled box
const props = defineProps({
  look: { type: Object, default: () => ({ colorClass: 'viz-s0', dashClass: 'viz-dash-0', shape: 'circle' }) },
  kind: { type: String, default: 'line' },
  tone: { type: String, default: '' },
  dashed: { type: Boolean, default: false }
})
const mark = computed(() => (props.look.shape ? markerPath(props.look.shape, 14, 7, 3.5) : ''))
const open = computed(() => isOpenMarker(props.look.shape))
</script>

<template lang="pug">
svg.viz-swatch(:class="tone || look.colorClass" viewBox="0 0 28 14" aria-hidden="true" focusable="false")
  path.viz-swatch__band(v-if="kind === 'band'" d="M1 2H27V12H1Z")
  path.viz-swatch__box(v-else-if="kind === 'box'" d="M4 2H24V12H4Z")
  line.viz-swatch__line(v-else :class="[look.dashClass, { 'viz-dash-ref': dashed }]" x1="1" y1="7" x2="27" y2="7")
  path.viz-mark(v-if="kind === 'line' && mark" :class="{ 'viz-mark--open': open }" :d="mark")
</template>
