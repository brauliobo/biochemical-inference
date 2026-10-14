<script setup vapor>
import { computed } from 'vue'
import StackedBar from '../../viz/StackedBar.vue'
import { co2Bars, co2Summary } from './co2-bars.js'

// Where the CO2 made from stomach acid and bicarbonate goes, set against the swallowed air in the same gas pocket. One
// absolute scale (mL), so a tiny belched amount stays tiny next to what formed: that is the honest result.
const props = defineProps({
  co2: { type: Object, required: true },
  id: { type: String, default: 'gut-co2' }
})
const bars = computed(() => co2Bars(props.co2))
const summary = computed(() => co2Summary(props.co2))
</script>

<template lang="pug">
StackedBar(:id="id" title="CO2 budget over 8 hours (mL at 37 C)" :bars="bars" :normalize="false" unit="mL" :summary="summary")
</template>
