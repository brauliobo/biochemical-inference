<script setup vapor>
import { computed } from 'vue'
import Fact from './Fact.vue'

// The one key/value list: a <dl> of labelled values. Pass `items` for plain
// data or put <Fact> children in the default slot for rich content.
//
//   Facts(:items="[{ label: 'Release', value: release.id, code: release.digest }, { label: 'Seed', value: 7 }]")
//   Facts(rows)            label left, value right (a short summary)
//   Facts(size="wide")     wider cells (long values); size="compact" for numbers
//
// item: { label, value, code, note, mono, large }  (see Fact.vue)
const props = defineProps({
  items: { type: Array, default: () => [] },
  rows: { type: Boolean, default: false },
  size: { type: String, default: '' }
})

const classes = computed(() => ['facts', props.rows ? 'facts--rows' : '', props.size ? `facts--${props.size}` : ''])
</script>

<template lang="pug">
dl(:class="classes")
  slot
  Fact(v-for="item in items" :key="item.label" :label="item.label" :value="item.value" :code="item.code" :mono="item.mono" :large="item.large" :note="item.note")
</template>
