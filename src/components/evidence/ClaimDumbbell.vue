<script setup vapor>
import { computed, ref } from 'vue'
import { claimStatusInfo } from '../../knowledge/evidence.js'
import { STATUS_LOOK, STATUS_ORDER, signed } from '../../kb/evidence.js'
import { entityPath } from '../../kb/paths.js'
import ChartFrame from '../../ui/ChartFrame.vue'
import RouterLink from '../../ui/RouterLink.vue'
import { uniqueId } from '../../ui/uid.js'
import LegendToggle from '../../viz/LegendToggle.vue'
import { seriesLook } from '../../viz/shapes.js'
import MarkIcon from './MarkIcon.vue'

// What the conversation claimed against what the recorded literature says. One row per claim from
// the conversation, least supported first. The open ring at the right edge is the claim as it was
// asserted (full support); the filled marker is where the design-weighted support index puts it
// (shape and colour = the curated status; hollow = no source recorded). The line between them is the
// shortfall. `rows` comes from dumbbellRows() in kb/evidence.js.
const props = defineProps({
  id: { type: String, default: () => uniqueId('dumbbell') },
  title: { type: String, default: 'What the conversation claimed against what the literature says' },
  rows: { type: Array, required: true }
})

const hidden = ref([])
const shown = computed(() => props.rows.filter((row) => !hidden.value.includes(row.status)))
const legend = computed(() => STATUS_ORDER.map((status) => ({
  id: status,
  label: `${claimStatusInfo(status).label} (${props.rows.filter((row) => row.status === status).length})`,
  look: seriesLook(STATUS_LOOK[status])
})))
const summary = computed(() => {
  const noSource = props.rows.filter((row) => row.noSource).length
  const against = props.rows.filter((row) => row.nAgainst > row.nFor).length
  return `${props.rows.length} claims from the conversation. ${noSource} have no recorded source and ${against} have more recorded evidence against than for. The better supported a claim is, the nearer its marker sits to the open ring.`
})
const looks = STATUS_ORDER.reduce((all, status) => ({ ...all, [status]: seriesLook(STATUS_LOOK[status]) }), {})
const pos = (index) => (index + 1) / 2

function toggle(status) {
  hidden.value = hidden.value.includes(status) ? hidden.value.filter((item) => item !== status) : [...hidden.value, status]
}
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summary" table-label="Show data table")
  .stack.stack--tight
    .ev-db__axis(aria-hidden="true")
      span Claim
      span.ev-db__scale
        span Contradicted (−1)
        span No net evidence (0)
        span Strongly supported (+1)
      span.ev-db__num Index
    ul.ev-db
      li.ev-db__row(v-for="row in shown" :key="row.id")
        RouterLink.ev-db__label(:to="entityPath(row.id)") {{ row.label }}
        .ev-db__plot(aria-hidden="true")
          span.ev-db__line(:class="looks[row.status].colorClass" :style="{ '--from': pos(row.index), '--to': 1 }")
          svg.ev-db__mark(viewBox="0 0 16 16" focusable="false" :style="{ '--at': 1 }")
            circle.ev-db__claimed(cx="8" cy="8" r="5")
          MarkIcon.ev-db__mark(:look="STATUS_LOOK[row.status]" :hollow="row.noSource" :style="{ '--at': pos(row.index) }")
        span.ev-db__num
          span(aria-hidden="true") {{ signed(row.index) }}
          span.visually-hidden {{ `${claimStatusInfo(row.status).label}; support index ${signed(row.index)}; ${row.nFor} for, ${row.nAgainst} against` }}
    p.muted Open ring: the claim as asserted. Filled marker: where the recorded literature puts it, shaped by the curated status. Hollow marker: no source recorded.
  template(#legend)
    LegendToggle(:items="legend" :hidden="hidden" label="Show or hide claims by status" @toggle="toggle")
  template(#table)
    table
      caption {{ title }}
      thead
        tr
          th(scope="col") Claim
          th(scope="col") Status
          th(scope="col") Support index
          th(scope="col") For
          th(scope="col") Against
      tbody
        tr(v-for="row in rows" :key="row.id")
          th(scope="row") {{ row.label }}
          td {{ claimStatusInfo(row.status).label }}
          td {{ signed(row.index) }}
          td {{ row.nFor }}
          td {{ row.nAgainst }}
</template>
