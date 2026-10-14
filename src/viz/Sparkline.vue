<script setup vapor>
import { computed } from 'vue'
import { formatNumber } from './scale.js'
import { sparkModel } from './spark-model.js'

// A word-sized line: the shape of a series with its last value marked. Inline,
// so it fits in a table cell or beside a label. The accessible name is a
// sentence (first, last, lowest, highest) so the shape is not the only carrier.
// `show-value` prints the last value next to it. `lower`/`upper` add a band.
//
//   Sparkline(label="SAM" :values="sam" unit="uM" show-value)
const props = defineProps({
  values: { type: Array, required: true },
  lower: { type: Array, default: undefined },
  upper: { type: Array, default: undefined },
  label: { type: String, default: '' },
  unit: { type: String, default: '' },
  showValue: { type: Boolean, default: false },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  look: { type: Number, default: 0 }
})
const model = computed(() => sparkModel({ values: props.values, lower: props.lower, upper: props.upper, label: props.label, unit: props.unit, min: props.min, max: props.max }))
const tone = computed(() => `viz-s${props.look % 8}`)
</script>

<template lang="pug">
span.viz-spark-wrap(:class="tone")
  svg.viz-spark(:viewBox="`0 0 ${model.width} ${model.height}`" role="img" :aria-label="model.text")
    path.viz-spark__band(v-if="model.band" :d="model.band")
    path.viz-spark__line(:d="model.path")
    circle.viz-spark__dot(v-if="model.last" :cx="model.last.x" :cy="model.last.y" r="3")
  span.viz-spark__value(v-if="showValue && model.last") {{ formatNumber(model.last.value) }}{{ unit ? ` ${unit}` : '' }}
</template>
