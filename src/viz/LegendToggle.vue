<script setup vapor>
import Swatch from './Swatch.vue'

// A legend whose entries are toggle buttons: pressed shows the series, not
// pressed hides it (struck-through, faded swatch, aria-pressed="false"). The
// parent owns the hidden list and listens for `toggle`.
//
//   LegendToggle(:items="[{ id: 'a', label: 'Scenario', look }]" :hidden="hidden" @toggle="flip")
//
// An item may set `kind` ('line' | 'band' | 'box') and `tone` (a viz-s* class)
// for its swatch. Each button is 44 px tall.
defineProps({
  items: { type: Array, required: true },
  hidden: { type: Array, default: () => [] },
  label: { type: String, default: 'Show or hide series' }
})
const emit = defineEmits(['toggle'])
</script>

<template lang="pug">
.viz-legend(role="group" :aria-label="label")
  button.viz-toggle(v-for="item in items" :key="item.id" type="button" :aria-pressed="!hidden.includes(item.id)" :data-series="item.id" @click="emit('toggle', item.id)")
    Swatch(:look="item.look" :kind="item.kind || 'line'" :tone="item.tone || ''" :dashed="Boolean(item.dashed)" :node="item.node || 'rounded'" :sign="item.sign || 'neutral'" :hypothesis="Boolean(item.hypothesis)")
    span.viz-toggle__label {{ item.label }}
</template>
