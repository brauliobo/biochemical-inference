<script setup vapor>
import { computed } from 'vue'
import { isOpenMarker, markerPath, seriesLook } from '../../viz/shapes.js'

// A small chart marker (shape and colour of one of the eight viz series looks), used as the icon
// of a study design, a stance or a claim status. Decorative: the meaning is always printed next to
// it. `hollow` draws it as an outline ("no source").
const props = defineProps({
  look: { type: Number, default: 0 },
  hollow: { type: Boolean, default: false }
})
const info = computed(() => seriesLook(props.look))
const path = computed(() => markerPath(info.value.shape, 8, 8, 5))
const open = computed(() => props.hollow || isOpenMarker(info.value.shape))
</script>

<template lang="pug">
svg.ev-design__icon(:class="info.colorClass" viewBox="0 0 16 16" aria-hidden="true" focusable="false")
  path.viz-mark(:class="{ 'viz-mark--open': open }" :d="path")
</template>
