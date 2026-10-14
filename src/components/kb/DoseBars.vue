<script setup vapor>
import { computed } from 'vue'
import Panel from '../../ui/Panel.vue'
import RangeBar from '../../viz/RangeBar.vue'

// Intake limits (AI, RDA, UL ...) or usual doses against limits as a RangeBar: one row per authority and
// population, "No upper limit established" printed where there is none. `data` comes from
// kb/quantities.js limitRows() or doseRows(); with no rows nothing is drawn.
//
//   DoseBars(:data="limitRows(id)" title="Intake against reference values")
const props = defineProps({
  data: { type: Object, default: null },
  title: { type: String, default: 'Intake against reference values' },
  chartTitle: { type: String, default: 'Intake limits' },
  lede: { type: String, default: '' }
})
const max = computed(() => {
  const values = (props.data?.rows ?? []).flatMap((row) => [...row.markers.map((marker) => marker.value), row.typical?.to ?? 0])
  return Math.max(0, ...values) * 1.2
})
const hasRows = computed(() => Boolean(props.data?.rows?.length))
</script>

<template lang="pug">
Panel.dose-bars(v-if="hasRows" :title="title" :lede="lede" data-visual="range-bar" data-testid="dose-bars")
  RangeBar(:title="chartTitle" :rows="data.rows" :unit="data.unit" :min="0" :max="max")
  p.muted(v-for="note in data.notes ?? []" :key="note") {{ note }}
</template>
