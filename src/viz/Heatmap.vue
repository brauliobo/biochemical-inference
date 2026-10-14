<script setup vapor>
import { computed, ref } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import { buildHeat, describeHeat, moveCursor } from './heat-model.js'
import { formatNumber } from './scale.js'

// Rows by columns as a coloured grid with the value printed in every cell,
// sequential or diverging colour bins (a key shows each bin's range), optional
// row and column totals and a keyboard grid: arrow keys move between cells,
// Home/End jump along the row (Ctrl for the whole grid), Enter or Space selects.
// It is a real table (role="grid"), so a screen reader reads row and column
// headers; the ChartFrame data table repeats it as plain text.
//
//   Heatmap(title="Evidence by kind" :rows="[{ id: 'compound', label: 'Compound' }]" :cols="[{ id: 'established', label: 'Established' }]"
//     :values="[[12]]" totals @select="open")
//
// `values` is a matrix (rows x cols) or a function (rowId, colId) => number | null.
// `mode`: 'sequential' (default) or 'diverging' around `center`. `domain` fixes [low, high].
// `blank-zero` prints a dot for zero. `diagonal` outlines cells where row id equals column id.
const props = defineProps({
  id: { type: String, default: () => uniqueId('heat') },
  title: { type: String, required: true },
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
  values: { type: [Array, Function], required: true },
  mode: { type: String, default: 'sequential' },
  center: { type: Number, default: 0 },
  domain: { type: Array, default: undefined },
  unit: { type: String, default: '' },
  format: { type: Function, default: (value) => formatNumber(value) },
  totals: { type: Boolean, default: false },
  blankZero: { type: Boolean, default: false },
  diagonal: { type: Boolean, default: false },
  rowTitle: { type: String, default: 'Row' },
  colTitle: { type: String, default: 'Column' },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show data table' }
})
const emit = defineEmits(['select'])

const grid = ref()
const cursor = ref({ row: 0, col: 0 })
const built = computed(() => buildHeat({ rows: props.rows, cols: props.cols, values: props.values, mode: props.mode, center: props.center, domain: props.domain, format: props.format, blankZero: props.blankZero, unit: props.unit }))
const summaryText = computed(() => props.summary || describeHeat({ rows: props.rows, cols: props.cols, built: built.value, format: props.format, unit: props.unit, title: props.title }))
const binClass = (bin) => `viz-bin-${bin}`

function focusCell(row, col) {
  cursor.value = { row, col }
  grid.value?.querySelector(`[data-r="${row}"][data-c="${col}"]`)?.focus()
}
function onKey(event, row, col) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select', { row: props.rows[row].id, col: props.cols[col].id, value: built.value.cells[row][col].value })
    return
  }
  const next = moveCursor({ row, col }, event.key, { rowCount: props.rows.length, colCount: props.cols.length, ctrl: event.ctrlKey || event.metaKey })
  if (!next) return
  event.preventDefault()
  focusCell(next.row, next.col)
}
function pick(row, col) {
  cursor.value = { row, col }
  emit('select', { row: props.rows[row].id, col: props.cols[col].id, value: built.value.cells[row][col].value })
}
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-heat-scroll
    table.viz-heat(ref="grid" role="grid" :aria-label="`${title}. Use the arrow keys to move between cells.`")
      thead
        tr(role="row")
          th.viz-heat__corner(role="columnheader" scope="col") {{ `${rowTitle} / ${colTitle}` }}
          th(v-for="col in cols" :key="col.id" role="columnheader" scope="col") {{ col.short || col.label }}
          th.viz-heat__total(v-if="totals" role="columnheader" scope="col") Total
      tbody
        tr(v-for="(row, r) in rows" :key="row.id" role="row")
          th(role="rowheader" scope="row") {{ row.label }}
          td.viz-heat__cell(v-for="(cell, c) in built.cells[r]" :key="cell.col" role="gridcell" :data-r="r" :data-c="c" :tabindex="cursor.row === r && cursor.col === c ? 0 : -1" :class="[binClass(cell.bin), { 'viz-heat__cell--diagonal': diagonal && row.id === cell.col }]" :aria-label="cell.label" @click="pick(r, c)" @focus="cursor = { row: r, col: c }" @keydown="onKey($event, r, c)") {{ cell.text }}
          td.viz-heat__total(v-if="totals") {{ format(built.rowTotals[r]) }}
      tfoot(v-if="totals")
        tr(role="row")
          th(role="rowheader" scope="row") Total
          td.viz-heat__total(v-for="(total, c) in built.colTotals" :key="cols[c].id") {{ format(total) }}
          td.viz-heat__total {{ format(built.grandTotal) }}
  template(#legend)
    span.viz-key(v-for="bin in built.legend" :key="bin.bin")
      span.viz-key__chip(:class="binClass(bin.bin)") {{ bin.bin === 'z' ? '0' : '' }}
      span {{ bin.text }}
  template(#table)
    table
      caption {{ title }}: values{{ unit ? ` (${unit})` : '' }}
      thead
        tr
          th(scope="col") {{ rowTitle }}
          th(v-for="col in cols" :key="col.id" scope="col") {{ col.label }}
          th(v-if="totals" scope="col") Total
      tbody
        tr(v-for="(row, r) in rows" :key="row.id")
          th(scope="row") {{ row.label }}
          td(v-for="(cell, c) in built.cells[r]" :key="cell.col") {{ cell.value === null ? 'no data' : format(cell.value) }}
          td(v-if="totals") {{ format(built.rowTotals[r]) }}
</template>
