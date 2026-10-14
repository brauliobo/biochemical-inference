<script setup vapor>
import { computed } from 'vue'
import { endMarker, isOpenMarker, markerPath, shapePath, SIGNS } from './shapes.js'

// The key to one series, band, node shape or edge sign: the same colour, dash
// pattern, marker shape and end marker the chart uses, so a legend never relies
// on hue alone.
//
//   Swatch(:look="seriesLook(2)")                a line with dash and marker
//   Swatch(:look="seriesLook(0)" kind="band")    a filled band
//   Swatch(kind="box" tone="viz-s3")             a filled box
//   Swatch(kind="node" node="hexagon" tone="viz-s2")   a node outline
//   Swatch(kind="sign" sign="decrease" hypothesis)     an edge with its end marker
const props = defineProps({
  look: { type: Object, default: () => ({ colorClass: 'viz-s0', dashClass: 'viz-dash-0', shape: 'circle' }) },
  kind: { type: String, default: 'line' },
  tone: { type: String, default: '' },
  dashed: { type: Boolean, default: false },
  node: { type: String, default: 'rounded' },
  sign: { type: String, default: 'neutral' },
  hypothesis: { type: Boolean, default: false }
})
const mark = computed(() => (props.look.shape ? markerPath(props.look.shape, 14, 7, 3.5) : ''))
const open = computed(() => isOpenMarker(props.look.shape))
const nodeD = computed(() => shapePath(props.node, 22, 12))
const head = computed(() => endMarker(SIGNS[props.sign]?.marker ?? 'dot', 27, 7, 0, 7))
</script>

<template lang="pug">
svg.viz-swatch(:class="tone || (kind === 'sign' ? `viz-edge--${sign}` : look.colorClass)" viewBox="0 0 28 14" aria-hidden="true" focusable="false")
  path.viz-swatch__band(v-if="kind === 'band'" d="M1 2H27V12H1Z")
  path.viz-swatch__box(v-else-if="kind === 'box'" d="M4 2H24V12H4Z")
  path.viz-swatch__node(v-else-if="kind === 'node'" :d="nodeD" transform="translate(14 7)")
  template(v-else-if="kind === 'sign'")
    line.viz-swatch__line(:class="{ 'viz-dash-ref': hypothesis }" x1="1" y1="7" x2="24" y2="7")
    path.viz-swatch__head(:class="{ 'viz-swatch__head--filled': head.filled }" :d="head.d")
  line.viz-swatch__line(v-else :class="dashed ? 'viz-dash-ref' : look.dashClass" x1="1" y1="7" x2="27" y2="7")
  path.viz-mark(v-if="kind === 'line' && mark" :class="{ 'viz-mark--open': open }" :d="mark")
</template>
