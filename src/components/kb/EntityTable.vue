<script setup vapor>
import { maxOf } from '../../kb/listing-table.js'
import { entityPath } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import Sparkline from '../../viz/Sparkline.vue'
import ClaimStatusBadge from './ClaimStatusBadge.vue'
import GradeDot from './GradeDot.vue'
import ReactionGraphic from './ReactionGraphic.vue'
import VerifiedBadge from './VerifiedBadge.vue'

// A type listing as a sortable table with a small visual in each row: the evidence grade as a lettered dot,
// counts as bars, reactions as inline equations, claims with their status, and a sparkline of how many
// relations of each kind the entry has. Column headers are buttons that sort (`aria-sort` tells which); the
// table scrolls inside its own focusable region on a narrow screen. Rows, columns and the sort come from
// kb/listing-table.js; the view owns the state.
const props = defineProps({
  rows: { type: Array, required: true },
  columns: { type: Array, required: true },
  allRows: { type: Array, required: true },
  sort: { type: String, required: true },
  dir: { type: String, required: true },
  caption: { type: String, required: true }
})
const emit = defineEmits(['sort'])

const ariaSort = (column) => (column.id === props.sort ? (props.dir === 'desc' ? 'descending' : 'ascending') : undefined)
const bar = (row, column) => `--share: ${Math.round((100 * (Number(row[column.id]) || 0)) / maxOf(props.allRows, column.id))}%`
</script>

<template lang="pug">
.data-table(role="region" tabindex="0" :aria-label="caption")
  table.listing-table
    caption.visually-hidden {{ caption }}
    thead
      tr
        th(v-for="column in columns" :key="column.id" scope="col" :aria-sort="ariaSort(column)")
          button.sort-button(v-if="column.sort" type="button" @click="emit('sort', column)")
            | {{ column.label }}
            span(aria-hidden="true") {{ column.id === sort ? (dir === 'desc' ? ' ▼' : ' ▲') : '' }}
          span(v-else) {{ column.label }}
    tbody
      tr(v-for="row in rows" :key="row.id")
        template(v-for="column in columns" :key="column.id")
          th(v-if="column.kind === 'name'" scope="row")
            RouterLink(:to="entityPath(row.id)") {{ row.name }}
          td(v-else-if="column.kind === 'grade'")
            GradeDot(:grade="row.evidence")
          td(v-else-if="column.kind === 'count'")
            .cluster.cluster--tight
              span.count-bar(aria-hidden="true" :style="bar(row, column)")
                span
              span {{ row[column.id] ?? 0 }}
          td(v-else-if="column.kind === 'equation'")
            ReactionGraphic(v-if="row.equation" :model="row.equation" compact)
          td(v-else-if="column.kind === 'status'")
            ClaimStatusBadge(v-if="row.status" :status="row.status")
          td(v-else-if="column.kind === 'verified'")
            VerifiedBadge(:verified="Boolean(row.verified)")
          td(v-else-if="column.kind === 'spark'")
            Sparkline(:values="row.fingerprint" label="Relations by kind" :min="0")
          td(v-else) {{ row[column.id] }}
</template>
