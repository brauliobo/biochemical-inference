<script setup vapor>
import { computed } from 'vue'
import Heatmap from './Heatmap.vue'

// A type-by-type relation matrix: rows are the "from" kind, columns the "to"
// kind, each cell the number of relations between them. A Heatmap with the
// diagonal outlined, zeros shown as a dot and click/Enter calling back with
// { from, to, count } so a view can open the filtered list behind the cell.
//
//   Matrix(title="Relations between kinds" :types="[{ id: 'compound', label: 'Compound' }]"
//     :counts="{ compound: { enzyme: 12 } }" @select="open")
//
// `counts` is an object of objects ({ from: { to: n } }) or an array of { from, to, count }.
const props = defineProps({
  id: { type: String, default: undefined },
  title: { type: String, required: true },
  types: { type: Array, required: true },
  counts: { type: [Object, Array], required: true },
  totals: { type: Boolean, default: true },
  summary: { type: String, default: '' }
})
const emit = defineEmits(['select'])

const lookup = computed(() => {
  const map = new Map()
  if (Array.isArray(props.counts)) {
    for (const entry of props.counts) map.set(`${entry.from}>${entry.to}`, (map.get(`${entry.from}>${entry.to}`) ?? 0) + entry.count)
  } else {
    for (const [from, targets] of Object.entries(props.counts)) for (const [to, count] of Object.entries(targets)) map.set(`${from}>${to}`, count)
  }
  return map
})
const valueOf = (from, to) => lookup.value.get(`${from}>${to}`) ?? 0
const pick = (cell) => emit('select', { from: cell.row, to: cell.col, count: cell.value })
</script>

<template lang="pug">
Heatmap(:id="id" :title="title" :rows="types" :cols="types" :values="valueOf" :totals="totals" blank-zero diagonal row-title="From" col-title="To" unit="relations" :summary="summary" @select="pick")
</template>
