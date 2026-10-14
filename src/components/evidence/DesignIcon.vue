<script setup vapor>
import { computed } from 'vue'
import { designInfo } from '../../kb/evidence.js'
import MarkIcon from './MarkIcon.vue'

// A study design as marker shape + name. `design` is a canonical class id from kb/evidence.js.
const props = defineProps({
  design: { type: String, required: true },
  short: { type: Boolean, default: false }
})
const info = computed(() => designInfo(props.design))
const text = computed(() => (props.short ? info.value.short : info.value.label))
</script>

<template lang="pug">
span.ev-design
  MarkIcon(:look="info.look")
  span {{ text }}
</template>
