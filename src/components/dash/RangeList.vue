<script setup vapor>
import { computed } from 'vue'
import ChartFrame from '../../ui/ChartFrame.vue'
import { uniqueId } from '../../ui/uid.js'
import { formatNumber } from '../../viz/scale.js'
import { rangeListModel } from './range-list.js'

// Estimates as rows on one shared axis: a dot for the best value and a whisker for the range, with the numbers
// printed. Use it where sources disagree: the width of the whisker is the disagreement. Wrapped in ChartFrame (summary
// and a data table).
//
//   RangeList(title="De novo glycine synthesis" unit="g/day" :items="[{ id: 'a', label: 'Pathway sum', value: 2.9 }, { id: 'b', label: 'Tracer', value: 11.2, low: 9.3, high: 14.3 }]")
const props = defineProps({
  id: { type: String, default: () => uniqueId('ranges') },
  title: { type: String, required: true },
  items: { type: Array, required: true },
  unit: { type: String, default: '' },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined }
})
const model = computed(() => rangeListModel({ items: props.items, unit: props.unit, min: props.min, max: props.max }))
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="model.summary" table-label="Show data table")
  ul.dash-ranges(:aria-label="title")
    li.dash-range(v-for="row in model.rows" :key="row.id ?? row.label" :style="{ '--from': `${row.from}%`, '--to': `${row.to}%`, '--at': `${row.at}%` }")
      span.dash-range__label {{ row.label }}
      span.dash-range__track(aria-hidden="true")
        span.dash-range__zero(v-if="model.zero !== null" :style="{ '--at': `${model.zero}%` }")
        span.dash-range__whisker(v-if="row.range")
        span.dash-range__dot
      span.dash-range__value {{ row.text }}
    li.dash-range.dash-range--axis(aria-hidden="true")
      span
      span.dash-range__ticks
        span(v-for="tick in model.ticks" :key="tick.value" :style="{ '--at': `${tick.pos}%` }") {{ formatNumber(tick.value) }}
      span {{ unit }}
  template(#table)
    table
      caption {{ title }}
      thead
        tr
          th(scope="col") Estimate
          th(scope="col") Best value
          th(scope="col") Low
          th(scope="col") High
      tbody
        tr(v-for="row in model.rows" :key="row.id ?? row.label")
          th(scope="row") {{ row.label }}
          td {{ formatNumber(row.value) }}
          td {{ formatNumber(row.low ?? row.value) }}
          td {{ formatNumber(row.high ?? row.value) }}
</template>
