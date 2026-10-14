<script setup vapor>
import { computed, shallowRef } from 'vue'
import { barThumb, lineThumb, mapThumb, thumbText } from './thumb-model.js'

// The picture on a dashboard card: a sparkline of a precomputed model result, bars of a count, or a mini-map of the
// network for dashboards without a time course. Decorative detail with a text name; nothing is simulated here.
// The data (sim/data/dash-thumbs.json) loads after first paint, so cards on the home page cost no initial JavaScript.
//
//   DashThumb(kind="methylation")
const props = defineProps({ kind: { type: String, required: true } })
const data = shallowRef(null)
import('../../sim/data/dash-thumbs.json').then((module) => { data.value = module.default }, () => {})

const entry = computed(() => data.value?.[props.kind] ?? data.value?.maps?.[props.kind] ?? null)
const isMap = computed(() => Boolean(entry.value?.nodes))
const lines = computed(() => (entry.value?.series ? lineThumb(entry.value.series) : []))
const bars = computed(() => (entry.value?.bars ? barThumb(entry.value.bars) : []))
const map = computed(() => (isMap.value ? mapThumb(entry.value) : null))
const label = computed(() => (entry.value ? thumbText(isMap.value ? `Network map of the ${props.kind} dashboard` : entry.value.title, entry.value.series ?? [], entry.value.bars ?? []) : undefined))
</script>

<template lang="pug">
svg.dash-thumb(viewBox="0 0 160 56" :role="entry ? 'img' : undefined" :aria-label="label" :aria-hidden="entry ? undefined : 'true'")
  path.dash-thumb__line(v-for="line in lines" :key="line.label" :class="line.baseline ? 'dash-thumb__line--baseline' : ''" :d="line.d")
  rect.dash-thumb__bar(v-for="(bar, index) in bars" :key="index" :x="bar.x" :y="bar.y" :width="bar.width" :height="bar.height")
  template(v-if="map")
    path.dash-thumb__edge(:d="map.d")
    circle.dash-thumb__dot(v-for="(dot, index) in map.dots" :key="index" :class="dot.reaction ? 'dash-thumb__dot--reaction' : ''" :cx="dot.x" :cy="dot.y" :r="dot.reaction ? 1.2 : 2")
</template>
